[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberAdminApi

# Class: AmberAdminApi

Defined in: [api.ts:136](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L136)

AmberAdminApi is the main class to access the admin functionality for a specific tenant. It is used to manage users and roles.

## Constructors

### Constructor

> **new AmberAdminApi**(`prefix`, `tenant`, `tokenProvider`): `AmberAdminApi`

Defined in: [api.ts:148](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L148)

You will optain an instance usually from the AmberClient that you get from an AmberInit builder

#### Parameters

##### prefix

`string`

server prefix for the api. E.g. '/amber'

##### tenant

`string`

tenant to manage

##### tokenProvider

() => `Promise`\<`string`\>

token provider to get a session token. The token needs to be valid for the tenant and contain the role `admin`

#### Returns

`AmberAdminApi`

## Methods

### changePasswordOfSingleTenantUser()

> **changePasswordOfSingleTenantUser**(`userId`, `newPassword`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:210](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L210)

change the password of a single tenant user. It can only be used for users that are ONLY registered in the current tenant. The admin of the tenant is considered the main admin for this user.

#### Parameters

##### userId

`string`

The user id of the user to change the password for.

##### newPassword

`string`

The new password for the user. It will be hashed and stored in the database. It is not possible to recover the password from the hash.

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Success result or error message

***

### createInvitation()

> **createInvitation**(`request`): `Promise`\<`string`\>

Defined in: [api.ts:184](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L184)

Create an invitation token for the given roles and a custom expiry

#### Parameters

##### request

[`CreateInvitationRequest`](../interfaces/CreateInvitationRequest.md)

Request object

#### Returns

`Promise`\<`string`\>

The invitation token to be used in the AmberUserApi.acceptInvitation.

***

### createPasswordResetTokenOfSingleTenantUser()

> **createPasswordResetTokenOfSingleTenantUser**(`userId`): `Promise`\<`string`\>

Defined in: [api.ts:224](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L224)

Get a passwordResetToken of a single tenant user. It can only be used for users that are ONLY registered in the current tenant. The admin of the tenant is considered the main admin for this user.
The passwordResetToken can be used by the user to change his password using the AmberUserApi.changeUserPasswordWithToken method.

#### Parameters

##### userId

`string`

The user id of the user to change the password for.

#### Returns

`Promise`\<`string`\>

The password reset token that can be used to change the password.

***

### deleteUser()

> **deleteUser**(`userId`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:165](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L165)

Delete a user of the tenant. It can NOT remove users that are registered to all tenants using the `*` global tenant

#### Parameters

##### userId

`string`

the user to remove from the tenant.

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Success result or error message

***

### getMetricsByHour()

> **getMetricsByHour**(): `Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Defined in: [api.ts:200](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L200)

Get metrics of the current tenant by hour

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

A list of metrics buckets with the metrics for the last 60 hours. The buckets are grouped by hour.

***

### getMetricsByMinutes()

> **getMetricsByMinutes**(): `Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Defined in: [api.ts:192](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L192)

Get metrics of the current tenant by minutes

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

A list of metrics buckets with the metrics for the last hour. The buckets are grouped by minute.

***

### getTenantInfo()

> **getTenantInfo**(): `Promise`\<[`TenantDetails`](../interfaces/TenantDetails.md)\>

Defined in: [api.ts:232](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L232)

Get tenant information about the current tenant

#### Returns

`Promise`\<[`TenantDetails`](../interfaces/TenantDetails.md)\>

Tenant details including id, name and data

***

### getUsers()

> **getUsers**(): `Promise`\<[`UserWithRoles`](../interfaces/UserWithRoles.md)[]\>

Defined in: [api.ts:156](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L156)

Get all users of the tenant. The user object contains the roles of the user.

#### Returns

`Promise`\<[`UserWithRoles`](../interfaces/UserWithRoles.md)[]\>

A list of users in the tenant. The user object contains the roles of the user.

***

### setRolesOfUser()

> **setRolesOfUser**(`userId`, `roles`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:175](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L175)

Set the roles of a user in the current tenant. It will remove all roles and set the new ones.

#### Parameters

##### userId

`string`

user to change

##### roles

`string`[]

new roles to set

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Success result or error message

***

### updateTenant()

> **updateTenant**(`request`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:241](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L241)

Update a tenant. It will update the name and data of the tenant. The id must be unique and not contain any special characters.

#### Parameters

##### request

[`TenantDetails`](../interfaces/TenantDetails.md)

Request object

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Action result with success or error message
