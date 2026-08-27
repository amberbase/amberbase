[**amberbase**](../README.md)

***

[amberbase](../globals.md) / AmberInit

# Class: AmberInit

Defined in: [amber.ts:29](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L29)

AmberInit is the main entry point for initializing an Amber application.
It wraps an Express app and provides methods to configure the amber specific details via a fluent interface and start the application.

## Methods

### addWebsocketHandler()

> **addWebsocketHandler**(`handler`): `AmberInit`

Defined in: [amber.ts:82](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L82)

Adds a websocket handler for easy websocket usage. The handler is a function that takes the path and protocol as arguments and returns a
function that takes a socket as an argument if the combination of path (relative to the "withPath" prefix) and protocol is acceptable.

This is a fluent interface, so it returns the AmberInit instance.

#### Parameters

##### handler

[`WebsocketHandler`](../type-aliases/WebsocketHandler.md)

The websocket handler to set. Default is a simple echo handler.

#### Returns

`AmberInit`

The AmberInit instance for all that fluidity.

***

### create()

> **create**(`otherApp?`, `server?`): `Promise`\<[`Amber`](Amber.md)\>

Defined in: [amber.ts:134](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L134)

Initiates and adds the amber application to a given or existing express app. It initializes the database, sets up the authentication and hooks on the websocket handling of the server.
If a custom server is provided, it will be used, otherwise it will hook into the `listen` call of the express app or just launch it with Amber.listen()

#### Parameters

##### otherApp?

`Express`

The express app to add the amber application to. If not provided, a new express app will be created. Due to the nature of express, you can use the same app for multiple amber instances BUT you must not install other middleware handlers that might interfere with amberbase BEFORE this call. Amberbase will only install middleware handlers that are limited to its own path prefix.

##### server?

`Server`\<*typeof* `IncomingMessage`, *typeof* `ServerResponse`\>

The http server to use. If not provided, a new http server will be created and the amber application will hook into the `listen` call of the express app.

#### Returns

`Promise`\<[`Amber`](Amber.md)\>

A promise that resolves to the Amber instance representing the running state of Amberbase.

***

### withChannel()

> **withChannel**\<`T`\>(`name`, `settings?`): `AmberInit`

Defined in: [amber.ts:106](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L106)

Adds a channel to the amber application. This is a fluent interface, so it returns the AmberInit instance.

#### Type Parameters

##### T

`T`

The type of the data in the channel. Used to provide type safety in the API.

#### Parameters

##### name

`string`

The name of the channel to add.

##### settings?

[`ChannelSettings`](../interfaces/ChannelSettings.md)\<`T`\>

The settings for the channel. See ChannelSettings for more details.

#### Returns

`AmberInit`

The AmberInit instance for all that fluidity.

***

### withCollection()

> **withCollection**\<`T`\>(`name`, `settings?`): `AmberInit`

Defined in: [amber.ts:94](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L94)

Adds a collection to the amber application. This is a fluent interface, so it returns the AmberInit instance.

#### Type Parameters

##### T

`T`

The type of the documents in the collection. Used to provide type safety in the API.

#### Parameters

##### name

`string`

The name of the collection to add.

##### settings?

[`CollectionSettings`](../interfaces/CollectionSettings.md)\<`T`\>

The settings for the collection. See

#### Returns

`AmberInit`

The AmberInit instance for all that fluidity.

#### See

CollectionSettings for more details. If not provided, the default settings will be used, which allow all actions for all users.

***

### withConfig()

> **withConfig**(`config`): `AmberInit`

Defined in: [amber.ts:57](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L57)

Sets the config for the amber application. This is a fluent interface, so it returns the AmberInit instance.
It merges the provided config with the default config (e.g. default db_name etc...).

#### Parameters

##### config

[`ConfigOptions`](../interfaces/ConfigOptions.md)

The optional configuration to set.

#### Returns

`AmberInit`

The AmberInit instance for all that fluidity.

***

### withPath()

> **withPath**(`path`): `AmberInit`

Defined in: [amber.ts:69](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L69)

Sets the path prefix for the amber application. It is used to separate the amber specific routes from the rest of the application.

This is a fluent interface, so it returns the AmberInit instance.

#### Parameters

##### path

`string`

The path prefix to set. Default is "/api/amber"

#### Returns

`AmberInit`

The AmberInit instance for all that fluidity.

***

### withUi()

> **withUi**(`config?`): `AmberInit`

Defined in: [amber.ts:115](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/backend/src/amber/amber.ts#L115)

Enable the standard UI for common managment and user profile tasks.

#### Parameters

##### config?

`UiConfigOptions` \| ((`c`) => `void`)

The configuration for the UI. It can be a function that takes the

#### Returns

`AmberInit`

#### See

 - AmberUiConfig and modifies it, or an
 - AmberUiConfig object directly.
