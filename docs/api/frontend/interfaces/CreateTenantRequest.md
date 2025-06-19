[**amber-client**](../README.md)

***

[amber-client](../globals.md) / CreateTenantRequest

# Interface: CreateTenantRequest

Defined in: [shared/dtos.ts:244](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L244)

Request to create a new tenant

## Properties

### data

> **data**: `string`

Defined in: [shared/dtos.ts:259](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L259)

Optional data field. This is a string that can be used to store additional information about the tenant. The content is up to the application.

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:249](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L249)

Tenant id. Must be unique. This is the identifier used in the URL path for tenant specific calls. [a-zA-Z0-9\-]{1,50}

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:254](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L254)

Tenant name. This is the name shown in the UI
