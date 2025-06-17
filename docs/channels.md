# Channels
Channels are a simple way to enable communication accross browser based clients with each other. Even though clients might use it to send messages to each other, the server side can act as a gatekeeper on who can be - and what is - sent.

## Setting up a channel
The channels are defined in the startup code of your app as a chained call to your amber initialization (see [config](docs/config.md)).
```ts
// server side code
amber().withPath("/amber")
// some other amber initialization
.withChannel<MyMessage>(
    "my-messages"
        // other options for this channel can be added here as well
    )
    // continue with amber initialization
```
The details of the options can be found in the [ChannelSettings](docs/api/backend/interfaces/ChannelSettings.md) documentation. 

On the client side, the counterpart to receive the channel messages is equally simple:
```ts
// client side code
 var client = amberClient().withPath("/amber").withAmberUiLogin().start(); // prepare client and start the login process
 var user = await client.getUserInTenant(); // wait until the user is logged in
 var channelsApi = client.getChannelsApi();
 var myMessagesChannel = channelsApi.getChannel<MyMessage>("my-messages");
 
 myMessagesChannel.subscribe( 
 (message)=>{ // handle the messages
    console.log(message.title);
 });
 channelsApi.connect(); // start the synchronization
 setInterval(1000, async ()=>{
    await myMessagesChannel.send({title:"I am alive"});
 })
```

## Subchannels
We might want to have more channels than the ones we can statically configure at the startup. For example if we allow users to create their own groups, or if a channel should exist alongside a document from a collection. Even a channel for a user might be helpful for the user to synchronize his or her experience across devices.

For that, you can enable the `subchannel` feature of a channel.

```ts
// server side code
amber().withPath("/amber")
// some other amber initialization
.withChannel<MyMessage>(
    "my-messages",
        {
            subchannels:true
        }
    )
```

Now a client can connect to a subchannel of "my-messages". 

```ts
// client side code

 var myTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
 // we only want to talk to others in the same timezone
 var myMessagesChannel = channelsApi.getChannel<MyMessage>("my-messages", myTimezone);
 
 myMessagesChannel.subscribe( /** get messages */);
 //...
```


## Validation
The server side can validate messages before they are send to the other clients
```ts
// server side code
amber().withPath("/amber")
// some other amber initialization
.withChannel<MyMessage>(
    "my-messages",
    {
        validator: (user, channel, subchannel, message)=>{
            if (message.sender != user.userId || message.title.length > 50) return false;
            return true;
        }
    }
       
    )
```

## Access Management
We can control who can send or subscribe to channels. For that we have two options: a simple role to action mapping or a code based handler.

### Access rights mapping
This options adds a simple map between `roles` and the two actions `subscribe` and `publish` to the channel configuration.
```ts
// server side code
amber().withPath("/amber")
// some other amber initialization
.withChannel<MyMessage>(
    "my-messages",
    {
        accessRights:{
            "editor":["subscribe", "publish"],
            "reader":["subscribe"]
        }
    }
)
```

### Access rights check with code
A more powerful option is a javascript handler, that acts as a predicate to decide which action is allowed. Taking the action, user, tenant and subchannel into account.
```ts
// server side code
amber().withPath("/amber")
// some other amber initialization
.withChannel<MyMessage>(
    "my-messages",
    {
        subchannels:true,
        accessRights:(user, channel, subchannel, action) => {
                if(user.userId != subchannel) return false; // the subchannel is private to the user
                return true;
            }
    }
)
```
