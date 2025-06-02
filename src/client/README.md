<p align="center">
  <img src="https://avatars.githubusercontent.com/u/208375923?s=64" alt="Amberbase logo showing an amber gemstone" />
  <h1 align="center">Amberbase Client</h1>
</p>



## Amberbase client library
This is the client library for `amberbase` and helps to connect your frontend code to your amberbase based backend.

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

## Amberbase
Amberbase is an Open Source Node.js backend for realtime applications. This entails a server-side library (Node.js) and a browser-side client library (JS).
It is right now a beta version and only suitable for early adopters.