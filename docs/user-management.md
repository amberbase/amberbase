# User Management
Amberbase ships with a user-management that is easy to use and ready to go. Let's start with the concepts first.
## Key Concepts
### Users
Users are "identified" individuals that have a unique `id` and `email` address. Right now the email address is used instead of a "user name" when you login. It is not yet a veryfied email address. The supported credentials are email (as username) and password. Additionally there is a `name` field that is NOT unique and should be used by the applications for human readable presentation only. 

### Tenants
Since Amberbase is a multi-tenant system, where you can have multiple separate data-sets for instances of the same application, it is important to understand that users are in it self NOT part of a tenant. They can be added to tenants by giving them roles. A user that does not have any role in a tenant cannot access that tenant.

The special tenant `*`, sometimes referred to as the `global tenant` is used to give some users roles that will apply to **_all_** other tenants. A user inherits its global roles, if there are any, into the tenants. 

### Roles
Roles are the links between `users` and `tenants`. A user can access a `tenant` when he or she has at least one `role` in it.
Roles are (beside the special role `admin`) part of the application domain. You are free to create as many roles with custom names as you need for your application. Good examples would be `reader`, `moderator`, `editor`, `guest` etc. A user can have multiple `roles` in a `tenant`. If an action is permitted by at least one of those roles, it is permitted for the user. 

The special `admin` role gives permissions for either `tenant` management or, if present on the `global tenant *`, even the global managment. See the sections below for details about what it enables.

### Invitations
An `invitation` is a consumable token (a "special" signed string that can be used once) that can be given to a non registered or already registered user to hand over initial `roles` for a tenant. 

Usually (e.g. in the case of the [embedded UI](embedded-ui.md)) they are created together with a url that asks the user to register or login to redeem the invitation. You can send them via email to invite them into your application. This works for any `tenant` including the `global tenant` and including the `admin` role.

> A note about email addresses and passwords. Right now we do not verify the email addresses. Therefore we do not use them for password reset flows. See the global and tenant management actions to see how administrators can recover users with lost passwords.

## Global Management
The global administration is available to any user that has the `admin` role on the `global tenant` `*`. That is why there is a special method in the server side amberbase API to create such a user as a bootstrap:

```ts
// server side
amberApp.addAdminIfNotExists('admin@myemail.com',"My Admin Account","mypa55word"); 
```

These users can, through the `amberbase-client` library, or using the embedded UI, do the following workflows:

* Create and delete tenants
* Delete users
* Change passwords of users
* Manage the global tenants users
  * E.g. create invitations for the `global tenant` to onboard more admins
* See global and tenant specific monitoring data

When the embedded UI is enabled, you can just navigate to `/amber/ui/globaladmin` to do all of that.

## Tenant Management
A user with the role `admin` in a specific `tenant` (including those who inherit it from the `global tenant`) can perform the following actions:
* Create invitations to give new `users` access to the `tenant` with a specific `role`
* Remove users from a tenant
* Change the roles of a user in the tenant
* If and only if the users only tenant is the one being managed, the password can be changed by the admin

# Using roles for access control
The application can now use the roles of a user to guard access of channels and collections. It can even use it on [its own APIs](technical/api-authentication.md). 

The following snippet shows how the role `"editor"` is used to protect a collection `books` from creating or updating records. Also only `"editor"` users are part of a private chat build with a channel.

```ts
// server side
var amberInit = amber()
                // config etc.
                .withCollection<Book>("books",{
                  accessRights:{
                    "editor" : ["subscribe","create","update"],
                    "reader" : ["subscribe"]
                  }
                })
                .withChannel<ChatMessage>("private",{
                  accessRights:{
                    "editor" : ["subscribe","publish"]
                  }
                });
```

