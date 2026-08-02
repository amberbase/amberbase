# amber-client

***

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/208375923?s=64" alt="Amberbase logo showing an amber gemstone" />
  <h1 align="center">Amberbase Client</h1>
</p>

Install the client library in your code:

```bash
pnpm install amber-client
```

You can use it similar to the following example:

```ts
var clientBuilder = amberClient().withPath("/amber").withTenant("production");
var userName = "";
var userRoles = [];
var amberClient = null;

clientBuilder.onUserChanged((u) => {
  userName = u.name;
});
clientBuilder.onRolesChanged((tenant, roles, user) => {
  userRoles = roles;
  if (roles.includes("reader")) {
    amberClient
      .getCollectionsApi()
      .getCollection<ToDoEntity>("todos")
      .subscribe(
        0,
        (doc) => {
          /** do something with the todo item, e.g. put it into the local cache */
        },
        (docId) => {
          /** remove the todo item from the local cache */
        },
      );
  }
});

amberClient = clientBuilder.withAmberUiLogin().start();

// later

amberClient.getCollectionsApi().getCollection<ToDoEntity>("todos").createDoc({
  title: "foo",
  description: "bar",
  completed: false,
});
```
