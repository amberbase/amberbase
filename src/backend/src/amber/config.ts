import * as fs from 'fs';
import {UiConfig} from './../../../ui/src/config.js';
export interface Config {
    db_name: string,
    db_type: string,
    db_host: string,
    db_port: number,
    db_username: string,
    db_password: string,
    path: string,
    enableAdminApi?: boolean,
    enableStatsApi?: boolean,
    inviteOnly?: boolean,
    ui?: UiConfig
};

export interface ConfigOptionals {
    db_name?: string,
    db_type?: string,
    db_host?: string,
    db_port?: number,
    db_username?: string,
    db_password?: string,
};

export var defaultConfig = {
    db_name: "amber",
    db_type: "mariadb",
    db_host: "localhost",
    db_port: 3306,
    db_username: "root",
    db_password: "root",
    path: "/api/amber",
    enableAdminApi: true,
    enableStatsApi: true,
    inviteOnly: true
};

export function loadConfig(path?:string): Config {
    var config = structuredClone(defaultConfig);
    if (path && fs.existsSync(path)){
        var jsonString = fs.readFileSync(path, 'utf8');
        var fileConfig = JSON.parse(jsonString);
        config = {...config, ...fileConfig};
    }
    if (process.env.Mariadb_host)
        config.db_host = process.env.Mariadb_host;
    if (process.env.Mariadb_port)
        config.db_port = parseInt(process.env.Mariadb_port);
    return config;
}