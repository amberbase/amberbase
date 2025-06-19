[**amber-client**](../README.md)

***

[amber-client](../globals.md) / CreateInvitationRequest

# Interface: CreateInvitationRequest

Defined in: [shared/dtos.ts:215](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L215)

Request to create a new user invitation (the url path contains the tenant id)

## Properties

### expiresInDays

> **expiresInDays**: `number`

Defined in: [shared/dtos.ts:224](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L224)

Expiration date in days.

***

### roles

> **roles**: `string`[]

Defined in: [shared/dtos.ts:219](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/shared/dtos.ts#L219)

Roles to be assigned (added) to the user when accepting the invitation. The user can have more roles than the ones specified here.
