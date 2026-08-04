[**amber-client**](../README.md)

***

[amber-client](../globals.md) / CreateInvitationRequest

# Interface: CreateInvitationRequest

Defined in: [shared/dtos.ts:234](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L234)

Request to create a new user invitation (the url path contains the tenant id)

## Properties

### expiresInDays

> **expiresInDays**: `number`

Defined in: [shared/dtos.ts:243](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L243)

Expiration date in days.

***

### roles

> **roles**: `string`[]

Defined in: [shared/dtos.ts:238](https://github.com/amberbase/amberbase/blob/f37a67500140122944ead3d861d98aca78451eef/src/client/src/shared/dtos.ts#L238)

Roles to be assigned (added) to the user when accepting the invitation. The user can have more roles than the ones specified here.
