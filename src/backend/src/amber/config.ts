import * as fs from 'fs';
import {AmberUiConfig} from '../../../shared/src/ui/model.js';
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
    ui?: AmberUiConfig
};

/**
 * Optional configuration options for the Amberbase app.
 */
export interface ConfigOptions {
    /**
     * Database name, defaults to "amber"
     */
    db_name?: string,
    /**
     * Database type, defaults to "mariadb"
     */
    db_type?: string,
    /**
     * Database host, defaults to "localhost"
     */
    db_host?: string,
    /**
     * Database port, defaults to 3306
     */
    db_port?: number,
    /**
     * Database username
     */
    db_username: string,
    /**
     * Database password
     */
    db_password: string,
    /**
     * Invite only registration (no registration without an invite code), defaults to true
     */
    inviteOnly?: boolean,
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

export interface UiConfigOptions{
    /**
     * Available roles for the UI, defaults to an empty array
     */
    availableRoles?: string[],
    /**
     * Theme for the UI, defaults to "dark"
     */
    theme?: "dark" | "light",
    /**
     * Title for the UI, defaults to "Amberbase App"
     */
    title?: string,
    /**
     * URL to redirect to after login, if not set the UI will redirect to the home page. Replaces {tenant} with the selected tenant id.
     */
    loginTargetUrl?:string;
}

export var defaultUiConfig: AmberUiConfig = {
    availableRoles: [],
    theme: "dark",
    title: "Amberbase App",
}

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