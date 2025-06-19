[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberUserApi

# Class: AmberUserApi

Defined in: [api.ts:316](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L316)

AmberUserApi is the main class to access the user functionality accessible by a logged in user. A user does not need a session token since all functionality here is independent from a tenant.
Instead it uses the user cookie to identify the user

## Methods

### acceptInvitation()

> **acceptInvitation**(`invitation`): `Promise`\<`void`\>

Defined in: [api.ts:372](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L372)

Accept an invitation to join a tenant. It needs a logged in user to do so.

#### Parameters

##### invitation

`string`

The invitation token created by the admin.

#### Returns

`Promise`\<`void`\>

***

### changePassword()

> **changePassword**(`userId`, `currentPassword`, `newPassword`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:391](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L391)

Change the password of the current user. It needs the current password to do so.

#### Parameters

##### userId

`string`

The user id of the current user.

##### currentPassword

`string`

Current password of the user

##### newPassword

`string`

New password of the user

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Success result or error message

***

### getInvitationDetails()

> **getInvitationDetails**(`invitation`): `Promise`\<[`InvitationDetails`](../interfaces/InvitationDetails.md)\>

Defined in: [api.ts:380](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L380)

Get the details of an invitation. It does not require a logged in user

#### Parameters

##### invitation

`string`

The invitation token created by the admin.

#### Returns

`Promise`\<[`InvitationDetails`](../interfaces/InvitationDetails.md)\>

***

### getUserDetails()

> **getUserDetails**(): `Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

Defined in: [api.ts:337](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L337)

Get details about the current user (e.g. user name and list of tenants where the user is directly registered for)

#### Returns

`Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

***

### getUserTenants()

> **getUserTenants**(): `Promise`\<[`TenantWithRoles`](../interfaces/TenantWithRoles.md)[]\>

Defined in: [api.ts:345](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L345)

Get all tenants the user has access to. Including those the user inherits from a potential global role

#### Returns

`Promise`\<[`TenantWithRoles`](../interfaces/TenantWithRoles.md)[]\>

***

### logout()

> **logout**(): `Promise`\<`void`\>

Defined in: [api.ts:353](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L353)

Logout the current user

#### Returns

`Promise`\<`void`\>

***

### registerUser()

> **registerUser**(`userName`, `userEmail`, `password`, `invitation?`): `Promise`\<`string`\>

Defined in: [api.ts:364](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L364)

Register a new user and login the user in one go

#### Parameters

##### userName

`string`

New user name

##### userEmail

`string`

Email address. Will be stored lower case (yes, this is not according to standard but according to reality). Needs to be unique

##### password

`string`

Password for the user. It will be hashed and stored in the database. It is not possible to recover the password from the hash.

##### invitation?

`string`

A potential invitation link to add the user to a tenant with some roles

#### Returns

`Promise`\<`string`\>

the user id

***

### updateUserDetails()

> **updateUserDetails**(`userName`): `Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Defined in: [api.ts:405](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/api.ts#L405)

Update the currently logged in user details. Right now we only expose the user name.

#### Parameters

##### userName

`string`

New user name

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Success result or error message
