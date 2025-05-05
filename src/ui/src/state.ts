import type { AmberUiConfig, AmberUiContext } from '../../shared/src'
export var state:{
    defaultView: string,
    amberTenant: string,
    amberInvitation: string,
    uiConfig: AmberUiConfig,
    uiContext: AmberUiContext
} = {
    defaultView: "",
    amberTenant: "*",
    amberInvitation: "",
    uiConfig:{
        theme:"dark"    
    },
    uiContext:{
        view: "login"
    }
};