[**amber-client**](../README.md)

***

[amber-client](../globals.md) / InvitationDetails

# Interface: InvitationDetails

Defined in: [shared/dtos.ts:279](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L279)

Details about an invitation. This is the response to the /invitations/:invitation endpoint.

## Properties

### expires

> **expires**: `number`

Defined in: [shared/dtos.ts:300](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L300)

Expiration as a UNIX timestamp (UTC)

***

### isStillValid

> **isStillValid**: `boolean`

Defined in: [shared/dtos.ts:291](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L291)

Indicator if the invitation is still valid. This is true if the invitation has not been accepted or expired yet.

***

### roles

> **roles**: `string`[]

Defined in: [shared/dtos.ts:296](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L296)

Roles the user will gain accepting the invitation

***

### tenantId

> **tenantId**: `string`

Defined in: [shared/dtos.ts:283](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L283)

The tenant id the invitation is allowing access to

***

### tenantName

> **tenantName**: `string`

Defined in: [shared/dtos.ts:287](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L287)

Human readable name of the tenant
