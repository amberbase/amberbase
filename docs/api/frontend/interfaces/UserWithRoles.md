[**amber-client**](../README.md)

***

[amber-client](../globals.md) / UserWithRoles

# Interface: UserWithRoles

Defined in: [shared/dtos.ts:171](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L171)

Details about a user from the perspective of a tenant. Therefore it includes the roles the user has in the tenant.

## Properties

### email

> **email**: `string`

Defined in: [shared/dtos.ts:179](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L179)

user email address

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:175](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L175)

User id

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:183](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L183)

User name

***

### roles

> **roles**: `string`[]

Defined in: [shared/dtos.ts:187](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L187)

Roles the user has in the tenant

***

### singleTenant

> **singleTenant**: `boolean`

Defined in: [shared/dtos.ts:191](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L191)

true if the user has access to only one tenant, false if the user has access to multiple tenants
