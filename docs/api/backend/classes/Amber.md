[**amberbase**](../README.md)

***

[amberbase](../globals.md) / Amber

# Class: Amber

Defined in: [amber.ts:207](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L207)

The amber application as it is running. It provides apis for the backend app to use during runtime. Start it by calling `listen` in the same way as you would with an express app.

## Properties

### auth

> **auth**: [`AmberAuth`](../interfaces/AmberAuth.md)

Defined in: [amber.ts:223](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L223)

The authentication service for the amber application. It provides methods to manage users, roles and permissions.

***

### channels

> **channels**: [`AmberChannels`](../interfaces/AmberChannels.md)

Defined in: [amber.ts:231](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L231)

The channels service for the amber application. It provides methods to access the channels.

***

### collections

> **collections**: [`AmberCollections`](../interfaces/AmberCollections.md)

Defined in: [amber.ts:227](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L227)

The collections service for the amber application. It provides methods to access the collections and their documents.

***

### express

> **express**: `Express`

Defined in: [amber.ts:211](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L211)

The express app that is used to run the amber application. You can use it to add additional middleware or routes.

## Methods

### addAdminIfNotExists()

> **addAdminIfNotExists**(`email`, `name`, `pw`, `roles?`): `Promise`\<`string`\>

Defined in: [amber.ts:273](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L273)

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

Defined in: [amber.ts:259](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L259)

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

Defined in: [amber.ts:283](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L283)

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
