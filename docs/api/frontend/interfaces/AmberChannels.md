[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberChannels

# Interface: AmberChannels

Defined in: [channels.ts:7](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L7)

SDK API for the amber channels

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [channels.ts:13](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L13)

Connect to the amber server. This will open a websocket connection and start receiving messages. The connection is potentially already established, there will only be one.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is established.

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [channels.ts:20](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L20)

Disconnect from the amber server. This will close the websocket connection and stop receiving messages.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is closed.

***

### getChannel()

> **getChannel**\<`T`\>(`channel`, `subchannel?`): [`AmberChannel`](AmberChannel.md)\<`T`\>

Defined in: [channels.ts:39](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L39)

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

An optional subchannel (the serverside needs to enable subchannels for this to work)

#### Returns

[`AmberChannel`](AmberChannel.md)\<`T`\>

***

### offConnectionChanged()

> **offConnectionChanged**(`callback`): `void`

Defined in: [channels.ts:32](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L32)

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

Defined in: [channels.ts:26](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L26)

Listen to connection changes. If the connection already exists the callback will be immediately called with true.

#### Parameters

##### callback

(`connected`) => `void`

Listener

#### Returns

`void`
