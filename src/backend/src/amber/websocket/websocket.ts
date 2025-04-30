import * as http from 'http'
import * as WebSocket from 'ws'
import { AmberAuth, SessionToken } from '../auth.js';
import { AmberSessionProtocolPrefix } from 'amber-client';

export interface SimpleWebsocket{
    onClose(callback: ()=>void): void;
    onMessage(callback: (message: any)=>void): void;
    close():void;
    sendJson(message: any): void;
}

/**
 * Websocket handler to determine if a websocket request should be processed or not. It is called with the path and protocol of the request as well as a verified session token if it is provided. 
 * The protocol is the first protocol that does not start with AmberSessionProtocolPrefix shared with the amber client library. The session token is the session token encoded in the protocol header that is carrying the AmberSessionProtocolPrefix.
 * Return a function to process the websocket request or undefined if the request should be ignored. Returning an error object interrupts the further search for an alternative handler. Do that if you feel responsible, but the peer contained some wrong data. 
 * The function will be called with a SimpleWebsocket instance that is used to send messages to the client and receive messages from the client.
 */
export type WebsocketHandler = ((path:string, protocol: string, sessionToken : SessionToken | null)=> (((socket: SimpleWebsocket)=>void) | undefined | {status:number, err:string}));

/**
 * Installs a wrapped websocket handler on an http server. It takes care of detecting aliveness and gives a simplified API to it.
 * @param server The server to install the websocket handler on
 * @param websocketHandlers Handlers to process the websocket requests. The first one that returns a function will be used. The function will that will be subsequentially be started with the socket context.
 * @param pathPrefix 
 * @param authService 
 */
export function simpleWebsockets(server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>, websocketHandlers: WebsocketHandler[], pathPrefix:string, authService:AmberAuth){
    var wss = new WebSocket.WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
        console.log('Parsing session from websocket request');
        if (!request.url)
        {
            request.statusCode = 400;
            return;
        }
        var pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
        var protocolRaw = request.headers['sec-websocket-protocol'] ?? "";

        var protocols = protocolRaw.split(',').map((protocol) => protocol.trim());

        // Check if the session token is encoded in the protocol header (yes, this is a bit odd but one of the potential solutions for the wacky decision to strip headers from the browsers websocket implementations)
        var protocolEncodedSessionTokenRaw = protocols.find((protocol) => protocol.startsWith(AmberSessionProtocolPrefix));

        // The first protocol that does not start with amberSessionPrefix is the protocol we are processing
        var protocol = protocols.find((protocol) => !protocol.startsWith(AmberSessionProtocolPrefix)) ?? null;
        
        var sessionTokenRaw = protocolEncodedSessionTokenRaw ? protocolEncodedSessionTokenRaw.substring(AmberSessionProtocolPrefix.length) : null;
        var sessionToken: SessionToken | null = null;
        
        if(sessionTokenRaw != null)
        {
            var parsedSessionToken = authService.validateSessionToken(sessionTokenRaw);
            if (parsedSessionToken )
            {
                sessionToken = parsedSessionToken;
            }
        }

        if (!pathname.startsWith(pathPrefix))
            return;
        pathname = pathname.substring(pathPrefix.length);
        
        for (const handler of websocketHandlers) {
            var result = handler(pathname, protocol, sessionToken);
            if (result === undefined)
                continue;
            if(typeof result === 'object'){

                socket.end(`HTTP/1.1 ${result.status} ${result.err}\r\n\r\n`);
                return;
            }
            if (typeof result === 'function'){
                    let socketHandler = result;
                    wss.handleUpgrade(request, socket, head, (ws, req)=>{

                        let closeHandler :()=>void = ()=>{};
                        let socketStartTime = new Date();
                        let aliveTime = socketStartTime.getTime();
                        let simpleWebsocket: SimpleWebsocket = {
                            onClose: (callback)=> {
                                closeHandler = callback;
                            },
                            close: ()=> ws.close(),
                            sendJson: (message)=> ws.send(JSON.stringify(message)),
                            onMessage: (callback)=> ws.on('message', (message)=> {
                                aliveTime = (new Date()).getTime();
                                callback(JSON.parse(message.toString()));
                            }) 
                            //ToDo: Decision pending, should we sequentialize async processing here?
                        };
                        
                        var pingProcess = setInterval(() => {
                            var aliveAge = (new Date()).getTime() - aliveTime;
                            if (aliveAge > 60_000) {
                                ws.terminate();
                                closeHandler();
                            } else if (aliveAge > 30_000) {
                                ws.ping();
                            }
                        }, 1000);

                        ws.on('pong', () => {
                            aliveTime = (new Date()).getTime();
                        });
                        ws.on('close', ()=>{
                            clearInterval(pingProcess);
                            closeHandler();
                        });

                        socketHandler(simpleWebsocket);
                return;
            });
        }
      }
    });
}

