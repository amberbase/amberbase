[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberUiApi

# Class: AmberUiApi

Defined in: [ui.ts:3](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L3)

## Methods

### goToAdmin()

> **goToAdmin**(): `void`

Defined in: [ui.ts:39](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L39)

Navigate to the admin page of the current tenant.

#### Returns

`void`

***

### goToGlobalAdmin()

> **goToGlobalAdmin**(): `void`

Defined in: [ui.ts:72](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L72)

Navigate to the global admin page.
This is only available if the user is in the global tenant "*" and `admin`.

#### Returns

`void`

***

### goToGlobalMonitoring()

> **goToGlobalMonitoring**(): `void`

Defined in: [ui.ts:82](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L82)

Navigate to the global monitoring page.
This is only available if the user is in the global tenant "*" and `admin`.

#### Returns

`void`

***

### goToLogin()

> **goToLogin**(`tenant`, `returnUrl`): `void`

Defined in: [ui.ts:25](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L25)

Navigate to the login page

#### Parameters

##### tenant

`string` \| `undefined`

The target tenant, if undefined and multiple tenants are available, the user will be asked to select a tenant.

##### returnUrl

`string` \| `undefined`

The URL to return to after login, if undefined the user will be redirected to the current page. Use `{tenant}` as a placeholder to receive the selected tenant.

#### Returns

`void`

***

### goToMonitoring()

> **goToMonitoring**(): `void`

Defined in: [ui.ts:51](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L51)

Navigate to the monitoring page of the current tenant.

#### Returns

`void`

***

### goToUserProfile()

> **goToUserProfile**(): `void`

Defined in: [ui.ts:63](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/ui.ts#L63)

Navigate to the user profile page of the current user.

#### Returns

`void`
