import { AmberLoginManager } from "./login.js";

export class AmberUiApi{
    apiPrefix: string;
    loginManager: AmberLoginManager;
    constructor(apiPrefix: string, loginManager: AmberLoginManager){
        this.apiPrefix = apiPrefix || '/amber';
        this.loginManager = loginManager;
    }

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

    goToAdmin(){
        var page = this.apiPrefix + "/ui/admin";
        var tenant = this.loginManager.tenant;
        if (tenant){
            page += "?tenant=" + tenant;
        }
        window.location.href = page;
    }

    goToMonitoring(){
        var page = this.apiPrefix + "/ui/monitoring";
        var tenant = this.loginManager.tenant;
        if (tenant){
            page += "?tenant=" + tenant;
        }
        window.location.href = page;
    }

    goToUserProfile(){
        var page = this.apiPrefix + "/ui/userprofile";
        window.location.href = page;
    }

    goToGlobalAdmin(){
        var page = this.apiPrefix + "/ui/globaladmin";
        
        window.location.href = page;
    }

    goToGlobalMonitoring(){
        var page = this.apiPrefix + "/ui/globalmonitoring";
        window.location.href = page;
    }
}