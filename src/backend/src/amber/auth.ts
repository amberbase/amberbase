import { Express, Request, Response } from 'express';
import {Config} from './config.js';
import {AmberRepo, Invitation, User} from './db/repo.js';
import {ActionResult, LoginRequest, nu, error, SessionToken as SessionTokenDto, RegisterRequest, AcceptInvitationRequest, UserDetails, CreateInvitationRequest, UserWithRoles as UserWithRolesDto, TenantWithRoles, InvitationDetails, UserInfo, ChangeUserPasswordRequest, ChangeUserProfileRequest} from './../../../client/src/shared/dtos.js';
import * as crypto from 'node:crypto';
import { sleep } from './../../../client/src/shared/helper.js';
import { BruteProtection } from './helper.js';

export const tenantAdminRole = 'admin';
export const allTenantsId = '*';
export const sessionHeader = 'AmberSession';
var loginBruteProtection = new BruteProtection();
var changePasswordBruteProtection = new BruteProtection();
export async function auth(app:Express, config:Config, repo:AmberRepo) : Promise<AmberAuthService>{
    var authService = new AmberAuthService(config, repo);
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
        var request: ChangeUserProfileRequest = req.body;
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
        if (!authService.checkAdmin(req, res)) return;
        var users = await repo.getUsersWithRoles(req.params.tenant);
        var results : UserWithRolesDto[] = users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            roles: u.roles,
            singleTenant: false
        }));
        var userIdsOnlyInThisTenant = new Set(await repo.getUserIdsOnlyInOneTenant(req.params.tenant));


        for (const u of results) {
            if (userIdsOnlyInThisTenant.has(u.id)) {
                // this user is only in this tenant, so we can remove the tenant from the roles
                u.singleTenant = true;
            }
        }

        res.send(nu<UserWithRolesDto[]>(results));
    });


    app.delete('/tenant/:tenant/admin/user/:userid', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        repo.storeUserRoles(req.params.userid, req.params.tenant, []);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post('/tenant/:tenant/admin/user/:userid/roles', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var roles = req.body;
        repo.storeUserRoles(req.params.userid, req.params.tenant, roles);
        res.send(nu<ActionResult>({success:true}));
    });

    app.post('/tenant/:tenant/admin/invitation', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
        var request:CreateInvitationRequest = req.body;
        var invitation = await repo.storeInvitation(req.params.tenant, request.roles, new Date(Date.now() + 24 * 60 * 60_000 * request.expiresInDays));
        res.send(nu<string>(invitation));
    });

    app.post('/tenant/:tenant/admin/user/:userid/password', async (req, res) => {
        if (!authService.checkAdmin(req, res)) return;
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
            await authService.changeUser(userId,undefined, undefined, newPassword);
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

/**
 * Server side interface for the AmberAuth service.
 */
export interface AmberAuth {
    /**
     * Utility function to get the session token from the request header.
     * If the session token is not valid or expired, it will return undefined.
     * @param req Request to handle
     * @returns SessionToken or undefined if not valid
     */
    getSessionToken(req: Request): SessionToken | undefined;
    
    /**
     * Utility function to check wether a user is logged in with a session and has the admin role for the given tenant retrieved from a path-parameter called "/:tenant" (or the global tenant).
     * If the path does not contain a tenant, it will check for the global tenants admin role.
     * The session token is expected to be in the header "AmberSession".
     * @param req Request to handle
     * @param res Response to potentially send the 401 to
     * @returns Boolean if the use is an admin
     */
    checkAdmin(req: Request, res: Response, onlyAllowGlobal?: boolean): boolean;

    /**
     * Change the password of a user from the user him/herself
     * @param id the id of the user to change the password for
     * @param oldpassword the old password to validate
     * @param newPassword the new password to set
     * @returns true if the password was changed, false if the old password was incorrect or the user was not found
     */
    changeUserPassword(id:string, oldpassword :string, newPassword:string): Promise<boolean>;

    /**
     * change the user, potentially including the password, therefore take caution.
     * @param id the id of the user to change
     * @param newName the new name of the user, if undefined, the old name will be kept
     * @param newEmail the new email of the user, if undefined, the old email will be kept
     * @param newPassword the new password of the user, if undefined, the old password will be kept
     * @returns true if the user was changed, false if the user was not found
     *  */ 
    changeUser(id:string, newName:string | undefined, newEmail?:string| undefined, newPassword?:string | undefined): Promise<boolean>;

    /**
     *  Create a new user with the given name, email and password.
     * @param name User name (does not have to be unique)
     * @param email Unique email of the user, used for login. We will use the lowercase version of the email for uniqueness.
     * @param password Password for the user
     * @returns The id of the created user or undefined if the user could not be created (e.g. email already exists)
     */
    createUser(name:string, email:string, password:string) : Promise<string | undefined>;

    /**
     * Add roles to a user in a tenant. If the user does not have the roles yet, they will be added.
     * @param userId The id of the user to add the roles to
     * @param tenant The tenant to add the roles to
     * @param roles The roles to add to the user
     * @return The id of the user
     */
    addRolesToUser(userId:string, tenant:string, roles:string[]): Promise<void>;

    /**
     * Add a user to a tenant with the given roles. If the user does not exist, it will be created.
     * @param email The email of the user to add
     * @param name The name of the user to add
     * @param pw The password of the user to add
     * @param tenant The tenant to add the user to
     * @param roles The roles to add to the user in the tenant
     */
    addUserToTenant(email:string, name:string, pw:string, tenant:string, roles:string[]) : Promise<string>;
}

export class AmberAuthService implements AmberAuth {
    /**
     * @ignore
     */
    config: Config;
    /**
     * @ignore
     */
    repo: AmberRepo;
    /**
     * @ignore
     */
    primarySecret: Buffer;
    /**
     * @ignore
     */
    secondarySecret: Buffer;

    /**
     * @ignore
     */
    constructor(config:Config, repo:AmberRepo){
        this.config = config;
        this.repo = repo;
    }

    /**
     * @ignore
     */
    async init(){
        this.primarySecret = Buffer.from(await this.repo.getOrCreateSystemSetting("primary_secret", ()=> crypto.randomBytes(32).toString('hex')), 'hex');
        this.secondarySecret = Buffer.from(await this.repo.getOrCreateSystemSetting("secondary_secret", ()=> crypto.randomBytes(32).toString('hex')), 'hex');
    }

    
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
        return this.validateSessionToken(sessionToken);
    }

    /**
     * 
     * @ignore
     */
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

    /**
     * Utility function to validate and retrive session token.
     * @param token the session token to validate as a string
     * @returns Validated SessionToken or undefined if the token is invalid or expired
     */
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

    /**
     * @ignore
     */
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

    /**
     * Utility function to validate a user token.
     * @param token the user token to validate as a string
     * @returns The validated UserToken or undefined if the token is invalid or expired
     */
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

    /**
     * Utility function to validate a user password.
     * @param email the email of the user to validate
     * @param password the password to validate
     * @returns The User if the password is valid, otherwise undefined
     */
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
   
    /**
     * change the user, potentially including the password, therefore take caution.
     * @param id the id of the user to change
     * @param newName the new name of the user, if undefined, the old name will be kept
     * @param newEmail the new email of the user, if undefined, the old email will be kept
     * @param newPassword the new password of the user, if undefined, the old password will be kept
     * @returns true if the user was changed, false if the user was not found
     *  */ 
    async changeUser(id:string, newName:string | undefined, newEmail?:string| undefined, newPassword?:string | undefined): Promise<boolean>{
        var user = await this.repo.getUserById(id);
        if (!user)
        {
            return false;
        }
        var passwordHash = newPassword ? this.createPasswordHash(newPassword) : user.credential_hash;
        return await this.repo.updateUser({
            id: user.id,
            email: newEmail || user.email,
            name: newName || user.name,
            credential_hash: passwordHash
        });
    }

    /**
     * Remove a user from a tenant, this will remove all roles for the user in the tenant
     * @param id the id of the user to remove
     * @param tenant the tenant to remove the user from
     */
    async removeUserFromTenant(id:string, tenant:string): Promise<void>{
        var user = await this.repo.getUserById(id);
        if (!user)
            return;
        var roles = await this.repo.getUserRoles(id, tenant);
        if (roles && roles.length > 0){
            await this.repo.storeUserRoles(id, tenant, []);
        }
    }

    /**
     * @ignore
     */
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

    
    async addUserToTenant(email:string, name:string, pw:string, tenant:string, roles:string[]) : Promise<string>{
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
        return id;
    }
}

