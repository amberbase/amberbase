<p align="center">
  <img src="https://avatars.githubusercontent.com/u/208375923?s=64" alt="Amberbase logo showing an amber gemstone" />
  <h1 align="center">Amberbase</h1>
</p>

An Open Source Node.js backend for realtime applications. This entails a server-side library (Node.js) and a browser-side client library (JS).
It is right now a beta version and only suitable for early adopters.

## Why?
The purpose of amberbase is to offer a library that covers the needs of a applications that are right now based on something like Firebase without the lock-in effect. It offers a simple user management, realtime communication between application instances, data synchronization and more. Since it requires a backend, it offers the opportunity to implement richer use cases through server side code; for example a powerful multi-tiered access rights management. 

The main design goal is to offer the flexibility and independence from SaaS lock-ins with an even better development experience. That means that the two-tier development model (the client side javascript talks directly to the datastore) is kept as the leading principle. But now you have the power to guide and control your application through *optional* server side code.

Amberbase is by default multi-tenant enabled. That means that everything* is scoped to an app instance with its own data context. 

>  (*) users are outside of the tenant scope and can have access to multiple tenants.

It is up to you to expose the tenants (for e.g. a SaaS concept) or to just use it to distinguish between `production` and `dev`...

## Dependencies
Amberbase uses mariadb as the database layer and is meant to be hosted in nodejs, ideally in conjunction with expressjs. It is designed for a single nodejs process being the gatekeeper (and single messaging broker) infront of the database.

## Get Started

If you want to use the library as an early adopter, install it using npm: `npm install amberbase` in your nodejs application.

The configuration is done through some fluent builder in your start.js, index.js or app.js file that is the entry point to your application.

```ts
import {amber, CollectionAccessAction, UserContext}  from 'amberbase';

 //This is just for the demo. Would be in some models.ts file beneficial to use typescript
interface ToDoEntity {
  title: string;
  description: string;
  completed: boolean;
}

var amberInit = amber()
              .withConfig({
                db_password:db_password, // e.g. from env variables
                db_username:db_username,
                db_name:'amber',
              })
              .withPath('/amber')
            // Example for a simple ToDo app. Everyone with the reader role can read todos. Editors can create, update and delete todos.
            .withCollection<ToDoEntity>("todos",
              {
                accessRights:{
                  "editor":['create',"update","delete","read"],
                  "reader":['read']
                },
                validator:(user, oldDoc:ToDoEntity, newDoc:ToDoEntity | null, action:CollectionAccessAction) => {
                  if (action == 'create' || action == 'update') 
                  {
                    if (newDoc.title.length < 3) return false; // title must be at least 3 characters long. This is an example validation
                  }
                  return true;
                }
              }
            )
            .withChannel<string>("selected-todo",{ // a simple "share selection id" channel to broadcast the selected item to all clients live at the same time
              subchannels:false
            })
            .withUi({ // offer a user and admin ui under <host>/amber/ui
               availableRoles: ["editor", "reader"], // roles offered in the user management
               theme:"dark",
               loginTargetUrl:"/#/tenant={tenant}",// entry point for the application after a successful login and tenant selection
               title:"Amberbase Example App",
            });

var amberApp = await amberInit.create(); // we create a new app, could also attach to an existing express app.

amberApp.listen(port, "0.0.0.0");
```

### Client side
Install the client library in your code via `npm install amberbase-client` and use it similar to the following example:
```ts

var clientBuilder = amberClient().withPath("/amber").withTenant("production");
var userName = "";
var userRoles = [];
var amberClient = null;

clientBuilder.onUserChanged(u=>{
  userName = u.name;
});
clientBuilder.onRolesChanged((tenant, roles, user) =>{
    userRoles = roles;
    if(roles.find("reader"))
    {
       amberClient.getCollectionsApi().getCollection<ToDoEntity>("todos").subscribe(0,
        doc =>{/** do something with the todo item, e.g. put it into the local cache */},
        docId => { /** remove the todo item from the local cache */}
       )
    }
});

amberClient = clientBuilder.withAmberUiLogin().start();

// later

amberClient.getCollectionsApi().getCollection<ToDoEntity>("todos")
.createDoc(
    {
        title: "foo",
        description: "bar",
        completed: false
    });
```
