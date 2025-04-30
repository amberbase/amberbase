import type { UiConfig } from "./config";

export var state:{
    defaultView: string,
    amberTenant: string,
    amberInvitation: string,
    uiConfig: UiConfig
} = {
    defaultView: "",
    amberTenant: "*",
    amberInvitation: "",
    uiConfig:{
        theme:"dark"    
    }
};