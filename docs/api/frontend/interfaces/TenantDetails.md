[**amber-client**](../README.md)

***

[amber-client](../globals.md) / TenantDetails

# Interface: TenantDetails

Defined in: [shared/dtos.ts:283](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L283)

Request to update a tenant. The request is only allowed if the user has the tenant admin role.

## Properties

### data

> **data**: `string`

Defined in: [shared/dtos.ts:291](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L291)

Optional data field. This is a string, interpreted as json, that can be used to store additional information about the tenant. The content is up to the application.

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:287](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L287)

Tenant name, only for the UI
