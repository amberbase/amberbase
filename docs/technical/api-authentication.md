# Using Amberbase Sessions for Custom APIs
When you build your application you might need to have more interactions between client and server than just the buildingblocks of Amberbase (like `collections`). But since the users are already logged in as Amberbase users with a role and a tenant, it is best to reuse this trust relationship in your custom APIs. Here is a little guide how to do that.

## Server side

```ts
// server side
const app = express();

var amberInit = amber()
              // ..
              ;
var amberApp = await amberInit.create(app); 

// Now we can build our own API

app.use(express.json()); 

app.get("/protected",async (req, res) => {
    var session = amberApp.auth.getSessionToken(req);
    if (!session)
    {
        res.status(401).send({error:"Not authorized"});
        return;

    }
    if (session.roles.includes("editor"))
        res.send({title:"Welcome editor"});
    else
        res.send({title:"You are no editor"});
  });

//..
amberApp.listen(3000, "0.0.0.0");
```
## Client side
To use this API with the Amberbase user session, you need to include a header in your API calls from the client:

```ts
// client side
var authHeader = await client.sessionHeader();
var response = await fetch("/protected", {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                [authHeader.header]:authHeader.value
            }
        });
if (response.status == 200)
{
    var result = await response.json() as {title:string};
    console.log(result.title);
}
```