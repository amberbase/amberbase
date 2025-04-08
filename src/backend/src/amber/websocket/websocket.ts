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
export type WebsocketHandler = ((path:string, protocol: string, sessionToken : SessionToken | null)=> (((socket: SimpleWebsocket)=>void) | undefined | {status:number, err:string}));
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

