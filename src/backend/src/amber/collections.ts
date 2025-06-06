import { AmberClientMessage, AmberCollectionClientMessage, AmberMetricName, AmberServerResponseMessage, CollectionClientWsMessage,  CreateDocument,  DeleteDocument,  ServerError, ServerSuccess, ServerSuccessWithDocument, ServerSyncDocument, SubscribeCollectionMessage, UnsubscribeCollectionMessage, UpdateDocument} from './../../../client/src/shared/dtos.js';
import { SessionToken } from "./auth.js";
import { Config } from "./config.js";
import { AmberRepo, Document } from "./db/repo.js";
import { SimpleWebsocket, WebsocketHandler } from "./websocket/websocket.js";
import { ActiveConnection, AmberConnectionManager, AmberConnectionMessageHandler, errorResponse, sendToClient, successResponse, UserContext } from "./connection.js";
import { amberStats, Stats, StatsProvider } from "./stats.js";

export const CollectionActionCreate = "create";
export const CollectionActionRead = "read";
export const CollectionActionUpdate = "update";
export const CollectionActionDelete = "delete";
export type CollectionAccessAction =  "create" | "read" | "update" | "delete";


interface DocumentContent{
    data: any;
    accessTags: string[];
}

function content(doc: Document): DocumentContent {
    return {
        data: JSON.parse(doc.data),
        accessTags: doc.access_tags
    };
}

function collectionItem(collection: string): string {
    return "collection." + collection;
}

export interface CollectionSettings<T>{

    /**
     * Either a map of roles with the actions they are allowed to perform or a function that takes the user context, the document and the action and returns true if the user is allowed to perform the action on the document.
     */
    accessRights: {[role:string]:CollectionAccessAction[]} | ((user: UserContext, document: T | null, action:CollectionAccessAction)=>boolean);
    /**
     * Filter the accessible documents for the user. This is executed server side to limit the documents to the user.
     * @param user the user to filter the collection for
     * @returns a set of tags. Only documents with one of these tags are accessible for the user.
     */
    accessTagsFromUser?: (user: UserContext)=>string[];
    accessTagsFromDocument?: (doc: T)=>string[];

    /**
     * Validate the document before creating or updating it. This is executed server to ensure integrity.
     */
    validator?: (user: UserContext, oldDocument: T | null, newDocument: T | null, action: CollectionAccessAction) => boolean;

    onDocumentChange?: (tenant:string, userId: string | null, docId:string, oldDocument: T | null, newDocument: T | null, action: CollectionAccessAction, collections : AmberCollections)=>Promise<void>;
}

export interface AmberCollection<T>{ // the API to be used by the server side app
    createDocument(tenant: string, userId:string | undefined, data: T): Promise<string | undefined>;
    deleteDocument(tenant: string, userId:string | undefined, documentId:string): Promise<boolean>;
    updateDocument(tenant: string, documentId:string, userId : string | undefined, data: T, expectedChangeNumber:number|undefined): Promise<boolean>;
    updateDocumentWithCallback(tenant: string,  documentId:string, userId : string | undefined, change : (oldDoc:T)=>T | null): Promise<boolean>;
    allDocuments(tenant: string, callback?:(id:string, data:T)=>Promise<void>): Promise<void>;
}

export interface AmberCollections{
    getCollection<T>(collection: string): AmberCollection<T> | undefined;
}

export class CollectionsService implements AmberConnectionMessageHandler, AmberCollections, StatsProvider{
    config: Config;
    repo: AmberRepo;
    collectionSettings: Map<string, CollectionSettings<any>>;
    connectionManager: AmberConnectionManager;
    
    constructor(config: Config, repo: AmberRepo, collections: Map<string, CollectionSettings<any>>, connectionManager: AmberConnectionManager) {
        this.config = config;
        this.repo = repo;
        this.collectionSettings = collections;
        this.connectionManager = connectionManager;
    }

    getCollection<T>(collection: string): AmberCollection<T> | undefined {
        let collectionSettings = this.collectionSettings.get(collection);
        if (!collectionSettings) {
            return undefined; // collection not found
        }
        return {
            createDocument: (tenant: string, userId:string | undefined, data: T) => this.createDocument(tenant, collection, userId, data),
            deleteDocument: (tenant: string, userId : string | undefined , documentId:string) => this.deleteDocument(tenant, collection, userId, documentId),
            updateDocument: (tenant: string, documentId:string, userId : string | undefined, data: T, expectedChangeNumber:number|undefined) => this.updateDocument(tenant, collection, documentId, userId, data, expectedChangeNumber),
            updateDocumentWithCallback: (tenant: string, documentId:string, userId : string | undefined, change : (oldDoc:T)=>T | null) => this.updateDocumentWithCallback(tenant, collection, documentId, userId, change),
            allDocuments: (tenant: string, callback?:(id:string, data:T)=>Promise<void>) => this.allDocuments(tenant, collection, callback)
        };
    }

    async updateDocumentWithCallback(tenant: string, collection: string, documentId: string, userId: string | undefined, change: (oldDoc: any) => any | null): Promise<boolean> {
        let collectionSettings = this.collectionSettings.get(collection);
        if (!collectionSettings)
        {
            return false; // collection not found
        }

        let oldDocument = await this.repo.getDocument(tenant, collection, documentId);
        if (!oldDocument) {
            return false; // document not found
        }

        let newData = change(JSON.parse(oldDocument.data));
        if (newData === null) {
            return true; // no change
        }
        
        return await this.updateDocumentWithOld(tenant, collection, documentId, userId, newData, oldDocument);
    }

    allDocuments(tenant: string, collection: string, callback?: (id: string, data: any) => Promise<void>): Promise<void> {
        let collectionSettings = this.collectionSettings.get(collection);
        if (!collectionSettings)
        {
            return Promise.reject(new Error(`Collection ${collection} not found`));
        }

        return this.repo.streamAllDocuments(tenant, collection, 0, undefined, async (document) => {
            if (callback) {
                await callback(document.id, JSON.parse(document.data));
            }
        });
    }

    async stats(): Promise<Stats>
    {
        var collectionSubscriptionsPerTenant = this.connectionManager.countActiveConnectionsGroupedByTenant( (items)=>items.filter((item) => item.startsWith("collection.")).length);
        var docsPerTenant = await this.repo.getDocumentCountPerTenant();
        return {
            'col-sub': collectionSubscriptionsPerTenant,
            'col-docs': docsPerTenant,
        };
    }

    async handleMessage(connection: ActiveConnection, message: AmberClientMessage): Promise<AmberServerResponseMessage | undefined> {
        var collectionMessage = message as AmberCollectionClientMessage;
        if (!collectionMessage.collection)
        {
            return; // not a collection message
        }

        let collectionSettings = this.collectionSettings.get(collectionMessage.collection);
        if (!collectionSettings)
        {
            return errorResponse(message, `Collection ${collectionMessage.collection} not found`);
        }

        if(message.action === "subscribe-collection")
        {
            return await this.handleSubscribe(connection, message as SubscribeCollectionMessage, collectionSettings);
        }

        if(message.action === "unsubscribe-collection")
        {
            return await this.handleUnsubscribe(connection, message as UnsubscribeCollectionMessage, collectionSettings);
        }
        if(message.action === "create-doc")
        {
            return await this.handleCreate(connection, message as CreateDocument, collectionSettings);
        }
        if(message.action === "delete-doc")
        {
            return await this.handleDelete(connection, message as DeleteDocument, collectionSettings);
        }
        if(message.action === "update-doc")
        {
            return await this.handleUpdate(connection, message as UpdateDocument, collectionSettings);
        }
    }
    

    private checkAccessRight(user: UserContext, collectionSettings: CollectionSettings<any>, action: CollectionAccessAction, doc: any | null): boolean {
        if (collectionSettings.accessRights && typeof collectionSettings.accessRights === 'object')
        {
            let hasAccess = false;
            for (const role of user.roles) {
                if (collectionSettings.accessRights[role] && collectionSettings.accessRights[role].includes(action)) {
                    hasAccess = true;
                    break;
                }
            }
            return hasAccess;
        }
        else if (typeof collectionSettings.accessRights === 'function') {
            return collectionSettings.accessRights(user, doc, action);
        }
        return false;
    }

    private async handleSubscribe(connection:ActiveConnection, message:SubscribeCollectionMessage, collectionSettings:CollectionSettings<any>): Promise<AmberServerResponseMessage> {
        // check if the user has read access to the collection
        if (connection.items.has(collectionItem(message.collection)))
        {
            return errorResponse(message, `Already subscribed to the collection ${message.collection}`);
        }

        if(!this.checkAccessRight(connection, collectionSettings, CollectionActionRead, null))
        {
            return errorResponse(message, `You don't have read access to the collection ${message.collection}`);
        }

        var accessTags = collectionSettings.accessTagsFromUser ? collectionSettings.accessTagsFromUser({userId: connection.userId, roles: connection.roles}) : undefined;
        connection.items.set(collectionItem(message.collection), message.start);
        let documentIdsSend = new Set<string>();
        await this.repo.streamAllDocuments(connection.tenant, message.collection, message.start, accessTags, async (document) => {

            let changeNumber = document.change_number;
            let changeUser = document.change_user;
            let changeTime = document.change_time;
            let data = document.data;
            let accessTags = document.access_tags;
            
            if (data != null)
            {            
                documentIdsSend.add(document.id);
                sendToClient<ServerSyncDocument>(connection,{
                collection: message.collection,
                type: "sync-document",
                document: {
                    id: document.id,
                    change_number: changeNumber,
                    change_user: changeUser,
                    change_time: changeTime,
                    data: JSON.parse(data)
                }
            });
            }
        });

        if (message.start > 0)
        {
            // send the last removed documents
            this.repo.streamAllSyncActions(connection.tenant, message.collection, message.start,accessTags,  (syncAction) => {
                if(!syncAction.deleted)
                {
                    var stillHasAccess = documentIdsSend.has(syncAction.id); // it was sent just now, so the access is still there
                    if (!stillHasAccess) {
                        // the user HAD access but does not have anymore. So we need to send a remove message
                        sendToClient<ServerSyncDocument>(connection, {
                            collection: message.collection,
                            type: "sync-document",
                            document: {
                                id: syncAction.id,
                                change_number: syncAction.change_number,
                                removed:true,
                            }
                        });
                    }
                }
                else if (syncAction.deleted)
                {
                    sendToClient<ServerSyncDocument>(connection, {
                        collection: message.collection,
                        type: "sync-document",
                        document: {
                            id: syncAction.id,
                            change_number: syncAction.change_number,
                            removed:true,
                        }
                    }); 
                }

            });
        }

        return successResponse(message);
    }

    private async handleUnsubscribe(connection:ActiveConnection, message:UnsubscribeCollectionMessage, collectionSettings:CollectionSettings<any>): Promise<AmberServerResponseMessage> {
        if (!connection.items.has(collectionItem(message.collection)))
        {
            return errorResponse(message, `Not subscribed to the collection ${message.collection}`);
        }
        connection.items.delete(collectionItem(message.collection));
        return successResponse(message);
    }

    private async handleCreate(connection:ActiveConnection, message:CreateDocument, collectionSettings:CollectionSettings<any>): Promise<AmberServerResponseMessage> {
        if (!this.checkAccessRight(connection, collectionSettings, CollectionActionCreate, null))
        {
            return errorResponse(message, `You don't have create access to the collection ${message.collection}`);
        }

        if (collectionSettings.validator)
        {
            if(!collectionSettings.validator(connection, null,  message.content, CollectionActionCreate))
            {
                return errorResponse(message, `Document creation validation failed for the collection ${message.collection}`);
            }
        }

        var documentId = await this.createDocument(connection.tenant, message.collection, connection.userId, message.content);
        
        if (documentId) {
            var successMessage : ServerSuccessWithDocument =  {
                type : "success-document",
                responseTo: message.requestId,
                documentId: documentId
            };
            return successMessage;
        } else {
            return errorResponse(message, `Failed to create document in collection ${message.collection}`);
        }
    }

    async createDocument( tenant: string, collection:string, userId:string, data: any): Promise<string | undefined> {
        let collectionSettings = this.collectionSettings.get(collection);
        if (!collectionSettings)
        {
            return undefined; // collection not found
        }

        var accessTags = collectionSettings.accessTagsFromDocument ? collectionSettings.accessTagsFromDocument(data) : [];

        let document = await this.repo.createDocument(tenant, collection,userId, JSON.stringify(data), accessTags);
        amberStats.trackMetric("col-crt", 1, tenant);
        if (document)
        {
            for (const connection of this.connectionManager.activeConnectionsForTenant(tenant)) {
                if (connection.items.has(collectionItem( collection))) {
                    // we need to check if the collection is filtered by access tags
                    let accessTagsForUser = collectionSettings.accessTagsFromUser ? collectionSettings.accessTagsFromUser({userId: connection.userId, roles: connection.roles}) : undefined;

                    if (accessTagsForUser)
                    {
                        // we must have at least one tag in common with the document
                        let hasAccess = false;
                        for (const tag of accessTags) {
                            if (accessTagsForUser.includes(tag)) {
                                hasAccess = true;
                                break;
                            }
                        }
                        if (!hasAccess) {
                            continue; // skip this connection
                        }
                    }

                    sendToClient<ServerSyncDocument>(connection, {
                        collection: collection,
                        type: "sync-document",
                        document: {
                            id: document.id,
                            change_number: document.change_number,
                            change_user: document.change_user,
                            change_time: document.change_time,
                            data: data
                        }
                    });
                }
            }
            if (collectionSettings.onDocumentChange)
            {
                try{
                await collectionSettings.onDocumentChange(tenant, userId, document.id, null, data, CollectionActionCreate, this);
                }
                catch (e) {
                    console.error(`Error in onDocumentChange for collection ${collection}:`, e);
                }
            }
            return document.id;
        }
        else
        {
            return undefined;
        }
    }

    async handleDelete(connection:ActiveConnection, message:DeleteDocument, collectionSettings:CollectionSettings<any>): Promise<AmberServerResponseMessage> {

        let oldDocument = await this.repo.getDocument(connection.tenant, message.collection, message.documentId);

        if (!oldDocument) {
            return errorResponse(message, `Document not found in collection ${message.collection}`);
        }

        if (!this.checkAccessRight(connection, collectionSettings, CollectionActionDelete, JSON.parse(oldDocument.data)))
        {
            return errorResponse(message, `You don't have delete access to the collection ${message.collection}`);
        }

        if (collectionSettings.validator)
        {
            if(!collectionSettings.validator(connection, oldDocument.data, null, CollectionActionDelete))
            {
                return errorResponse(message, `Document deletion validation failed for the collection ${message.collection}`);
            }
        }

        var success = await this.deleteDocument(connection.tenant, message.collection, connection.userId, message.documentId);

        if (success) {

            return successResponse(message);
        } else {
            return errorResponse(message, `Failed to delete document in collection ${message.collection}`);
        }
    }

    async deleteDocument( tenant: string, collection:string, userId:string, documentId:string): Promise<boolean> {
        
        let collectionSettings = this.collectionSettings.get(collection);
        if (!collectionSettings)
        {
            return false; // collection not found
        }

        // if there is a on change handler, we need to get the document first
        let oldDocument = await this.repo.getDocument(tenant, collection, documentId);

        let changeNumber = await this.repo.deleteDocument(tenant, collection, documentId);

        amberStats.trackMetric("col-del", 1, tenant);

        if (changeNumber) {
            for (const connection of this.connectionManager.activeConnectionsForTenant(tenant)) {
                if (connection.items.has(collectionItem(collection)) ) {
                    // we might send a delete message to a client that does not have access to the document via the access tags. We accept this for now.
                    sendToClient<ServerSyncDocument>(connection, {
                        collection: collection,
                        type: "sync-document",
                        document: {
                            id: documentId,
                            change_number: changeNumber,
                            removed:true,
                        }
                    });
                }
            }
        }

        if (collectionSettings.onDocumentChange && oldDocument)
        {
            try{
                await collectionSettings.onDocumentChange(tenant, userId, documentId , JSON.parse(oldDocument.data), null, CollectionActionDelete, this);
            }
            catch (e) {
                console.error(`Error in onDocumentChange for collection ${collection}:`, e);
            }
        }

        return changeNumber > 0;
    }

    private async handleUpdate(connection:ActiveConnection, message:UpdateDocument, collectionSettings:CollectionSettings<any>): Promise<AmberServerResponseMessage> {
        var oldDocument = await this.repo.getDocument(connection.tenant, message.collection, message.documentId);

        if (!oldDocument) {
            return errorResponse(message, `Document not found in collection ${message.collection}`);
        }

        // check if the document is already updated by another client
        if (message.expectedChangeNumber !== oldDocument.change_number) {
            return errorResponse(message, `Document change number mismatch in collection ${message.collection}. Concurrent update?`);
        }

        if (!this.checkAccessRight(connection, collectionSettings, CollectionActionUpdate, JSON.parse(oldDocument.data)))
        {
            return errorResponse(message, `You don't have update access to the collection ${message.collection}`);
        }

        if (collectionSettings.validator)
        {
            if(!collectionSettings.validator(connection, oldDocument.data, message.content, CollectionActionUpdate))
            {
                return errorResponse(message, `Document update validation failed for the collection ${message.collection}`);
            }
        }

        var success = await this.updateDocumentWithOld(connection.tenant, message.collection, message.documentId, connection.userId, message.content, oldDocument);
        if (success) {
            return successResponse(message);
        } else {
            return errorResponse(message, `Failed to update document in collection ${message.collection}`);
        }
    }


    public async updateDocument( tenant: string, collection:string, documentId:string, userId : string | undefined, data: any, expectedChangeNumber:number | undefined): Promise<boolean> 
    {
        var oldDocument = await this.repo.getDocument(tenant, collection, documentId);
        if (!oldDocument) {
            return false; // document not found
        }
        if (expectedChangeNumber !== undefined && expectedChangeNumber !== oldDocument.change_number) {
            return false; // change number mismatch
        }
        return await this.updateDocumentWithOld(tenant, collection, documentId, userId, data, oldDocument);    
    }
    /**
     * We need to know the old one to properly update
     * @param tenant 
     * @param collection 
     * @param documentId 
     * @param userId 
     * @param data 
     * @param accessTags 
     * @param expectedChangeNumber 
     * @returns 
     */
    private async updateDocumentWithOld( tenant: string, collection:string, documentId:string, userId : string | undefined, data: any| undefined, oldDoc :Document): Promise<boolean> {

        let collectionSettings = this.collectionSettings.get(collection);
        if (!collectionSettings)
        {
            return false; // collection not found
        }

        let accessTags = collectionSettings.accessTagsFromDocument ? collectionSettings.accessTagsFromDocument(data) : [];
        let oldAccessTags = oldDoc.access_tags;
        let changeNumber = await this.repo.updateDocument(tenant, collection, documentId,userId, data != undefined ? JSON.stringify(data) : undefined, accessTags, oldDoc);
        
        amberStats.trackMetric("col-upd", 1, tenant);

        if (changeNumber) {
            for (const connection of this.connectionManager.activeConnectionsForTenant(tenant)) {
                if (connection.items.has(collectionItem(collection))) {
                    
                     // we need to check if the collection is filtered by access tags
                     let userAccessTags = collectionSettings.accessTagsFromUser ? collectionSettings.accessTagsFromUser({userId: connection.userId, roles: connection.roles}) : undefined;

                     if (userAccessTags)
                     {
                         // we must have at least one tag in common with the new document to send an update
                         let hasAccess = false;
                         for (const tag of userAccessTags) {
                             if (accessTags.includes(tag)) {
                                 hasAccess = true;
                                 break;
                             }
                         }
                         if (!hasAccess) {
                             // let's see if the user had access to the old document
                            let hasAccessOld = false;
                            for (const tag of userAccessTags) {
                                if (oldAccessTags.includes(tag)) {
                                    hasAccessOld = true;
                                    break;
                                }
                            }
                            if (hasAccessOld) {
                                // send a delete message for the old document since it is not accessible anymore
                                sendToClient<ServerSyncDocument>(connection, {
                                    collection: collection,
                                    type: "sync-document",
                                    document: {
                                        id: documentId,
                                        change_number: changeNumber,
                                        removed:true,
                                    }
                                });
                            }
                            continue; // skip this connection
                         }
                     }
                    sendToClient<ServerSyncDocument>(connection, {
                        collection: collection,
                        type: "sync-document",
                        document: {
                            id: documentId,
                            change_number: changeNumber,
                            change_user: userId,
                            change_time: new Date(),
                            data: data
                        }
                    });
                }
            }
        }

        if (collectionSettings.onDocumentChange)
        {
            try{
                await collectionSettings.onDocumentChange(tenant, userId, documentId, JSON.parse(oldDoc.data), data, CollectionActionUpdate, this);
            }
            catch (e) {
                console.error(`Error in onDocumentChange for collection ${collection}:`, e);
            }
        }
        return changeNumber > 0;
    }

}