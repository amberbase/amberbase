[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberApi

# Class: AmberApi

Defined in: [api.ts:291](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L291)

General purpose AmberApi for tenant specific calls that do not fit anywhere else ✌️

## Methods

### getUsers()

> **getUsers**(): `Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

Defined in: [api.ts:307](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L307)

Get all users of the tenant. The user object contains the public information of the user.

#### Returns

`Promise`\<[`UserInfo`](../interfaces/UserInfo.md)[]\>

A list of users in the tenant including global users.
