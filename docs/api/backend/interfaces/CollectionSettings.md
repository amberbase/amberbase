[**amberbase**](../README.md)

***

[amberbase](../globals.md) / CollectionSettings

# Interface: CollectionSettings\<T\>

Defined in: [collections.ts:20](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L20)

## Type Parameters

### T

`T`

## Properties

### accessRights?

> `optional` **accessRights**: \{[`role`: `string`]: [`CollectionAccessAction`](../type-aliases/CollectionAccessAction.md)[]; \} \| (`user`, `document`, `action`) => `boolean`

Defined in: [collections.ts:25](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L25)

Either a map of roles with the actions they are allowed to perform or a function that takes the user context, the document and the action and returns true if the user is allowed to perform the action on the document.

***

### accessTagsFromDocument()?

> `optional` **accessTagsFromDocument**: (`doc`) => `string`[]

Defined in: [collections.ts:38](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L38)

Calculate the access tags for the document. Only documents that have a common access tag with users are accessible if the this hook is configured.

#### Parameters

##### doc

`T`

The document to calculate the access tags for.

#### Returns

`string`[]

The list of access tags that can be used to find the documents for server side processing (e.g. for the onDocumentChange hook).

***

### accessTagsFromUser()?

> `optional` **accessTagsFromUser**: (`user`) => `string`[]

Defined in: [collections.ts:31](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L31)

Filter the accessible documents for the user. This is executed server side to limit the documents to the user.

#### Parameters

##### user

[`UserContext`](UserContext.md)

the user to filter the collection for

#### Returns

`string`[]

a set of tags. Only documents with one of these tags are accessible for the user.

***

### onDocumentChange()?

> `optional` **onDocumentChange**: (`tenant`, `userId`, `docId`, `oldDocument`, `newDocument`, `action`, `collections`) => `Promise`\<`void`\>

Defined in: [collections.ts:65](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L65)

A callback that is called when a document is created, updated or deleted. This can be used to trigger additional actions cacading deletes or updating other documents that have a reference to this document.

#### Parameters

##### tenant

`string`

The tenant the document belongs to

##### userId

`string`

The user that performed the action. Can be null if the action was performed by the system.

##### docId

`string`

The id of the document that was changed

##### oldDocument

`T`

Contains the old document data if it was updated or deleted. Null if the document was created.

##### newDocument

`T`

Contains the new document data if it was created or updated. Null if the document was deleted.

##### action

[`CollectionAccessAction`](../type-aliases/CollectionAccessAction.md)

The action that was performed on the document. Can be "create", "update" or "delete".

##### collections

[`AmberCollections`](AmberCollections.md)

An instance of AmberCollections to access the collections to manipulate as the result of this change.

#### Returns

`Promise`\<`void`\>

Awaitable, will return when all inner tasks are done.

***

### tagsFromDocument()?

> `optional` **tagsFromDocument**: (`doc`) => `string`[]

Defined in: [collections.ts:47](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L47)

Calculate a list of tags that are used to find documents in the collection in a more efficient way. 
There can be up to 4096 character of tags in total, one character is used to delimit the tags. So try to keep the tags short. A common way to use this is to use referenced document ids with a prefix (of maximum 2 characters). With those we consume 40 characters which means we have around 100 tags available per document.

#### Parameters

##### doc

`T`

The document to calculate the tags for.

#### Returns

`string`[]

The list of tags that can be used to find the documents for server side processing (e.g. for the onDocumentChange hook).

***

### validator()?

> `optional` **validator**: (`user`, `oldDocument`, `newDocument`, `action`) => `boolean`

Defined in: [collections.ts:52](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/collections.ts#L52)

Validate the document before creating or updating it. This is executed on the server to ensure integrity.

#### Parameters

##### user

[`UserContext`](UserContext.md)

##### oldDocument

`T`

##### newDocument

`T`

##### action

[`CollectionAccessAction`](../type-aliases/CollectionAccessAction.md)

#### Returns

`boolean`
