export const adminRole = "admin";
export const globalTenant = "*";

export interface AmberUiConfig{
    theme: "dark" | "light";
    loginTargetUrl?:string;
    availableRoles: string[];
}

export interface AmberUiContext{
    tenant?: string;
    tenantName?: string;
    invitation?: string;
    view: "login" | "invited" | "tenant-admin" | "global-admin" | "global-monitoring" |  "tenant-monitoring" | "user-profile"
}