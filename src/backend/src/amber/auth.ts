import { Express, Request, Response } from 'express';
import {Config} from './config.js';
import {AmberRepo, Invitation, User} from './db/repo.js';
import {ActionResult, LoginRequest, nu, error, SessionToken as SessionTokenDto, RegisterRequest, AcceptInvitationRequest, UserDetails, CreateInvitationRequest, UserWithRoles as UserWithRolesDto, TenantWithRoles, InvitationDetails, UserInfo, ChangeUserPasswordRequest, ChangeUserDetailsRequest} from './../../../client/src/shared/dtos.js';
import * as crypto from 'node:crypto';
import { sleep } from './../../../client/src/shared/helper.js';
import { BruteProtection } from './helper.js';

export const tenantAdminRole = 'admin';
export const allTenantsId = '*';
export const sessionHeader = 'AmberSession';
var loginBruteProtection = new BruteProtection();
var changePasswordBruteProtection = new BruteProtection();
export async function auth(app:Express, config:Config, repo:AmberRepo) : Promise<AmberAuth>{
    var authService = new AmberAuth(config, repo);
    await authService.init();
    
    // This is the endpoint for a login with credentials that will set a cookie with a user token
    app.post('/login', async (req, res) => {
        
        // this is where we need to protect against brute force attacks
        if (!await loginBruteProtection.check()){
            res.status(429).send(error("Too many parallel logins"));
            return;
        }

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
    app.post( '/loginWithToken', async (req, res) => {
        var stayLoggedIn = req.query.stayLoggedIn;
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
    app.post('/logout', async (req, res) => {
        
        var token = "";
        res.cookie('auth', token, {httpOnly: true, sameSite: 'strict'});
        res.send(nu<ActionResult>({success:true}));
    });

    // This is the endpoint for a session token that can be used during this session. 
    // It uses the `auth` cookie from a earlier login. It is not stored in a cookie but meant to be used by the frontend library in later calls via the header value "AmberSession"
    app.get('/token/:tenant', async (req, res) => {
        
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

    app.post('/register', async (req, res) => {
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

    app.post('/accept-invitation', async (req, res) => {
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

    app.get('/invitation/:invitation', async (req, res) => {
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

    // get the current users details
    app.get('/user', async (req, res) => {
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
            var sessionToken = req.header(sessionHeader);
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

    /**
     * Change the password of a user from the user him/herself
     */
    app.post('/user/password', async (req, res) => {
        var request: ChangeUserPasswordRequest = req.body;
        if (!request.currentPassword || !request.newPassword){
            res.status(400).send(error("Missing old or new password"));
            return;
        }

        if (!await changePasswordBruteProtection.check())
        {
            res.status(429).send(error("Too many parallel password changes"));
            return;
        }

        if (await authService.changeUserPassword(request.userId, request.currentPassword, request.newPassword)){
            res.send(nu<ActionResult>({success:true}));
        }
        else{
            res.status(400).send(error("Missmatch old password or user not found"));
            return;
        }
    });

    /**
     * Update user details from the user him/herself
     */
    app.post('/user', async (req, res) => {
        var request: ChangeUserDetailsRequest = req.body;
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
                error("Invalid user token")
            );
            return;
        }

        if (!request.userName ){
            res.status(400).send(error("Missing new username"));
            return;
        }
        if (await authService.changeUser(userId, request.userName)){
            res.send(nu<ActionResult>({success:true}));
        }
        else{
            res.send(nu<ActionResult>({success:false, error: "Unable to change user"}));
        }
    });



    // This is the endpoint to discover the tenants of a user, authenticated as a user with a valid user token
    app.get('/user/tenants', async (req, res) => {
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
        var sessionToken = req.header(sessionHeader);
        if (sessionToken) {
            var session = authService.validateSessionToken(sessionToken);
            if (session && session.roles.indexOf(tenantAdminRole) !== -1 && (session.tenant === req.params.tenant || session.tenant === allTenantsId) ) {
                return true;
            }
        }
        res.status(401).send(error("Not authorized"));
        return false;
    }

    //get all users for a tenant (allowed for users of the tenant). Will contain global users as well
    app.get('/tenant/:tenant/users', async (req, res) => {
        var sessionToken = req.header(sessionHeader);
        var session = authService.validateSessionToken(sessionToken);
        if (!session || session.tenant !== req.params.tenant) {
            res.status(401).send(error("Not authorized"));
            return;
        }
        
        var users = await repo.getUsersForTenant(req.params.tenant);
        res.send(nu<UserInfo[]>(users));
    });

    // admin functionality for tenant admin user management
    app.get('/tenant/:tenant/admin/users', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var users = await repo.getUsersWithRoles(req.params.tenant);
        res.send(nu<UserWithRolesDto[]>(users));
    });


    app.delete('/tenant/:tenant/admin/user/:userid', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        repo.storeUserRoles(req.params.userid, req.params.tenant, []);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post('/tenant/:tenant/admin/user/:userid/roles', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var roles = req.body;
        repo.storeUserRoles(req.params.userid, req.params.tenant, roles);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post('/tenant/:tenant/admin/invitation', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var request:CreateInvitationRequest = req.body;
        var invitation = await repo.storeInvitation(req.params.tenant, request.roles, new Date(Date.now() + 24 * 60 * 60_000 * request.expiresInDays));
        res.send(nu<string>(invitation));
    });

    app.post('/tenant/:tenant/admin/user/:userid/password', async (req, res) => {
        if (!checkAdmin(req, res)) return;
        var newPassword = req.body;
        var userId = req.params.userid;
        var user = await repo.getUserDetails(userId);
        if (!user){
            res.status(401).send(error("User not found"));
            return;
        }
        if(user.tenants[req.params.tenant] && Object.keys(user.tenants).length === 1)
        {
            // this is the only tenant, so we can change the password
            await authService.changeUserPasswordWithoutOldpassword(userId, newPassword);
            res.send(nu<ActionResult>({success:true}));
            return;
        }

        res.status(401).send(error("User is not only member of this tenant"));
        return;
    });

    return authService;
}

export interface SessionToken{
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

    /**
     * Utility function to check wether a user is logged in with a session and has the admin role for the given tenant (or the global tenant).
     * If the path does not contain a tenant, it will check for the global tenants admin role.
     * @param req Request to handle
     * @param res Response to potentially send the 401 to
     * @returns Boolean if the use is an admin
     */
    checkAdmin(req:Request, res: Response, onlyAllowGlobal?: boolean | undefined) : boolean {
        var tenantToCheck = onlyAllowGlobal? allTenantsId : (req.params.tenant || allTenantsId);
        var sessionToken = req.header('AmberSession');
        if (sessionToken) {
            var session = this.validateSessionToken(sessionToken);
            if (session && session.roles.indexOf(tenantAdminRole) !== -1 && ( session.tenant === tenantToCheck) || session.tenant === allTenantsId) {
                return true;
            }
        }
        res.status(401).send(error("Not authorized"));
        return false;
    }


    getSessionToken(req: Request): SessionToken | undefined {
        var sessionToken = req.header(sessionHeader);
        if (!sessionToken)
            return undefined;
        var session = this.validateSessionToken(sessionToken);
        if (!session)
            return undefined;
        if (session.expires && new Date(session.expires) < new Date())
            return undefined;
        return session;
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

    validateSessionToken(token: string | undefined): SessionToken | undefined{
        if (!token)
        {
            return undefined;
        }
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
        if (crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash)))
            return user;
        return undefined;
    }

    async changeUserPassword(id:string, oldpassword :string, newPassword:string): Promise<boolean>{
        var user = await this.repo.getUserById(id);
        if (!user)
            return false;

        var [salt, hash] = user.credential_hash.split('.');

        var hashAlgo = crypto.createHash('sha256');
        hashAlgo.update(salt + oldpassword);
        var calculatedHash = hashAlgo.digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(calculatedHash), Buffer.from(hash)))
            return false;

        var passwordHash = this.createPasswordHash(newPassword);

        return await this.repo.updateUser({
            id: user.id,
            email: user.email,
            name: user.name,
            credential_hash: passwordHash
        });
    }

    // this is a special case where we don't need the old password. Only an admin should be able to do this
    async changeUserPasswordWithoutOldpassword(id:string, newPassword:string): Promise<boolean>{
        var user = await this.repo.getUserById(id);
        if (!user)
            return false;
        var passwordHash = this.createPasswordHash(newPassword);

        await this.repo.updateUser({
            id: user.id,
            email: user.email,
            name: user.name,
            credential_hash: passwordHash
        });
    }

    // this is a special case where we don't need the old password. Only an admin should be able to do this
    async changeUser(id:string, newName:string | undefined, newEmail?:string| undefined): Promise<boolean>{
        console.log("Change user", id, newName, newEmail);
        var user = await this.repo.getUserById(id);
        if (!user)
        {
            console.log("User not found");
            return false;
        }

        return await this.repo.updateUser({
            id: user.id,
            email: newEmail || user.email,
            name: newName || user.name,
            credential_hash: user.credential_hash
        });
    }

    async removeUserFromTenant(id:string, tenant:string): Promise<void>{
        var user = await this.repo.getUserById(id);
        if (!user)
            return;
        var roles = await this.repo.getUserRoles(id, tenant);
        if (roles && roles.length > 0){
            await this.repo.storeUserRoles(id, tenant, []);
        }
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

