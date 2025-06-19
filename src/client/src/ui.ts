import { AmberLoginManager } from "./login.js";

export class AmberUiApi{
    /**
     * @internal
     */
    apiPrefix: string;
    /**
     * @internal
     */
    loginManager: AmberLoginManager;
    /**
     * @internal
     */
    constructor(apiPrefix: string, loginManager: AmberLoginManager){
        this.apiPrefix = apiPrefix || '/amber';
        this.loginManager = loginManager;
    }

    /**
     * Navigate to the login page
     * @param tenant The target tenant, if undefined and multiple tenants are available, the user will be asked to select a tenant.
     * @param returnUrl The URL to return to after login, if undefined the user will be redirected to the current page. Use `{tenant}` as a placeholder to receive the selected tenant.
     */
    goToLogin(tenant:string | undefined, returnUrl:string | undefined){
        var loginPage = this.apiPrefix + "/ui/login";
        if (tenant){
            loginPage += "?tenant=" + tenant;
        }
        if (returnUrl){
            loginPage += "#return=" + encodeURIComponent(returnUrl);
        }
        window.location.href = loginPage;
    }

    /**
     * Navigate to the admin page of the current tenant.
     */
    goToAdmin(){
        var page = this.apiPrefix + "/ui/admin";
        var tenant = this.loginManager.tenant;
        if (tenant){
            page += "?tenant=" + tenant;
        }
        window.location.href = page;
    }

    /**
     * Navigate to the monitoring page of the current tenant.
     */
    goToMonitoring(){
        var page = this.apiPrefix + "/ui/monitoring";
        var tenant = this.loginManager.tenant;
        if (tenant){
            page += "?tenant=" + tenant;
        }
        window.location.href = page;
    }

    /**
     * Navigate to the user profile page of the current user.
     */
    goToUserProfile(){
        var page = this.apiPrefix + "/ui/userprofile";
        window.location.href = page;
    }

    /**
     * Navigate to the global admin page.
     * This is only available if the user is in the global tenant "*" and `admin`.
     */
    goToGlobalAdmin(){
        var page = this.apiPrefix + "/ui/globaladmin";
        
        window.location.href = page;
    }

    /**
     * Navigate to the global monitoring page.
     * This is only available if the user is in the global tenant "*" and `admin`.
     */
    goToGlobalMonitoring(){
        var page = this.apiPrefix + "/ui/globalmonitoring";
        window.location.href = page;
    }
}