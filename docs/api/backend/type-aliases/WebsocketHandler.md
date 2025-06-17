[**amberbase**](../README.md)

***

[amberbase](../globals.md) / WebsocketHandler

# Type Alias: WebsocketHandler()

> **WebsocketHandler** = (`path`, `protocol`, `sessionToken`) => (`socket`) => `void` \| `undefined` \| \{ `err`: `string`; `status`: `number`; \}

Defined in: [websocket/websocket.ts:41](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/websocket/websocket.ts#L41)

Websocket handler to determine if a websocket request should be processed or not. It is called with the path and protocol of the request as well as a verified session token if it is provided. 
The protocol is the first protocol that does not start with "ambersession.". The session token is the session token encoded in the protocol header that is carrying the AmberSessionProtocolPrefix.
Return a function to process the websocket request or undefined if the request should be ignored. Returning an error object interrupts the further search for an alternative handler. Do that if you feel responsible, but the peer contained some wrong data. 
The function will be called with a SimpleWebsocket instance that is used to send messages to the client and receive messages from the client.

## Parameters

### path

`string`

### protocol

`string`

### sessionToken

[`SessionToken`](../interfaces/SessionToken.md) | `null`

## Returns

(`socket`) => `void` \| `undefined` \| \{ `err`: `string`; `status`: `number`; \}
