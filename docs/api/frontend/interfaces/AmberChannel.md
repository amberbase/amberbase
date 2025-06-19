[**amber-client**](../README.md)

***

[amber-client](../globals.md) / AmberChannel

# Interface: AmberChannel\<T\>

Defined in: [channels.ts:45](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L45)

Interface for a channel in the Amber SDK. This is used to send and receive messages on a channel.

## Type Parameters

### T

`T`

## Methods

### send()

> **send**(`content`): `Promise`\<`void`\>

Defined in: [channels.ts:62](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L62)

Send a message to the channel. This will send a message to the channel.

#### Parameters

##### content

`T`

The content of the message

#### Returns

`Promise`\<`void`\>

***

### subscribe()

> **subscribe**(`onMessage`): `void`

Defined in: [channels.ts:51](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L51)

Subscribe to a channel. This will start receiving messages for the channel.

#### Parameters

##### onMessage

(`doc`) => `void`

Callback for when a message is received

#### Returns

`void`

***

### unsubscribe()

> **unsubscribe**(): `void`

Defined in: [channels.ts:56](https://github.com/amberbase/amberbase/blob/6464296e6e41acf9a6a91921198b6834f589ce99/src/client/src/channels.ts#L56)

Unsubscribe from the channel. This will stop receiving messages

#### Returns

`void`
