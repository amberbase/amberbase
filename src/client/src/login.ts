import { AmberAdminApi, AmberApi, AmberGlobalAdminApi, AmberUserApi } from './api.js';
import { AmberClient } from './client.js';
import {LoginRequest, nu, UserDetails, SessionToken, RegisterRequest} from './shared/dtos.js'
import { CompletablePromise, sleep } from './shared/helper.js';

export interface UserInTenant {
    /**
     * The user details of the user
     */
    user:UserDetails, 
    /**
     * The tenant the user is in
     */
    tenant:string, 
    /**
     * The roles the user has in the tenant
     */
    roles:string[]
}

export class AmberLoginManager {

    onUserChanged: (user: UserDetails| null) => void = (user) => {};
    onRolesChanged: (tenant : string | null, roles: string[], user: UserDetails | null) => void = (tenant, roles) => {};
    userPromise: CompletablePromise<UserDetails|null> = new CompletablePromise<UserDetails|null>();
    userInTenantPromise: CompletablePromise<UserInTenant|null> = new CompletablePromise<UserInTenant|null>();
    user: UserDetails | null = null;
    roles: string[] = [];
    resolveUser!: (user: UserDetails) => void;
    apiPrefix: string;
    tenant: string | null = null;
    stop: boolean = false;
    provider: (failed: boolean) => Promise<{ email: string; pw: string; stayLoggedIn:boolean }>;
    tenantSelector?: ((availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) | undefined ;

    sessionTokenValidity: number = 0;
    sessionTokenValue: string = "";
    
    constructor(
        apiPrefix : string, 
        provider:(failed:boolean)=>Promise<{email:string, pw:string; stayLoggedIn:boolean}>,
        cleanUser:boolean = false,
        tenantSelector : ((availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string> ) | undefined) 
    {
        this.apiPrefix = apiPrefix;
        this.tenantSelector = tenantSelector;
        this.provider = provider;
        this.loginLoop(cleanUser);
    }

    public close() {
        this.stop = true;
    }

    public getAdminApi(){
        if (this.tenant == null){
            throw new Error("Need to be in a concrete tenant to get the tenant admin api");
        }
        return new AmberAdminApi(this.apiPrefix, this.tenant, () => this.sessionToken());
    }

    public getGlobalAdminApi(){
        if (this.tenant !== "*") {
            throw new Error("Need to be in the global tenant \"*\" to get the global admin api");
        }
        return new AmberGlobalAdminApi(this.apiPrefix, () => this.sessionToken());
    }

    public getAmberApi(){
        if (this.tenant == "*" || this.tenant == null){
            throw new Error("Need to be in a concrete tenant to get the tenant admin api");
        }
        return new AmberApi(this.apiPrefix, this.tenant, () => this.sessionToken());
    }

    public getAmberUserApi(){
        
        return new AmberUserApi(this.apiPrefix, this);
    }

    setRoles( roles: string[]) {
        if (this.roles.length !== roles.length || this.roles.some((role, index) => roles.indexOf(role) === -1)) {
            this.roles = roles;
            this.onRolesChanged(this.tenant, roles, this.user);
            if(this.tenant && this.tenant !=="*" && this.user && roles.length > 0) {
                this.userInTenantPromise.set({
                    user: this.user!,
                    tenant: this.tenant!,
                    roles: roles
                });
            }
        }
    }
    
    setUser(user: UserDetails| null) {
        this.user = user;
        this.userPromise.set(user);
        this.onUserChanged(user);
        this.setRoles([]);
    }

    public getUser() : Promise<UserDetails|null> {
        if (this.user) {
            return Promise.resolve(this.user);
        }
        
        return this.userPromise.promise;
    }

    public getUserInTenant() : Promise<UserInTenant|null> {
        if (this.user && this.tenant && this.roles.length > 0) {
            return Promise.resolve({
                user: this.user,
                tenant: this.tenant,
                roles: this.roles
            });
        }
        
        return this.userInTenantPromise.promise;
    }

    async register(username: string, email: string, password: string, invitation: string) : Promise<void> {
        var response = await fetch(this.apiPrefix + '/register', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(nu<RegisterRequest>({username:username, email:email, password:password, invitation:invitation})),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            throw new Error("Unable to create user");
        }
    }

    async loginLoop(cleanUser: boolean) : Promise<void> {
        if (cleanUser) {
            await fetch(this.apiPrefix + '/logout', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify({}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        
        
        while(1)
        {
            while (!this.user) {
                try {
                    if (!this.user)
                    {
                        await this.loginWithToken(true);
                        var userFetched = await this.getUserDetails();
                        this.setUser(userFetched);
                        
                        if (userFetched)
                        {
                            if(this.tenant == null && this.tenantSelector)
                            {
                                var tenants = await this.getAmberUserApi().getUserTenants();
                                var tenantSelected = await this.tenantSelector(tenants);
                                var roles = tenants.find(t => t.id === tenantSelected)?.roles ?? [];
                                this.tenant = tenantSelected;
                                this.setRoles(roles);
                            }
                            await this.sessionToken();
                        }
                        
                    }
                    else
                    {
                    }
                } catch (e) {
                    var loginSucces = false;
                    var loginCredentialsFailed = false;
                    while (!loginSucces) {
                        var creds = await this.provider(loginCredentialsFailed);
                        loginSucces = await this.dologin(creds, creds.stayLoggedIn);
                        loginCredentialsFailed = true;
                    }
                }
            }
            await this.userPromise.promise;
            if (this.stop) {
                return;
            }
        }
    }

    async logout() : Promise<void> {
        await fetch(this.apiPrefix + '/logout', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({}),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        this.setUser(null);
    }

    refreshUser(){
        this.setUser(null);
    }

    async sessionToken() : Promise<string> {
        var user = await this.user;
        if (this.sessionTokenValidity > Date.now() + 1000 * 60 * 5) {
            return this.sessionTokenValue;
        }
        else
        {
            var response = await fetch(this.apiPrefix + '/token/' + this.tenant, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.status === 401) {
                throw new Error("Not authorized");
            }
            var sessionToken: SessionToken = await response.json();
            this.sessionTokenValue = sessionToken.token;
            this.sessionTokenValidity = sessionToken.expires;
            
            this.setRoles(sessionToken.roles);
            
            return this.sessionTokenValue;
        }
    }

    async getUserDetails() : Promise<UserDetails> {
        var response = await fetch(this.apiPrefix + '/user', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            throw new Error("Not authorized");
        }
        return await response.json();
    }


    async dologin(creds: {email:string, pw:string}, stayLoggedIn:boolean) : Promise<boolean> {
        var response = await fetch(this.apiPrefix + '/login', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(nu<LoginRequest>({email:creds.email, password:creds.pw, stayLoggedIn:stayLoggedIn})),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            return false;
        }
        return true;
    }

    async loginWithToken(stayLoggedIn:boolean) : Promise<boolean> {
        var response = await fetch(this.apiPrefix + `/loginWithToken?${new URLSearchParams({stayLoggedIn: ""+stayLoggedIn})}`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({}),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            return false;
        }
        return true;
    }
}