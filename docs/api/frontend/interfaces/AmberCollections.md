[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberCollections

# Interface: AmberCollections

Defined in: [collections.ts:25](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L25)

SDK API for the amber collections

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: [collections.ts:31](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L31)

Connect to the amber server. This will open a websocket connection and start receiving messages. The connection is potentially already established, there will only be one.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is established.

***

### disconnect()

> **disconnect**(): `Promise`\<`void`\>

Defined in: [collections.ts:38](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L38)

Disconnect from the amber server. This will close the websocket connection and stop receiving messages.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the connection is closed.

***

### getCollection()

> **getCollection**\<`T`\>(`collection`): [`AmberCollection`](AmberCollection.md)\<`T`\>

Defined in: [collections.ts:56](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L56)

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

### getCollectionAdmin()

> **getCollectionAdmin**\<`T`\>(`collection`): `AmberCollectionAdmin`\<`T`\>

Defined in: [collections.ts:67](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L67)

Get the admin interface to work with a given collection. This interface has additional methods to manage the collection.

#### Type Parameters

##### T

`T`

#### Parameters

##### collection

`string`

The collection

#### Returns

`AmberCollectionAdmin`\<`T`\>

***

### getCollectionsInfo()

> **getCollectionsInfo**(): `Promise`\<`CollectionInfo`[]\>

Defined in: [collections.ts:61](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L61)

Get information about all collections that are configured. Since this is only metadata, it is available for all users of a tenant.

#### Returns

`Promise`\<`CollectionInfo`[]\>

A promise that resolves to an array of collection info objects.

***

### offConnectionChanged()

> **offConnectionChanged**(`callback`): `void`

Defined in: [collections.ts:50](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L50)

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

Defined in: [collections.ts:44](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L44)

Listen to connection changes. If the connection already exists the callback will be immediately called with true.

#### Parameters

##### callback

(`connected`) => `void`

Listener

#### Returns

`void`
