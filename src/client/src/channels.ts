import { AmberChannelAdminApi } from "./api.js";
import { AmberConnectionsClient, ConnectionHandler } from "./connection.js";
import { AmberSessionProtocolPrefix, CollectionClientWsMessage, CollectionDocument, AmberServerMessage, SubscribeCollectionMessage, AmberServerResponseMessage, AmberCollectionClientMessage, ServerError, ServerSyncDocument, DeletedCollectionDocument, UnsubscribeCollectionMessage, ServerSuccessWithDocument, CreateDocument, UpdateDocument, ServerSuccess, DeleteDocument, joinChannelName, SubscribeChannelMessage, ServerChannelMessage, UnsubscribeChannelMessage, SendToChannelMessage, ChannelDocumentCheckResult, ChannelInfo } from "./shared/dtos.js";

/**
 * SDK API for the amber channels
 */
export interface AmberChannels{
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
     * Get the interface to work with a given channel
     * @param channel The name of the channel
     * @param subchannel An optional subchannel (the serverside needs to enable subchannels for this to work, if it is the subchannel must be defined). An admin can subscribe to the top level channel even if subchannels are used.
     */
    getChannel<T>(channel:string, subchannel?:string | undefined): AmberChannel<T>;

    /**
     * Get the debug API for channels. Only available for admin users.
     */
    getAdminApi(): AmberChannelAdmin;
}
/**
 * Debug interface for channels. Only available for admin users.
 */
export interface AmberChannelAdmin{
    /**
     * Check a message against the channel's validation and authorization rules.
     * @param channel Channel name
     * @param message Message to check, as serialized json
     * @param subchannel subchannel name (optional)
     * @param userId user id to check the message for another user (optional)
     */
    checkMessage(channel:string, message:string,  subchannel?:string, userId?:string): Promise<ChannelDocumentCheckResult>;

    /**
     * Get the list of channels available on the server. It will only enumerate the main channels, not subchannels (since they only exist virtually if someone subscribed to them).
     */
    getChannels(): Promise<ChannelInfo[]>;
}

/**
 * Interface for a channel in the Amber SDK. This is used to send and receive messages on a channel.
 */
export interface AmberChannel<T>{
    
    /**
     * Subscribe to a channel. This will start receiving messages for the channel. 
     * If a channel has subchannels enabled, the subscription is only for the given subchannel and will throw an error if no subchannel has been selected. 
     * Tenant admins can subscribe to the top level channel even if subchannels are used.
     * If a subscription already exists for the particular channel, it will be replaced. There are never two subscriptions receiving the same message. 
     * If an admin subscribes to a top level channel AND a subchannel of the same top level, the more specific subchannel subscription will be triggered.
     * @param onMessage Callback for when a message is received and the channel name as it was received
     */
    subscribe(onMessage:(doc:T, channelName:string) => void): void;

    /**
     * Unsubscribe from the channel. This will stop receiving messages
     */
    unsubscribe(): void;

    /**
     * Send a message to the channel. This will send a message to the channel.
     * @param content The content of the message
     */
    send(content:T): Promise<void>;
}



export class AmberChannelsClient implements ConnectionHandler, AmberChannels{
    

    subscriptions: Map<string,{
        onMessage:(message:any, channelName:string) => void,
    }> = new Map();
    connection: AmberConnectionsClient;
    adminApiClient: AmberChannelAdmin;
    
    constructor(connection:AmberConnectionsClient, prefix:string, tenant:string, sessionToken: () => Promise<string>){
        this.connection = connection;
        connection.registerConnectionHandler(this);
        this.adminApiClient = new AmberChannelAdminApi(prefix, tenant, sessionToken);
    }

    getChannel<T>(channel: string, subchannel:string|undefined): AmberChannel<T> {
        const channelName = joinChannelName(channel, subchannel);
        return { 
            subscribe: (onMessage:(message:T, subchannel:string) => void) => {
                this.subscribe<T>(channelName, onMessage);
            },
            unsubscribe: () => {
                this.unsubscribe(channelName);
            },
            send: async (content:T) => {
                await this.sendMessage(channelName, content);
            }          
        };
    }

    handleConnectionChanged(connected: boolean): void {
        if(connected) {
            // send all subscriptions to the server
            this.subscriptions.forEach((subscription, channel) => {
                this.connection.send<SubscribeChannelMessage>({action:"subscribe-channel", channel:channel, requestId:this.connection.incrementedRequestId()});
            });
        }
    }

    handleMessage(message: AmberServerMessage): void {
        if (message.type === "channel-message") {
            const syncMessage = message as ServerChannelMessage;
            const toplevelChannel = syncMessage.channel.split('/')[0];

            const subscription = this.subscriptions.get(syncMessage.channel);
            if (subscription) {
                subscription.onMessage(syncMessage.message, syncMessage.channel);
                return; // the more specific subscription takes precedence
            }

            const toplevelSubscription = this.subscriptions.get(toplevelChannel);
            if(toplevelSubscription) {
                toplevelSubscription.onMessage(syncMessage.message, syncMessage.channel);

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


    subscribe<T>(channelName:string, onMessage:(message:T, channelName:string) => void) 
    {
        this.subscriptions.set(channelName, {onMessage:onMessage});

        // if we are already connected, send the subscribe message. Otherwise it will be sent when we connect
        if(this.connection.isConnected())
        {
            this.connection.send<SubscribeChannelMessage>({action:"subscribe-channel", channel:channelName, requestId:this.connection.incrementedRequestId()});
        }
    }

    unsubscribe(channelName:string) 
    {
        this.subscriptions.delete(channelName);
        // if we are already connected, send the unsubscribe message. 
        if(this.connection.isConnected())
        {
            this.connection.send<UnsubscribeChannelMessage>({action:"unsubscribe-channel", channel:channelName, requestId:this.connection.incrementedRequestId()});
        }
    }

    async sendMessage<T>(channelName:string, message:T) : Promise<void> 
    {
        var response = await this.connection.sendAndReceive<SendToChannelMessage, ServerSuccess | ServerError>({action:"send-to-channel", channel:channelName, requestId:this.connection.incrementedRequestId(), message:message});
        if(response.type === "error"){
            throw new Error(response.error);
        }
    }

    public async connect(): Promise<void> {
        await this.connection.connect();
    }

    public async disconnect(): Promise<void> {
        await this.connection.disconnect();
    }

    public getAdminApi(){
        return this.adminApiClient;
    }

}