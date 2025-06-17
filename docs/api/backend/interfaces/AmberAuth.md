[**amberbase**](../README.md)

***

[amberbase](../globals.md) / AmberAuth

# Interface: AmberAuth

Defined in: [auth.ts:400](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L400)

Server side interface for the AmberAuth service.

## Methods

### addRolesToUser()

> **addRolesToUser**(`userId`, `tenant`, `roles`): `Promise`\<`void`\>

Defined in: [auth.ts:454](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L454)

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

Defined in: [auth.ts:464](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L464)

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

Defined in: [auth.ts:436](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L436)

change the user, potentially including the password, therefore take caution.

#### Parameters

##### id

`string`

the id of the user to change

##### newName

`string`

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

Defined in: [auth.ts:426](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L426)

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

### checkAdmin()

> **checkAdmin**(`req`, `res`, `onlyAllowGlobal?`): `boolean`

Defined in: [auth.ts:417](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L417)

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

#### Returns

`boolean`

Boolean if the use is an admin

***

### createUser()

> **createUser**(`name`, `email`, `password`): `Promise`\<`string`\>

Defined in: [auth.ts:445](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L445)

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

`Promise`\<`string`\>

The id of the created user or undefined if the user could not be created (e.g. email already exists)

***

### getSessionToken()

> **getSessionToken**(`req`): [`SessionToken`](SessionToken.md)

Defined in: [auth.ts:407](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/auth.ts#L407)

Utility function to get the session token from the request header.
If the session token is not valid or expired, it will return undefined.

#### Parameters

##### req

`Request`

Request to handle

#### Returns

[`SessionToken`](SessionToken.md)

SessionToken or undefined if not valid
