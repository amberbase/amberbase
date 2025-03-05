import {Express} from 'express'
import { Config, ConfigOptionals, defaultConfig} from './config.js';
import { WebsocketHandler } from './websocket/websocket.js';
import * as http from 'http'
import {simpleWebsockets} from './websocket/websocket.js'
import { AmberRepo } from './db/repo.js';
import { AmberAuth, auth } from './auth.js';
import { enableAdminApi } from './admin.js';
export function amber(app:Express) : AmberInit{
    return new AmberInit(app);
}

export class AmberInit{
    wsHandler : WebsocketHandler[]=[];
    app: Express;
    config: Config = defaultConfig;
    
    constructor(app:Express){
        this.app = app;
    }
    
    withConfig(config:ConfigOptionals) : AmberInit{
        this.config = {...this.config, ...config};;
        return this;
    }

    withPath(path:string) : AmberInit{
        this.config.path = path;
        return this;
    }


    addWebsocketHandler(handler: WebsocketHandler) : AmberInit{
        this.wsHandler.push(handler);
        return this;
    }

    async start(port:number) : Promise<Amber>{

        var repo = new AmberRepo(this.config);
        await repo.initDb();
        var amberAuth = await auth(this.app, this.config, repo);
        
        if (this.config.enableAdminApi)
        {
            enableAdminApi(this.app, this.config, repo, amberAuth);
        }
        
        var server = this.app.listen(port, () => {
            console.log(`This amber app is listening on port ${port}`)
          });
        
        simpleWebsockets(server, this.wsHandler, this.config.path);

        return new Amber(this.app, this.config, server, repo, amberAuth);
    }
}

export class Amber{
    app: Express;
    config: Config;
    server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    repo: AmberRepo;
    auth: AmberAuth;

    constructor(app:Express, config: Config, server: http.Server<typeof http.IncomingMessage,typeof  http.ServerResponse>, repo: AmberRepo, auth : AmberAuth){
        this.app = app;
        this.config = config;
        this.server = server;
        this.repo = repo;
        this.auth = auth;
    }
}