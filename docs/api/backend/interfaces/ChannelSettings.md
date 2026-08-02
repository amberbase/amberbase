[**amberbase**](../README.md)

***

[amberbase](../globals.md) / ChannelSettings

# Interface: ChannelSettings\<T\>

Defined in: [channels.ts:33](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/channels.ts#L33)

## Type Parameters

### T

`T`

## Properties

### accessRights?

> `optional` **accessRights?**: \{\[`role`: `string`\]: [`ChannelAccessAction`](../type-aliases/ChannelAccessAction.md)[]; \} \| ((`user`, `channel`, `subchannel`, `action`) => `boolean`)

Defined in: [channels.ts:45](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/channels.ts#L45)

Model the access to the channel. Either as code or just a simple type and role based mapping. Default is allow all access to all roles (still requires a valid user in the tenant)
Tenant admin can always access all channels.

***

### subchannels?

> `optional` **subchannels?**: `boolean`

Defined in: [channels.ts:39](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/channels.ts#L39)

Set to true if the channel is more a "type" and there are subchannels with their own IDs below that. E.g. "chat" and "chat/room1", "chat/room2", etc.
If it is set to "false" all subscriptions in a tenant are peered to each other. Default is false.

#### Default

```ts
false
```

***

### validator?

> `optional` **validator?**: (`user`, `channel`, `subchannel`, `message`) => `string` \| `boolean`

Defined in: [channels.ts:57](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/channels.ts#L57)

Validate a message before it is send to the channel. This is NOT checked for server send messages.

#### Parameters

##### user

[`UserContext`](UserContext.md)

The user

##### channel

`string`

The channel name

##### subchannel

`string` \| `null`

The channel instance name (if subchannels are used)

##### message

`T`

The message

#### Returns

`string` \| `boolean`

True indicating that the message is valid (and will be delivered) or either an error message or 'false' both signaling a failed validation .
