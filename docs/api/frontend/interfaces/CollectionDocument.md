[**amber-client**](../README.md)

***

[amber-client](../globals.md) / CollectionDocument

# Interface: CollectionDocument\<T\>

Defined in: [shared/dtos.ts:469](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L469)

Collection document with json payload. Generic to allow easy TS static type checks

## Type Parameters

### T

`T` = `any`

## Properties

### change\_number

> **change\_number**: `number`

Defined in: [shared/dtos.ts:477](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L477)

Last change number. It is using a monotonic counter per collection (not document!) that indicates new versions and is used for optimistic concurrency control as a kind of eTag.

***

### change\_time

> **change\_time**: `Date`

Defined in: [shared/dtos.ts:487](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L487)

The time of the last change in UTC.

***

### change\_user

> **change\_user**: `string`

Defined in: [shared/dtos.ts:482](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L482)

The user that made the last change. This is the user id (not the email) of the user that made the change.

***

### data

> **data**: `T`

Defined in: [shared/dtos.ts:492](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L492)

The content of the document. This is the actual data of the document. It is a JSON object.

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:473](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L473)

Document id. This is the unique identifier for the document in the collection.
