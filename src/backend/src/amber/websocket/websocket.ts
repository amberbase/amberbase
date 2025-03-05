import * as express from 'express'
import * as http from 'http'
import * as WebSocket from 'ws'

export interface SimpleWebsocket{
    onClose(callback: ()=>void): void;
    onMessage(callback: (message: any)=>void): void;
    close():void;
    sendJson(message: any): void;
}
export type WebsocketHandler = ((path:string, protocol: string)=> (((socket: SimpleWebsocket)=>void) | undefined | {status:number, err:string}));
export function simpleWebsockets(server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>, websocketHandlers: WebsocketHandler[], pathPrefix:string){
    var wss = new WebSocket.WebSocketServer({ noServer: true });
    server.on('upgrade', (request, socket, head) => {
        console.log('Parsing session from websocket request');
        if (!request.url)
        {
            request.statusCode = 400;
            return;
        }
        var pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
        var protocol = request.headers['sec-websocket-protocol'] ?? "";
        if (!pathname.startsWith(pathPrefix))
            return;
        pathname = pathname.substring(pathPrefix.length);
        for (const handler of websocketHandlers) {
            var result = handler(pathname, protocol);
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
                        let simpleWebsocket: SimpleWebsocket = {
                            onClose: (callback)=> {
                                closeHandler = callback;
                            },
                            close: ()=> ws.close(),
                            sendJson: (message)=> ws.send(JSON.stringify(message)),
                            onMessage: (callback)=> ws.on('message', (message)=> callback(JSON.parse(message.toString())))
                        };

                        let aliveTime = socketStartTime.getTime();
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

