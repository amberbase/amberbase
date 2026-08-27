[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberChannel

# Interface: AmberChannel\<T\>

Defined in: [channels.ts:85](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L85)

Interface for a channel in the Amber SDK. This is used to send and receive messages on a channel.

## Type Parameters

### T

`T`

## Methods

### send()

> **send**(`content`): `Promise`\<`void`\>

Defined in: [channels.ts:105](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L105)

Send a message to the channel. This will send a message to the channel.

#### Parameters

##### content

`T`

The content of the message

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**(`onMessage`): `void`

Defined in: [channels.ts:94](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L94)

Subscribe to a channel. This will start receiving messages for the channel.
If a channel has subchannels enabled, the subscription is only for the given subchannel and will throw an error if no subchannel has been selected.
Tenant admins can subscribe to the top level channel even if subchannels are used.
If a subscription already exists for the particular channel, it will be replaced. There are never two subscriptions receiving the same message.
If an admin subscribes to a top level channel AND a subchannel of the same top level, the more specific subchannel subscription will be triggered.

#### Parameters

##### onMessage

(`doc`, `channelName`) => `void`

Callback for when a message is received and the channel name as it was received

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(): `void`

Defined in: [channels.ts:99](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L99)

Unsubscribe from the channel. This will stop receiving messages

#### Returns

`void`
