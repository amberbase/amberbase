[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberCollection

# Interface: AmberCollection\<T\>

Defined in: [collections.ts:81](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L81)

Interface for a collection in the Amber SDK. This is used to create, update, delete and subscribe to documents in a collection.
Methods might throw a

## See

ServerErrorResponse if the operation fails.

## Type Parameters

### T

`T`

## Methods

### createDoc()

> **createDoc**(`content`, `documentId?`): `Promise`\<`string`\>

Defined in: [collections.ts:110](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L110)

Create a new document

#### Parameters

##### content

`T`

content of the document

##### documentId?

`string`

Optional document id containing case sensitive alpha-numerics with "-" and "_" of a max-length of 36 characters. If not provided a new one will be generated. If it is povided and the id already exists, the call will fail with a ServerErrorResponse of errorCode "duplicate-id"

#### Returns

`Promise`\<`string`\>

the document id of the created document. If this call succeeds, the document will already be sent to the client as a sync.

***

### deleteDoc()

> **deleteDoc**(`documentId`): `Promise`\<`void`\>

Defined in: [collections.ts:127](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L127)

Delete a document. This will delete the document in the collection and return the document id.
The document will be sent to the client as a sync-delete message before the promise resolves succesfully.

#### Parameters

##### documentId

`string`

The document id of the document to delete

#### Returns

`Promise`\<`void`\>

The document id of the deleted document

***

### name()

> **name**(): `string`

Defined in: [collections.ts:85](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L85)

Get the name of the collection

#### Returns

`string`

***

### subscribe()

> **subscribe**(`lastReceivedChange`, `onDocument`, `onDocumentDelete`): `void`

Defined in: [collections.ts:92](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L92)

Subscribe to a collection. This will start receiving messages for the collection. The lastReceivedChange is used to determine the starting point for the subscription.

#### Parameters

##### lastReceivedChange

`number`

The last change number received. This is used to determine the starting point for the subscription.

##### onDocument

(`doc`) => `void`

Callback for when a document is received

##### onDocumentDelete

(`docId`) => `void`

Callback for when a document is deleted

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(): `void`

Defined in: [collections.ts:101](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L101)

Unsubscribe from a collection. This will stop receiving messages for the collection.

#### Returns

`void`

***

### updateDoc()

> **updateDoc**(`documentId`, `changeNumber`, `content`): `Promise`\<`void`\>

Defined in: [collections.ts:119](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/collections.ts#L119)

Update a document. This will update the document in the collection and return the document id.
The document will be sent to the client as a sync message before the promise resolves succesfully.

#### Parameters

##### documentId

`string`

The document id of the document to update

##### changeNumber

`number`

##### content

`T`

The content of the document

#### Returns

`Promise`\<`void`\>

The document id of the updated document
