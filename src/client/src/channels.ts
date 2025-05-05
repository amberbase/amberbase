import { AmberConnectionsClient, ConnectionHandler } from "./connection.js";
import { AmberSessionProtocolPrefix, CollectionClientWsMessage, CollectionDocument, AmberServerMessage, SubscribeCollectionMessage, AmberServerResponseMessage, AmberCollectionClientMessage, ServerError, ServerSyncDocument, DeletedCollectionDocument, UnsubscribeCollectionMessage, ServerSuccessWithDocument, CreateDocument, UpdateDocument, ServerSuccess, DeleteDocument, joinChannelName, SubscribeChannelMessage, ServerChannelMessage, UnsubscribeChannelMessage, SendToChannelMessage } from "./shared/dtos.js";

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
     * Get the interface to work with a given collection
     * @param collection 
     */
    getChannel<T>(channel:string, subchannel?:string | undefined): AmberChannel<T>;
}


export interface AmberChannel<T>{
    
    /**
     * Subscribe to a channel. This will start receiving messages for the channel.
     * @param onMessage Callback for when a message is received
     */
    subscribe(onMessage:(doc:T) => void): void;

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



export class AmberChannelssClient implements ConnectionHandler, AmberChannels{
    
    subscriptions: Map<string,{
        onMessage:(message:any) => void,
    }> = new Map();
    connection: AmberConnectionsClient;

    
    constructor(connection:AmberConnectionsClient){
        this.connection = connection;
        connection.registerConnectionHandler(this);
    }

    getChannel<T>(channel: string, subchannel:string|undefined): AmberChannel<T> {
        const channelName = joinChannelName(channel, subchannel);
        return { 
            subscribe: (onMessage:(message:T) => void) => {
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
            const subscription = this.subscriptions.get(syncMessage.channel);
            if (subscription) {
              subscription.onMessage(syncMessage.message);
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


    subscribe<T>(channelName:string, onMessage:(message:T) => void) 
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

}