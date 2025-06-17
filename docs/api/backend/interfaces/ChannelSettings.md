[**amberbase**](../README.md)

***

[amberbase](../globals.md) / ChannelSettings

# Interface: ChannelSettings\<T\>

Defined in: [channels.ts:7](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/channels.ts#L7)

## Type Parameters

### T

`T`

## Properties

### accessRights?

> `optional` **accessRights**: \{[`role`: `string`]: [`ChannelAccessAction`](../type-aliases/ChannelAccessAction.md)[]; \} \| (`user`, `channel`, `subchannel`, `action`) => `boolean`

Defined in: [channels.ts:18](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/channels.ts#L18)

Model the access to the channel. Either as code or just a simple type and role based mapping. Default is allow all access to all roles (still requires a valid user in the tenant)

***

### subchannels?

> `optional` **subchannels**: `boolean`

Defined in: [channels.ts:13](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/channels.ts#L13)

Set to true if the channel is more a "type" and there are subchannels with their own IDs below that. E.g. "chat" and "chat/room1", "chat/room2", etc.
If it is set to "false" all subscriptions in a tenant are peered to each other. Default is false.

#### Default

```ts
false
```

***

### validator()?

> `optional` **validator**: (`user`, `channel`, `subchannel`, `message`) => `boolean`

Defined in: [channels.ts:28](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/channels.ts#L28)

Validate a message before it is send to the channel. This is NOT checked for server send messages.

#### Parameters

##### user

[`UserContext`](UserContext.md)

The user

##### channel

`string`

The channel name

##### subchannel

`string`

The channel instance name (if subchannels are used)

##### message

`T`

The message

#### Returns

`boolean`

Boolean indicating if the message is valid (and will be delivered) or not.
