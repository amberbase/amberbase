[**amber-client**](../README.md)

***

[amber-client](../globals.md) / CreateTenantRequest

# Interface: CreateTenantRequest

Defined in: [shared/dtos.ts:263](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L263)

Request to create a new tenant

## Properties

### data

> **data**: `string`

Defined in: [shared/dtos.ts:277](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L277)

Optional data field. This is a string containing json that can be used to store additional information about the tenant. The content is up to the application.

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:267](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L267)

Tenant id. Must be unique. This is the identifier used in the URL path for tenant specific calls. [a-zA-Z0-9\-]{1,50}

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:272](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L272)

Tenant name. This is the name shown in the UI
