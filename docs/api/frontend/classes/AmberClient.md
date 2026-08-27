[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberClient

# Class: AmberClient

Defined in: [client.ts:250](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L250)

## Methods

### getAdminApi()

> **getAdminApi**(): [`AmberAdminApi`](AmberAdminApi.md) \| `undefined`

Defined in: [client.ts:309](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L309)

Get the admin api for the tenat that the user is currently in. The user must be logged in and in a tenant and have the "admin" role for this to work.

#### Returns

[`AmberAdminApi`](AmberAdminApi.md) \| `undefined`

the admin api for the tenant that the user is currently in.

***

### getAmberApi()

> **getAmberApi**(): [`AmberApi`](AmberApi.md) \| `undefined`

Defined in: [client.ts:329](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L329)

Get the general amber api for the tenant that the user is currently in. Right now this provides access to a list of users in the tenant.

#### Returns

[`AmberApi`](AmberApi.md) \| `undefined`

the amber api for the tenant that the user is currently in.

***

### getAmberUiApi()

> **getAmberUiApi**(): [`AmberUiApi`](AmberUiApi.md)

Defined in: [client.ts:408](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L408)

Get the api to navigate to the included amber ui

#### Returns

[`AmberUiApi`](AmberUiApi.md)

***

### getChannelsApi()

> **getChannelsApi**(): [`AmberChannels`](../interfaces/AmberChannels.md)

Defined in: [client.ts:383](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L383)

Get the collections client for this tenant

#### Returns

[`AmberChannels`](../interfaces/AmberChannels.md)

the collections client for this tenant

***

### getCollectionsApi()

> **getCollectionsApi**(): [`AmberCollections`](../interfaces/AmberCollections.md)

Defined in: [client.ts:360](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L360)

Get the collections client for this tenant

#### Returns

[`AmberCollections`](../interfaces/AmberCollections.md)

the collections client for this tenant

***

### getGlobalAdminApi()

> **getGlobalAdminApi**(): [`AmberGlobalAdminApi`](AmberGlobalAdminApi.md) \| `undefined`

Defined in: [client.ts:319](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L319)

Get the global admin api. This is only available if the user is logged in the global tenant. The user needs to have the "admin" role in the global tenant for this to work.

#### Returns

[`AmberGlobalAdminApi`](AmberGlobalAdminApi.md) \| `undefined`

the global admin api to manage tenants and users across all tenants.

***

### getUserApi()

> **getUserApi**(): [`AmberUserApi`](AmberUserApi.md)

Defined in: [client.ts:339](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L339)

Get the user api. It has methods for selfmanagement of the user as well as methods to register new users or redeem invitations. It is not bound to a tenant

#### Returns

[`AmberUserApi`](AmberUserApi.md)

the user api.

***

### sessionHeader()

> **sessionHeader**(): `Promise`\<\{ `header`: `string`; `value`: `string`; \}\>

Defined in: [client.ts:416](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L416)

Get session header. Use this header to authenticate requests to your custom APIs that you want to protect with an amber session.

#### Returns

`Promise`\<\{ `header`: `string`; `value`: `string`; \}\>

a promise that resolves to an object with the header name and value to use in the request.

***

### user()

> **user**(): `Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

Defined in: [client.ts:286](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L286)

Method to receive the user as soon as the user is logged in. It will return immediately if the user is already logged in.
The user being logged in does not mean that the user is in a tenant. Use

#### Returns

`Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

the user details of the logged in user as a promise.

#### See

userInTenant to wait for that to be ready.

***

### userInTenant()

> **userInTenant**(): `Promise`\<[`UserInTenant`](../interfaces/UserInTenant.md) \| `null`\>

Defined in: [client.ts:298](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/client.ts#L298)

Method to receive the user details, tenant and roles as soon as the user is logged in and in a tenant.
It will return immediately if the user is already logged in and in a tenant.

#### Returns

`Promise`\<[`UserInTenant`](../interfaces/UserInTenant.md) \| `null`\>

the user details, tenant and roles as a promise.
