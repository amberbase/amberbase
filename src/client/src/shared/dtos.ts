export function nu<T>(arg: T): T { return arg;}
export function error(reason: string): ActionResult { return {success:false, error:reason};}

/**
 * Login request for the /login endpoint
 */
export interface LoginRequest{
    /**
     * We use the email as user identity
     */
    email:string;
    /**
     * Password for login
     */
    password:string;

    /**
     * Should the lifetime of the token extend accross the browser session?
     */
    stayLoggedIn:boolean; 
}

/**
 * Request to register a new user. Registration is outside of the tenant scope
 */
export interface RegisterRequest{
    
    /**
     * User name for the new user
     */
    username:string;

    /**
     * We use the email as user identity. Will be used in lower case form
     */
    email:string;

    /**
     * Password for login
     */
    password:string;

    /**
     * Optional invitation code. If not set, the user will be created outside a tenant.
     */
    invitation?:string;
}

/**
 * Common result to indicate success or failure of an operation
 */
export interface ActionResult{
    success:boolean;
    error?:string;
}

/**
 * Request to accept an invitation. 
 */ 
export interface AcceptInvitationRequest{
    /**
     * Invitation code to accept
     */
    invitation:string;
}

/**
 * Session token response
 */
export interface SessionToken{
    /**
     * Unix timestamp
     */
    expires: number; 

    /**
     * Session token. This is a base64 encoded string containing the user id and the tenant id. It is meant to be used in the HTTP header "AmberSession" or the websocket handshake.
     */
    token:string; // base64 encoded

    /**
     * The roles the user has access to in the tenant
     */
    roles: string[];
}

/**
 * User details
 */
export interface UserDetails{
    /**
     * User id. Often used to identify the user. E.g. in access tags
     */
    id:string, 

    /**
     * User email. This is the email used to login. It is stored in lower case.
     */
    email:string, 

    /**
     * User name (descriptive, not unique)
     */
    name:string, 

    /**
     * Tenants the user has access to and the roles the user has in the tenant
     */
    tenants:{
        [tenant:string]:string[]
    }
}

/**
 * Request change a users password. The user must provide the current password and the new one.
 */
export interface ChangeUserPasswordRequest{

    /**
     * User id. This is the user id (not the email) of the user that made the change.
     */
    userId:string;
    /**
     * Current password
     */
    currentPassword:string;
    /**
     * New password
     */
    newPassword:string;
}

/**
 * Request change a users password. The user must provide the current password and the new one.
 */
export interface ChangeUserDetailsRequest{

    userName:string;
}

/**
 * Details about a tenant from the perspective of a user. Therefore it includes the roles the user has in the tenant.
 */
export interface TenantWithRoles{
    /**
     * Tenant id
     */
    id:string;
    /**
     * Tenant name
     */
    name:string;
    /**
     * Roles the user has in the tenant
     */
    roles:string[];
}

/**
 * Details about a user from the perspective of a tenant. Therefore it includes the roles the user has in the tenant.
 */
export interface UserWithRoles{
    /**
     * User id
     */
    id:string;
    /**
     * user email address
     */
    email:string;
    /**
     * User name
     */
    name:string;
    /**
     * Roles the user has in the tenant
     */
    roles:string[];
}

/**
 * Public details about a user
 */
export interface UserInfo{
    /**
     * User id
     */
    id:string;
    /**
     * User email address
     */
    email:string;
    /**
     * User name
     */
    name:string;
}

/**
 * Request to create a new user invitation (the url path contains the tenant id)
 */
export interface CreateInvitationRequest{
    /**
     * Roles to be assigned (added) to the user when accepting the invitation. The user can have more roles than the ones specified here.
     */
    roles:string[];

    /**
     * Expiration date in days.
     */
    expiresInDays:number;
}

/**
 * Details about a tenant
 */
export interface Tenant{
    /**
     * Tenant id
     */
    id:string;
    /**
     * Tenant name
     */
    name:string;
}

/**
 * Request to create a new tenant
 */
export interface CreateTenantRequest{

    /**
     * Tenant id. Must be unique. This is the identifier used in the URL path for tenant specific calls. [a-zA-Z0-9\-]{1,50}
     */
    id:string;

    /**
     * Tenant name. This is the name shown in the UI
     */
    name:string;

    /**
     * Optional data field. This is a string that can be used to store additional information about the tenant. The content is up to the application.
     */
    data:string;
}

/**
 * Request to update a tenant. The request is only allowed if the user has the tenant admin role.
 */
export interface TenantDetails{
    /**
     * Tenant name, only for the UI
     */
    name:string;
    /**
     * Optional data field. This is a string that can be used to store additional information about the tenant. The content is up to the application.
     */
    data:string;
}

/**
 * Details about an invitation. This is the response to the /invitations/:invitation endpoint.
 */
export interface InvitationDetails{
    /**
     * The tenant id the invitation is allowing access to
     */
    tenantId:string;
    /**
     * Human readable name of the tenant
     */
    tenantName:string;
    /**
     * Indicator if the invitation is still valid. This is true if the invitation has not been accepted or expired yet.
     */
    isStillValid:boolean;

    /**
     * Roles the user will gain accepting the invitation
     */
    roles:string[];
    /**
     * Expiration as a UNIX timestamp (UTC)
     */
    expires:number;
}


/**
 * "Header" prefix to be used as a protocol in the websocket handshake. Yes that sucks but it is a best practice (weird one, but nevertheless)
 */
export const AmberSessionProtocolPrefix="ambersession.";

// Amber websocket messages
/**
 * All server messages
 */
export type AmberServerWsMessage = ServerError | ServerSuccess | ServerSyncDocument | ServerChannelMessage | ServerSuccessWithDocument;

/**
 * All client messages
 */
export type AmberClientWsMessage = CollectionClientWsMessage | ChannelClientWsMessage;

/**
 * Collection specific client messages
 */
export type CollectionClientWsMessage = SubscribeCollectionMessage | UnsubscribeCollectionMessage | DeleteDocument | CreateDocument | UpdateDocument;

/**
 * Channel specific client messages (not implemented yet)
 */
export type ChannelClientWsMessage = SubscribeChannelMessage | UnsubscribeChannelMessage | SendToChannelMessage;


export interface AmberServerMessage{
    /**
     * Identifier for server messages. We use it to discriminate between different messages.
     */
    type:"error" | "success" | "sync-document" | "success-document" | "sync-delete-document" | "channel-message";
}

/**
 * Common interface for all server messages that respond to a client message in a request-response style.
 */
export interface AmberServerResponseMessage extends AmberServerMessage{
    /**
     * Request ID of the client message this is a response to. This is used to match requests and responses.
     */
    responseTo:number; 
}

/**
 * Common error message
 */
export interface ServerError extends AmberServerResponseMessage{
    type:"error";
    /**
     * Error code. This is a short string that identifies the error type. It should be used to identify the error in the client code.
     */
    error:string;
}

/**
 * Common success message
 */
export interface ServerSuccess extends AmberServerResponseMessage{
    type:"success";
}


/**
 * Success message with a document id
 */
export interface ServerSuccessWithDocument extends AmberServerResponseMessage{
    type:"success-document";
    documentId:string;
}

/**
 * Collection document with json payload. Generic to allow easy TS static type checks
 */
export interface CollectionDocument<T = any>{
    /**
     * Document id. This is the unique identifier for the document in the collection.
     */
    id:string, 
    /**
     * Last change number. It is using a monotonic counter per collection (not document!) that indicates new versions and is used for optimistic concurrency control as a kind of eTag.
     */
    change_number:number, 

    /**
     * The user that made the last change. This is the user id (not the email) of the user that made the change.
     */
    change_user:string,

    /**
     * The time of the last change in UTC.
     */
    change_time:Date, 

    /**
     * The content of the document. This is the actual data of the document. It is a JSON object.
     */
    data:T
}

/**
 * Indicator for a removed document. This can either indicate that the user lost access to the document or that it has been deleted.
 */
export interface DeletedCollectionDocument{
    id:string, 
    removed:true,
    change_number:number
}

/**
 * Sync message for a document. This is sent when the client subscribes to a collection and the server sends all documents in the collection and further updates.
 */
export interface ServerSyncDocument extends AmberServerMessage{
    type:"sync-document";

    /**
     * The collection the document belongs to
     */
    collection:string;

    /**
     * The document. This can either be an initial / updated or a deleted document.
     */
    document:CollectionDocument | DeletedCollectionDocument;
}

/**
 * Channel message from the server to broadcast to clients
 */
export interface ServerChannelMessage extends AmberServerMessage{
    type:"channel-message";

    /**
     * The channel the message belongs to. Can be a subchannel in the form of "channel/subchannel".
     */
    channel:string;

    /**
     * The message. This is the actual data of the message. It is a JSON object.
     */
    message:any;
}

// Now the client messages...

/**
 * Common interface for all client messages. It introduces the requestId for request-response style messages
 */
export interface AmberClientMessage
{
    action:"subscribe-collection" | "unsubscribe-collection" | "delete-doc" | "create-doc" | "update-doc" | "update-doc-access-tags" | "subscribe-channel" | "unsubscribe-channel" | "send-to-channel";
    /**
     * Request ID of the client message. This is used to match requests and responses. Should be managed by the client to be kept unique per call (just do a static increment)
     */
    requestId:number;
}

/**
 * Common interface for all client originating messages that are related to a collection.
 */
export interface AmberCollectionClientMessage extends AmberClientMessage{
    collection:string;
}

/**
 * Subscribe to a collection
 */
export interface SubscribeCollectionMessage extends AmberCollectionClientMessage{
    action:"subscribe-collection";
    /**
     * Highest change number of the document that is already in the client. The server will only send documents with a higher change numbers.
     */
    start:number;
}

/**
 * Unsubscribe from a collection
 */
export interface UnsubscribeCollectionMessage extends AmberCollectionClientMessage{
    action:"unsubscribe-collection";
}

/**
 * Delete a document from a collection. The server will send a sync message to all clients that are subscribed to the collection.
 */
export interface DeleteDocument extends AmberCollectionClientMessage{
    action:"delete-doc";
    /**
     * Document to delete
     */
    documentId:string;
}

/**
 * Create a new document in a collection. The server will send a sync message to all clients that are subscribed to the collection and afterwards respond with a success message containing the document id.
 */
export interface CreateDocument extends AmberCollectionClientMessage{
    action:"create-doc";
    /**
     * Document content
     */
    content:any;
}

/**
 * Update a document in a collection. The server will send a sync message to all clients that are subscribed to the collection and afterwards respond with a success message.
 */
export interface UpdateDocument extends AmberCollectionClientMessage{
    action:"update-doc";
    /**
     * Document to change
     */
    documentId:string;

    /**
     * Document content. This is the new content of the document. It is a JSON object.
     */
    content:any;

    /**
     * The change number of the old document. This is used for optimistic concurrency control. The server will only accept the update if the change number in the database is the same as stated here.
     */
    expectedChangeNumber:number;
}

/**
 * Subscribe to a channel to receive server side push messages
 */
export interface SubscribeChannelMessage extends AmberClientMessage{
    action:"subscribe-channel";

    /**
     * The channel to subscribe to. This is a string that identifies the channel. It is up to the application to define the channels.
     */
    channel:string;
}

/**
 * Unsubscribe from a channel
 */
export interface UnsubscribeChannelMessage extends AmberClientMessage{
    action:"unsubscribe-channel";
    /**
     * The channel to unsubscribe from. This is a string that identifies the channel. It is up to the application to define the channels.
     */
    channel:string;
}

/**
 * Send a message to a channel and to all the clients
 */
export interface SendToChannelMessage extends AmberClientMessage{
    action:"send-to-channel";

    /**
     * The channel to send the message to. Can be a subchannel in the form of "channel/subchannel".
     */
    channel:string;
    /**
     * The message. This is the actual data of the message. It is a JSON object.
     */
    message:any;
}

export function splitChannelName(channel: string): { channel: string, subchannel: string | null } | null {
    if (!channel || typeof channel !== 'string') {
        return null;
    }
    var splitChannel = channel.split('/');
    
    if (splitChannel.length >= 2){
        return { channel: splitChannel[0], subchannel: splitChannel.slice(1).join('/') };
        
    }
    else {
        return { channel: splitChannel[0], subchannel: null };
    }
}

export function joinChannelName(channel: string, subchannel: string | null | undefined): string {
    if (!subchannel) {
        return channel;
    }
    return `${channel}/${subchannel}`;
}

export type AmberMetricName = "col-crt" | "col-upd" | "col-del" | "col-sub" | "col-docs" | "chan-sub" | "chan-send" | "login-token" | "login-register";

export interface MetricValue{
    min: number;
    max: number;
    sum:number;
    count:number;
}

export type Metrics = {
    [name in AmberMetricName]?: {
        min:number,
        max:number,
        sum:number,
        count:number
    }
};

export interface AmberMetricsBucket{
    bucket:string,
    metrics:Metrics;
}

