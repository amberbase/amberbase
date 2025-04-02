export function nu<T>(arg: T): T { return arg;}
export function error(reason: string): ActionResult { return {success:false, error:reason};}

export interface LoginRequest{
    email:string;
    password:string;
    stayLoggedIn:boolean;
}

export interface RegisterRequest{
    username:string;
    email:string;
    password:string;
    invitation?:string;
}

export interface ActionResult{
    success:boolean;
    error?:string;
}

export interface AcceptInvitationRequest{
    invitation:string;
}

export interface SessionToken{
    expires: number; // Unix timestamp
    token:string; // base64 encoded
    roles: string[];
}

export interface UserDetails{
    id:string, 
    email:string, 
    name:string, 
    tenants:{
        [tenant:string]:string[]
    }
}

export interface TenantWithRoles{
    id:string;
    name:string;
    roles:string[];
}

export interface UserWithRoles{
    id:string;
    email:string;
    name:string;
    roles:string[];
}

export interface CreateInvitationRequest{
    roles:string[];
    expiresInDays:number;
}

export interface Tenant{
    id:string;
    name:string;
}

export interface CreateTenantRequest{
    id:string;
    name:string;
    data:string;
}

export interface TenantDetails{
    name:string;
    data:string;
}

export interface InvitationDetails{
    tenantId:string;
    tenantName:string;
    isStillValid:boolean;
    roles:string[];
    expires:number;
}
