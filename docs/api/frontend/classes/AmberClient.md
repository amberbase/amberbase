[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberClient

# Class: AmberClient

Defined in: [client.ts:235](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L235)

## Methods

### getAdminApi()

> **getAdminApi**(): `undefined` \| [`AmberAdminApi`](AmberAdminApi.md)

Defined in: [client.ts:282](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L282)

Get the admin api for the tenat that the user is currently in. The user must be logged in and in a tenant and have the "admin" role for this to work.

#### Returns

`undefined` \| [`AmberAdminApi`](AmberAdminApi.md)

the admin api for the tenant that the user is currently in.

***

### getAmberApi()

> **getAmberApi**(): `undefined` \| [`AmberApi`](AmberApi.md)

Defined in: [client.ts:303](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L303)

Get the general amber api for the tenant that the user is currently in. Right now this provides access to a list of users in the tenant.

#### Returns

`undefined` \| [`AmberApi`](AmberApi.md)

the amber api for the tenant that the user is currently in.

***

### getAmberUiApi()

> **getAmberUiApi**(): [`AmberUiApi`](AmberUiApi.md)

Defined in: [client.ts:376](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L376)

Get the api to navigate to the included amber ui

#### Returns

[`AmberUiApi`](AmberUiApi.md)

***

### getChannelsApi()

> **getChannelsApi**(): [`AmberChannels`](../interfaces/AmberChannels.md)

Defined in: [client.ts:355](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L355)

Get the collections client for this tenant

#### Returns

[`AmberChannels`](../interfaces/AmberChannels.md)

the collections client for this tenant

***

### getCollectionsApi()

> **getCollectionsApi**(): [`AmberCollections`](../interfaces/AmberCollections.md)

Defined in: [client.ts:334](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L334)

Get the collections client for this tenant

#### Returns

[`AmberCollections`](../interfaces/AmberCollections.md)

the collections client for this tenant

***

### getGlobalAdminApi()

> **getGlobalAdminApi**(): `undefined` \| [`AmberGlobalAdminApi`](AmberGlobalAdminApi.md)

Defined in: [client.ts:292](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L292)

Get the global admin api. This is only available if the user is logged in the global tenant. The user needs to have the "admin" role in the global tenant for this to work.

#### Returns

`undefined` \| [`AmberGlobalAdminApi`](AmberGlobalAdminApi.md)

the global admin api to manage tenants and users across all tenants.

***

### getUserApi()

> **getUserApi**(): [`AmberUserApi`](AmberUserApi.md)

Defined in: [client.ts:313](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L313)

Get the user api. It has methods for selfmanagement of the user as well as methods to register new users or redeem invitations. It is not bound to a tenant

#### Returns

[`AmberUserApi`](AmberUserApi.md)

the user api.

***

### sessionHeader()

> **sessionHeader**(): `Promise`\<\{ `header`: `string`; `value`: `string`; \}\>

Defined in: [client.ts:384](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L384)

Get session header. Use this header to authenticate requests to your custom APIs that you want to protect with an amber session.

#### Returns

`Promise`\<\{ `header`: `string`; `value`: `string`; \}\>

a promise that resolves to an object with the header name and value to use in the request.

***

### user()

> **user**(): `Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

Defined in: [client.ts:259](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L259)

Method to receive the user as soon as the user is logged in. It will return immediately if the user is already logged in. 
The user being logged in does not mean that the user is in a tenant. Use

#### Returns

`Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

the user details of the logged in user as a promise.

#### See

userInTenant to wait for that to be ready.

***

### userInTenant()

> **userInTenant**(): `Promise`\<`null` \| [`UserInTenant`](../interfaces/UserInTenant.md)\>

Defined in: [client.ts:271](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L271)

Method to receive the user details, tenant and roles as soon as the user is logged in and in a tenant. 
It will return immediately if the user is already logged in and in a tenant.

#### Returns

`Promise`\<`null` \| [`UserInTenant`](../interfaces/UserInTenant.md)\>

the user details, tenant and roles as a promise.
