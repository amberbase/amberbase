[**amber-client**](../README.md)

***

[amber-client](../globals.md) / UserDetails

# Interface: UserDetails

Defined in: [shared/dtos.ts:97](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L97)

User details

## Properties

### email

> **email**: `string`

Defined in: [shared/dtos.ts:106](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L106)

User email. This is the email used to login. It is stored in lower case.

***

### id

> **id**: `string`

Defined in: [shared/dtos.ts:101](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L101)

User id. Often used to identify the user. E.g. in access tags

***

### name

> **name**: `string`

Defined in: [shared/dtos.ts:111](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L111)

User name (descriptive, not unique)

***

### tenants

> **tenants**: `object`

Defined in: [shared/dtos.ts:116](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L116)

Tenants the user has access to and the roles the user has in the tenant

#### Index Signature

\[`tenant`: `string`\]: `string`[]
