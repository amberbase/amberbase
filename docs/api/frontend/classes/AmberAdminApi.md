[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberAdminApi

# Class: AmberAdminApi

Defined in: [api.ts:103](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L103)

AmberAdminApi is the main class to access the admin functionality for a specific tenant. It is used to manage users and roles.

## Constructors

### Constructor

> **new AmberAdminApi**(`prefix`, `tenant`, `tokenProvider`): `AmberAdminApi`

Defined in: [api.ts:115](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L115)

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

Defined in: [api.ts:177](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L177)

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

Defined in: [api.ts:151](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L151)

Create an invitation token for the given roles and a custom expiry

#### Parameters

##### request

[`CreateInvitationRequest`](../interfaces/CreateInvitationRequest.md)

Request object

#### Returns

`Promise`\<`string`\>

The invitation token to be used in the AmberUserApi.acceptInvitation.

***

### deleteUser()

> **deleteUser**(`userId`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:132](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L132)

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

Defined in: [api.ts:167](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L167)

Get metrics of the current tenant by hour

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

A list of metrics buckets with the metrics for the last 60 hours. The buckets are grouped by hour.

***

### getMetricsByMinutes()

> **getMetricsByMinutes**(): `Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Defined in: [api.ts:159](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L159)

Get metrics of the current tenant by minutes

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

A list of metrics buckets with the metrics for the last hour. The buckets are grouped by minute.

***

### getUsers()

> **getUsers**(): `Promise`\<[`UserWithRoles`](../interfaces/UserWithRoles.md)[]\>

Defined in: [api.ts:123](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L123)

Get all users of the tenant. The user object contains the roles of the user.

#### Returns

`Promise`\<[`UserWithRoles`](../interfaces/UserWithRoles.md)[]\>

A list of users in the tenant. The user object contains the roles of the user.

***

### setRolesOfUser()

> **setRolesOfUser**(`userId`, `roles`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:142](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L142)

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
