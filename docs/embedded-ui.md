# Amberbase UI
Amberbase comes with a build-in UI for common tasks that need some user interfaces: 
* Login screen for the application
* Registration of new users
* Invitation flows
* Managing the users in a tenant as the tenant admin
* Managing the global scope, like creating new tenants
* Monitoring of the system

## Setup
The enabling and configuration of the embedded ui is done in the same way as all the other setup steps: as a chained call after `amber()` called `withUi()`.

```ts
//server side
var amberInit = amber()
            // other setup goes here
            .withPath("/amber")
            .withUi({
                title:"My App Backend",
                availableRoles:["editor", "reader"]
            });
```

You can find all the options for the ui in the API [documentation](api/backend/interfaces/UiConfigOptions.md).

Once you started your backend application, you can now navigate to `/amber/ui/globaladmin` and login as an `admin` user for the `global tenant` (see [user management](docs/user-management.md)) to manage your Amberbase instance.

Since the ui has functionality to add roles to users, we need to tell it the available roles that it should present as options.

On the client side, you can integrate with the ui very easily now:
```ts
// client side
var client = amberClient().withPath("/amber").withTenant("default").withAmberUiLogin().start(); // this will redirect to the login screen and come back here with a logged in user and a session
var loggedInUser = await client.userInTenant(); // wait until the user is logged in

console.log(`User ${loggedInUser.user.name} is logged in. ${loggedInUser.roles.includes("editor")?" Welcome editor!" : ""}`);
```

### Multi tenant setup
In some cases, the application already knows the `tenant` to use even though the user has not logged in yet. For example if you just use one `tenant` called `"default"` or you use `"dev"` when the host is "`localhost`" and otherwise `"production"`. You might even have a setup where a subdomain is mapped to the `tenant`, e.g. `berlin.cityapp.com` and `vancouver.cityapp.com`. In that case, you prime the client with the tenant to use, and users logging in will automatically be checked against a `role` in this tenant.
```ts
amberClient().withPath("/amber").withTenant("default").withAmberUiLogin().start();
```

Sometimes you want the user to select the `tenant` they want to log-in to. For example if a `tenant` represents a course in a university and you visit multiple courses at the same time.

If you have one app, and you want the user to select which `tenant` to login to, we need to have a way to communicate this back to the application after the login and selection occured in the login-ui.

For that we need to have a way to transport the tenant name into the application. We do this via a part of the url, for example the "#hash" part (so that the server will still serve the same page). Let's use `host.com/#/tenant=selected_tenant_name`.

The first step is to configure this pattern on when we setup the ui.
```ts
//server side
var amberInit = amber()
            // other setup goes here
            .withPath("/amber")
            .withUi({
                title:"My App Backend",
                availableRoles:["editor", "reader"],
                loginTargetUrl:"/#/tenant={tenant}" // users will be redirected here
            });
```

The `loginTargetUrl` property defines the navigation target after the user has logged in and (potentially) selected the tenant. If the user is only part of one tenant, the redirection will happen immediately. To inform the application about the tenant, it will replace the placeholder `{tenant}` with the `tenant id`.

Now we can use it on the client side

```ts
// client side
var clientInit = amberClient().withPath("/amber");

// we need to see if we know the tenant already
var amberTenant = "";
var hash = window.location.hash;
if (hash.startsWith("#/")) {
    var params = new URLSearchParams(hash.substring(2)); // parse it like url parameters
    amberTenant = params.get("tenant") || "";
}
if(amberTenant){ // we know the tenant. Let's add it to the client
    clientInit.withTenant(amberTenant)
}

clientInit.withAmberUiLogin().start(); // this will redirect to the login screen and come back here with a logged in user and a session
var loggedInUser = await client.userInTenant(); // wait until the user is logged in

console.log(`User ${loggedInUser.user.name} is logged in. ${loggedInUser.roles.includes("editor")?" Welcome editor!" : ""}`);
```

## Server Views
When the ui is setup, the following views are available (assuming the path `/amber`)

|Path|Description|Who has access?|
|-|-|-|
| `/amber/ui/login`| Login screen to enter the application. Will redirect to the path - root or the configured `loginTargetUrl` | Every user
| `/amber/ui/userprofile`| Overview and selfmanagement for a logged in user. E.g. changing password or visible name | Every user
| `/amber/ui/invitation?tenant={tenant}&invitation={invitation}` | Redeem an invitation, register a new user| Everyone with an invitation
| `/amber/ui/globaladmin`| Manage tenants and users. You can navigate to the other views from here|`admin` of `global tenant` `*`
| `/amber/ui/globalmonitoring`| Displays a live monitoring view showing active subscriptions, actions performed etc.|`admin` of `global tenant` `*`
| `/amber/ui/globalmonitoring`| Displays a live monitoring view showing active subscriptions, actions performed etc.|`admin` of `global tenant` `*`
| `/amber/ui/admin?tenant={tenant}` | Manage the users of a given tenant | `admin` of the tenant being managed
| `/amber/ui/monitoring?tenant={tenant}` | Displays a live monitoring view showing active subscriptions, actions performed etc. of a given tenant | `admin` of the tenant being monitored
| `/amber/ui`| Redirects to `globaladmin`|`admin` of `global tenant` `*`

## Client Support
When you are building your application and want to navigate users to those views of the embedded ui, you can use the `amberbase-client` library to do so easily.

```ts
// client side
// setup as shown in other examples...
var client = clientInit.withAmberUiLogin().start(); // this will redirect to the login screen and come back here with a logged in user and a session
var loggedInUser = await client.userInTenant(); // wait until the user is logged in

let profileButton = document.getElementById("gotoprofile");
let tenantAdminButton = document.getElementById("tenantadmin");
let globalAdminButton = document.getElementById("globaladmin");
profileButton.addEventListener("click", ()=>{
    client.getAmberUiApi().goToUserProfile();
});
tenantAdminButton.addEventListener("click", ()=>{
    client.getAmberUiApi().goToAdmin();
});
globalAdminButton.addEventListener("click", ()=>{
    client.getAmberUiApi().goToGlobalAdmin();
});
```