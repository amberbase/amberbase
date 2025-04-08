import { AmberSessionProtocolPrefix, CollectionClientWsMessage, CollectionDocument, AmberServerMessage, SubscribeCollectionMessage, AmberServerResponseMessage, AmberCollectionClientMessage, ServerError, ServerSyncDocument, DeletedCollectionDocument, UnsubscribeCollectionMessage, ServerSuccessWithDocument, CreateDocument, UpdateDocument, ServerSuccess, DeleteDocument } from "./dtos.js";

export interface AmberCollections{
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe<T>(collection:string, lastReceivedChange:number, onDocument:(doc:CollectionDocument<T>) => void, onDocumentDelete:(docId:string) => void): void;
    unsubscribe(collection:string): void;
    createDoc<T>(collection:string, content:T): Promise<string>;
    updateDoc<T>(collection:string, documentId:string, changeNumber:number, content:T): Promise<void>;
    deleteDoc(collection:string, documentId:string): Promise<void>;
    onConnectionChanged(callback:(connected:boolean) => void): void;
    offConnectionChanged(callback:(connected:boolean) => void): void;
}

export class AmberConnectionsClient implements AmberCollections{
    apiPrefix: string;
    tenant: string;
    sessionToken: () => Promise<string | null>;

    ws :WebSocket | null = null;
    websocketPrefix: string = 'wss://';

    requestId: number = 0;

    /**
     * Is connected to the server. Fed by the websocket onopen and onclose events.
     */
    connected: boolean = false;

    /** 
     * The connected() method has been called to start the connection
     */
    connectionEnabled : boolean = false;

    subscriptions: Map<string,{
        lastReceivedChange:number,
        onDocument:(doc:CollectionDocument) => void,
        onDocumentDelete:(docId:string) => void,
    }> = new Map();

    inflightRequests: Map<number, (message:AmberServerResponseMessage) => void> = new Map(); 


    onConnectionChanged(callback:(connected:boolean) => void)
    {
        this.connectionChangeHandlers.push(callback);
    }

    offConnectionChanged(callback:(connected:boolean) => void)
    {
        this.connectionChangeHandlers = this.connectionChangeHandlers.filter((handler) => handler !== callback);
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

    subscribe<T>(collection:string, lastReceivedChange:number, onDocument:(doc:CollectionDocument<T>) => void, onDocumentDelete:(docId:string) => void) 
    {
        this.subscriptions.set(collection, {lastReceivedChange:lastReceivedChange, onDocument:onDocument, onDocumentDelete:onDocumentDelete});

        // if we are already connected, send the subscribe message. Otherwise it will be sent when we connect
        if(this.ws != null && this.connected && this.ws.readyState === WebSocket.OPEN)
        {
            this.send<SubscribeCollectionMessage>({action:"subscribe-collection", collection:collection, requestId:this.requestId++, start: lastReceivedChange});
        }
    }

    unsubscribe(collection:string) 
    {
        this.subscriptions.delete(collection);
        // if we are already connected, send the unsubscribe message. Otherwise it will be sent when we connect
        if(this.ws != null && this.connected && this.ws.readyState === WebSocket.OPEN)
        {
            this.send<UnsubscribeCollectionMessage>({action:"unsubscribe-collection", collection:collection, requestId:this.requestId++});
        }
    }

    /**
     * Create a new document
     * @param collection The collection to create it into
     * @param content content of the document
     * @param accessTags Access tags if necessary
     * @returns the document id of the created document. If this call succeeds, the document will already be sent to the client as a sync.
     */

    async createDoc<T>(collection:string, content:T) : Promise<string> 
    {
        var response = await this.sendAndReceive<CreateDocument, ServerSuccessWithDocument>({action:"create-doc", collection:collection, requestId:this.requestId++, content:content});
        return response.documentId;
    }

    /**
     * Update a document.
     * @param collection The collection to update it into
     * @param documentId The document id to update
     * @param content content of the document
     * @returns the document id of the updated document. If this call succeeds, the document will already be sent to the client as a sync.
     */
    async updateDoc<T>(collection:string, documentId:string, changeNumber:number, content:T) : Promise<void> 
    {
        await this.sendAndReceive<UpdateDocument, ServerSuccess>({action:"update-doc", collection:collection, requestId:this.requestId++, documentId:documentId, content:content, expectedChangeNumber:changeNumber});
    }

    /**
     * Delete a document.
     * @param collection The collection to delete from
     * @param documentId The document id to delete
     */
    async deleteDoc<T>(collection:string, documentId:string) : Promise<void> 
    {
        await this.sendAndReceive<DeleteDocument, ServerSuccess>({action:"delete-doc", collection:collection, requestId:this.requestId++, documentId:documentId});
    }

       
    send<T extends AmberCollectionClientMessage>(message:T) : boolean {
        if(this.ws != null && this.connected && this.ws.readyState === WebSocket.OPEN)
        {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    sendAndReceive<T extends AmberCollectionClientMessage, R extends AmberServerResponseMessage>(message:T) : Promise<R> {
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
                // send the subscribe messages
                for(const [collection, subscription] of this.subscriptions.entries()){
                    this.send<SubscribeCollectionMessage>({action:"subscribe-collection", collection:collection, requestId:this.requestId++, start: subscription.lastReceivedChange});
                }
            };

            this.ws.onclose = () => {
                this.connected = false;
                this.connectionChangeHandlers.forEach((handler) => handler(false));
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

                if (message.type === "sync-document") {
                    const syncMessage = message as ServerSyncDocument;
                    const subscription = this.subscriptions.get(syncMessage.collection);
                    if (subscription) {
                        if ( (syncMessage.document as DeletedCollectionDocument).removed) {
                            subscription.onDocumentDelete(syncMessage.document.id);
                        }
                        else {
                            subscription.onDocument(syncMessage.document as CollectionDocument);
                        }
                        subscription.lastReceivedChange = Math.max(subscription.lastReceivedChange || 0, syncMessage.document.change_number);
                    }
                } 
            };

        });
    }


}