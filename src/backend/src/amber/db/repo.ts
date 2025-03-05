import {Config} from "../config.js";
import * as mariadb from "mariadb";

export interface User{id:string, email:string, name:string};
export interface UserWithCredential{id:string, email:string, name:string, credential_hash?:string};
export interface UserWithTenantsAndRoles{id:string, email:string, name:string, tenants:{[tenant:string]:string[]}};
export interface UserWithRoles{id:string, email:string, name:string, roles:string[]};
export interface Invitation{tenant:string, roles:string[], valid_until:Date, accepted?:Date, id:string};
const migrationScripts:{lvl:number;sql?:string, migrate?: (conn:mariadb.PoolConnection)=>Promise<void>}[] = [
    {lvl: 1, sql: 'CREATE TABLE IF NOT EXISTS users (`id` UUID NOT NULL, `name` VARCHAR(255), `email` VARCHAR(255), `credential_hash` VARCHAR(255), PRIMARY KEY (`email`), UNIQUE INDEX `id` (`id`))'},
    {lvl: 2, sql: 'CREATE TABLE IF NOT EXISTS roles (`user` UUID NOT NULL, `tenant` VARCHAR(255) NOT NULL, `roles` VARCHAR(255), PRIMARY KEY (`user`, `tenant`))'},
    {lvl: 3, sql: 'CREATE TABLE IF NOT EXISTS tenants (`id` VARCHAR(255) NOT NULL, `name` VARCHAR(255), `data` VARCHAR(10000), PRIMARY KEY (`id`))'},
    {lvl: 4, sql: 'CREATE TABLE IF NOT EXISTS invitations (`id` VARCHAR(50) NOT NULL,`tenant` VARCHAR(50) NULL DEFAULT NULL,`roles` VARCHAR(255) NULL DEFAULT NULL,`valid_until` DATETIME NULL DEFAULT NULL,`accepted` DATETIME NULL DEFAULT NULL,PRIMARY KEY (`id`))'}
];

// this class is a singleton! That means that it can keep some state in a cache and reuse it between requests
export class AmberRepo {
    config: Config;
    pool: mariadb.Pool;
    cache: Map<string, Promise<any>> = new Map();

    constructor(config: Config) {
        this.config = config;
    }

    async initDb() {
        var pool = mariadb.createPool({host: this.config.db_host, user: this.config.db_username, connectionLimit: 5, password: this.config.db_password});
        var conn = await pool.getConnection();
        try{
            // in shared hosting environments, we might not have the access rights to do that
            await conn.query(`CREATE DATABASE IF NOT EXISTS ${conn.escapeId(this.config.db_name)}`);
        }
        catch (e){
            console.log(e);
        }
        await conn.query(`USE ${conn.escapeId(this.config.db_name)}`);
        await conn.query("CREATE TABLE IF NOT EXISTS system (`value` VARCHAR(255), `name` VARCHAR(255), `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`name`))");
        var result = await conn.query<{value:string}[]>("SELECT value FROM system WHERE name = 'db_migration' LIMIT 1");
        var migrationVersion = 0;
        if (result.length === 0){
            await conn.query("INSERT INTO system (name, value) VALUES ('db_migration', '0')");
        }
        if (result.length === 1){
            migrationVersion = parseInt(result[0].value);
        }
        for (const migration of migrationScripts.filter((script)=> script.lvl > migrationVersion).sort((a,b)=> a.lvl - b.lvl)){
            if (migration.sql)
            {
                await conn.query(migration.sql);
            }
            if (migration.migrate)
            {
                await migration.migrate(conn);
            }
            await conn.query("UPDATE system SET value = ? WHERE name = 'db_migration'", [migration.lvl]);
        }
        await conn.end();   
        this.pool = mariadb.createPool({host: this.config.db_host, user: this.config.db_username, connectionLimit: 5, password: this.config.db_password, database: this.config.db_name});     
    }

    async getOrCreateSystemSetting(name:string, create:()=>string): Promise<string> {
        var cached = this.cache.get(name);
        if (cached)
            return await cached;
        var resolver: (value: string) => void;
        var rejecter: (err: any) => void;
        var promise = new Promise<string>((resolve, reject)=>{
            resolver = resolve;
            rejecter = reject;
        });
        this.cache.set(name, promise); // we want "parallel" requests to wait for our result
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{value:string}[]>("SELECT value FROM system WHERE name = ? LIMIT 1", [name]);
            if (result.length === 0){
                var value = create();
                await conn.query("INSERT INTO system (name, value) VALUES (?, ?)", [name, value]);
                resolver(value);
            }
            else{
                resolver(result[0].value);
            }
        }
        catch (e){
            this.cache.delete(name);
            rejecter(e);
        }
        finally{
            conn.end();
        }
        return await promise;
    }

    async getUserByEmail(email:string): Promise< UserWithCredential | undefined> {
        var emailLower = email.toLowerCase();
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, email:string, name:string, credential_hash:string}[]>("SELECT id, email, name, credential_hash FROM users WHERE email = ?", [emailLower]);
            if (result.length === 0){
                return undefined;
            }
            return result[0];
        }
        finally{
            conn.end();
        }
    }

    async getUserById(userId:string): Promise< User | undefined> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, email:string, name:string}[]>("SELECT id, email, name FROM users WHERE id = ?", [userId]);
            if (result.length === 0){
                return undefined;
            }
            return result[0];
        }
        finally{
            conn.end();
        }
    }

    async getUserDetails(userId:string): Promise< UserWithTenantsAndRoles | undefined> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, email:string, name:string}[]>("SELECT id, email, name FROM users WHERE id = ?", [userId]);
            if (result.length === 0){
                return undefined;
            }
            var roles = await conn.query<{tenant:string, roles:string}[]>("SELECT tenant, roles FROM roles WHERE user = ?", [userId]);
            var tenantRoles:{[tenant:string]:string[]} = {};
            
            for (const role of roles){
                tenantRoles[role.tenant] = role.roles.split(",");
            }
            return {...result[0], tenants: tenantRoles};
        }
        finally{
            conn.end();
        }
    }

    async getAllUsers(): Promise<User[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, email:string, name:string}[]>("SELECT id, email, name FROM users");
            return result;
        }
        finally{
            conn.end();
        }
    }


    async getUserRoles(userId:string, tenant:string): Promise<string[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{roles:string}[]>("SELECT roles FROM roles WHERE user = ? AND (tenant = ? OR tenant = ?)", [userId, tenant, "*"]);
            var roles:Set<string> = new Set();
            for (const row of result){
                var rowRoles = row.roles.split(",");
                for (const role of rowRoles){
                    roles.add(role);
                }
            }
            return Array.from(roles);
        }
        finally{
            conn.end();
        }
    }

    async getUserTenantsWithRoles(userId:string): Promise<{name:string, id:string, roles:string[]}[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{name:string, id:string, roles:string}[]>("SELECT `name`, `id`, `roles` FROM tenants LEFT JOIN (SELECT `roles`, `tenant` FROM roles WHERE `user` = ?) AS r ON tenants.id = r.tenant ", [userId]);
            var tenantRoles =  result.map((row)=> {return {name: row.name, id :row.id, roles: row.roles ? row.roles.split(",") : []};});
            var globalRoles = tenantRoles.find((tenant)=> tenant.id === "*");
            if (globalRoles){
                for (const tenant of tenantRoles){
                    tenant.roles = [...(new Set([...tenant.roles, ...globalRoles.roles]))];
                }
            }
            return tenantRoles.filter((tenant)=> tenant.roles && tenant.roles.length > 0);
        }
        finally{
            conn.end();
        }
    }

    async getUsersWithRoles(tenant:string): Promise<UserWithRoles[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{user:string, email:string, name:string, roles:string}[]>("SELECT user, name, email, roles FROM roles JOIN users ON roles.`user` = users.id WHERE roles.`tenant` = ?", [tenant]);
            return result.map((user)=> {return {id: user.user, email: user.email, name: user.name, roles: user.roles.split(",")};});
        }
        finally{
            conn.end();
        }
    }

    async storeUser(user: UserWithCredential): Promise<boolean> {
        user.email = user.email.toLowerCase();
        var conn = await this.pool.getConnection();
        try{
            await conn.query("INSERT INTO users (id, email, name, credential_hash) VALUES (?, ?, ?, ?)", [user.id, user.email, user.name, user.credential_hash]);
            return true;
        }
        finally{
            conn.end();
        }
        return false;
    }

    async storeUserRoles(userId:string, tenant:string, roles:string[]): Promise<void> {
        var conn = await this.pool.getConnection();
        try{
            if (roles.length != 0){
                await conn.query("INSERT INTO roles (user, tenant, roles) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE roles = ?", [userId, tenant, roles.join(","), roles.join(",")]);
            }
            else {
                await conn.query("DELETE FROM roles WHERE user = ? AND tenant = ?", [userId, tenant]);
            }
        }
        finally{
            conn.end();
        }
    }


    async getTenant(id:string): Promise<{id:string, name:string, data:string} | undefined> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, name:string, data:string}[]>("SELECT id, name, data FROM tenants WHERE id = ?", [id]);
            if (result.length === 0){
                return undefined;
            }
            return result[0];
        }
        finally{
            conn.end();
        }
    }

    async getTenants(): Promise<{id:string, name:string}[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, name:string}[]>("SELECT id, name FROM tenants");
            return result;
        }
        finally{
            conn.end();
        }
    }

    async getTenantRolesForUser(userId:string): Promise<{id:string, name:string}[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, name:string}[]>("SELECT id, name FROM tenants");
            return result;
        }
        finally{
            conn.end();
        }
    }

    async createTenant(id:string, name: string, data:string)
    {
        var validTenantId = /^[a-zA-Z0-9\-]{1,50}$/;
        if (!validTenantId.test(id)){
            throw new Error("Invalid tenant id");
        }

        var conn = await this.pool.getConnection();
        try{
            await conn.query("INSERT INTO tenants (id, name, data) VALUES (?, ?, ?)", [id, name, data]);
        }
        catch(e){
            if (e.code === "ER_DUP_ENTRY"){
                throw new Error("Tenant already exists");
            }
            throw e;
        }
        finally{
            conn.end();
        }
    }

    async updateTenant(id:string, name: string, data:string)
    {
        var conn = await this.pool.getConnection();
        try{
            await conn.query("UPDATE tenants SET name = ?, data = ? WHERE id = ?", [name, data, id]);
        }
        finally{
            conn.end();
        }
    }

    async deleteTenant(id:string)
    {
        var conn = await this.pool.getConnection();
        try{
            await conn.query("DELETE FROM tenants WHERE id = ?", [id]);
            await conn.query("DELETE FROM roles WHERE tenant = ?", [id]);
            await conn.query("DELETE FROM invitations WHERE tenant = ?", [id]);
        }
        finally{
            conn.end();
        }
    }

    async storeInvitation(tenant:string, roles:string[], validUntil:Date): Promise<string> {
        var id = crypto.randomUUID();
        var conn = await this.pool.getConnection();
        var rolesString = roles.join(",");
        try{
            await conn.query("INSERT INTO invitations (id, tenant, roles, valid_until) VALUES (?, ?, ?, ?)", [id, tenant, rolesString, validUntil]);
            return id;
        }
        finally{
            conn.end();
        }
    }

    async getInvitation(id:string): Promise< Invitation | undefined> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{tenant:string, roles:string, valid_until:Date, accepted?:Date}[]>("SELECT id, tenant, roles, valid_until, accepted FROM invitations WHERE id = ?", [id]);
            if (result.length === 0){
                return undefined;
            }
            return {
                id: id,
                tenant: result[0].tenant,
                roles: result[0].roles.split(","),
                valid_until: result[0].valid_until,
                accepted: result[0].accepted
            };
        }
        finally{
            conn.end();
        }
    }

    async acceptInvitation(id:string): Promise<void> {
        var conn = await this.pool.getConnection();
        try{
            await conn.query("UPDATE invitations SET accepted = ? WHERE id = ?", [new Date(), id]);
        }
        finally{
            conn.end();
        }
    }
}