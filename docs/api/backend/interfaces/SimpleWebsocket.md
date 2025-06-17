[**amberbase**](../README.md)

***

[amberbase](../globals.md) / SimpleWebsocket

# Interface: SimpleWebsocket

Defined in: [websocket/websocket.ts:9](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/websocket/websocket.ts#L9)

A simple websocket interface that allows to send and receive JSON messages. It is used to simplify the websocket handling in the amber server.

## Methods

### close()

> **close**(): `void`

Defined in: [websocket/websocket.ts:25](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/websocket/websocket.ts#L25)

Close the websocket connection.

#### Returns

`void`

***

### onClose()

> **onClose**(`callback`): `void`

Defined in: [websocket/websocket.ts:14](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/websocket/websocket.ts#L14)

Register a callback that is called when the websocket is closed. The callback is called with no arguments.

#### Parameters

##### callback

() => `void`

Callback that is called when the websocket is closed.

#### Returns

`void`

***

### onMessage()

> **onMessage**(`callback`): `void`

Defined in: [websocket/websocket.ts:20](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/websocket/websocket.ts#L20)

Register a callback that is called when a message is received. The callback is called with the parsed JSON message.

#### Parameters

##### callback

(`message`) => `void`

Callback that is called when a message is received.

#### Returns

`void`

***

### sendJson()

> **sendJson**(`message`): `void`

Defined in: [websocket/websocket.ts:31](https://github.com/amberbase/amberbase/blob/81aedbf4fe970dbf0032c9ddb84e467b0235ae2d/src/backend/src/amber/websocket/websocket.ts#L31)

Send a JSON message to the client. The message is automatically stringified.

#### Parameters

##### message

`any`

The message to send.

#### Returns

`void`
