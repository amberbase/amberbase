[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberChannels

# Interface: AmberChannels

Defined in: [channels.ts:19](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L19)

SDK API for the amber channels

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [channels.ts:25](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L25)

Connect to the amber server. This will open a websocket connection and start receiving messages. The connection is potentially already established, there will only be one.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is established.

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [channels.ts:32](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L32)

Disconnect from the amber server. This will close the websocket connection and stop receiving messages.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is closed.

***

### getAdminApi()

> **getAdminApi**(): `AmberChannelAdmin`

Defined in: [channels.ts:56](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L56)

Get the debug API for channels. Only available for admin users.

#### Returns

`AmberChannelAdmin`

***

### getChannel()

> **getChannel**\<`T`\>(`channel`, `subchannel?`): [`AmberChannel`](AmberChannel.md)\<`T`\>

Defined in: [channels.ts:51](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L51)

Get the interface to work with a given channel

#### Type Parameters

##### T

`T`

#### Parameters

##### channel

`string`

The name of the channel

##### subchannel?

`string`

An optional subchannel (the serverside needs to enable subchannels for this to work, if it is the subchannel must be defined). An admin can subscribe to the top level channel even if subchannels are used.

#### Returns

[`AmberChannel`](AmberChannel.md)\<`T`\>

***

### offConnectionChanged()

> **offConnectionChanged**(`callback`): `void`

Defined in: [channels.ts:44](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L44)

Stop listening to connection changes.

#### Parameters

##### callback

(`connected`) => `void`

The same listener that was passed to onConnectionChanged

#### Returns

`void`

***

### onConnectionChanged()

> **onConnectionChanged**(`callback`): `void`

Defined in: [channels.ts:38](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/channels.ts#L38)

Listen to connection changes. If the connection already exists the callback will be immediately called with true.

#### Parameters

##### callback

(`connected`) => `void`

Listener

#### Returns

`void`
