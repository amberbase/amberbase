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
    },
    showMessage: (text: string) => {},
    showError: (text: string) => {},
    showSuccess: (text: string) => {},

};

export async function copy(text:string): Promise<void> {
  try{
    await navigator.clipboard.writeText(text);
    uiHelper.showSuccess("Copied to clipboard");
  }
  catch(e){
    uiHelper.showError("Error copying to clipboard: " + e);
  }
};

export function generatePassword (): string {
    var length = 8,
        charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
};
