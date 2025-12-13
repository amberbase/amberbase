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
{   confirmDialog :
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

export function renderRelativeTime(time:number | Date | undefined | null):string {
    if (!time) return "N/A";
    var d = new Date(time);
    var now = new Date();
    var diff = now.getTime() - d.getTime();
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    if (days > 0) return days + " day(s) ago";
    if (hours > 0) return hours + " hour(s) ago";
    if (minutes > 0) return minutes + " minute(s) ago";
    return seconds + " second(s) ago";
}  

export function renderIsoTime(time:number | Date | undefined | null):string {
    if (!time) return "N/A";
    var d = new Date(time);
    return d.toISOString();
}
