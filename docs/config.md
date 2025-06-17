# Amberbase Configuration
This assumes that you have installed amberbase via `npm install amberbase`


The entrypoint to create an amber application on the server side is the `amber()` function that creates a [AmberInit](api/backend/classes/AmberInit.md) fluent interface builder.

The first thing to configure are the database connection and the path in which `Amberbase` should publish its endpoints.

```ts
// server side
import {amber} from "amberbase"
var amberInit = amber()
              .withConfig({
                db_password:db_password, // the password should come from some secure place
                db_username:db_username, // hopefully not just "root" ;-)
                db_name:'amber', // the name of the database. The user needs the access rights to create it or it should exist already
                inviteOnly : true // we only allow users to register when they have an invitation
              })
              .withPath('/amber')
```
For more options and their meaning, please refer to their [documentation](api/backend/interfaces/ConfigOptionals.md).

After these basics, you can add collections and channels as you need for the application you are building. Please check out their respective documentation for [collections](collections.md) and [channels](channels.md).
To use the build-in UI, you can add some configuration to enable it.

```ts
// server side
var amberInit = amber()
              // ..
              .withCollection<BookEntity>("books", {})
              .withCollection<AnnotationEntity>("annotations", {})
              .withChannel<string>("broadcast",{ 
                subchannels:false
                })
              .withUi({
               availableRoles: ["editor", "reader"],
               theme:"dark",
               loginTargetUrl:"/#/tenant={tenant}",
               title:"Amberbase Example App",
            });
```
The ui is described in more detail in the [embedded ui documentation](embedded-ui.md).
Once you have everything configured, you can create the app, add your own routes to it and start it.

```ts
// server side
const app = express();

var amberInit = amber()
              // ..
              ;
var amberApp = await amberInit.create(app); 

app.use(express.static(path.join(__dirname, 'static'))); 
app.use(express.json()); // please only do this after "create" since it is otherwise interfering with amberbase if it is on the global level

app.get("/test",async (req, res) => {
    res.send("foo");
  });

// bootstrap an admin user
amberApp.addAdminIfNotExists('admin',"Admin Account","password"); 
var adminId = amberApp.addOrUpdateTenant("default", "Default Tenant", {}); // bootstrap a default tenant.
amberApp.auth.addRolesToUser(adminId, "default", ["editor","reader"]); // add the admin to it 
amberApp.listen(3000, "0.0.0.0");
```
