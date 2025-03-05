import {SimpleWebsocket, WebsocketHandler} from '../amber/websocket/websocket.js';

// This is a very simple websocket based chat server. It listens on a path and forwards messages to all clients that are subscribed to the topic of the message.
export function chat(listenPath:string) : WebsocketHandler{
    var clients:{socket:SimpleWebsocket, subscribedTopics:string[]}[] = [];

    return (path: string, protocol: string)=> {
        if (path === listenPath){
            return (socket)=>{
                var thisClient:{socket:SimpleWebsocket, subscribedTopics:string[]} = {socket: socket, subscribedTopics: ["test"]};
                clients.push(thisClient);
                socket.onClose(()=>{
                    clients = clients.filter((client)=> client !== thisClient);
                });
                socket.onMessage((message:{topics?:string[],message?:string, topic?:string})=>{
                    if (message.topics){
                        thisClient.subscribedTopics = message.topics;
                        return;
                    }
                    clients.forEach((client)=>{
                        if (client.subscribedTopics.includes(message.topic ?? "test")){
                            client.socket.sendJson({topic: message.topic, message: message.message});
                        }
                    });
                });
            };
        }
        return undefined;
    };
}