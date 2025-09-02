export const adminRole = "admin";
export const globalTenant = "*";

export interface AmberUiConfig{
    theme: "dark" | "light";
    loginTargetUrl?:string;
    availableRoles: string[];
    title:string;
}

export interface AmberUiContext{
    tenant?: string;
    tenantName?: string;
    invitation?: string;
    view: "login" | "invited" | "tenant-admin" | "global-admin" | "global-monitoring" |  "tenant-monitoring" | "user-profile" | "reset-password";
    errorMessage?:string;
    passwordResetToken?: string; // the password reset token if we are in the reset-password view
    userEmail?: string; // the email of the user that is resetting his password
    userName?: string; // the name of the user that is resetting his password
}