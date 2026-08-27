[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberApi

# Class: AmberApi

Defined in: [api.ts:373](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L373)

General purpose AmberApi for tenant specific calls that do not fit anywhere else ✌️

## Methods

### getTenantInfo()

> **getTenantInfo**(): `Promise`\<[`TenantDetails`](../interfaces/TenantDetails.md)\>

Defined in: [api.ts:397](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L397)

Get information about the current tenant

#### Returns

`Promise`\<[`TenantDetails`](../interfaces/TenantDetails.md)\>

Tenant details including id, name and data

***

### getUsers()

> **getUsers**(): `Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

Defined in: [api.ts:389](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L389)

Get all users of the tenant. The user object contains the public information of the user.

#### Returns

`Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

A list of users in the tenant including global users.
