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
        theme:"dark",
        availableRoles:[],
        title:"Amberbase App"
    },
    uiContext:{
        view: "login"
    }
};

// this is a stub for the confirm dialog implemented by AmberUi.vue
export var uiHelper =
{ confirmDialog :
    (text: string) :Promise<boolean> => {
        return new Promise((resolve, reject) => {
            reject();
        });
    }
};