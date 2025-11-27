import e from 'express';
import { AmberClientMessage, AmberServerResponseMessage, ChannelClientWsMessage, joinChannelName, SendToChannelMessage, ServerChannelMessage, splitChannelName, SubscribeChannelMessage, UnsubscribeChannelMessage } from './../../../client/src/shared/dtos.js';
import { tenantAdminRole } from './auth.js';
import { ActiveConnection, AmberConnectionManager, AmberConnectionMessageHandler, errorResponse, sendToClient, successResponse, UserContext } from "./connection.js";
import { amberStats, Stats, StatsProvider } from "./stats.js";

export type ChannelAccessAction =  "subscribe" | "publish";

export interface ChannelSettings<T>{
    /**
     * Set to true if the channel is more a "type" and there are subchannels with their own IDs below that. E.g. "chat" and "chat/room1", "chat/room2", etc.
     * If it is set to "false" all subscriptions in a tenant are peered to each other. Default is false.
     * @default false
     */
    subchannels?: boolean;

    /**
     * Model the access to the channel. Either as code or just a simple type and role based mapping. Default is allow all access to all roles (still requires a valid user in the tenant)
     * Tenant admin can always access all channels.
     */
    accessRights?: {[role:string]:ChannelAccessAction[]} | ((user: UserContext, channel: string, subchannel : string | null, action:ChannelAccessAction)=>boolean);

    /**
     * Validate a message before it is send to the channel. This is NOT checked for server send messages.
     * @param user The user
     * @param channel The channel name
     * @param subchannel The channel instance name (if subchannels are used)
     * @param message The message
     * @returns Boolean indicating if the message is valid (and will be delivered) or not.
     */
    validator?: (user: UserContext, channel: string, subchannel : string | null, message: T) => boolean;

    // ToDo: onMessage to implement server side processing
}

export interface AmberChannels{
    publishMessage<T>(tenant:string, channel: string, subchannel: string | null, message: T): void;
}

/**
 * @ignore
 */
export class ChannelService implements AmberConnectionMessageHandler, AmberChannels, StatsProvider{

    channels: Map<string, ChannelSettings<any>> = new Map();
    connectionManager: AmberConnectionManager;

    constructor(channels: Map<string, ChannelSettings<any>>,connectionManager: AmberConnectionManager)
    {
        this.channels = channels;
        this.connectionManager = connectionManager;
        connectionManager.registerHandler(this);
    }

    async stats(): Promise<Stats>
    {
        var channelSubscriptionsPerTenant = this.connectionManager.countActiveConnectionsGroupedByTenant( (items)=>items.filter((item) => item.startsWith("channel.")).length);
        return {
            'chan-sub': channelSubscriptionsPerTenant
        };
    }

    async handleMessage(connection: ActiveConnection, message: AmberClientMessage): Promise<AmberServerResponseMessage | undefined> {
        var channelMessage = message as ChannelClientWsMessage;
        if (channelMessage.action == 'subscribe-channel')
        {
            return await this.handleSubscribeChannel(connection, channelMessage);
        }
        if (channelMessage.action == 'unsubscribe-channel')
        {
            return await this.handleUnsubscribeChannel(connection, channelMessage);
        }

        if (channelMessage.action == 'send-to-channel')
        {
            return await this.handleSendToChannel(connection, channelMessage);
        }
    }

    async handleSubscribeChannel(connection: ActiveConnection, message: SubscribeChannelMessage): Promise<AmberServerResponseMessage> {
        var channel = message.channel;
        var channelName = splitChannelName(channel);        

        var isAdmin = connection.roles.includes(tenantAdminRole);

        if (channelName == null) {
            return errorResponse(message, 'bad-request', 'Channel name is required');
        }

        var channelSettings = this.channels.get(channelName.channel);

        if (!channelSettings) {
            return errorResponse(message, 'not-found', `Channel ${channel} not found`);
        }
        if (channelSettings.subchannels && !channelName.subchannel && !isAdmin) { // tenant admins can subscribe to the top level channel
            return errorResponse(message, 'bad-request',`Channel ${channel} requires a subchannel`);
        }

        if (!channelSettings.subchannels && channelName.subchannel) {
            return errorResponse(message, 'bad-request',`Channel ${channel} does not support subchannels`);
        }

        if(!isAdmin && !this.checkAccessRights(connection, channelSettings, channelName.channel, channelName.subchannel, 'subscribe')){ // tenant admins always have access
            return errorResponse(message, 'unauthorized', `Access denied to channel ${channel}`);
        }

        connection.items.set(`channel.${channel}`, true); // mark the connection as subscribed to the channel
        return successResponse(message);
    }

    checkAccessRights(user: UserContext, channelSettings: ChannelSettings<any>, channel: string, subchannel: string | null, action: ChannelAccessAction): boolean {
        if (channelSettings.accessRights) { 
            if (typeof channelSettings.accessRights == 'function') {
                return channelSettings.accessRights(user, channel, subchannel, action);
            } else {
                var rights = channelSettings.accessRights as {[role:string]:ChannelAccessAction[]};
                return user.roles.some(role => rights[role]?.includes(action));
            }
        }
        return true;
    }

    async handleUnsubscribeChannel(connection: ActiveConnection, message: UnsubscribeChannelMessage): Promise<AmberServerResponseMessage> {
        var channel = message.channel;
        var channelName = splitChannelName(channel);        

        if (channelName == null) {
            return errorResponse(message, 'bad-request', 'Channel name is required');
        }

        var channelSettings = this.channels.get(channelName.channel);

        if (!channelSettings) {
            return errorResponse(message, 'not-found', `Channel ${channel} not found`);
        }

        if (!channelSettings.subchannels && channelName.subchannel) {
            return errorResponse(message, 'bad-request', `Channel ${channel} does not support subchannels`);
        }

        connection.items.delete(`channel.${channel}`); // remove the subscription
        
        return successResponse(message);
    }

    async handleSendToChannel(connection: ActiveConnection, message: SendToChannelMessage): Promise<AmberServerResponseMessage> {
        var channelName = splitChannelName(message.channel);
        var isAdmin = connection.roles.includes(tenantAdminRole);

        if (channelName == null) {
            return errorResponse(message, 'bad-request', 'Channel name is required');
        }
        var channelSettings = this.channels.get(channelName.channel);
        if (!channelSettings) {
            return errorResponse(message, 'bad-request', `Channel ${message.channel} not found`);
        }
        if (channelSettings.validator) {
            if (!channelSettings.validator(connection, channelName.channel, channelName.subchannel, message.message)) {
                return errorResponse(message, 'validation-failed', `Invalid message for channel ${message.channel}`);
            }
        }

        if (!isAdmin && !this.checkAccessRights(connection, channelSettings, channelName.channel, channelName.subchannel, 'publish')) {
            return errorResponse(message, 'unauthorized', `Access denied to channel ${message.channel}`);
        }
        this.publishMessage(connection.tenant, channelName.channel, channelName.subchannel, message.message);
        return successResponse(message);
    }


    publishMessage<T>(tenant:string, channel: string, subchannel: string | null, message: T){

        var channelName = joinChannelName(channel, subchannel);
        for (const connection of this.connectionManager.activeConnectionsForTenant(tenant)) {
            if (connection.items.has(`channel.${channelName}`) || connection.items.has(`channel.${channel}`)) { // admins can subscribe to the main channel without subchannel
                sendToClient<ServerChannelMessage>(connection,{
                    type: 'channel-message',
                    channel: channel,
                    message: message
                });
            }
        }
        amberStats.trackMetric('chan-send',1, tenant);
    }

}