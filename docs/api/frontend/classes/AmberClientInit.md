[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberClientInit

# Class: AmberClientInit

Defined in: [client.ts:17](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L17)

## Methods

### forGlobal()

> **forGlobal**(): `AmberClientInit`

Defined in: [client.ts:69](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L69)

Request the global tenant. That means that we only want users from the global tenant. This is useful to build a custom management UI for the global management tasks like creating new tenants etc.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

***

### onRolesChanged()

> **onRolesChanged**(`callback`): `AmberClientInit`

Defined in: [client.ts:194](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L194)

Register a callback that will be called when the roles of the user or the tenant selected change.

#### Parameters

##### callback

(`tenant`, `roles`, `user`) => `void`

A callback that will be called with the tenant, the roles and the user details or null if the user has logged out again.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

***

### onUserChanged()

> **onUserChanged**(`callback`): `AmberClientInit`

Defined in: [client.ts:184](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L184)

Register a callback that will be called when the user changes. This is useful if you want to update the UI or perform some actions when the user changes.

#### Parameters

##### callback

(`user`) => `void`

A callback that will be called with the user details or null if the user has logged out again.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

***

### start()

> **start**(): [`AmberClient`](AmberClient.md)

Defined in: [client.ts:203](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L203)

Start the client and return the actual

#### Returns

[`AmberClient`](AmberClient.md)

a new

#### See

 - AmberClient instance. This will create the login manager and set it up to ask the user to login.
 - AmberClient instance that is ready to use.

***

### withAmberUiLogin()

> **withAmberUiLogin**(`returnUrl?`): `AmberClientInit`

Defined in: [client.ts:117](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L117)

Use the amber ui to login. This will redirect the user to the amber ui login page and handle the login process there. 
It will also handle tenant selection if the tenant is not set.

#### Parameters

##### returnUrl?

`string`

the url to redirect to after login. If not set, it will redirect to the current page. Use `{tenant}` as a placeholder to retrieve the selected tenant if you have not set it already.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

***

### withCleanUser()

> **withCleanUser**(): `AmberClientInit`

Defined in: [client.ts:174](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L174)

Clean the user and force a new login.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

***

### withCredentialsProvider()

> **withCredentialsProvider**(`provider`): `AmberClientInit`

Defined in: [client.ts:106](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L106)

Set the credentials provider to use for the client when asking for the users credentials in a custom UI. This is useful if you want to provide a custom way to retrieve the user credentials, for example by prompting the user for their credentials.
It will only be called if the user is not already logged in or if the login fails. This is mutually exclusive to the other methods that handle user login credentials:

#### Parameters

##### provider

(`failed`) => `Promise`\<\{ `email`: `string`; `pw`: `string`; `stayLoggedIn`: `boolean`; \}\>

the provider function that returns the user credentials. You can use the `failed` parameter to determine if the login failed and you want to prompt the user again for their credentials.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

#### See

 - withUser and
 - withAmberUiLogin.

***

### withPath()

> **withPath**(`path`): `AmberClientInit`

Defined in: [client.ts:79](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L79)

Set the path prefix for the amber api. This is important if you want to use a different path than the default `/amber`.

#### Parameters

##### path

`string`

the path to the amber api.

#### Returns

`AmberClientInit`

***

### withTenant()

> **withTenant**(`tenant`): `AmberClientInit`

Defined in: [client.ts:60](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L60)

Set the tenant to use, from some place. This can be either hardcoded or retrieved from the url in the case that you use the amber ui and get the tenant selected injected into the url.
If it is not set, the user will be prompted to select a tenant unless the global tenant has explicitly been requested via

#### Parameters

##### tenant

`string`

the tenant to use for the client.

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

#### See

forGlobal.

***

### withTenantSelector()

> **withTenantSelector**(`selector`): `AmberClientInit`

Defined in: [client.ts:165](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L165)

If you want to build a custom way to select the tenant by a user (that means you do not set the tenant explicitly with

#### Parameters

##### selector

(`availableTenants`) => `Promise`\<`string`\>

a function that will be called to select the tenant. It will be called with the available tenants and should return the id of the tenant to use.

#### Returns

`AmberClientInit`

#### See

 - withTenant and you don't want to use
 - withAmberUiLogin), you can use this method to set a function that will be called to select the tenant.

***

### withUser()

> **withUser**(`email`, `pw`, `stayLoggedIn`): `AmberClientInit`

Defined in: [client.ts:92](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/client.ts#L92)

Set the user credentials to use for the client. This is useful for testing or if you want to hardcode the credentials or you somehow retrieve the credentials through another mechanism. 
It is mutually exclusive to the other methods that handle user login credentials:

#### Parameters

##### email

`string`

the email of the user

##### pw

`string`

the password of the user

##### stayLoggedIn

`boolean`

whether to stay logged in or not

#### Returns

`AmberClientInit`

Continuation of the fluent API to configure the client.

#### See

 - withCredentialsProvider and
 - withAmberUiLogin.
