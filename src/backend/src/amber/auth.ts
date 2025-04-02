import { Express, Request, Response } from 'express';
import {Config} from './config.js';
import {AmberRepo, Invitation, User, UserWithRoles} from './db/repo.js';
import {ActionResult, LoginRequest, nu, error, SessionToken as SessionTokenDto, RegisterRequest, AcceptInvitationRequest, UserDetails, CreateInvitationRequest, UserWithRoles as UserWithRolesDto, TenantWithRoles, InvitationDetails} from 'amber-client';
import * as crypto from 'node:crypto';
import { sleep } from 'amber-client/dist/src/helper.js';

export const tenantAdminRole = 'admin';
export const allTenantsId = '*';

var loginHeat = 0;
var lastLogin = Date.now();
var parallelLogins = 0;
export async function auth(app:Express, config:Config, repo:AmberRepo) : Promise<AmberAuth>{
    var authService = new AmberAuth(config, repo);
    await authService.init();
    
    // This is the endpoint for a login with credentials that will set a cookie with a user token
    app.post(config.path + '/login', async (req, res) => {
        
        // this is where we need to protect against brute force attacks
        if (parallelLogins > 10){
            res.status(429).send(error("Too many parallel logins"));
            return;
        }

        parallelLogins++;
        var msSinceLastLogin = Date.now() - lastLogin;
        if (msSinceLastLogin > 60_000){
            loginHeat = 0;
        } else
        if (msSinceLastLogin < 1000 && loginHeat < 12){
            loginHeat++;
        }
        else
        {
            if (loginHeat > 0)
            {
                loginHeat--;
            }
        }

        lastLogin = Date.now();
        await sleep(crypto.randomInt(1, 10) + (2^loginHeat)*10); // add a little delay to make timing and brute force attacks harder

        parallelLogins--;

        var request: LoginRequest = req.body;
        var email = request.email;
        var password = request.password;
        
        var user = await authService.validateUserPassword(email, password);
        if (!user){
            res.status(401).send(error("Invalid credentials"));
            return;
        }
        var token = authService.createUserToken(user.id, 60 * 24 * 7 * 4 * 12);
        res.cookie('auth', token, {httpOnly: true, sameSite: 'strict', expires: request.stayLoggedIn ? new Date(Date.now() + 60 * 24 * 7 * 4 * 12 * 60_000) : undefined});
        
        res.send(nu<ActionResult>({success:true}));
    });

    // This is the endpoint for a login with credentials that will set a cookie with a user token
    app.post(config.path + '/loginWithToken', async (req, res) => {
        var stayLoggedIn = req.params.stayLoggedIn;
        var oldToken = req.cookies?.auth;
        var userToken = authService.validateUserToken(oldToken);
        if (!userToken){
            res.status(401).send(
                error("Invalid user token, better get a new one")
            );
            return;
        }

        var user = await repo.getUserById(userToken.userId);

        if (user === undefined){
            res.status(401).send(error( "Unknown user"));
            return;
        }
        
        var token = authService.createUserToken(user.id, 60 * 24 * 7 * 4 * 12);
        res.cookie('auth', token, {httpOnly: true, sameSite: 'strict', expires: stayLoggedIn ? new Date(Date.now() + 60 * 24 * 7 * 4 * 12 * 60_000) : undefined});
        
        res.send(nu<ActionResult>({success:true}));
    });

    // This is the endpoint for a logout that will clear the cookie
    app.post(config.path + '/logout', async (req, res) => {
        
        var token = "";
        res.cookie('auth', token, {httpOnly: true, sameSite: 'strict'});
        res.send(nu<ActionResult>({success:true}));
    });

    // This is the endpoint for a session token that can be used during this session. 
    // It uses the `auth` cookie from a earlier login. It is not stored in a cookie but meant to be used by the frontend library in later calls via the header value "AmberSession"
    app.get(config.path + '/token/:tenant', async (req, res) => {
        
        var token = req.cookies.auth;
        var userToken = authService.validateUserToken(token);
        if (!userToken){
            res.status(401).send(
                error("Invalid user token, better get a new one")
            );
            return;
        }

        var user = await repo.getUserById(userToken.userId);

        if (user === undefined){
            res.status(401).send(error( "Unknown user"));
            return;
        }

        var roles = await repo.getUserRoles(userToken.userId, req.params.tenant);
        if (user === undefined || !roles || roles.length === 0){
            res.status(401).send(error("No access to tenant"));
            return;
        }

        var sessionToken = authService.createSessionToken(user.id, req.params.tenant, roles, 60);
        
        var result : SessionTokenDto = {
            token: sessionToken,
            expires: Date.now() + 60 * 60_000,
            roles: roles
        };

        res.send(result);
    });

    app.post(config.path + '/register', async (req, res) => {
        var request: RegisterRequest = req.body;
        var validInvitation: Invitation | null = null;
        if (request.invitation){
            var repoinvitation = await repo.getInvitation(request.invitation);
            if (repoinvitation && repoinvitation.valid_until > new Date() && !repoinvitation.accepted){
                validInvitation = repoinvitation;
            }
        }

        if(config.inviteOnly && !validInvitation){
            res.status(401).send(error("No valid invitation provided"));
            return;
        }
        var userId : string | undefined = undefined;
        
        userId = await authService.createUser(request.username, request.email, request.password);

        if (!userId){
            res.status(401).send(error("Unable to create user. Duplicate email?"));
            return;
        }
        else{
            if (validInvitation != null){
                
                    await repo.acceptInvitation(validInvitation.id);
                    await authService.addRolesToUser(userId, validInvitation.tenant, validInvitation.roles);
            }            
            res.send(nu<string>(userId));
            return;
        }
    });

    app.post(config.path + '/accept-invitation', async (req, res) => {
        var request: AcceptInvitationRequest = req.body;
        var token = req.cookies.auth;
        var userToken = authService.validateUserToken(token);

        if (!userToken){
            res.status(401).send(
                error("Invalid user token, better get a new one")
            );
            return;
        }

        var invitation = await repo.getInvitation(request.invitation);
        if (!invitation || new Date(invitation.valid_until) < new Date() || invitation.accepted){
            res.status(401).send(error("Invalid invitation"));
            return;
        }

        await repo.acceptInvitation(request.invitation);
        await authService.addRolesToUser(userToken.userId, invitation.tenant, invitation.roles);
        
    });

    app.get(config.path + '/invitation/:invitation', async (req, res) => {
        var invitation = await repo.getInvitation(req.params.invitation);
        if (!invitation){
            res.status(404).send(error("Invitation not found"));
        }
        res.send(nu<InvitationDetails>({
            roles: invitation.roles,
            tenantId: invitation.tenant,
            expires: invitation.valid_until.getTime(),
            isStillValid: new Date() < invitation.valid_until && !invitation.accepted,
            tenantName: invitation.tenant == "*" ? "GLOBAL" : (await repo.getTenant(invitation.tenant))?.name 
        }));
    });

    app.get(config.path + '/user', async (req, res) => {
        var userId:string | null = null;
        var token = req.cookies?.auth;
        if (token){
            var userToken = authService.validateUserToken(token);
            if (userToken){
                userId = userToken.userId;
            }
        }
        if (!userId)
        {
            var sessionToken = req.header('AmberSession');
            if (sessionToken){
                var session = authService.validateSessionToken(sessionToken);
                if (session){
                    userId = session.userId;
                }
            }
        }
        
        if (!userId){
            res.status(401).send(
                error("Invalid user and session token, better get a new one")
            );
            return;
        }

        var user = await repo.getUserDetails(userId);
        if (user === undefined){
            res.status(401).send(error( "Unknown user"));
            return;
        }
        res.send(nu<UserDetails>(user));
    });

    // This is the endpoint to discover the tenants of a user
    app.get(config.path + '/user/tenants', async (req, res) => {
        var userId:string | null = null;
        var token = req.cookies?.auth;
        if (token){
            var userToken = authService.validateUserToken(token);
            if (userToken){
                userId = userToken.userId;
            }
        }
        
        if (!userId){
            res.status(401).send(
                error("Invalid user token, better get a new one")
            );
            return;
        }

        var tenants = await repo.getUserTenantsWithRoles(userId);

        res.send(nu<TenantWithRoles[]>(tenants));
    });

     
    function checkAdmin(req:Request, res: Response) : boolean {
        var sessionToken = req.header('AmberSession');
        if (sessionToken) {
            var session = authService.validateSessionToken(sessionToken);
            if (session && session.roles.indexOf(tenantAdminRole) !== -1 && (session.tenant === req.params.tenant || session.tenant === allTenantsId) ) {
                return true;
            }
        }
        res.status(401).send(error("Not authorized"));
        return false;
    }

    // admin functionality for tenant admin user management
    app.get(config.path + '/tenant/:tenant/admin/users', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var users = await repo.getUsersWithRoles(req.params.tenant);
        res.send(nu<UserWithRolesDto[]>(users));
    });

    app.delete(config.path + '/tenant/:tenant/admin/user/:userid', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        repo.storeUserRoles(req.params.userid, req.params.tenant, []);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post(config.path + '/tenant/:tenant/admin/user/:userid/roles', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var roles = req.body;
        repo.storeUserRoles(req.params.userid, req.params.tenant, roles);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post(config.path + '/tenant/:tenant/admin/invitation', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var request:CreateInvitationRequest = req.body;
        var invitation = await repo.storeInvitation(req.params.tenant, request.roles, new Date(Date.now() + 24 * 60 * 60_000 * request.expiresInDays));
        res.send(nu<string>(invitation));
    });

    return authService;
}

interface SessionToken{
    userId: string;
    tenant: string;
    roles: string[];
    expires: string;
}

interface UserToken{
    userId: string;
    expires: string;
}

export class AmberAuth{
    config: Config;
    repo: AmberRepo;
    primarySecret: Buffer;
    secondarySecret: Buffer;

    constructor(config:Config, repo:AmberRepo){
        this.config = config;
        this.repo = repo;
    }

    async init(){
        this.primarySecret = Buffer.from(await this.repo.getOrCreateSystemSetting("primary_secret", ()=> crypto.randomBytes(32).toString('hex')), 'hex');
        this.secondarySecret = Buffer.from(await this.repo.getOrCreateSystemSetting("secondary_secret", ()=> crypto.randomBytes(32).toString('hex')), 'hex');
    }

    // our session tokens are only used for internal communication, so we don't need to worry about JWT standards
    createSessionToken(userId: string, tenant : string, roles:string[], validityMinutes:number): string{
        var token = {
            userId: userId,
            tenant: tenant,
            roles: roles,
            expires: new Date(Date.now() + validityMinutes * 60_000).toISOString()
        };

        var tokenPayload = Buffer.from(JSON.stringify(token)).toString('base64url');
        var hmac = crypto.createHmac('sha256', this.primarySecret);
        hmac.update(tokenPayload);
        var signature = hmac.digest('base64url');
        return tokenPayload + "." + signature;
    }

    validateSessionToken(token: string): SessionToken | undefined{
        var [tokenPayload, signature] = token.split('.');
        
        var hmac = crypto.createHmac('sha256', this.primarySecret);
        hmac.update(tokenPayload);
        var calculatedSignature = hmac.digest('base64url');
        if (calculatedSignature !== signature)
        {
            // second try. Maybe we are in a secret rollover
            hmac = crypto.createHmac('sha256', this.secondarySecret);
            hmac.update(tokenPayload);
            calculatedSignature = hmac.digest('base64url');
            if (calculatedSignature !== signature)
            {
                return undefined;
            }
        }
        var tokenString = Buffer.from(tokenPayload, 'base64url').toString();
        var t = JSON.parse(tokenString);
        if (new Date(t.expires) < new Date())
            return undefined;
        return t;
    }

    createUserToken(userId: string, validityMinutes:number): string{
        var token = {
            userId: userId,
            expires: new Date(Date.now() + validityMinutes * 60_000).toISOString()
        };

        var tokenPayload = Buffer.from(JSON.stringify(token)).toString('base64url');
        var hmac = crypto.createHmac('sha256', this.primarySecret);
        hmac.update(tokenPayload);
        var signature = hmac.digest('base64url');
        return tokenPayload + "." + signature;
    }

    validateUserToken(token: string | undefined | null): UserToken | undefined{
        if (!token)
            return undefined;
        var [tokenPayload, signature] = token.split('.');
        
        var hmac = crypto.createHmac('sha256', this.primarySecret);
        hmac.update(tokenPayload);
        var calculatedSignature = hmac.digest('base64url');
        if (calculatedSignature !== signature)
        {
            // second try. Maybe we are in a secret rollover
            hmac = crypto.createHmac('sha256', this.secondarySecret);
            hmac.update(tokenPayload);
            calculatedSignature = hmac.digest('base64url');
            if (calculatedSignature !== signature)
            {
                return undefined;
            }
        }
        var tokenString = Buffer.from(tokenPayload, 'base64url').toString();
        var t = JSON.parse(tokenString);
        if (new Date(t.expires) < new Date())
            return undefined;
        return t;
    }

    async validateUserPassword(email:string, password:string): Promise<User | undefined>{
        var user = await this.repo.getUserByEmail(email);

        if (!user)
            return undefined;
        var [salt, hash] = user.credential_hash.split('.');

        var hashAlgo = crypto.createHash('sha256');
        hashAlgo.update(salt + password);
        var calculatedHash = hashAlgo.digest('hex');
        if (calculatedHash === hash)
            return user;
        return undefined;
    }

    createPasswordHash(password:string): string{
        var salt = crypto.randomBytes(16).toString('hex');
        var hashAlgo = crypto.createHash('sha256');
        hashAlgo.update(salt + password);
        var hash = hashAlgo.digest('hex');
        return salt + "." + hash;
    }

    async createUser(name:string, email:string, password:string) : Promise<string | undefined>{
        var id = crypto.randomUUID()
        if(await this.repo.storeUser({
            id: id,
            email: email,
            name: name,
            credential_hash: this.createPasswordHash(password)
        }))
        {
            return id;
        }
        return undefined;
    }

    async addRolesToUser(userId:string, tenant:string, roles:string[]){
        var existingRoles = await this.repo.getUserRoles(userId, tenant);
        for (const role of roles) {
            if (existingRoles.indexOf(role) === -1){
                existingRoles.push(role);
            }
        }
        await this.repo.storeUserRoles(userId, tenant, existingRoles);
    }

    async addUserIfNotExists(email:string, name:string, pw:string, tenant:string, roles:string[]) : Promise<void>{
        var user = await this.repo.getUserByEmail(email);
        var id : string | undefined;
        if (!user){
            id = await this.createUser(name, email, pw);
        }
        else{
            id = user.id;
        }
        if (id){
            await this.addRolesToUser(id, tenant, roles);
        }
    }
}