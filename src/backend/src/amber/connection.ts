import { AmberClientMessage, AmberServerMessage, AmberServerResponseMessage, ServerError, ServerSuccess } from "amber-client";
import { SessionToken } from "./auth.js";
import { SimpleWebsocket, WebsocketHandler } from "./websocket/websocket.js";

export interface UserContext {
    userId: string;
    roles: string[];
}

export interface ActiveConnection extends UserContext {
    id: number,
    userId: string, 
    roles: string[], 
    items: Map<string, any>, // to be used by handlers to store information (e.g. subscriptions etc...)
    tenant: string,
    socket: SimpleWebsocket
};

export interface AmberConnectionMessageHandler{
    handleMessage(connection: ActiveConnection, message: AmberClientMessage): Promise<AmberServerResponseMessage | undefined>;
}

export function errorResponse(message: AmberClientMessage, error: string): ServerError {
    return {
        type: "error",
        error: error,
        responseTo: message.requestId
    };
}

export function successResponse(message: AmberClientMessage): ServerSuccess {
    return {
        type: "success",
        responseTo: message.requestId
    };
}

export function sendToClient<T extends AmberServerMessage>(connection: ActiveConnection, message: T): void {
    connection.socket.sendJson(message);
}

export class AmberConnectionManager{

    activeConnections: ActiveConnection[] = [];

    handlers: AmberConnectionMessageHandler[] = [];
    registerHandler(handler: AmberConnectionMessageHandler): void {
        this.handlers.push(handler);
    }
    
    activeConnectionsForTenant(tenant: string): ActiveConnection[] {
        return this.activeConnections.filter(c => c.tenant === tenant);
    }

    countActiveConnectionsGroupedByTenant(counter?:((itemKeys:string[])=>number) | undefined):{[tenant:string]:number}  {
        let result: {[tenant:string]:number} = {};
        for (const connection of this.activeConnections) {
            if (!result[connection.tenant]) {
                result[connection.tenant] = 0;
            }
            result[connection.tenant] += counter? counter(Array.from(connection.items.keys())) : 1;
        }
        return result;
    }

    websocketBinding(): WebsocketHandler
        {
            var counter = 0;
            return (path: string, protocol: string, sessionToken: SessionToken | null) => {
                if (!sessionToken || protocol != "amber")
                {
                    return undefined;
                }
                if (!path.startsWith("/ws/amber/"))
                {
                    return undefined;
                }
                let id = counter++;
    
                return (socket => {
                    var connection: ActiveConnection = {
                        id: id,
                        userId: sessionToken.userId,
                        roles: sessionToken.roles,
                        items: new Map(),
                        tenant: sessionToken.tenant,
                        socket: socket
                    };
                    this.activeConnections.push(connection);
                    socket.onMessage(async (message: AmberClientMessage) => {
                        for (const handler of this.handlers) {
                            try{
                                let result = await handler.handleMessage(connection, message);
                                if (result) {
                                    sendToClient(connection, result);
                                    break;
                                }
                            }
                            catch (e) {
                                console.error("Error in amber websocket message handler", e);
                            }
                        }
                        
                    });
                    socket.onClose(() => {
                        let index = this.activeConnections.findIndex(c => c.id === id);
                        if (index !== -1) {
                            this.activeConnections.splice(index, 1);
                        }
                    });
                });
            };
        }
}