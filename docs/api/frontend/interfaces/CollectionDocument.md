[**amber-client**](../README.md)

***

[amber-client](../globals.md) / CollectionDocument

# Interface: CollectionDocument\<T\>

Defined in: [shared/dtos.ts:378](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L378)

Collection document with json payload. Generic to allow easy TS static type checks

## Type Parameters

### T

`T` = `any`

## Properties

### change\_number

> **change\_number**: `number`

Defined in: [shared/dtos.ts:386](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L386)

Last change number. It is using a monotonic counter per collection (not document!) that indicates new versions and is used for optimistic concurrency control as a kind of eTag.

***

### change\_time

> **change\_time**: `Date`

Defined in: [shared/dtos.ts:396](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L396)

The time of the last change in UTC.

***

### change\_user

> **change\_user**: `string`

Defined in: [shared/dtos.ts:391](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L391)

The user that made the last change. This is the user id (not the email) of the user that made the change.

***

### data

> **data**: `T`

Defined in: [shared/dtos.ts:401](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L401)

The content of the document. This is the actual data of the document. It is a JSON object.

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:382](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L382)

Document id. This is the unique identifier for the document in the collection.
