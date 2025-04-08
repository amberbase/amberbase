export function nu<T>(arg: T): T { return arg;}
export function error(reason: string): ActionResult { return {success:false, error:reason};}

export interface LoginRequest{
    email:string;
    password:string;
    stayLoggedIn:boolean;
}

export interface RegisterRequest{
    username:string;
    email:string;
    password:string;
    invitation?:string;
}

export interface ActionResult{
    success:boolean;
    error?:string;
}

export interface AcceptInvitationRequest{
    invitation:string;
}

export interface SessionToken{
    expires: number; // Unix timestamp
    token:string; // base64 encoded
    roles: string[];
}

export interface UserDetails{
    id:string, 
    email:string, 
    name:string, 
    tenants:{
        [tenant:string]:string[]
    }
}

export interface TenantWithRoles{
    id:string;
    name:string;
    roles:string[];
}

export interface UserWithRoles{
    id:string;
    email:string;
    name:string;
    roles:string[];
}

export interface UserInfo{
    id:string;
    email:string;
    name:string;
}

export interface CreateInvitationRequest{
    roles:string[];
    expiresInDays:number;
}

export interface Tenant{
    id:string;
    name:string;
}

export interface CreateTenantRequest{
    id:string;
    name:string;
    data:string;
}

export interface TenantDetails{
    name:string;
    data:string;
}

export interface InvitationDetails{
    tenantId:string;
    tenantName:string;
    isStillValid:boolean;
    roles:string[];
    expires:number;
}

// collections websocket messages

export const AmberSessionProtocolPrefix="ambersession.";

export type AmberServerWsMessage = ServerError | ServerSuccess | ServerSyncDocument | ServerChannelMessage | ServerSuccessWithDocument;
export type AmberClientWsMessage = CollectionClientWsMessage;
export type CollectionClientWsMessage = SubscribeCollectionMessage | UnsubscribeCollectionMessage | DeleteDocument | CreateDocument | UpdateDocument;
export type ChannelClientWsMessage = SubscribeChannelMessage | UnsubscribeChannelMessage;

export interface AmberServerMessage{
    type:"error" | "success" | "sync-document" | "success-document" | "sync-delete-document" | "channel-message";
}

export interface AmberServerResponseMessage extends AmberServerMessage{
    responseTo:number; // requestId of the client message if this is a response
}

export interface ServerError extends AmberServerResponseMessage{
    type:"error";
    error:string; // error message
}

export interface ServerSuccess extends AmberServerResponseMessage{
    type:"success";
}

export interface ServerSuccessWithDocument extends AmberServerResponseMessage{
    type:"success-document";
    documentId:string;
}

export interface CollectionDocument<T = any>{
    id:string, 
    change_number:number, 
    change_user:string,
    change_time:Date, 
    data:T, 
    access_tags:string[]
}

export interface DeletedCollectionDocument{
    id:string, 
    removed:true,
    change_number:number
}

export interface ServerSyncDocument extends AmberServerMessage{
    type:"sync-document";
    collection:string;
    document:CollectionDocument | DeletedCollectionDocument;
}

export interface ServerChannelMessage extends AmberServerMessage{
    type:"channel-message";
    channel:string;
    messageType:string;
    message:any;
}

export interface AmberClientMessage
{
    action:"subscribe-collection" | "unsubscribe-collection" | "delete-doc" | "create-doc" | "update-doc" | "update-doc-access-tags" | "subscribe-channel" | "unsubscribe-channel" | "send-to-channel";
    requestId:number;
}

export interface AmberCollectionClientMessage extends AmberClientMessage{
    collection:string;
}

export interface SubscribeCollectionMessage extends AmberCollectionClientMessage{
    action:"subscribe-collection";
    /**
     * Highest change number of the document that is already in the client. The server will only send documents with a higher change numbers.
     */
    start:number;
}

export interface UnsubscribeCollectionMessage extends AmberCollectionClientMessage{
    action:"unsubscribe-collection";
}

export interface DeleteDocument extends AmberCollectionClientMessage{
    action:"delete-doc";
    /**
     * Document to delete
     */
    documentId:string;
}

export interface CreateDocument extends AmberCollectionClientMessage{
    action:"create-doc";
    /**
     * Document content
     */
    content:any;
    
}

export interface UpdateDocument extends AmberCollectionClientMessage{
    action:"update-doc";
    /**
     * Document to change
     */
    documentId:string;
    content:any;
    expectedChangeNumber:number;
}

export interface SubscribeChannelMessage extends AmberClientMessage{
    action:"subscribe-channel";
    channel:string;
}

export interface UnsubscribeChannelMessage extends AmberClientMessage{
    action:"unsubscribe-channel";
    channel:string;
}

export interface SendToChannelMessage extends AmberClientMessage{
    action:"send-to-channel";
    channel:string;
    messageType:string;
    message:any;
}




