import { AmberApi, AmberUserApi } from "./api.js";
import { AmberChannels, AmberChannelssClient } from "./channels.js";
import { AmberCollectionsClient, AmberCollections } from "./collections.js";
import { AmberConnectionsClient } from "./connection.js";
import { UserDetails } from "./shared/dtos.js";
import { AmberLoginManager } from "./login.js";

export class AmberClientInit{
    apiPrefix:string = "/amber";
    tenant:string | null = null;
    credentialsProvider: ((failed:boolean) => Promise<{ email: string; pw: string; stayLoggedIn : boolean }>) | undefined;
    tenantSelector: ((availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) | undefined;
    cleanUser:boolean = false;
    userChanged: ((user: UserDetails | null) => void) | undefined;
    rolesChanged: ((tenant:string | null, roles: string[]) => void) | undefined;

    constructor(){

    }

    withTenant(tenant:string) : AmberClientInit{
        this.tenant = tenant;
        return this;
    }

    forGlobal() : AmberClientInit{
        this.tenant = "*";
        return this;
    }

    withPath(path:string) : AmberClientInit{
        this.apiPrefix = path;
        return this;
    }

    withUser(email:string, pw:string, stayLoggedIn:boolean) : AmberClientInit{
        this.credentialsProvider = async (failed:boolean) => {
            return {email:email, pw:pw, stayLoggedIn:stayLoggedIn};
        }
        this.cleanUser = true;
        return this;
    }

    withCredentialsProvider(provider:(failed:boolean)=>Promise<{email:string, pw:string, stayLoggedIn:boolean}>) : AmberClientInit{
        this.credentialsProvider = provider;
        return this;
    }

    withTenantSelector(selector:(availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) : AmberClientInit{
        this.tenantSelector = selector;
        return this;
    }

    withCleanUser() : AmberClientInit{
        this.cleanUser = true;
        return this
    }

    onUserChanged(callback:(user: UserDetails | null) => void) : AmberClientInit{
        this.userChanged = callback;
        return this;
    }

    onRolesChanged(callback:(tenant : string | null, roles: string[]) => void) : AmberClientInit{
        this.rolesChanged = callback;
        return this;
    }

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
    apiPrefix:string;
    loginManager: AmberLoginManager;
    constructor(apiPrefix:string | undefined, credentialsProvider: ((failed:boolean) => Promise<{ email: string; pw: string; stayLoggedIn:boolean }>), cleanUser:boolean = false,
        tenantSelector: ((availableTenants:{id:string, name:string, roles:string[]}[]) => Promise<string>) | undefined){
        this.apiPrefix = apiPrefix || '/amber';
        this.loginManager = new AmberLoginManager(this.apiPrefix, credentialsProvider, cleanUser, tenantSelector);     
    }

    user() : Promise<UserDetails | null>{
        if (this.loginManager){
            return this.loginManager.getUser();
        }
        return Promise.reject("No login manager");
    }

    getAdminApi(){
        if (this.loginManager){
            return this.loginManager.getAdminApi();
        }
    }

    getGlobalAdminApi(){
        if (this.loginManager){
            return this.loginManager.getGlobalAdminApi();
        }
        
    }

    getAmberApi() : AmberApi | undefined{
        if (this.loginManager){
            return this.loginManager.getAmberApi();
        }
    }

    getUserApi(){
        return new AmberUserApi(this.apiPrefix);
    }

    connectionsClient : AmberConnectionsClient | null = null;
    collectionsClient : AmberCollectionsClient | null = null;
    channelsClient : AmberChannelssClient | null = null;

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
            this.channelsClient = new AmberChannelssClient( this.connectionsClient);
        }
        return this.channelsClient;
    }
}