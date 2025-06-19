import { AmberApi, AmberUserApi } from "./api.js";
import { AmberChannels, AmberChannelsClient } from "./channels.js";
import { AmberCollectionsClient, AmberCollections } from "./collections.js";
import { AmberConnectionsClient } from "./connection.js";
import { UserDetails } from "./shared/dtos.js";
import { AmberLoginManager, UserInTenant } from "./login.js";
import { AmberUiApi } from "./ui.js";

/**
 * Main entry point to create a new amberbase client. It provides a fluent API to configure the client. Make sure to call the `start()` method to create the actual client instance after completing the setup.
 * @returns a new @see AmberClientInit instance to configure the client
 */
export function amberClient() : AmberClientInit{
    return new AmberClientInit();
}

export class AmberClientInit{
    /**
     * @internal
     */
    apiPrefix:string = "/amber";
    /**
     * @internal
     */
    tenant:string | null = null;
    /**
     * @internal
     */
    credentialsProvider: ((failed:boolean) => Promise<{ email: string; pw: string; stayLoggedIn : boolean }>) | undefined;
    /**
     * @internal
     */
    tenantSelector: ((availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) | undefined;
    /**
     * @internal
     */
    cleanUser:boolean = false;
    /**
     * @internal
     */
    userChanged: ((user: UserDetails | null) => void) | undefined;
    /**
     * @internal
     */
    rolesChanged: ((tenant:string | null, roles: string[], user: UserDetails | null) => void) | undefined;

    /**
     * @internal
     */
    constructor(){

    }

    /**
     * Set the tenant to use, from some place. This can be either hardcoded or retrieved from the url in the case that you use the amber ui and get the tenant selected injected into the url.
     * If it is not set, the user will be prompted to select a tenant unless the global tenant has explicitly been requested via @see forGlobal.
     * @param tenant the tenant to use for the client. 
     * @returns Continuation of the fluent API to configure the client.
     */
    withTenant(tenant:string) : AmberClientInit{
        this.tenant = tenant;
        return this;
    }

    /**
     * Request the global tenant. That means that we only want users from the global tenant. This is useful to build a custom management UI for the global management tasks like creating new tenants etc.
     * @returns Continuation of the fluent API to configure the client.
     */
    forGlobal() : AmberClientInit{
        this.tenant = "*";
        return this;
    }

    /**
     * Set the path prefix for the amber api. This is important if you want to use a different path than the default `/amber`.
     * @param path the path to the amber api.
     * @returns 
     */
    withPath(path:string) : AmberClientInit{
        this.apiPrefix = path;
        return this;
    }

    /**
     * Set the user credentials to use for the client. This is useful for testing or if you want to hardcode the credentials or you somehow retrieve the credentials through another mechanism. 
     * It is mutually exclusive to the other methods that handle user login credentials: @see withCredentialsProvider and @see withAmberUiLogin.
     * @param email the email of the user
     * @param pw the password of the user
     * @param stayLoggedIn whether to stay logged in or not
     * @returns Continuation of the fluent API to configure the client.
     */
    withUser(email:string, pw:string, stayLoggedIn:boolean) : AmberClientInit{
        this.credentialsProvider = async (failed:boolean) => {
            return {email:email, pw:pw, stayLoggedIn:stayLoggedIn};
        }
        this.cleanUser = true;
        return this;
    }

    /**
     * Set the credentials provider to use for the client when asking for the users credentials in a custom UI. This is useful if you want to provide a custom way to retrieve the user credentials, for example by prompting the user for their credentials.
     * It will only be called if the user is not already logged in or if the login fails. This is mutually exclusive to the other methods that handle user login credentials: @see withUser and @see withAmberUiLogin.
     * @param provider the provider function that returns the user credentials. You can use the `failed` parameter to determine if the login failed and you want to prompt the user again for their credentials. 
     * @returns Continuation of the fluent API to configure the client.
     */
    withCredentialsProvider(provider:(failed:boolean)=>Promise<{email:string, pw:string, stayLoggedIn:boolean}>) : AmberClientInit{
        this.credentialsProvider = provider;
        return this;
    }

    /**
     * Use the amber ui to login. This will redirect the user to the amber ui login page and handle the login process there. 
     * It will also handle tenant selection if the tenant is not set.
     * @param returnUrl the url to redirect to after login. If not set, it will redirect to the current page. Use `{tenant}` as a placeholder to retrieve the selected tenant if you have not set it already.
     * @returns Continuation of the fluent API to configure the client.
     */
    withAmberUiLogin(returnUrl?:string) : AmberClientInit{
        this.credentialsProvider = async (failed:boolean) => {
            var loginPage = this.apiPrefix + "/ui/login";
            
            if (this.tenant){
                loginPage += "?tenant=" + this.tenant;
            }

            if (returnUrl){
                loginPage += "#return=" + encodeURIComponent(returnUrl);
            } 

            console.log("Redirect to login page: " + loginPage);
            window.location.href = loginPage;
            
            return {email:"", pw:"", stayLoggedIn:false}; // never reached
        }

        
        this.tenantSelector = async (availableTenants) => {
            if (this.tenant)
            {
                return this.tenant;
            }
            if (availableTenants.length == 1){
                return availableTenants[0].id;
            }
            var loginPage = this.apiPrefix + "/ui/login";
            
            if (returnUrl){
                loginPage += "#return=" + encodeURIComponent(returnUrl);
            } 

            console.log("Redirect to login page for tenant selection: " + loginPage);
            window.location.href = loginPage;
            
            return ""; // never reached

        };

        return this;
    }

    /**
     * If you want to build a custom way to select the tenant by a user (that means you do not set the tenant explicitly with @see withTenant and you don't want to use @see withAmberUiLogin), you can use this method to set a function that will be called to select the tenant.
     * @param selector a function that will be called to select the tenant. It will be called with the available tenants and should return the id of the tenant to use.
     * @returns 
     */
    withTenantSelector(selector:(availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) : AmberClientInit{
        this.tenantSelector = selector;
        return this;
    }

    /**
     * Clean the user and force a new login.
     * @returns Continuation of the fluent API to configure the client.
     */
    withCleanUser() : AmberClientInit{
        this.cleanUser = true;
        return this
    }

    /**
     * Register a callback that will be called when the user changes. This is useful if you want to update the UI or perform some actions when the user changes.
     * @param callback A callback that will be called with the user details or null if the user has logged out again.
     * @returns Continuation of the fluent API to configure the client.
     */
    onUserChanged(callback:(user: UserDetails | null) => void) : AmberClientInit{
        this.userChanged = callback;
        return this;
    }

    /**
     * Register a callback that will be called when the roles of the user or the tenant selected change.
     * @param callback A callback that will be called with the tenant, the roles and the user details or null if the user has logged out again.
     * @returns Continuation of the fluent API to configure the client.
     */
    onRolesChanged(callback:(tenant : string | null, roles: string[], user: UserDetails | null) => void) : AmberClientInit{
        this.rolesChanged = callback;
        return this;
    }

    /**
     * Start the client and return the actual @see AmberClient instance. This will create the login manager and set it up to ask the user to login.
     * @returns a new @see AmberClient instance that is ready to use.
     */
    start() : AmberClient{
        if (!this.credentialsProvider){
            throw new Error("No credentials provider or credentials set");
        }

        if (this.tenant)
        {
            this.tenantSelector = async (availableTenants) => {
                return this.tenant!;
            }
        }

        var client =  new AmberClient(
            this.apiPrefix, 
            this.credentialsProvider, 
            this.cleanUser,
            this.tenantSelector
        );
        
        var loginManager = client.loginManager;
        if (loginManager){
            if (this.userChanged){
                loginManager.onUserChanged = this.userChanged;
            }
            if (this.rolesChanged){
                loginManager.onRolesChanged = this.rolesChanged;
            }
        }
        return client;
    }
}

export class AmberClient{
    /**
     * @internal
     */
    apiPrefix:string;

    /**
     * @internal
     */
    loginManager: AmberLoginManager;
    /**
     * @internal
     */
    constructor(apiPrefix:string | undefined, credentialsProvider: ((failed:boolean) => Promise<{ email: string; pw: string; stayLoggedIn:boolean }>), cleanUser:boolean = false,
        tenantSelector: ((availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) | undefined){
        this.apiPrefix = apiPrefix || '/amber';
        this.loginManager = new AmberLoginManager(this.apiPrefix, credentialsProvider, cleanUser, tenantSelector);     
    }

    /**
     * Method to receive the user as soon as the user is logged in. It will return immediately if the user is already logged in. 
     * The user being logged in does not mean that the user is in a tenant. Use @see userInTenant to wait for that to be ready.
     * @returns the user details of the logged in user as a promise.
     */
    user() : Promise<UserDetails >{
        if (this.loginManager){
            return this.loginManager.getUser();
        }
        return Promise.reject("No login manager");
    }

    /**
     * Method to receive the user details, tenant and roles as soon as the user is logged in and in a tenant. 
     * It will return immediately if the user is already logged in and in a tenant.
     * @returns the user details, tenant and roles as a promise.
     */
    userInTenant(): Promise<UserInTenant | null>{
        if (this.loginManager){
            return this.loginManager.getUserInTenant();
        }
        return Promise.reject("No login manager");
    }

    /**
     * Get the admin api for the tenat that the user is currently in. The user must be logged in and in a tenant and have the "admin" role for this to work.
     * @returns the admin api for the tenant that the user is currently in.
     */
    getAdminApi(){
        if (this.loginManager){
            return this.loginManager.getAdminApi();
        }
    }

    /**
     * Get the global admin api. This is only available if the user is logged in the global tenant. The user needs to have the "admin" role in the global tenant for this to work.
     * @returns the global admin api to manage tenants and users across all tenants.
     */
    getGlobalAdminApi(){
        if (this.loginManager){
            return this.loginManager.getGlobalAdminApi();
        }
        
    }

    /**
     * Get the general amber api for the tenant that the user is currently in. Right now this provides access to a list of users in the tenant.
     * @returns the amber api for the tenant that the user is currently in.
     */
    getAmberApi() : AmberApi | undefined{
        if (this.loginManager){
            return this.loginManager.getAmberApi();
        }
    }

    /**
     * Get the user api. It has methods for selfmanagement of the user as well as methods to register new users or redeem invitations. It is not bound to a tenant
     * @returns the user api.
     */
    getUserApi(){
        return new AmberUserApi(this.apiPrefix, this.loginManager);
    }

    /**
     * @internal
     */
    connectionsClient : AmberConnectionsClient | null = null;
    /**
     * @internal
     */
    collectionsClient : AmberCollectionsClient | null = null;
    /**
     * @internal
     */
    channelsClient : AmberChannelsClient | null = null;

    /**
     * Get the collections client for this tenant
     * @returns the collections client for this tenant
     */
    getCollectionsApi(): AmberCollections{
        if (this.connectionsClient == null){
            var tenant = this.loginManager.tenant;
            if (tenant == null){
                throw new Error("No tenant set in login manager yet");
            }
            this.connectionsClient = new AmberConnectionsClient(this.apiPrefix, 
                tenant ,
                ()=>this.loginManager.sessionToken()
            );
        }
        if (this.collectionsClient == null){
            this.collectionsClient = new AmberCollectionsClient( this.connectionsClient);
        }
        return this.collectionsClient;
    }

    /**
     * Get the collections client for this tenant
     * @returns the collections client for this tenant
     */
    getChannelsApi(): AmberChannels{
        if (this.connectionsClient == null){ // collections and channels are sharing the same connection
            var tenant = this.loginManager.tenant;
            if (tenant == null){
                throw new Error("No tenant set in login manager yet");
            }
            this.connectionsClient = new AmberConnectionsClient(this.apiPrefix, 
                tenant ,
                ()=>this.loginManager.sessionToken()
            );
        }
        if (this.channelsClient == null){
            this.channelsClient = new AmberChannelsClient( this.connectionsClient);
        }
        return this.channelsClient;
    }

    /**
     * Get the api to navigate to the included amber ui
     * @returns 
     */
    getAmberUiApi() : AmberUiApi{
        return new AmberUiApi(this.apiPrefix, this.loginManager);
    }

    /**
     * Get session header. Use this header to authenticate requests to your custom APIs that you want to protect with an amber session.
     * @returns a promise that resolves to an object with the header name and value to use in the request.
     */
    async sessionHeader() : Promise<{header:string, value:string}> {
        if (!this.loginManager){
            throw new Error("No login manager");
        }
        var token = await this.loginManager.sessionToken();
        if (!token){
            throw new Error("No session token available");
        }
        return {header: "AmberSession", value: token};
    }
}