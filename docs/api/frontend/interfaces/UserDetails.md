[**amber-client**](../README.md)

***

[amber-client](../globals.md) / UserDetails

# Interface: UserDetails

Defined in: [shared/dtos.ts:90](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L90)

User details

## Properties

### email

> **email**: `string`

Defined in: [shared/dtos.ts:99](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L99)

User email. This is the email used to login. It is stored in lower case.

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:94](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L94)

User id. Often used to identify the user. E.g. in access tags

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:104](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L104)

User name (descriptive, not unique)

***

### tenants

> **tenants**: `object`

Defined in: [shared/dtos.ts:109](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L109)

Tenants the user has access to and the roles the user has in the tenant

#### Index Signature

\[`tenant`: `string`\]: `string`[]
