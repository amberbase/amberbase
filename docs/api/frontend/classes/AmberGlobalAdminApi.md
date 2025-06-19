[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberGlobalAdminApi

# Class: AmberGlobalAdminApi

Defined in: [api.ts:185](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L185)

AmberGlobalAdminApi is the main class to access the global admin functionality. It is used to manage tenants and requires a user with a session for tenant `*` and `admin` role

## Methods

### createTenant()

> **createTenant**(`request`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:220](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L220)

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

Defined in: [api.ts:211](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L211)

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

Defined in: [api.ts:283](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L283)

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

Defined in: [api.ts:246](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L246)

Get the metrics of the system. It will return the metrics for the last 60 hours grouped by hour.

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Buckets of metrics for the last 60 hours. The buckets are grouped by hour.

***

### getMetricsByMinutes()

> **getMetricsByMinutes**(): `Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Defined in: [api.ts:238](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L238)

Get the metrics of the system. It will return the metrics for the last hour grouped by minute.

#### Returns

`Promise`\<[`AmberMetricsBucket`](../interfaces/AmberMetricsBucket.md)[]\>

Buckets of metrics for the last hour. The buckets are grouped by minute.

***

### getTenants()

> **getTenants**(): `Promise`\<[`Tenant`](../interfaces/Tenant.md)[]\>

Defined in: [api.ts:201](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L201)

Get all existing tenants

#### Returns

`Promise`\<[`Tenant`](../interfaces/Tenant.md)[]\>

List of tenants

***

### getUserDetails()

> **getUserDetails**(`userId`): `Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

Defined in: [api.ts:263](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L263)

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

Defined in: [api.ts:254](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L254)

Get all users of the system.

#### Returns

`Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

A list of users with their basic properties.

***

### updateTenant()

> **updateTenant**(`tenantId`, `request`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:230](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L230)

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

Defined in: [api.ts:273](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L273)

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
