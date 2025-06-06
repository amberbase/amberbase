
import { Config, ConfigOptionals, defaultConfig, defaultUiConfig} from './config.js';
import { WebsocketHandler } from './websocket/websocket.js';
import * as http from 'http'
import {simpleWebsockets} from './websocket/websocket.js'
import { AmberRepo } from './db/repo.js';
import { AmberAuth, auth } from './auth.js';
import { enableAdminApi } from './admin.js';
import { AmberCollections, CollectionSettings, CollectionsService } from './collections.js';
import { AmberConnectionManager } from './connection.js';
import { AmberChannels, ChannelService, ChannelSettings } from './channels.js';
import { amberStats, enableStatsApis } from './stats.js';
import express from 'express'
import cookieParser from 'cookie-parser';
import { enableUi } from './ui.js';
import {AmberUiConfig} from '../../../shared/src/ui/model.js';


/**
 * The startingpoint to initialize an amber application. It takes an express app and returns an AmberInit instance.
 * @param app the express app to wrap
 * @returns the fluent interface to configure the amber application
 */
export function amber() : AmberInit{

    return new AmberInit();
}

/**
 * AmberInit is the main entry point for initializing an Amber application. 
 * It wraps an Express app and provides methods to configure the amber specific details via a fluent interface and start the application.
 */
export class AmberInit{
    wsHandler : WebsocketHandler[]=[];
    config: Config = defaultConfig;
    collections: Map<string,CollectionSettings<any>> = new Map();
    channels: Map<string,ChannelSettings<any>> = new Map();
    constructor(){
    }
    
    /**
     * Sets the config for the amber application. This is a fluent interface, so it returns the AmberInit instance.
     * It merges the provided config with the default config (e.g. default db_name etc...).
     * @param config The optional configuration to set.
     * @returns The AmberInit instance for all that fluidity.
     */
    withConfig(config:ConfigOptionals) : AmberInit{
        this.config = {...this.config, ...config};;
        return this;
    }

    /**
     * Sets the path prefix for the amber application. It is used to separate the amber specific routes from the rest of the application.
     * 
     * This is a fluent interface, so it returns the AmberInit instance.
     * @param path The path prefix to set. Default is "/api/amber"
     * @returns The AmberInit instance for all that fluidity.
     */
    withPath(path:string) : AmberInit{
        this.config.path = path;
        return this;
    }

    /**
     * Adds a websocket handler for easy websocket usage. The handler is a function that takes the path and protocol as arguments and returns a 
     * function that takes a socket as an argument if the combination of path (relative to the "withPath" prefix) and protocol is acceptable.
     * 
     * This is a fluent interface, so it returns the AmberInit instance.
     * @param handler The websocket handler to set. Default is a simple echo handler.
     * @returns The AmberInit instance for all that fluidity.
     */
    addWebsocketHandler(handler: WebsocketHandler) : AmberInit{
        this.wsHandler.push(handler);
        return this;
    }

    /**
     * Adds a collection to the amber application. This is a fluent interface, so it returns the AmberInit instance.
     * @param name The name of the collection to add.
     * @param settings The settings for the collection. See CollectionSettings for more details.
     * @returns The AmberInit instance for all that fluidity.
     */
    withCollection<T>(name:string, settings?:CollectionSettings<T> ): AmberInit{

        this.collections.set(name, settings || {accessRights: (user, doc, action) => true}); // default access rights are "true" for all actions
        return this;
    }

    /**
     * Adds a channel to the amber application. This is a fluent interface, so it returns the AmberInit instance.
     * @param name The name of the channel to add.
     * @param settings The settings for the channel. See ChannelSettings for more details.
     * @returns The AmberInit instance for all that fluidity.
     */
    withChannel<T>(name:string, settings?:ChannelSettings<T>): AmberInit{
        this.channels.set(name,settings || {accessRights: (user, channel, subchannel, action) => true}); // default access rights are "true" for all actions
        return this;
    }

    /**
     * Enable the standard UI for common managment and user profile tasks.
     */
    withUi(config? : ((c:AmberUiConfig)=>void) | AmberUiConfig| undefined): AmberInit{
        var c = structuredClone(defaultUiConfig);
        if (config)
        {
            if (typeof config === "function")
            {
                config(c);
            }
            else
            {
                c = {...c, ...config};
            }
        }
        this.config.ui = c; 
        return this;    
    }
    /**
     * Initiates and adds the amber application to a given or existing express app. It initializes the database, sets up the authentication and hooks on the websocket handling of the server.
     * If a custom server is provided, it will be used, otherwise it will hook into the `listen` call of the express app. You can access the express app from the amber instance, or just launch it with Amber.listen()
     */
    async create(otherApp? : express.Express | undefined, server? : http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> ) : Promise<Amber> {
        
        var repo = new AmberRepo(this.config);
        await repo.initDb();

        var amberApp = express();
        amberApp.use(express.json({strict: false})); // allow non "strict" json parsing ( strict has a bug to not follow RFC7159 in case it is a "string")
        amberApp.use(cookieParser());
        
        var amberAuth = await auth(amberApp, this.config, repo);
        
        if (this.config.enableAdminApi)
        {
            enableAdminApi(amberApp, this.config, repo, amberAuth);
        }

        if (this.config.enableStatsApi)
        {
            enableStatsApis(amberApp, this.config, amberAuth);
        }

        if (this.config.ui)
        {
            enableUi(amberApp, this.config, repo, amberAuth);
        }

        if (!otherApp)
        {
            otherApp = express();
        }

        otherApp.use(this.config.path,amberApp);

        if(!server){
            server = http.createServer(otherApp);
            otherApp.listen = (...args:any) => {
                server.listen.apply(server, args);
                return server;
            };
        }


        var connectionManager = new AmberConnectionManager();
        this.wsHandler.push(connectionManager.websocketBinding());

        var collectionsService = new CollectionsService(this.config, repo, this.collections, connectionManager);
        connectionManager.registerHandler(collectionsService);

        amberStats.addStatsProvider(collectionsService);

        var channelService = new ChannelService(this.channels, connectionManager);
        connectionManager.registerHandler(channelService);
        amberStats.addStatsProvider(channelService);

        simpleWebsockets(server, this.wsHandler, this.config.path, amberAuth);
        
        return new Amber(otherApp, this.config, repo, amberAuth, collectionsService, channelService);
    }
}

/**
 * The amber application as it is running. It provides apis for the backend app
 */
export class Amber{
    express: express.Express;
    config: Config;
    repo: AmberRepo;
    auth: AmberAuth;
    collections: AmberCollections;
    channels: AmberChannels;

    constructor(app:express.Express, config: Config, repo: AmberRepo, auth : AmberAuth, collections: AmberCollections, channels: AmberChannels)
    {
        this.express = app;
        this.config = config;
        this.repo = repo;
        this.auth = auth;
        this.collections = collections;
        this.channels = channels;
    }


    /**
     * Bootstraps a tenant in the amber application. It will create the tenant if it does not exist, or update it if it does.
     * @param tenantId tenantId (short name) of the tenant, e.g. "mytenant"
     * @param tenantName descrtive name of the tenant, e.g. "My Tenant"
     * @param tenantData some data to store with the tenant, e.g. {description: "This is my tenant", background: "blue"}. Application specific
     */
    async addOrUpdateTenant(tenantId:string, tenantName:string, tenantData:any) : Promise<void> {
        if (!(await this.repo.createTenant(tenantId, tenantName, tenantData)))
        {
            await this.repo.updateTenant(tenantId, tenantName, tenantData);
        }
    }

    /**
     * Bootstraps a user in the amber application as the initial admin. It will create the user if it does not exist, or update its roles if it does. It will be added to the global
     * tenant "*"
     * @param email Email to be used to login
     * @param name User name as a descriptive name for the user, e.g. "John Doe"
     * @param pw An initial password for the user, please take it from a secure place
     * @param roles Roles to be added additional to "admin" which is the build in role for the admin user.
     */
    async addAdminIfNotExists(email:string, name:string, pw:string, roles:string[]) : Promise<void> {
        await this.auth.addUserIfNotExists(email, name, pw, "*", [...new Set(["admin", ...roles])]);   
    }

    /**
     * Starts the amber application. It is a wrapper around the express app's listen method.
     * @param port The port to listen on. Default is 3000.
     * @param host The host to listen on. Default is "localhost".
     * @returns The server instance.
     */
    listen(port?: number, host?: string) : http.Server<typeof http.IncomingMessage, typeof http.ServerResponse> {
        return this.express.listen(port,host);
    }
}