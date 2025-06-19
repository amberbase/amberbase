[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberCollections

# Interface: AmberCollections

Defined in: [collections.ts:7](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L7)

SDK API for the amber collections

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [collections.ts:13](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L13)

Connect to the amber server. This will open a websocket connection and start receiving messages. The connection is potentially already established, there will only be one.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is established.

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [collections.ts:20](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L20)

Disconnect from the amber server. This will close the websocket connection and stop receiving messages.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is closed.

***

### getCollection()

> **getCollection**\<`T`\>(`collection`): [`AmberCollection`](AmberCollection.md)\<`T`\>

Defined in: [collections.ts:38](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L38)

Get the interface to work with a given collection

#### Type Parameters

##### T

`T`

#### Parameters

##### collection

`string`

#### Returns

[`AmberCollection`](AmberCollection.md)\<`T`\>

***

### offConnectionChanged()

> **offConnectionChanged**(`callback`): `void`

Defined in: [collections.ts:32](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L32)

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

Defined in: [collections.ts:26](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L26)

Listen to connection changes. If the connection already exists the callback will be immediately called with true.

#### Parameters

##### callback

(`connected`) => `void`

Listener

#### Returns

`void`
