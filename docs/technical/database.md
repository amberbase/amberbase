## Database
Right now `Amberbase` supports MariaDB 10.6 and higher as the persistency layer. The structure of the tables, indexes and datatype should not be taken as set in stone and are not guaranteed to be compatible across versions. In fact it is planned to have multiple implementations of the persistency layer, each with optimized table (or documents, collections, files...) structures.

### General
#### Table `system`
* `name` string, key of the system setting (e.g. `"db_migration"`)
* `value` string, value of the system setting (e.g. `8`)
* `timestamp` DateTime, timestamp of the last change

### User Management

#### Table `users`
* `id` uuid, stable unique id to potential allow e-mail change
* `name` string, visible name
* `credential_hash` string, salted password hash "(salt):(SHA256)"
* `email` string, unique

#### Table `roles`

* `user` uuid, foreign key to `Users.id`
* `tenant` string, forms the primary key together with `user`
* `roles` string, comma separated list of roles given to the user in this tenant

#### Table `tenants`

* `id` string, unique short name
* `name` string, descriptive label
* `data` string, JSON object of potential properties

#### Table `invitations`
* `id` string, cryptographic secure random id
* `tenant` string, tenant id of the invitation
* `roles` string, roles to be applied to the user
* `valid_until` DateTime, UTC time 
* `accepted` DateTime, time when accepted. Null when not accepted yet

### Collections

#### Table `documents`

* `tenant` string, tenant id
* `collection` string, collection name
* `id` uuid, unique document id
* `change_number` int, change counter stamp
* `change_user` uuid, users id of the last modifying user
* `change_time` datetime, last update time
* `data` JSON, the payload
* `tags` string of commaseparated tags, Fulltext index, for efficient addressing of documents
* `access_tags` string of commaseparated tags, Fulltext index, for access management of documents

#### Table `syncactions`
> table to store pending actions that could result in a removal from a local replica
* `tenant` string, tenant id
* `collection` string, collection name
* `id` uuid, unique document id
* `change_number` int, change counter stamp
* `change_time` datetime, last update time
* `access_tags` string of commaseparated access tags that guarded access to the old version of the document
* `new_access_tags` string of commaseparated access tags that guard access to the new version of the document. 
* `deleted` boolean (tinyint 1), indicating that a document was deleted
