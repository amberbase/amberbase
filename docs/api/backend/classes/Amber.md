[**amberbase**](../README.md)

***

[amberbase](../globals.md) / Amber

# Class: Amber

Defined in: [amber.ts:206](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L206)

The amber application as it is running. It provides apis for the backend app to use during runtime. Start it by calling `listen` in the same way as you would with an express app.

## Properties

### auth

> **auth**: [`AmberAuth`](../interfaces/AmberAuth.md)

Defined in: [amber.ts:222](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L222)

The authentication service for the amber application. It provides methods to manage users, roles and permissions.

***

### channels

> **channels**: [`AmberChannels`](../interfaces/AmberChannels.md)

Defined in: [amber.ts:230](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L230)

The channels service for the amber application. It provides methods to access the channels.

***

### collections

> **collections**: [`AmberCollections`](../interfaces/AmberCollections.md)

Defined in: [amber.ts:226](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L226)

The collections service for the amber application. It provides methods to access the collections and their documents.

***

### express

> **express**: `Express`

Defined in: [amber.ts:210](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L210)

The express app that is used to run the amber application. You can use it to add additional middleware or routes.

## Methods

### addAdminIfNotExists()

> **addAdminIfNotExists**(`email`, `name`, `pw`, `roles?`): `Promise`\<`string`\>

Defined in: [amber.ts:268](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L268)

Bootstraps a user in the amber application as the initial admin. It will create the user if it does not exist, or update its roles if it does. It will be added to the global
tenant "*"

#### Parameters

##### email

`string`

Email to be used to login

##### name

`string`

User name as a descriptive name for the user, e.g. "John Doe"

##### pw

`string`

An initial password for the user, please take it from a secure place

##### roles?

`string`[]

Roles to be added additional to "admin" which is the build in role for the admin user.

#### Returns

`Promise`\<`string`\>

***

### addOrUpdateTenant()

> **addOrUpdateTenant**(`tenantId`, `tenantName`, `tenantData`): `Promise`\<`void`\>

Defined in: [amber.ts:253](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L253)

Bootstraps a tenant in the amber application. It will create the tenant if it does not exist, or update it if it does.

#### Parameters

##### tenantId

`string`

tenantId (short name) of the tenant, e.g. "mytenant"

##### tenantName

`string`

descrtive name of the tenant, e.g. "My Tenant"

##### tenantData

`any`

some data to store with the tenant, e.g. {description: "This is my tenant", background: "blue"}. Application specific

#### Returns

`Promise`\<`void`\>

***

### listen()

> **listen**(`port?`, `host?`): `Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>

Defined in: [amber.ts:278](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/amber.ts#L278)

Starts the amber application. It is a wrapper around the express app's listen method.

#### Parameters

##### port?

`number`

The port to listen on. Default is 3000.

##### host?

`string`

The host to listen on. Default is "localhost".

#### Returns

`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>

The server instance.
