[**amberbase**](../README.md)

***

[amberbase](../globals.md) / AmberAuth

# Interface: AmberAuth

Defined in: [auth.ts:467](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L467)

Server side interface for the AmberAuth service.

## Methods

### addRolesToUser()

> **addRolesToUser**(`userId`, `tenant`, `roles`): `Promise`\<`void`\>

Defined in: [auth.ts:548](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L548)

Add roles to a user in a tenant. If the user does not have the roles yet, they will be added.

#### Parameters

##### userId

`string`

The id of the user to add the roles to

##### tenant

`string`

The tenant to add the roles to

##### roles

`string`[]

The roles to add to the user

#### Returns

`Promise`\<`void`\>

The id of the user

***

### addUserToTenant()

> **addUserToTenant**(`email`, `name`, `pw`, `tenant`, `roles`): `Promise`\<`string`\>

Defined in: [auth.ts:558](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L558)

Add a user to a tenant with the given roles. If the user does not exist, it will be created.

#### Parameters

##### email

`string`

The email of the user to add

##### name

`string`

The name of the user to add

##### pw

`string`

The password of the user to add

##### tenant

`string`

The tenant to add the user to

##### roles

`string`[]

The roles to add to the user in the tenant

#### Returns

`Promise`\<`string`\>

***

### changeUser()

> **changeUser**(`id`, `newName`, `newEmail?`, `newPassword?`): `Promise`\<`boolean`\>

Defined in: [auth.ts:525](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L525)

change the user, potentially including the password, therefore take caution.

#### Parameters

##### id

`string`

the id of the user to change

##### newName

`string` \| `undefined`

the new name of the user, if undefined, the old name will be kept

##### newEmail?

`string`

the new email of the user, if undefined, the old email will be kept

##### newPassword?

`string`

the new password of the user, if undefined, the old password will be kept

#### Returns

`Promise`\<`boolean`\>

true if the user was changed, false if the user was not found

***

### changeUserPassword()

> **changeUserPassword**(`id`, `oldpassword`, `newPassword`): `Promise`\<`boolean`\>

Defined in: [auth.ts:494](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L494)

Change the password of a user from the user him/herself

#### Parameters

##### id

`string`

the id of the user to change the password for

##### oldpassword

`string`

the old password to validate

##### newPassword

`string`

the new password to set

#### Returns

`Promise`\<`boolean`\>

true if the password was changed, false if the old password was incorrect or the user was not found

***

### changeUserPasswordWithResetToken()

> **changeUserPasswordWithResetToken**(`resetToken`, `newPassword`): `Promise`\<`boolean`\>

Defined in: [auth.ts:503](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L503)

Change the password of a user from the user him/herself using a reset token (such as from a "forgot password" flow)

#### Parameters

##### resetToken

`string`

token to validate the password reset request

##### newPassword

`string`

the new password to set

#### Returns

`Promise`\<`boolean`\>

true if the password was changed, false if the old password was incorrect or the user was not found

***

### checkAdmin()

> **checkAdmin**(`req`, `res`, `onlyAllowGlobal?`): `boolean`

Defined in: [auth.ts:485](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L485)

Utility function to check wether a user is logged in with a session and has the admin role for the given tenant retrieved from a path-parameter called "/:tenant" (or the global tenant).
If the path does not contain a tenant, it will check for the global tenants admin role.
The session token is expected to be in the header "AmberSession".

#### Parameters

##### req

`Request`

Request to handle

##### res

`Response`

Response to potentially send the 401 to

##### onlyAllowGlobal?

`boolean`

If true, only the global admin role will be accepted

#### Returns

`boolean`

Boolean if the use is an admin

***

### createPasswordResetToken()

> **createPasswordResetToken**(`userId`, `validityHours`): `Promise`\<`string`\>

Defined in: [auth.ts:515](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L515)

Create a password reset token for a user that can be used in a "forgot password" flow.

#### Parameters

##### userId

`string`

the id of the user to create the token for

##### validityHours

`number`

#### Returns

`Promise`\<`string`\>

***

### createUser()

> **createUser**(`name`, `email`, `password`): `Promise`\<`string` \| `undefined`\>

Defined in: [auth.ts:539](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L539)

Create a new user with the given name, email and password.

#### Parameters

##### name

`string`

User name (does not have to be unique)

##### email

`string`

Unique email of the user, used for login. We will use the lowercase version of the email for uniqueness.

##### password

`string`

Password for the user

#### Returns

`Promise`\<`string` \| `undefined`\>

The id of the created user or undefined if the user could not be created (e.g. email already exists)

***

### getSessionToken()

> **getSessionToken**(`req`): [`SessionToken`](SessionToken.md) \| `undefined`

Defined in: [auth.ts:474](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L474)

Utility function to get the session token from the request header.
If the session token is not valid or expired, it will return undefined. It will check if a parameter "tenant" is present in the path and validate that the session token is valid for this tenant.

#### Parameters

##### req

`Request`

Request to handle

#### Returns

[`SessionToken`](SessionToken.md) \| `undefined`

SessionToken or undefined if not valid

***

### getUserRoles()

> **getUserRoles**(`userId`, `tenant`): `Promise`\<`string`[]\>

Defined in: [auth.ts:566](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L566)

Get the roles of a user in a tenant.

#### Parameters

##### userId

`string`

The id of the user to get the roles for

##### tenant

`string`

The tenant to get the roles for

#### Returns

`Promise`\<`string`[]\>

The roles of the user in the tenant

***

### validatePasswordResetToken()

> **validatePasswordResetToken**(`resetToken`): `Promise`\<`UserWithCredential` \| `null`\>

Defined in: [auth.ts:509](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/auth.ts#L509)

Utility function to validate a password reset token.

#### Parameters

##### resetToken

`string`

the password reset token to validate as a string

#### Returns

`Promise`\<`UserWithCredential` \| `null`\>
