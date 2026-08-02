[**amberbase**](../README.md)

***

[amberbase](../globals.md) / AmberCollection

# Interface: AmberCollection\<T\>

Defined in: [collections.ts:113](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L113)

The API to be used by the server side app to access and manipulate documents in a collection. You might wonder, why we cannot enumerate all documents in a collection, this is due to the expected cost (memory and database IO). Please use the allDocumentsByTags method to stream documents by tags. This is a more efficient way to access documents since it uses an index.

## Type Parameters

### T

`T`

## Methods

### allDocumentsByTags()

> **allDocumentsByTags**(`tenant`, `tags`, `callback?`): `Promise`\<`void`\>

Defined in: [collections.ts:178](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L178)

#### Parameters

##### tenant

`string`

##### tags

`string`[]

##### callback?

(`id`, `data`) => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

***

### createDocument()

> **createDocument**(`tenant`, `userId`, `data`, `documentId?`): `Promise`\<\{ `error?`: `"internal-error"` \| `"duplicate-id"` \| `"invalid-id"`; `id?`: `string`; \}\>

Defined in: [collections.ts:130](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L130)

Create a new document in the collection.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### userId

`string` \| `undefined`

the user that is creating the document. Can be undefined if the document is created by the system.

##### data

`T`

The data of the document to create. This is the JSON object that will be stored in the collection.

##### documentId?

`string`

Optional document id containing case sensitive alpha-numerics with "-" and "_" of a max-length of 36 characters. If not provided a new one will be generated.

#### Returns

`Promise`\<\{ `error?`: `"internal-error"` \| `"duplicate-id"` \| `"invalid-id"`; `id?`: `string`; \}\>

The id of the created document or an indication of the error that occured.

***

### deleteDocument()

> **deleteDocument**(`tenant`, `userId`, `documentId`): `Promise`\<`boolean`\>

Defined in: [collections.ts:144](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L144)

Delete a document from the collection.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### userId

`string` \| `undefined`

the user that is deleting the document. Can be undefined if the document is deleted by the system.

##### documentId

`string`

The id of the document to delete.

#### Returns

`Promise`\<`boolean`\>

true if the document was deleted, false if the document was not found or the deletion failed.

***

### getDocument()

> **getDocument**(`tenant`, `documentId`): `Promise`\<`T` \| `undefined`\>

Defined in: [collections.ts:121](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L121)

Get a document by its id.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### documentId

`string`

The id of the document to get.

#### Returns

`Promise`\<`T` \| `undefined`\>

***

### updateDocument()

> **updateDocument**(`tenant`, `documentId`, `userId`, `data`, `expectedChangeNumber?`): `Promise`\<`boolean`\>

Defined in: [collections.ts:155](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L155)

Update a document in the collection.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### documentId

`string`

The id of the document to update.

##### userId

`string` \| `undefined`

the user that is updating the document. Can be undefined if the document is updated by the system.

##### data

`T`

The new data of the document. This is the JSON object that will be stored in the collection.

##### expectedChangeNumber?

`number`

The expected change number of the document. If this is presented and does not match, the update will fail with a change number mismatch error.

#### Returns

`Promise`\<`boolean`\>

true if the document was updated, false if the document was not found or the update failed.

***

### updateDocumentWithCallback()

> **updateDocumentWithCallback**(`tenant`, `documentId`, `userId`, `change`): `Promise`\<`boolean`\>

Defined in: [collections.ts:170](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/collections.ts#L170)

Update a document in the collection using a callback that receives the old document and returns the new document. This is useful to implement read-modify-write operations.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### documentId

`string`

The id of the document to update.

##### userId

`string` \| `undefined`

the user that is updating the document. Can be undefined if the document is updated by the system.

##### change

(`oldDoc`) => `T` \| `null`

A callback that receives the old document and returns the new document. If the callback returns null, the update will be cancelled.

#### Returns

`Promise`\<`boolean`\>
