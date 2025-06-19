# Amberbase Setup and Configuration
Amberbase consists of a server side library (for `NodeJs`) and a client side library, both available via `npm`. The server side will need to be connected to a MariaDB as the database, so make sure you have some MariaDB with a version higher than 10.6 available (for example as a [docker container](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/installing-mariadb/binary-packages/automated-mariadb-deployment-and-administration/docker-and-mariadb/installing-and-using-mariadb-via-docker)). 
It uses expressjs as a `nodejs` framework and works best if the rest of the server side application is also using expressjs.

The client library assumes that the client code is executed in something like a SPA application where the connection from client to server can persist for the time of the session (for some interpretation of "session" that makes sense in the context of the app 😉).

## Server Side Setup
We recommend the use of typescript, amberbase ships with the *.d.ts files that help the IDE to discover the interface. In many places a generic interface helps to handle the data in a type safe and assisted way. Therefore we only include typescript examples in this documentation.
First install the `amberbase` package via `npm install amberbase` to add it to your `package.json`.

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
              .withPath('/amber') // all other paths can be used by the rest of the application
```
For more options and their meaning, please refer to their [documentation](api/backend/interfaces/ConfigOptions.md).

After these basics, you can add collections and channels as you need for the application you are building. Please check out their respective documentation for [collections](collections.md) and [channels](channels.md). Use typescript to define the database documents and the messages you want to exchange with the clients.


```ts
// server side
// application specific models
interface BookEntity{ title:string, author:string}
interface AnnotationEntity{ bookId:string, owner:string, note:string}
interface Message{title:string, content:string, severity:"urgent"|"relaxed"}

var amberInit = amber()
              // ..
              .withCollection<BookEntity>("books", {accessRights:{"editor":["subscribe","create"]}})
              .withCollection<AnnotationEntity>("annotations", {/** additional options */})
              .withChannel<Message>("broadcast",{/** additional options */});
```
At the start, it is easiest to use the UI that ships with `amberbase` for common administration tasks, and to show a login screen to the user.
```ts
// server side

var amberInit = amber()
              // ..
              .withUi((ui)=>{
               ui.title = "Amberbase Example App";
            });
```


The ui is described in more detail in the [embedded ui documentation](embedded-ui.md).
Once you have everything configured, you can create the app, add your own routes and middlewares to it, bootstrap some users and tenants and start it.

```ts
// server side
const app = express();

var amberInit = amber()
              // ..
              ;
var amberApp = await amberInit.create(app); 

// START Application specific app
app.use(express.static(path.join(__dirname, 'static'))); 
app.use(express.json()); // please only do this after "create" since it is otherwise interfering with amberbase if it is on the global level

app.get("/test",async (req, res) => {
    res.send("foo");
  });
// END Application specific app

// bootstrap an admin user
amberApp.addAdminIfNotExists('admin',"Admin Account","password"); 
var adminId = amberApp.addOrUpdateTenant("default", "Default Tenant", {}); // bootstrap a default tenant.
amberApp.auth.addRolesToUser(adminId, "default", ["editor","reader"]); // add the admin to it 
amberApp.listen(3000, "0.0.0.0");
```

Now navigate to `localhost:3000/amber/ui/globaladmin` and login (with `admin` and `password`, do not use this in a real application) to see an overview of tenants and users.

## Client Side Setup
On the client, the library to use is `amberbase-client` and can be installed via `npm install amberbase-client`.
Once the site or component has loaded sufficiently for your needs (e.g. `onMounted` in Vue js or waiting for `DOMContentLoaded` in vanilla javascript, or even an IIFE), you can setup amberbase by running code similar to this:

```ts
// client side
import {  amberClient} from "amber-client"
// make sure to use the same `path` as on the server side
// If you do not include the tenant, the user will be prompted with the selection of tenant that are available to this user
var amberClient = amberClient().withPath("/amber").withTenant("default").withAmberUiLogin().start();
// you should now wait until you have a valid user logged in to the tenant. This will happen automatically since the user will be forwarded to a login page and redirected back once he or she is logged in.
var user = await amberClient.userInTenant();
console.log(`The user ${user.user.name} is logged in and is ${user.user.roles.includes("editor") ? "an editor" : "no editor"}`);
```

We can now get the data from the collections, listen to channels etc.
```ts
// client side
interface BookEntity{ title:string, author:string}

var user = await amberClient.userInTenant();
amberClient.getCollectionsApi().getCollection<BookEntity>()!.subscribe(0,
(doc)=>{
  console.log(`Received a book with title ${doc.data.title} and id ${doc.id}`);
},
(deletedDocId)=>{
  console.log(`Forget about the book with id ${doc.id}, it is no more`);
});
```
Put your code into some html page and host it from the same server, for example from the `static` folder that is used in the example as `index.html`. 

