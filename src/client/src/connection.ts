import { AmberSessionProtocolPrefix, CollectionClientWsMessage, CollectionDocument, AmberServerMessage, SubscribeCollectionMessage, AmberServerResponseMessage, AmberCollectionClientMessage, ServerError, ServerSyncDocument, DeletedCollectionDocument, UnsubscribeCollectionMessage, ServerSuccessWithDocument, CreateDocument, UpdateDocument, ServerSuccess, DeleteDocument, AmberClientWsMessage } from "./dtos.js";


export interface ConnectionHandler{
    handleConnectionChanged(connected:boolean): void;
    handleMessage(message: AmberServerMessage): void;
}

export class AmberConnectionsClient {
    apiPrefix: string;
    tenant: string;
    sessionToken: () => Promise<string | null>;

    ws :WebSocket | null = null;
    websocketPrefix: string = 'wss://';

    requestId: number = 0;


    connectionHandlers: ConnectionHandler[] = [];

    /**
     * Is connected to the server. Fed by the websocket onopen and onclose events.
     */
    connected: boolean = false;

    /** 
     * The connected() method has been called to start the connection
     */
    connectionEnabled : boolean = false;

    inflightRequests: Map<number, (message:AmberServerResponseMessage) => void> = new Map(); 

    registerConnectionHandler(handler:ConnectionHandler) : void {
        this.connectionHandlers.push(handler);
        if(this.connected){
            handler.handleConnectionChanged(true);
        }
    }

    onConnectionChanged(callback:(connected:boolean) => void)
    {
        this.connectionChangeHandlers.push(callback);
        if(this.connected){
            callback(true);
        }
    }

    offConnectionChanged(callback:(connected:boolean) => void)
    {
        this.connectionChangeHandlers = this.connectionChangeHandlers.filter((handler) => handler !== callback);
    }

    isConnected() : boolean {
        return this.ws != null && this.connected && this.ws.readyState === WebSocket.OPEN;
    }

    incrementedRequestId() : number {
        return this.requestId++;
    }

    connectionChangeHandlers: ((connected:boolean) => void)[] =[];

    constructor(apiPrefix:string, tenant:string, sessionToken: () => Promise<string | null>){
        this.apiPrefix = apiPrefix;
        this.tenant = tenant;
        this.sessionToken = sessionToken;
        if(location.protocol === "http:"){
            this.websocketPrefix = 'ws://';
        }
    }

    
       
    send<T extends AmberClientWsMessage>(message:T) : boolean {
        if(this.ws != null && this.connected && this.ws.readyState === WebSocket.OPEN)
        {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    sendAndReceive<T extends AmberClientWsMessage, R extends AmberServerResponseMessage>(message:T) : Promise<R> {
        var received = false;
        return new Promise<R>((resolve, reject) => {
        setTimeout(() => {
            if(!received){
                this.inflightRequests.delete(message.requestId);
                reject(new Error("Timeout waiting for response"));
            }
        }, 5 * 1000);

        this.inflightRequests.set(message.requestId, (response:AmberServerResponseMessage) => {
            received = true;
            if(response.type === "error"){
                var errorResponse = response as ServerError;
                reject(new Error(errorResponse.error));
            } else {
                resolve(response as R);
            };
           });
            this.send<T>(message);
        });
    }

    public async connect(): Promise<void> {
        if(this.connectionEnabled){
            return Promise.resolve();
        }
        this.connectionEnabled = true;
        return this.innerConnect();
    }

    public async disconnect(): Promise<void> {
        this.connectionEnabled = false;
        if(this.ws != null){
            this.ws.close();
            this.ws = null;
        }
    }

    async innerConnect(): Promise<void> {
        var token = await this.sessionToken();
        return new Promise((resolve, reject) => {
            const url = `${this.websocketPrefix}${location.host}${this.apiPrefix}/ws/amber/${this.tenant}`;
            
            this.ws = new WebSocket(url, [ AmberSessionProtocolPrefix +  token, "amber"]);

            this.ws.onopen = () => {
                resolve();
                this.connected = true;
                this.connectionChangeHandlers.forEach((handler) => handler(true));

                this.connectionHandlers.forEach((handler) => {
                    handler.handleConnectionChanged(true);
                });
           };

            this.ws.onclose = () => {
                this.connected = false;
                this.connectionChangeHandlers.forEach((handler) => handler(false));
                this.connectionHandlers.forEach((handler) => {
                    handler.handleConnectionChanged(false);
                });
                this.ws = null;
                if (this.connectionEnabled) {
                    setTimeout(async() => {
                    if(this.connectionEnabled)
                        {
                            await this.innerConnect();
                        }
                    }, 1000);
                }
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data) as AmberServerMessage;

                // Check if the message is a response to a request
                // If it is, call the callback with the response message
                if((message as AmberServerResponseMessage).responseTo !== undefined){
                    const responseMessage = message as AmberServerResponseMessage;
                    if (this.inflightRequests.has(responseMessage.responseTo)) {
                        const callback = this.inflightRequests.get(responseMessage.responseTo);
                        this.inflightRequests.delete(responseMessage.responseTo);
                        if (callback) {
                            callback(responseMessage);
                        }
                    }
                    return;
                };

                this.connectionHandlers.forEach((handler) => {
                    handler.handleMessage(message);
                });

                
            };
        });
    }
}