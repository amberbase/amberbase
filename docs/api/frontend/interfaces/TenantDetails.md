[**amber-client**](../README.md)

***

[amber-client](../globals.md) / TenantDetails

# Interface: TenantDetails

Defined in: [shared/dtos.ts:265](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L265)

Request to update a tenant. The request is only allowed if the user has the tenant admin role.

## Properties

### data

> **data**: `string`

Defined in: [shared/dtos.ts:273](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L273)

Optional data field. This is a string that can be used to store additional information about the tenant. The content is up to the application.

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:269](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L269)

Tenant name, only for the UI
