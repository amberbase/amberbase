[**amber-client**](../README.md)

***

[amber-client](../globals.md) / InvitationDetails

# Interface: InvitationDetails

Defined in: [shared/dtos.ts:297](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L297)

Details about an invitation. This is the response to the /invitations/:invitation endpoint.

## Properties

### expires

> **expires**: `number`

Defined in: [shared/dtos.ts:318](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L318)

Expiration as a UNIX timestamp (UTC)

***

### isStillValid

> **isStillValid**: `boolean`

Defined in: [shared/dtos.ts:309](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L309)

Indicator if the invitation is still valid. This is true if the invitation has not been accepted or expired yet.

***

### roles

> **roles**: `string`[]

Defined in: [shared/dtos.ts:314](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L314)

Roles the user will gain accepting the invitation

***

### tenantId

> **tenantId**: `string`

Defined in: [shared/dtos.ts:301](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L301)

The tenant id the invitation is allowing access to

***

### tenantName

> **tenantName**: `string`

Defined in: [shared/dtos.ts:305](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L305)

Human readable name of the tenant
