[**amberbase**](../README.md)

***

[amberbase](../globals.md) / AmberCollection

# Interface: AmberCollection\<T\>

Defined in: [collections.ts:71](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L71)

The API to be used by the server side app to access and manipulate documents in a collection. You might wonder, why we cannot enumerate all documents in a collection, this is due to the expected cost (memory and database IO). Please use the allDocumentsByTags method to stream documents by tags. This is a more efficient way to access documents since it uses an index.

## Type Parameters

### T

`T`

## Methods

### allDocumentsByTags()

> **allDocumentsByTags**(`tenant`, `tags`, `callback?`): `Promise`\<`void`\>

Defined in: [collections.ts:117](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L117)

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

> **createDocument**(`tenant`, `userId`, `data`): `Promise`\<`string`\>

Defined in: [collections.ts:86](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L86)

Create a new document in the collection.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### userId

`string`

the user that is creating the document. Can be undefined if the document is created by the system.

##### data

`T`

The data of the document to create. This is the JSON object that will be stored in the collection.

#### Returns

`Promise`\<`string`\>

The id of the created document or undefined if the creation failed.

***

### deleteDocument()

> **deleteDocument**(`tenant`, `userId`, `documentId`): `Promise`\<`boolean`\>

Defined in: [collections.ts:95](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L95)

Delete a document from the collection.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### userId

`string`

the user that is deleting the document. Can be undefined if the document is deleted by the system.

##### documentId

`string`

The id of the document to delete.

#### Returns

`Promise`\<`boolean`\>

true if the document was deleted, false if the document was not found or the deletion failed.

***

### getDocument()

> **getDocument**(`tenant`, `documentId`): `Promise`\<`T`\>

Defined in: [collections.ts:78](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L78)

Get a document by its id.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### documentId

`string`

The id of the document to get.

#### Returns

`Promise`\<`T`\>

***

### updateDocument()

> **updateDocument**(`tenant`, `documentId`, `userId`, `data`, `expectedChangeNumber`): `Promise`\<`boolean`\>

Defined in: [collections.ts:106](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L106)

Update a document in the collection.

#### Parameters

##### tenant

`string`

The tenant the document belongs to.

##### documentId

`string`

The id of the document to update.

##### userId

`string`

the user that is updating the document. Can be undefined if the document is updated by the system.

##### data

`T`

The new data of the document. This is the JSON object that will be stored in the collection.

##### expectedChangeNumber

`number`

The expected change number of the document. If this is presented and does not match, the update will fail with a change number mismatch error.

#### Returns

`Promise`\<`boolean`\>

true if the document was updated, false if the document was not found or the update failed.

***

### updateDocumentWithCallback()

> **updateDocumentWithCallback**(`tenant`, `documentId`, `userId`, `change`): `Promise`\<`boolean`\>

Defined in: [collections.ts:115](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L115)

#### Parameters

##### tenant

`string`

##### documentId

`string`

##### userId

`string`

##### change

(`oldDoc`) => `T`

#### Returns

`Promise`\<`boolean`\>
