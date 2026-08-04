[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberUserApi

# Class: AmberUserApi

Defined in: [api.ts:406](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L406)

AmberUserApi is the main class to access the user functionality accessible by a logged in user. A user does not need a session token since all functionality here is independent from a tenant.
Instead it uses the user cookie to identify the user

## Methods

### acceptInvitation()

> **acceptInvitation**(`invitation`): `Promise`\<`void`\>

Defined in: [api.ts:466](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L466)

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

Defined in: [api.ts:485](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L485)

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

### changePasswordWithToken()

> **changePasswordWithToken**(`resetToken`, `newPassword`): `Promise`\<`boolean`\>

Defined in: [api.ts:503](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L503)

#### Parameters

##### resetToken

`string`

The password reset token that was created using the AmberUserApi.createPasswordResetToken or AmberGlobalAdminApi.createPasswordResetToken method it is validated to see if it is expired or the password was already changed in the meantime

##### newPassword

`string`

#### Returns

`Promise`\<`boolean`\>

***

### getInvitationDetails()

> **getInvitationDetails**(`invitation`): `Promise`\<[`InvitationDetails`](../interfaces/InvitationDetails.md)\>

Defined in: [api.ts:474](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L474)

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

Defined in: [api.ts:427](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L427)

Get details about the current user (e.g. user name and list of tenants where the user is directly registered for)

#### Returns

`Promise`\<[`UserDetails`](../interfaces/UserDetails.md)\>

***

### getUserTenants()

> **getUserTenants**(): `Promise`\<[`TenantWithRoles`](../interfaces/TenantWithRoles.md)[]\>

Defined in: [api.ts:435](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L435)

Get all tenants the user has access to. Including those the user inherits from a potential global role

#### Returns

`Promise`\<[`TenantWithRoles`](../interfaces/TenantWithRoles.md)[]\>

***

### logout()

> **logout**(): `Promise`\<`void`\>

Defined in: [api.ts:443](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L443)

Logout the current user

#### Returns

`Promise`\<`void`\>

***

### registerUser()

> **registerUser**(`userName`, `userEmail`, `password`, `invitation?`): `Promise`\<`string`\>

Defined in: [api.ts:454](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L454)

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

Defined in: [api.ts:521](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/api.ts#L521)

Update the currently logged in user details. Right now we only expose the user name.

#### Parameters

##### userName

`string`

New user name

#### Returns

`Promise`\<[`ActionResult`](../interfaces/ActionResult.md)\>

Success result or error message
