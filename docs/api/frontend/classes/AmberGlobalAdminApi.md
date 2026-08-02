[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberGlobalAdminApi

# Class: AmberGlobalAdminApi

Defined in: [api.ts:249](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L249)

AmberGlobalAdminApi is the main class to access the global admin functionality. It is used to manage tenants and requires a user with a session for tenant `*` and `admin` role

## Methods

### createPasswordResetToken()

> **createPasswordResetToken**(`userId`): `Promise`\<`string`\>

Defined in: [api.ts:365](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L365)

Create a password reset token for a user that can be used in a "forgot password" flow.
The token can be used by the user to change his password using the AmberUserApi.changeUserPasswordWithToken method.

#### Parameters

##### userId

`string`

The user id to create the token for

#### Returns

`Promise`\<`string`\>

The password reset token that can be used to change the password.

***

### createTenant()

> **createTenant**(`request`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:283](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L283)

Create a new tenant. It will create a new tenant with the given id and name. The id must be unique and not contain any special characters.

#### Parameters

##### request

[`CreateTenantRequest`](../interfaces/CreateTenantRequest.md)

Request object

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Action result with success or error message

***

### deleteTenant()

> **deleteTenant**(`tenantId`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:274](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L274)

Remove tenant from the system. It will remove all users and data of the tenant. It can NOT remove the `*` global tenant.

#### Parameters

##### tenantId

`string`

Tenant to remove

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Action result with success or error message

***

### deleteUser()

> **deleteUser**(`userId`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:355](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L355)

Delete a user. The user will be removed from all tenants and the global user list.
An admin can not remove himself.

#### Parameters

##### userId

`string`

The user id to delete

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Action result with success or error message

***

### getMetricsByHour()

> **getMetricsByHour**(): `Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Defined in: [api.ts:318](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L318)

Get the metrics of the system. It will return the metrics for the last 60 hours grouped by hour.

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Buckets of metrics for the last 60 hours. The buckets are grouped by hour.

***

### getMetricsByMinutes()

> **getMetricsByMinutes**(): `Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Defined in: [api.ts:310](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L310)

Get the metrics of the system. It will return the metrics for the last hour grouped by minute.

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Buckets of metrics for the last hour. The buckets are grouped by minute.

***

### getTenantInfo()

> **getTenantInfo**(`tenantId`): `Promise`\<[`TenantDetails`](../interfaces/TenantDetails.md)\>

Defined in: [api.ts:302](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L302)

Get information about a specific tenant

#### Parameters

##### tenantId

`string`

Tenant to get the information for

#### Returns

`Promise`\<[`TenantDetails`](../interfaces/TenantDetails.md)\>

Tenant details including id, name and data

***

### getTenants()

> **getTenants**(): `Promise`\<[`Tenant`](../interfaces/Tenant.md)[]\>

Defined in: [api.ts:265](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L265)

Get all existing tenants

#### Returns

`Promise`\<[`Tenant`](../interfaces/Tenant.md)[]\>

List of tenants

***

### getUserDetails()

> **getUserDetails**(`userId`): `Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

Defined in: [api.ts:335](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L335)

Get user details by id

#### Parameters

##### userId

`string`

The user id to get the details for

#### Returns

`Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

User details with roles and tenant information

***

### getUsers()

> **getUsers**(): `Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

Defined in: [api.ts:326](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L326)

Get all users of the system.

#### Returns

`Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

A list of users with their basic properties.

***

### updateTenant()

> **updateTenant**(`tenantId`, `request`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:293](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L293)

Update a tenant. It will update the name and data of the tenant. The id must be unique and not contain any special characters.

#### Parameters

##### tenantId

`string`

Tenant to update

##### request

[`TenantDetails`](../interfaces/TenantDetails.md)

Request object

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Action result with success or error message

***

### updateUserDetails()

> **updateUserDetails**(`userId`, `request`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:345](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L345)

Update user details. The admin can change the user name, email and password.

#### Parameters

##### userId

`string`

The user id to update

##### request

[`ChangeUserRequest`](../interfaces/ChangeUserRequest.md)

Request object with the new user details

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Action result with success or error message
