[**amber-client**](../README.md)

***

[amber-client](../globals.md) / UserWithRoles

# Interface: UserWithRoles

Defined in: [shared/dtos.ts:190](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L190)

Details about a user from the perspective of a tenant. Therefore it includes the roles the user has in the tenant.

## Properties

### email

> **email**: `string`

Defined in: [shared/dtos.ts:198](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L198)

user email address

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:194](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L194)

User id

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:202](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L202)

User name

***

### roles

> **roles**: `string`[]

Defined in: [shared/dtos.ts:206](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L206)

Roles the user has in the tenant

***

### singleTenant

> **singleTenant**: `boolean`

Defined in: [shared/dtos.ts:210](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L210)

true if the user has access to only one tenant, false if the user has access to multiple tenants
