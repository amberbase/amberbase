import { AmberConnectionsClient, ConnectionHandler } from "./connection.js";
import { AmberSessionProtocolPrefix, CollectionClientWsMessage, CollectionDocument, AmberServerMessage, SubscribeCollectionMessage, AmberServerResponseMessage, AmberCollectionClientMessage, ServerError, ServerSyncDocument, DeletedCollectionDocument, UnsubscribeCollectionMessage, ServerSuccessWithDocument, CreateDocument, UpdateDocument, ServerSuccess, DeleteDocument } from "./shared/dtos.js";

/**
 * SDK API for the amber collections
 */
export interface AmberCollections{
    /**
     * Connect to the amber server. This will open a websocket connection and start receiving messages. The connection is potentially already established, there will only be one.
     * 
     * @returns A promise that resolves when the connection is established.
     */
    connect(): Promise<void>;

    /**
     * Disconnect from the amber server. This will close the websocket connection and stop receiving messages.
     * 
     * @returns A promise that resolves when the connection is closed.
     */
    disconnect(): Promise<void>;

    /**
     * Listen to connection changes. If the connection already exists the callback will be immediately called with true.
     * @param callback Listener
     */
    onConnectionChanged(callback:(connected:boolean) => void): void;

    /**
     * Stop listening to connection changes.
     * @param callback The same listener that was passed to onConnectionChanged
     */
    offConnectionChanged(callback:(connected:boolean) => void): void;

    /**
     * Get the interface to work with a given collection
     * @param collection 
     */
    getCollection<T>(collection:string): AmberCollection<T>;
}

export interface AmberCollection<T>{
    
    /**
     * Subscribe to a collection. This will start receiving messages for the collection. The lastReceivedChange is used to determine the starting point for the subscription.
     * @param lastReceivedChange The last change number received. This is used to determine the starting point for the subscription.
     * @param onDocument Callback for when a document is received
     * @param onDocumentDelete Callback for when a document is deleted
     */
    subscribe(lastReceivedChange:number, onDocument:(doc:CollectionDocument<T>) => void, onDocumentDelete:(docId:string) => void): void;

    /**
     * Unsubscribe from a collection. This will stop receiving messages for the collection.
     */
    unsubscribe(): void;

    /**
     * Create a new document. This will create a new document in the collection and return the document id. 
     * The document will be sent to the client as a sync message before the promise resolves succesfully, so the application can immediately navigate to it. 
     * @param content The content of the document
     * @returns The document id of the created document
     */
    createDoc(content:T): Promise<string>;

    /**
     * Update a document. This will update the document in the collection and return the document id. 
     * The document will be sent to the client as a sync message before the promise resolves succesfully. 
     * @param documentId The document id of the document to update
     * @param content The content of the document
     * @returns The document id of the updated document
     */
    updateDoc(documentId:string, changeNumber:number, content:T): Promise<void>;

    /**
     * Delete a document. This will delete the document in the collection and return the document id. 
     * The document will be sent to the client as a sync-delete message before the promise resolves succesfully. 
     * @param documentId The document id of the document to delete
     * @returns The document id of the deleted document
     */
    deleteDoc(documentId:string): Promise<void>;
}

export class AmberCollectionsClient implements ConnectionHandler, AmberCollections{
    
    subscriptions: Map<string,{
        lastReceivedChange:number,
        onDocument:(doc:CollectionDocument) => void,
        onDocumentDelete:(docId:string) => void,
    }> = new Map();
    connection: AmberConnectionsClient;

    
    constructor(connection:AmberConnectionsClient){
        this.connection = connection;
        connection.registerConnectionHandler(this);
    }

    getCollection<T>(collection: string): AmberCollection<T> {
        return {        
            createDoc: (content:T) => this.createDoc<T>(collection, content),
            updateDoc: (documentId:string, changeNumber:number, content:T) => this.updateDoc<T>(collection, documentId, changeNumber, content),
            deleteDoc: (documentId:string) => this.deleteDoc(collection, documentId),
            subscribe: (lastReceivedChange:number, onDocument:(doc:CollectionDocument<T>) => void, onDocumentDelete:(docId:string) => void) => this.subscribe<T>(collection, lastReceivedChange, onDocument, onDocumentDelete),
            unsubscribe: () => this.unsubscribe(collection)
        };
    }

    handleConnectionChanged(connected: boolean): void {
        if(connected) {
            // send all subscriptions to the server
            this.subscriptions.forEach((subscription, collection) => {
                this.connection.send<SubscribeCollectionMessage>({action:"subscribe-collection", collection:collection, requestId:this.connection.incrementedRequestId(), start: subscription.lastReceivedChange});
            });
        }
    }

    handleMessage(message: AmberServerMessage): void {
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
    }

    onConnectionChanged(callback:(connected:boolean) => void)
    {
        this.connection.onConnectionChanged(callback);
    }

    offConnectionChanged(callback:(connected:boolean) => void)
    {
        this.connection.offConnectionChanged(callback);
    }


    subscribe<T>(collection:string, lastReceivedChange:number, onDocument:(doc:CollectionDocument<T>) => void, onDocumentDelete:(docId:string) => void) 
    {
        this.subscriptions.set(collection, {lastReceivedChange:lastReceivedChange, onDocument:onDocument, onDocumentDelete:onDocumentDelete});

        // if we are already connected, send the subscribe message. Otherwise it will be sent when we connect
        if(this.connection.isConnected())
        {
            this.connection.send<SubscribeCollectionMessage>({action:"subscribe-collection", collection:collection, requestId:this.connection.incrementedRequestId(), start: lastReceivedChange});
        }
    }

    unsubscribe(collection:string) 
    {
        this.subscriptions.delete(collection);
        // if we are already connected, send the unsubscribe message.
        if(this.connection.isConnected())
        {
            this.connection.send<UnsubscribeCollectionMessage>({action:"unsubscribe-collection", collection:collection, requestId:this.connection.incrementedRequestId()});
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
        var response = await this.connection.sendAndReceive<CreateDocument, ServerSuccessWithDocument>({action:"create-doc", collection:collection, requestId:this.connection.incrementedRequestId(), content:content});
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
        await this.connection.sendAndReceive<UpdateDocument, ServerSuccess>({action:"update-doc", collection:collection, requestId:this.connection.incrementedRequestId(), documentId:documentId, content:content, expectedChangeNumber:changeNumber});
    }

    /**
     * Delete a document.
     * @param collection The collection to delete from
     * @param documentId The document id to delete
     */
    async deleteDoc(collection:string, documentId:string) : Promise<void> 
    {
        await this.connection.sendAndReceive<DeleteDocument, ServerSuccess>({action:"delete-doc", collection:collection, requestId:this.connection.incrementedRequestId(), documentId:documentId});
    }

    public async connect(): Promise<void> {
        await this.connection.connect();
    }

    public async disconnect(): Promise<void> {
        await this.connection.disconnect();
    }

}