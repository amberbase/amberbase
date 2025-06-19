[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberCollection

# Interface: AmberCollection\<T\>

Defined in: [collections.ts:41](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L41)

## Type Parameters

### T

`T`

## Methods

### createDoc()

> **createDoc**(`content`): `Promise`\<`string`\>

Defined in: [collections.ts:62](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L62)

Create a new document. This will create a new document in the collection and return the document id. 
The document will be sent to the client as a sync message before the promise resolves succesfully, so the application can immediately navigate to it.

#### Parameters

##### content

`T`

The content of the document

#### Returns

`Promise`\<`string`\>

The document id of the created document

***

### deleteDoc()

> **deleteDoc**(`documentId`): `Promise`\<`void`\>

Defined in: [collections.ts:79](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L79)

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

### subscribe()

> **subscribe**(`lastReceivedChange`, `onDocument`, `onDocumentDelete`): `void`

Defined in: [collections.ts:49](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L49)

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

Defined in: [collections.ts:54](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L54)

Unsubscribe from a collection. This will stop receiving messages for the collection.

#### Returns

`void`

***

### updateDoc()

> **updateDoc**(`documentId`, `changeNumber`, `content`): `Promise`\<`void`\>

Defined in: [collections.ts:71](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/collections.ts#L71)

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
