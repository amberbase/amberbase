import {Config} from "../config.js";
import * as mariadb from "mariadb";

export interface User{id:string, email:string, name:string};
export interface UserWithCredential{id:string, email:string, name:string, credential_hash?:string};
export interface UserWithTenantsAndRoles{id:string, email:string, name:string, tenants:{[tenant:string]:string[]}};
export interface UserWithRoles{id:string, email:string, name:string, roles:string[]};
export interface Invitation{tenant:string, roles:string[], valid_until:Date, accepted?:Date, id:string};
export interface Document{tenant:string, collection:string, id:string, change_number:number, change_user:string, change_time:Date, data:string | null, access_tags:string[]};
export interface SyncAction{tenant:string, collection:string, id:string, change_number:number, change_time:Date, access_tags:string[] | null, new_access_tags:string[] | null, deleted:boolean};

type MigrationScript = {lvl:number, sql?:string, migrate?:(conn:mariadb.PoolConnection)=>Promise<void>};
const migrationScripts:MigrationScript[] = [
    {lvl: 1, sql: 'CREATE TABLE IF NOT EXISTS users (`id` VARCHAR(36) NOT NULL, `name` VARCHAR(255), `email` VARCHAR(255), `credential_hash` VARCHAR(255), PRIMARY KEY (`email`), UNIQUE INDEX `id` (`id`))'},
    {lvl: 2, sql: 'CREATE TABLE IF NOT EXISTS roles (`user` VARCHAR(36) NOT NULL, `tenant` VARCHAR(255) NOT NULL, `roles` VARCHAR(255), PRIMARY KEY (`user`, `tenant`))'},
    {lvl: 3, sql: 'CREATE TABLE IF NOT EXISTS tenants (`id` VARCHAR(255) NOT NULL, `name` VARCHAR(255), `data` VARCHAR(10000), PRIMARY KEY (`id`))'},
    {lvl: 4, sql: 'CREATE TABLE IF NOT EXISTS invitations (`id` VARCHAR(50) NOT NULL,`tenant` VARCHAR(50) NULL DEFAULT NULL,`roles` VARCHAR(255) NULL DEFAULT NULL,`valid_until` DATETIME NULL DEFAULT NULL,`accepted` DATETIME NULL DEFAULT NULL,PRIMARY KEY (`id`))'},
    {lvl: 5, sql: "CREATE TABLE `documents` (`tenant` VARCHAR(255) NOT NULL,`collection` VARCHAR(50) NOT NULL,`id` VARCHAR(36) NOT NULL,`change_number` INT UNSIGNED NOT NULL DEFAULT '0',`change_user` VARCHAR(36) NULL,`change_time` DATETIME NOT NULL,`data` LONGTEXT NULL,`access_tags` VARCHAR(4096) NULL DEFAULT NULL,PRIMARY KEY (`id`),INDEX `tenant_collection` (`tenant`, `collection`),FULLTEXT INDEX `access_tags` (`access_tags`))"},
    {lvl: 6, sql: "CREATE TABLE `syncactions` (`tenant` VARCHAR(255) NOT NULL,`collection` VARCHAR(50) NOT NULL,`id` VARCHAR(36) NOT NULL,`change_number` INT(10) UNSIGNED NOT NULL DEFAULT '0',`change_time` DATETIME NOT NULL,`access_tags` VARCHAR(4096) NULL DEFAULT NULL,`new_access_tags` VARCHAR(4096) NULL DEFAULT NULL,`deleted` TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,INDEX `tenant_collection` (`tenant`, `collection`,  `change_number`) USING BTREE,FULLTEXT INDEX `access_tags` (`access_tags`))"},
    {lvl: 7, sql: "INSERT IGNORE INTO `tenants` (`id`, `name`, `data`) VALUES ('*', 'Global', '')"}, // this is the global tenant as it is used to assign roles to users that are not tenant specific but global and inherited into the local tenants	
];

/**
 * Checks if two arrays of strings are equal in a "set-theory sense". That means the order of the elements does not matter.
 * @param a set of strings
 * @param b set of strings
 * @returns true for equal, false otherwise
 */
function compareArraySets(a:string[], b:string[]): boolean {
    if (a.length !== b.length) return false;
    var setB = new Set(b);
    for (const item of a){
        if (!setB.has(item)){
            return false;
        }
    }
    return true;
}

/**
 * Create a string from an array of strings. The array is sorted and the elements are trimmed. If the array is undefined, an empty string is returned.
 * @param a String array to convert to string
 * @returns string created from the array as expected by this database layer. That means separated by spaces and sorted.
 */
function arraySetToString(a:string[] | undefined): string {
    if (a === undefined){
        return "";
    }
    var sorted = [...(a.map(i=>i.trim()))].sort((a,b)=> a.localeCompare(b)); // sort the array to make sure that the order is the same
    return a.join(" ");
}

// this class is a singleton! That means that it can keep some state in a cache and reuse it between requests
export class AmberRepo {
    config: Config;
    pool: mariadb.Pool;
    cache: Map<string, Promise<any>> = new Map();

    constructor(config: Config) {
        this.config = config;
    }

    /**
     * Init the database. This will create the database and the tables if they do not exist through the migration scripts.
     */
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

    /**
     * Get a system setting from the database. If the setting does not exist, it will be created with the provided function.
     * @param name The name of the setting
     * @param create The function to create the setting if it does not exist
     * @returns The value of the setting
     */
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

    async getUserById(userId:string): Promise< UserWithCredential | undefined> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{id:string, email:string, name:string}[]>("SELECT id, email, name, credential_hash FROM users WHERE id = ?", [userId]);
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

            var globalRoles = tenantRoles["*"];
            if (globalRoles){
                var allTenants = await conn.query<{id:string}[]>("SELECT id FROM tenants WHERE id != '*'");
                for (const tenant of allTenants){
                    tenantRoles[tenant.id] = [...(new Set([...(tenantRoles[tenant.id] || []), ...globalRoles]))];
                }
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
            var result = await conn.query<{name:string, tenant:string, roles:string}[]>("SELECT `name`, `id` AS `tenant`, GROUP_CONCAT( `roles` SEPARATOR ',') AS roles FROM tenants RIGHT OUTER JOIN (SELECT `user`, `roles`, `tenant` FROM roles WHERE `user` = ?) AS r ON tenants.id = r.tenant OR r.tenant = '*' GROUP BY `name`,`id`", [userId]);
            var tenantRoles =  result.map((row)=> {return {name: row.name, id :row.tenant, roles: row.roles ? [...(new Set(row.roles.split(",")))] : []};});
            return tenantRoles.filter((tenant)=> tenant.roles && tenant.roles.length > 0);
        }
        finally{
            conn.end();
        }
    }

    async getUserIdsOnlyInOneTenant(tenant:string): Promise<string[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{user:string}[]>("SELECT `user` FROM  (SELECT a.`user` AS `user`, COUNT(*) AS `tenantcount`  FROM roles as a LEFT JOIN roles as b ON a.`user` = b.`user` WHERE a.`tenant` = ? GROUP BY a.`user`) AS i WHERE i.`tenantcount` = 1;", [tenant]);
            return result.map((row)=> row.user);
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

    async getUsersForTenant(tenant:string): Promise<User[]> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{user:string, email:string, name:string}[]>("SELECT DISTINCT user, email, name FROM roles JOIN users ON roles.`user` = users.id WHERE roles.`tenant` = ? OR roles.`tenant` = '*'" , [tenant]);
            return result.map((user)=> {return {id: user.user, email: user.email, name: user.name};});
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

    /**
     * Update a user entity
     * @param user updates the user, uses the id to identify the record to update. The passwordhash needs to be correctly formed. Use the AmberAuth class to do it.
     * @returns 
     */
    async updateUser(user: UserWithCredential): Promise<boolean> {
        user.email = user.email.toLowerCase();
        var conn = await this.pool.getConnection();
        try{
            await conn.query("UPDATE users SET email = ?, name = ?, credential_hash = ? WHERE id = ?", [user.email, user.name, user.credential_hash, user.id]);
            return true;
        }
        catch(e){
            return false;
        }
        finally{
            conn.end();
        }
        
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

    async deleteUser(id:string)
    {
        var conn = await this.pool.getConnection();
        try{
            await conn.query("DELETE FROM users WHERE id = ?", [id]);
            await conn.query("DELETE FROM roles WHERE user = ?", [id]);
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

    async getLastChangeNumber(tenant:string, collection:string): Promise<number> {
        var conn = await this.pool.getConnection();
        try{
            // changes are either in the documents, or in case that a document has been deleted, in the syncactions table. We need to get the max change number from both tables and return the higher one
            var resultDocs = await conn.query<{change_number:number}[]>("SELECT MAX(change_number) AS change_number FROM documents WHERE tenant = ? AND collection = ?", [tenant, collection]);
            var resultActions = await conn.query<{change_number:number}[]>("SELECT MAX(change_number) AS change_number FROM syncactions WHERE tenant = ? AND collection = ?", [tenant, collection]);
            var res = 0;
            if (resultDocs.length > 0){
                res = resultDocs[0].change_number;
            }

            if (resultActions.length > 0){
                res = Math.max(res, resultActions[0].change_number);
            }
            return res;
        }
        finally{
            conn.end();
        }
    }

    changeNumberCache: Map<string, number> = new Map(); // cache for change numbers

    async getLastChangeNumberFromCache(tenant:string, collection:string): Promise<number> {
        var cached = this.changeNumberCache.get(`${tenant}.${collection}`);
        if (cached!== undefined){
            
            return cached;
        }
        // if the change number is not in the cache, we need to get it from the database
        var changeNumber = await this.getLastChangeNumber(tenant, collection);
        this.changeNumberCache.set(`${tenant}.${collection}`, changeNumber);
        return changeNumber;    
    }

    async incrementLastChangeNumberFromCache(tenant:string, collection:string): Promise<number> {
        var lastNumber = await this.getLastChangeNumberFromCache(tenant, collection);
        lastNumber++;
        this.changeNumberCache.set(`${tenant}.${collection}`, lastNumber);
        return lastNumber;
    }

    async getDocument(tenant:string, collection:string, id:string): Promise<Document | undefined> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{tenant:string, collection:string, id:string, change_number:number, change_user:string, change_time:Date, data:string, access_tags:string}[]>("SELECT tenant, collection, id, change_number, change_user, change_time, data, access_tags FROM documents WHERE tenant = ? AND collection = ? AND id = ?", [tenant, collection, id]);
            if (result.length === 0){
                return undefined;
            }
            return {
                tenant: result[0].tenant,
                collection: result[0].collection,
                id: result[0].id,
                change_number: result[0].change_number,
                change_user: result[0].change_user,
                change_time: result[0].change_time,
                data: result[0].data,
                access_tags: result[0].access_tags ? result[0].access_tags.split(" ") : []
            };
        }
        finally{
            conn.end();
        }
    }

    /**
     * Create a new document in the database. The document is created with a new id and a change number that is incremented from the last change number.
     * @param tenant tenant id
     * @param collection collection id
     * @param changeUser the users uuid issuing the document
     * @param data new data
     * @param accessTags new access tags
     * @returns the new document id or undefined if the document could not be created
     */
    async createDocument(tenant:string, collection:string, changeUser:string | undefined, data:string, accessTags:string[]): Promise<Document | undefined> {
        var conn = await this.pool.getConnection();
        var id = crypto.randomUUID();
        var changeTime = new Date();
        var changeNumber = await this.incrementLastChangeNumberFromCache(tenant, collection);
        try{
            await conn.query(
                "INSERT INTO documents (tenant, collection, id, change_number, change_user, change_time, data, access_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
                [tenant, collection, id, changeNumber, changeUser || null, changeTime, data, arraySetToString(accessTags)]);
            return {
                tenant: tenant,
                collection: collection,
                id: id,
                change_number: changeNumber,
                change_user: changeUser,
                change_time: changeTime,
                data: data,
                access_tags: accessTags
            };
        }
        finally{
            conn.end();
        }
    }

    /**
     * Update an existing document
     * @param tenant tenant id
     * @param collection collection id
     * @param id the id of the document to alter
     * @param changeUser the users uuid issuing the document
     * @param data the new data for the document. 
     * @param accessTags Old and new access tags. It will only be updated if it is not undefined and store a sync action accordingly as well.
     * @param oldDocument we need the old document anyway in the flow. So we use it for optimistic concurrency and to see if we need to add a sync action or not.
     * @returns The new changeNumber or 0 if no change was performed.
     */
    async updateDocument(tenant:string, collection:string, id:string, changeUser:string | undefined, data:string, accessTags:string[], oldDoc : Document): Promise<number> {
        if (data === undefined ){
            return 0; // nothing to do, and we just did that
        }

        var conn = await this.pool.getConnection();
        
        var changeTime = new Date();
        var changeNumber = await this.incrementLastChangeNumberFromCache(tenant, collection);
        
        try{
            var result = await conn.query(
                `UPDATE documents SET data = ?, access_tags = ?, change_number = ?, change_user = ?, change_time = ? WHERE tenant = ? AND collection = ? AND id = ? AND change_number = ?;`, 
                [
                    data,
                    arraySetToString(accessTags) , 
                    changeNumber, changeUser ||null, changeTime, tenant, collection, id, 
                    oldDoc.change_number, 
                ]
                );

            if (result.affectedRows === 0){
                return 0;
            }

            // if the access tags have changed, we need to add a sync action for that
            if (oldDoc.access_tags !== undefined && accessTags !== undefined && !compareArraySets(oldDoc.access_tags, accessTags)){
                await conn.query(
                    `INSERT INTO syncactions (tenant, collection, id, change_number, change_time, access_tags, new_access_tags) VALUES (?, ?, ?, ?, ?, ?, ?);`, 
                    [tenant, collection, id, changeNumber, changeTime, arraySetToString(oldDoc.access_tags), arraySetToString(accessTags)]);
            }
            return changeNumber;
        }
        finally{
            conn.end();
        }
        return 0;
    }

    /**
     * Deletes a document from the database. This is in fact a soft delete, we will otherwise have a problem with clients that "miss" the deletion by being offline and caching the data
     * @param tenant tenant id
     * @param collection collection id
     * @param id the id of the document to delete
     * @returns the change number on success, 0 otherwise
     */
    async deleteDocument(tenant:string, collection:string, id:string): Promise<number> {
        var conn = await this.pool.getConnection();
        var changeTime = new Date();
        // we need to increment the change number for the sync action, but not for the document itself. The document is deleted, so it will not be synced anymore.
        var changeNumberForSyncAction = await this.incrementLastChangeNumberFromCache(tenant, collection);

        try{
            await conn.beginTransaction();
            try{
            await conn.batch(`DELETE FROM documents WHERE tenant = ? AND collection = ? AND id = ?;`, 
                [tenant, collection, id]);	
            await conn.batch(`INSERT INTO syncactions (tenant, collection, id, change_number, change_time, deleted) VALUES (?, ?, ?, ?, ?, 1);`,
                 [tenant, collection, id, changeNumberForSyncAction, changeTime]);
            await conn.commit();
            }
             catch(err){
                await conn.rollback();
                return 0;
            }
            return changeNumberForSyncAction;
        }
        finally{
            conn.end();
        }
    }


    async getDocumentCountPerTenant(): Promise<{[tenant:string]:number}> {
        var conn = await this.pool.getConnection();
        try{
            var result = await conn.query<{tenant:string, count:BigInt}[]>("SELECT `tenant`, COUNT(*) AS count FROM documents GROUP BY `tenant`");
            var tenantCount:{[tenant:string]:number} = {};
            for (const row of result){
                tenantCount[row.tenant] = Number(row.count);
            }
            return tenantCount;
        }
        finally{
            conn.end();
        }
    }

    async getAllDocuments(tenant:string, collection:string, newerThanChangeNumber:number | undefined, withOneOfTheseAccessTags:string[] | undefined): Promise<Document[]> {
        var conn = await this.pool.getConnection();
        var accessTagFilter:string | undefined = undefined;
        if (withOneOfTheseAccessTags !== undefined){
            if (withOneOfTheseAccessTags.length === 0){
                return []; // we cannot match anything with an empty access tag list
            }
            accessTagFilter = "AND (" + withOneOfTheseAccessTags.map((tag)=> `MATCH(access_tags) AGAINST(? IN BOOLEAN MODE)`).join(" OR ") + ")";
        }
        withOneOfTheseAccessTags !== undefined ? withOneOfTheseAccessTags.map((tag)=> `+${tag}`).join(" ") : undefined;
        try{
            var result = await conn.query<{tenant:string, collection:string, id:string, change_number:number, change_user:string, change_time:Date, data:string, access_tags:string}[]>
                (`SELECT tenant, collection, id, change_number, change_user, change_time, data, access_tags FROM documents WHERE tenant = ? AND collection = ?${newerThanChangeNumber !== undefined ? " AND change_number > ?" : ""}${accessTagFilter !== undefined ? accessTagFilter : ""}`, 
                [tenant, collection, 
                    ...(newerThanChangeNumber !== undefined ? [newerThanChangeNumber] : []), 
                    ...(withOneOfTheseAccessTags !== undefined ? withOneOfTheseAccessTags : [])
                ]);
            return result.map((doc)=> {return {tenant: doc.tenant, collection: doc.collection, id: doc.id, change_number: doc.change_number, change_user: doc.change_user, change_time: doc.change_time, data: doc.data, access_tags: doc.access_tags ? doc.access_tags.split(" ") : []};});
        }
        finally{
            conn.end();
        }
    }

    /**
     * Stream the documents of a collection to the client. The documents are streamed in rows, so the client can process them as they arrive.
     * @param tenant tenant id
     * @param collection collection id
     * @param newerThanChangeNumber last change number that the client has. The server will only send documents with a higher change number.
     * @param withOneOfTheseAccessTags filter for access tags. The server will only send documents that match at least one of the access tags. If this is undefined, all documents are sent.
     * @param rowCallback callback for streaming the data. The callback is called for each row in the result set.
     * @returns A promise that is only resolved when the stream is finished. The promise will be rejected if an error occurs during streaming.
     */
    async streamAllDocuments(tenant:string, collection:string, newerThanChangeNumber:number | undefined, withOneOfTheseAccessTags:string[] | undefined, rowCallback:(doc:Document)=>void): Promise<void> {
        
        var conn = await this.pool.getConnection();
        var accessTagFilter:string | undefined = undefined;
        if (withOneOfTheseAccessTags !== undefined){
            if (withOneOfTheseAccessTags.length === 0){
                return; // we cannot match anything with an empty access tag list
            }
            withOneOfTheseAccessTags = withOneOfTheseAccessTags.map((tag)=> `"${tag}"`);
            accessTagFilter = " AND (" + withOneOfTheseAccessTags.map((tag)=> `MATCH(access_tags) AGAINST(? IN BOOLEAN MODE)`).join(" OR ") + ")";
        }
        
            var p = new Promise<void>((resolve, reject)=>{
                try{
                    var query = `SELECT tenant, collection, id, change_number, change_user, change_time, data, access_tags FROM documents WHERE tenant = ? AND collection = ?${newerThanChangeNumber !== undefined ? " AND change_number > ?" : ""}${accessTagFilter !== undefined ? accessTagFilter : ""}`;
                    var params = [tenant, collection, 
                        ...(newerThanChangeNumber !== undefined ? [newerThanChangeNumber] : []), 
                        ...(withOneOfTheseAccessTags !== undefined ? withOneOfTheseAccessTags : [])
                    ];
                    conn.queryStream(query, params)
                        .on("data", 
                            (doc:{tenant:string, collection:string, id:string, change_number:number, change_user:string, change_time:Date, data:string | null, access_tags:string})=> 
                            {
                                rowCallback({tenant: doc.tenant, collection: doc.collection, id: doc.id, change_number: doc.change_number, change_user: doc.change_user, change_time: doc.change_time, data: doc.data, access_tags: doc.access_tags ? doc.access_tags.split(" ") : []});
                            }
                        )
                        .on("end", ()=> {
                            resolve();
                        });
                }
                catch (e){
                    reject(e);
                }
                finally{
                    conn.end();
                }
            });
            await p;
    }

    /**
     * Stream the documents of a collection to the client. The documents are streamed in rows, so the client can process them as they arrive.
     * @param tenant tenant id
     * @param collection collection id
     * @param newerThanChangeNumber last change number that the client has. The server will only send documents with a higher change number.
     * @param withOneOfTheseAccessTags filter for access tags. The server will only send documents that match at least one of the access tags. If this is undefined, all documents are sent.
     * @param rowCallback callback for streaming the data. The callback is called for each row in the result set.
     * @returns A promise that is only resolved when the stream is finished. The promise will be rejected if an error occurs during streaming.
     */
    async streamAllSyncActions(tenant:string, collection:string, newerThanChangeNumber:number, withOneOfTheseAccessTags:string[] | undefined, rowCallback:(doc:SyncAction)=>void): Promise<void> {
        
        var conn = await this.pool.getConnection();
        var accessTagFilter:string | undefined = undefined;
        if (withOneOfTheseAccessTags !== undefined){
            if (withOneOfTheseAccessTags.length === 0){
                return; // we cannot match anything with an empty access tag list
            }
            withOneOfTheseAccessTags = withOneOfTheseAccessTags.map((tag)=> `"${tag}"`);
            accessTagFilter = " AND (" + withOneOfTheseAccessTags.map((tag)=> `MATCH(access_tags) AGAINST(? IN BOOLEAN MODE)`).join(" OR ") + ")";
        }
        
            var p = new Promise<void>((resolve, reject)=>{
                try{
                    conn.queryStream
                        (`SELECT tenant, collection, id, change_number, change_time, access_tags, new_access_tags, deleted FROM syncactions WHERE tenant = ? AND collection = ? AND change_number > ?${accessTagFilter !== undefined ? accessTagFilter : ""}`, 
                        [tenant, collection, newerThanChangeNumber, 
                            ...(withOneOfTheseAccessTags !== undefined ? withOneOfTheseAccessTags : [])
                        ])
                        .on("data", 
                            (doc:{tenant:string, collection:string, id:string, change_number:number, change_time:Date, access_tags:string, new_access_tags:string, deleted:boolean})=> 
                            {
                                rowCallback({tenant: doc.tenant, collection: doc.collection, id: doc.id, change_number: doc.change_number, change_time: doc.change_time, access_tags: doc.access_tags ? doc.access_tags.split(" ") : [], new_access_tags: doc.new_access_tags ? doc.new_access_tags.split(" ") : [], deleted:doc.deleted});
                            }
                        )
                        .on("end", ()=> {
                            resolve();
                        });
                }
                catch (e){
                    reject(e);
                }
                finally{
                    conn.end();
                }
            });
            await p;
    }
}