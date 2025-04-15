import {Express} from 'express'
import { Config, ConfigOptionals, defaultConfig} from './config.js';
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



/**
 * The startingpoint to initialize an amber application. It takes an express app and returns an AmberInit instance.
 * @param app the express app to wrap
 * @returns the fluent interface to configure the amber application
 */
export function amber(app:Express) : AmberInit{
    return new AmberInit(app);
}

/**
 * AmberInit is the main entry point for initializing an Amber application. 
 * It wraps an Express app and provides methods to configure the amber specific details via a fluent interface and start the application.
 */
export class AmberInit{
    wsHandler : WebsocketHandler[]=[];
    app: Express;
    config: Config = defaultConfig;
    collections: Map<string,CollectionSettings<any>> = new Map();
    channels: Map<string,ChannelSettings<any>> = new Map();
    constructor(app:Express){
        this.app = app;
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
    withCollection<T>(name:string, settings:CollectionSettings<T> ): AmberInit{

        this.collections.set(name,settings);
        return this;
    }

    withChannel<T>(name:string, settings:ChannelSettings<T>): AmberInit{
        this.channels.set(name,settings);
        return this;
    }

    /**
     * Starts the amber (and express) application on the given port. It initializes the database, sets up the authentication and starts the server.
     */
    async start(host:string, port:number) : Promise<Amber>{

        var repo = new AmberRepo(this.config);
        await repo.initDb();
        var amberAuth = await auth(this.app, this.config, repo);
        
        if (this.config.enableAdminApi)
        {
            enableAdminApi(this.app, this.config, repo, amberAuth);
        }

        if (this.config.enableStatsApi)
        {
            enableStatsApis(this.app, this.config, amberAuth);
        }
        
        var server = this.app.listen(port,host, () => {
            console.log(`This amber app is listening on port ${port}`)
          });
        

        var connectionManager = new AmberConnectionManager();
        this.wsHandler.push(connectionManager.websocketBinding());

        var collectionsService = new CollectionsService(this.config, repo, this.collections, connectionManager);
        connectionManager.registerHandler(collectionsService);

        amberStats.addStatsProvider(collectionsService);

        var channelService = new ChannelService(this.channels, connectionManager);
        connectionManager.registerHandler(channelService);
        amberStats.addStatsProvider(channelService);

        simpleWebsockets(server, this.wsHandler, this.config.path, amberAuth);

        return new Amber(this.app, this.config, server, repo, amberAuth, collectionsService, channelService);
    }
}

/**
 * The amber application as it is running. It provides apis for the backend app
 */
export class Amber{
    app: Express;
    config: Config;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    repo: AmberRepo;
    auth: AmberAuth;
    collections: AmberCollections;
    channels: AmberChannels;

    constructor(app:Express, config: Config, server: http.Server<typeof http.IncomingMessage,typeof  http.ServerResponse>, repo: AmberRepo, auth : AmberAuth, collections: AmberCollections, channels: AmberChannels)
    {
        this.app = app;
        this.config = config;
        this.server = server;
        this.repo = repo;
        this.auth = auth;
        this.collections = collections;
        this.channels = channels;
    }
}