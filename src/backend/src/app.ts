import express from 'express'
import {amber} from './amber/amber.js'
import {relativeTimeFromDates} from './timeHelper.js'
import * as path from 'path';
import {chat} from './test/chat.js'

import {fileURLToPath} from 'url';
import cookieParser from 'cookie-parser';
import { AccessAction } from './amber/collections.js';
import { UserContext } from './amber/connection.js';
import * as uberspace from './integration/uberspace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var uberspaceConfig = uberspace.loadConfig('.my.cnf');

var db_username = uberspaceConfig?.client?.user || process.env.Mariadb_user;
var db_password = uberspaceConfig?.client?.password || process.env.Mariadb_password;

const app = express();
const port = 3000;
const startTime =  new Date();
const serverInstanceId = crypto.randomUUID();

app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.get('/starttime', (req, res) => {
    res.send(`We are here since ${startTime.toISOString()}, that is ${relativeTimeFromDates(startTime)}`)
})

app.get('/test', (req, res) => {
    res.send(`What's up?`)
  });


 //This is just for the demo. Would be in some models.ts file
interface ToDoEntity {
  title: string;
  description: string;
  completed: boolean;
}

interface NoteEntity {
  title: string;
  description: string;
  owner:string;
  sharedWith:string[];
  isPublic:boolean;
}

var amberInit = amber(app)
              .withConfig({
                db_password:db_password,
                db_username:db_username,
                db_name:'amber',
              })
              .withPath('/amber')
              .addWebsocketHandler(chat('/ws-chat'))
              .addWebsocketHandler((path, protocol)=>{
                if (path === '/ws-test'){
                  if (protocol !== 'foo-protocol'){
                    return {status: 400, err: 'Invalid protocol'};
                  }
                  return (socket)=>{
                    let socketStartTime = new Date();
                      socket.onMessage((message:{req:String})=>{
                        console.log('received: %s', message.req);
                        socket.sendJson({resp: `You sent -> ${message.req}`});
                      });
        
                      var process = setInterval(()=>{
                        socket.sendJson({
                          serverInstanceId: serverInstanceId,
                          socketStartTime: socketStartTime.toISOString(),
                          serverStartTime: startTime.toISOString(),
                          socketAliveSeconds: ((new Date()).getTime()-socketStartTime.getTime())/1000
                        });
                      }, 1000);
        
                      socket.onClose(()=>{
                        var socketAliveSeconds = ((new Date()).getTime()-socketStartTime.getTime())/1000;
                        console.log('Closed after %d seconds', socketAliveSeconds);
                        clearInterval(process);
                      });
                    
                  };
                }
                return undefined;
            })
            .withCollection<ToDoEntity>("todos",
              {
                accessRights:{
                  "editor":['create',"update","delete","read"],
                  "reader":['read']
                },
                validator:(user, oldDoc:ToDoEntity, newDoc:ToDoEntity | null, action:AccessAction) => {
                  if (action == 'create' || action == 'update') 
                  {
                    if (newDoc.title.length < 3) return false;
                  }
                  return true;
                }
              }
            )
            .withCollection<NoteEntity>("notes",
              {
                accessRights:(user:UserContext, doc:NoteEntity | null, action:AccessAction) => {
                  if(action == 'create' || action == 'update' || action == 'delete'){
                    if(!user.roles.includes("editor")){
                      return false;
                    }
                    if(action == 'create'){
                     return true;
                    }
                  }

                  if (action == 'update' || action == 'delete'){
                    if(doc.owner != user.userId ){
                      return false;
                    }
                    else{
                      return true;
                    }
                  }
                  if (action == 'read'){ // the filter to only see the subset of documents is allowed to see is handled by the accessTags
                    if(user.roles.includes("editor") || user.roles.includes("reader")){
                      return true;
                    }
                    return false;
                  }
                  return false;
                },
                accessTagsFromDocument:( doc:NoteEntity) => [
                    "owner-" + doc.owner, 
                    ...doc.sharedWith.map(s=>"sharedWith-" + s),
                    ...(doc.isPublic ? ["public"] : [])
                  ],
                accessTagsFromUser:(user:UserContext) => [
                    "owner-" + user.userId,
                    "sharedWith-" + user.userId,
                    "public"
                ],
                validator:(user, oldDoc:NoteEntity, newDoc:NoteEntity | null, action:AccessAction) => {
                  if (action == 'create' || action == 'update') 
                  {
                    if (newDoc.title.length < 3) return false;
                    if(!newDoc.owner) return false;
                    if(!newDoc.sharedWith) return false;
                  }
                  return true;
                }
              }
            );
var amberApp = await amberInit.start("0.0.0.0",port);
amberApp.auth.addUserIfNotExists('admin',"Christians Admin Account","password", "*",["admin"]);