import {LoginRequest, nu, UserDetails, SessionToken, RegisterRequest, Tenant, ActionResult, TenantDetails, CreateTenantRequest, UserWithRoles, CreateInvitationRequest, TenantWithRoles, AcceptInvitationRequest, InvitationDetails, UserInfo, AmberMetricsBucket} from './dtos.js'

/**
 * Internal class to wrap REST like api calls to the amber server for convenience
 */
class ApiClient {
    apiPrefix: string;
    tenant: string | undefined;
    tokenProvider: (() => Promise<string>) | undefined;

    /**
     * Initialize the ApiClient with the api prefix and optional tenant and token provider. 
     * Some API calls do not need a session token and some are outside of a tenant context.
     * @param apiPrefix the api prefix that is used on the server to separate the amber specific methods from custom ones. E.g. '/amber'
     * @param tenant tenant for the api calls for tenant specific apis
     * @param tokenProvider token provider to give an amber session token. Needed for tenant specific calls.
     */
    constructor(apiPrefix : string, tenant: string | undefined = undefined, tokenProvider: (() => Promise<string>) | undefined = undefined) {
        this.apiPrefix = apiPrefix;
        this.tenant = tenant;
        this.tokenProvider = tokenProvider;
    }

    /**
     * Internal method to fetch data from the server. It will replace the :tenant placeholder in the path with the tenant id if it is set and attach a session header.
     * @param method HTTP method to use. GET, POST, DELETE
     * @param path Path relative to the apiPrefix. It can contain a :tenant placeholder that will be replaced with the tenant id if it is set.
     * @param body Body to be send
     * @returns Parsed json response from the server. It will throw an error if the response is not 200 OK or if the json cannot be parsed.
     */
    async fetch<T>(method: "GET"| "DELETE" | "POST", path: string, body:any | undefined = undefined): Promise<T> {
        var p = this.tenant ?  path.replace(":tenant", this.tenant) : path;
        var token = this.tokenProvider ? await this.tokenProvider() : undefined;
        var headers:HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token)
        {
            headers["AmberSession"] = token;
        }

        var response = await fetch(this.apiPrefix + p, {
            method: method,
            credentials: 'include',
            headers: headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 401) {
            throw new Error("Not authorized");
        }

        var result = await response.json();
        if (response.status !== 200) {
            throw new Error(result.error || "HTTP Status indicates error: " + response.status);
        }
        return result;
    }

    /**
     * Internal method to fetch data from the server. It will replace the :tenant placeholder in the path with the tenant id if it is set and attach a session header.
     * @param method HTTP method to use. GET, POST, DELETE
     * @param path Path relative to the apiPrefix. It can contain a :tenant placeholder that will be replaced with the tenant id if it is set.
     * @param body Body to be send
     * @returns Raw text value. It will throw an error if the response is not 200 OK.
     */
    async fetchText(method: "GET"| "DELETE" | "POST", path: string, body:any | undefined = undefined): Promise<string> {
        var p = this.tenant ?  path.replace(":tenant", this.tenant) : path;
        var token = this.tokenProvider ? await this.tokenProvider() : undefined;
        var headers:HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token)
        {
            headers["AmberSession"] = token;
        }

        var response = await fetch(this.apiPrefix + p, {
            method: method,
            credentials: 'include',
            headers: headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (response.status === 401) {
            throw new Error("Not authorized");
        }

        var result = await response.text();
        if (response.status !== 200) {
            throw new Error("HTTP Status indicates error: " + response.status);
        }
        return result;
    }

}

/**
 * AmberAdminApi is the main class to access the admin functionality for a specific tenant. It is used to manage users and roles.
 */
export class AmberAdminApi{
    apiClient: ApiClient;

    /**
     * You will optain an instance usually from the AmberClient that you get from an AmberInit builder
     * @param prefix server prefix for the api. E.g. '/amber'
     * @param tenant tenant to manage
     * @param tokenProvider token provider to get a session token. The token needs to be valid for the tenant and contain the role `admin`
     */
    constructor(prefix: string, tenant:string, tokenProvider: () => Promise<string>){
        this.apiClient = new ApiClient(prefix, tenant, tokenProvider);
    }

    /**
     * Get all users of the tenant. The user object contains the roles of the user.
     * @returns A list of users in the tenant. The user object contains the roles of the user.
     */
    async getUsers() : Promise<UserWithRoles[]> {
        return await this.apiClient.fetch<UserWithRoles[]>("GET", '/tenant/:tenant/admin/users');
    }

    /**
     * Delete a user of the tenant. It can NOT remove users that are registered to all tenants using the `*` global tenant 
     * @param userId the user to remove from the tenant.
     * @returns Success result or error message
     */
    async deleteUser(userId:string) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("DELETE", '/tenant/:tenant/admin/user/' + userId);
    }

    /**
     * Set the roles of a user in the current tenant. It will remove all roles and set the new ones.
     * @param userId user to change
     * @param roles new roles to set
     * @returns Success result or error message
     */
    async setRolesOfUser(userId:string, roles:string[]) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("POST", '/tenant/:tenant/admin/user/' + userId + '/roles', roles);
    }

    /**
     * Create an invitation token for the given roles and a custom expiry
     * @param request Request object
     * @returns The invitation token to be used in the AmberUserApi.acceptInvitation. 
     */
    async createInvitation(request:CreateInvitationRequest) : Promise<string> {
        return await this.apiClient.fetchText("POST", '/tenant/:tenant/admin/invitation', request);
    }

    async getMetricsByMinutes() : Promise<AmberMetricsBucket[]> {
        return await this.apiClient.fetch<AmberMetricsBucket[]>("GET", '/tenant/:tenant/metrics/minute');
    }

    async getMetricsByHour() : Promise<AmberMetricsBucket[]> {
        return await this.apiClient.fetch<AmberMetricsBucket[]>("GET", '/tenant/:tenant/metrics/hour');
    }
}

/**
 * AmberGlobalAdminApi is the main class to access the global admin functionality. It is used to manage tenants and requires a user with a session for tenant `*` and `admin` role
 */
export class AmberGlobalAdminApi{
    apiClient: ApiClient;
    constructor(prefix: string, tokenProvider: () => Promise<string>){
        this.apiClient = new ApiClient(prefix, "*", tokenProvider);
    }

    /**
     * Get all existing tenants
     * @returns List of tenants
     */
    async getTenants() : Promise<Tenant[]> {
        return await this.apiClient.fetch<Tenant[]>("GET", '/tenants');
    }


    /**
     * Remove tenant from the system. It will remove all users and data of the tenant. It can NOT remove the `*` global tenant.
     * @param tenantId Tenant to remove
     * @returns Action result with success or error message
     */
    async deleteTenant(tenantId:string) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("DELETE", '/tenant/' + tenantId);
    }

    /**
     * Create a new tenant. It will create a new tenant with the given id and name. The id must be unique and not contain any special characters.
     * @param request Request object
     * @returns Action result with success or error message
     */
    async createTenant(request:CreateTenantRequest) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("POST", '/tenants', request);
    }

    /**
     * Update a tenant. It will update the name and data of the tenant. The id must be unique and not contain any special characters.
     * @param tenantId Tenant to update
     * @param request Request object
     * @returns Action result with success or error message
     */
    async updateTenant(tenantId:string, request:TenantDetails) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("POST", '/tenant/' + tenantId, request);
    }

    async getMetricsByMinutes() : Promise<AmberMetricsBucket[]> {
        return await this.apiClient.fetch<AmberMetricsBucket[]>("GET", '/metrics/minute');
    }

    async getMetricsByHour() : Promise<AmberMetricsBucket[]> {
        return await this.apiClient.fetch<AmberMetricsBucket[]>("GET", '/metrics/hour');
    }
}

/**
 * General purpose AmberApi for tenant specific calls that do not fit anywhere else ✌️
 */
export class AmberApi{
    apiClient: ApiClient;
    constructor(prefix: string, tenant:string, tokenProvider: () => Promise<string>){
        this.apiClient = new ApiClient(prefix, tenant, tokenProvider);
    }

    /**
     * Get all users of the tenant. The user object contains the public information of the user.
     * @returns A list of users in the tenant including global users. 
     */
    async getUsers() : Promise<UserInfo[]> {
        return await this.apiClient.fetch<UserInfo[]>("GET", '/tenant/:tenant/users');
    }
}

/**
 * AmberUserApi is the main class to access the user functionality accessible by a logged in user. A user does not need a session token since all functionality here is independent from a tenant.
 * Instead it uses the user cookie to identify the user
 */
export class AmberUserApi{
    apiClient: ApiClient;
    constructor(prefix: string){
        this.apiClient = new ApiClient(prefix);
    }

    /**
     * Get details about the current user (e.g. user name and list of tenants where the user is directly registered for)
     * @returns 
     */
    async getUserDetails() : Promise<UserDetails> {
        return await this.apiClient.fetch<UserDetails>("GET", '/user');
    }

    /**
     * Get all tenants the user has access to. Including those the user inherits from a potential global role
     * @returns 
     */
    async getUserTenants() : Promise<TenantWithRoles[]> {
        return await this.apiClient.fetch<TenantWithRoles[]>("GET", '/user/tenants');
    }

    /**
     * Register a new user and login the user in one go
     * @param userName New user name
     * @param userEmail Email address. Will be stored lower case (yes, this is not according to standard but according to reality). Needs to be unique
     * @param password Password for the user. It will be hashed and stored in the database. It is not possible to recover the password from the hash.
     * @param invitation A potential invitation link to add the user to a tenant with some roles
     * @returns the user id
     */
    async registerUser(userName : string, userEmail : string, password : string, invitation : string) : Promise<string> {
        return await this.apiClient.fetchText("POST", '/register', nu<RegisterRequest>({username: userName, email:userEmail, password, invitation}));
    }

    /**
     * Accept an invitation to join a tenant. It needs a logged in user to do so.
     * @param invitation The invitation token created by the admin.
     */
    async acceptInvitation(invitation : string) : Promise<void> {
        await this.apiClient.fetchText("POST", '/accept-invitation', nu<AcceptInvitationRequest>({invitation}));
    }

    /**
     * Get the details of an invitation. It does not require a logged in user
     * @param invitation The invitation token created by the admin.
     */
    async getInvitationDetails(invitation : string) : Promise<InvitationDetails> {
        return await this.apiClient.fetch<InvitationDetails>("GET", '/invitation/' + invitation);
    }
}

