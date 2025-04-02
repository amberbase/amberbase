import {LoginRequest, nu, UserDetails, SessionToken, RegisterRequest, Tenant, ActionResult, TenantDetails, CreateTenantRequest, UserWithRoles, CreateInvitationRequest, TenantWithRoles, AcceptInvitationRequest, InvitationDetails} from './dtos.js'
import { CompletablePromise, sleep } from './helper.js';

class ApiClient {
    apiPrefix: string;
    tenant: string | undefined;
    tokenProvider: (() => Promise<string>) | undefined;

    constructor(apiPrefix : string, tenant: string | undefined = undefined, tokenProvider: (() => Promise<string>) | undefined = undefined) {
        this.apiPrefix = apiPrefix;
        this.tenant = tenant;
        this.tokenProvider = tokenProvider;
    }

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

export class AmberAdminApi{
    apiClient: ApiClient;
    constructor(prefix: string, tenant:string, tokenProvider: () => Promise<string>){
        this.apiClient = new ApiClient(prefix, tenant, tokenProvider);
    }

    async getUsers() : Promise<UserWithRoles[]> {
        return await this.apiClient.fetch<UserWithRoles[]>("GET", '/tenant/:tenant/admin/users');
    }

    async deleteUser(userId:string) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("DELETE", '/tenant/:tenant/admin/user/' + userId);
    }

    async setRolesOfUser(userId:string, roles:string[]) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("POST", '/tenant/:tenant/admin/user/' + userId + '/roles', roles);
    }

    async createInvitation(request:CreateInvitationRequest) : Promise<string> {
        return await this.apiClient.fetchText("POST", '/tenant/:tenant/admin/invitation', request);
    }
}

export class AmberGlobalAdminApi{
    apiClient: ApiClient;
    constructor(prefix: string, tokenProvider: () => Promise<string>){
        this.apiClient = new ApiClient(prefix, "*", tokenProvider);
    }

    async getTenants() : Promise<Tenant[]> {
        return await this.apiClient.fetch<Tenant[]>("GET", '/tenants');
    }

    async deleteTenant(tenantId:string) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("DELETE", '/tenants/' + tenantId);
    }

    async createTenant(request:CreateTenantRequest) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("POST", '/tenants', request);
    }

    async updateTenant(tenantId:string, request:TenantDetails) : Promise<ActionResult> {
        return await this.apiClient.fetch<ActionResult>("POST", '/tenants/' + tenantId, request);
    }
}

export class AmberApi{
    apiClient: ApiClient;
    constructor(prefix: string, tenant:string, tokenProvider: () => Promise<string>){
        this.apiClient = new ApiClient(prefix, tenant, tokenProvider);
    }
}

export class AmberUserApi{
    apiClient: ApiClient;
    constructor(prefix: string){
        this.apiClient = new ApiClient(prefix);
    }

    async getUserDetails() : Promise<UserDetails> {
        return await this.apiClient.fetch<UserDetails>("GET", '/user');
    }

    async getUserTenants() : Promise<TenantWithRoles[]> {
        return await this.apiClient.fetch<TenantWithRoles[]>("GET", '/user/tenants');
    }

    async registerUser(userName : string, userEmail : string, password : string, invitation : string) : Promise<string> {
        return await this.apiClient.fetchText("POST", '/register', nu<RegisterRequest>({username: userName, email:userEmail, password, invitation}));
    }

    async acceptInvitation(invitation : string) : Promise<void> {
        await this.apiClient.fetchText("POST", '/accept-invitation', nu<AcceptInvitationRequest>({invitation}));
    }

    async getInvitationDetails(invitation : string) : Promise<InvitationDetails> {
        return await this.apiClient.fetch<InvitationDetails>("GET", '/invitation/' + invitation);
    }

}

