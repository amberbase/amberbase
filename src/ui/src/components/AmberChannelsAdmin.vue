<script setup lang="ts">
import {ref, onMounted, shallowRef, watch, computed} from "vue"
import { AmberClient, type UserInfo} from "amber-client"
import { renderRelativeTime, uiHelper } from "@/common";
import JsonEdit from "./shared/JsonEdit.vue";
import RelativeTime from "./shared/RelativeTime.vue";
var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string
}>();


const users = ref<UserInfo[]>([]);
const usersLookup = ref<Map<string, UserInfo>>(new Map());
var loggedInUser = ref<UserInfo|null>(null);

const currentSelectedUser = ref<UserInfo|null>(null);
const currentUser = ()=>currentSelectedUser.value || loggedInUser.value;
const currentUserAccess = ref<string[]>([])
const showSelectUser = ref<boolean>(false);
const channelsClient = props.amberClient.getChannelsApi();
const channelsAdminApi = channelsClient.getAdminApi();
var tenantApi = props.amberClient.getAmberApi()!;

interface QualifiedChannel {
  main:string, 
  sub?: string
}

interface ChannelItem{
  name:string;
  subscriptionScope:{main:string, sub?: string};
}

interface Channel extends ChannelItem{
  subchannels:Subchannel[] | null;
  accessRightsMethod: "code" | "roles" | "none"
}

interface Subchannel extends ChannelItem{
}

interface Message{
  channelName:QualifiedChannel,
  message:any,
  time:Date
}


const messages = ref<Message[]>([]);
const selectedMessage = ref<Message|undefined>(undefined);
const channels = ref<Channel[]>([]);
const selectedChannel = shallowRef<ChannelItem|null>(null);
const newSubchannelName = ref<string>("");

const newMessageText = ref<string>("{}");
const showNewMessage = ref<boolean>(false);
const newMessageValid = ref<boolean>(true);
const newMessageErrors = ref<string>("");
const newMessageAuthSend = ref<boolean>(false);
const newMessageAuthSubscribe = ref<boolean>(false);
const messageInfoBusy = ref<boolean>(false);
const newMessageChannel = ref<ChannelItem|undefined>();
const jsonEditOpen = ref<boolean>();

const onConnectionChanged = (connected:boolean)=>{
    if(connected)
    {
      console.debug(`Connected to channel sync service`);
    }
    else
    {
      console.error(`Disconnected from channel sync service`);
    }
      
};

let selectChannel = (c:ChannelItem)=>{
  if (selectedChannel.value == c){
    selectedChannel.value = null;
    return;
  }
  selectedChannel.value = c;
  newSubchannelName.value = "";
};

let onMessage = (message:any,channelName:string)=>{
console.log("received message for channel " + channelName)
  var channelNameParsed = parseChannelName(channelName);
  messages.value.push({
    channelName:channelNameParsed,
    message:message,
    time:new Date()
  })
};

const subscribedChannelNames= ref<Set<string>>(new Set<string>()); 

const channelIsPinned = (q:QualifiedChannel)=>
  channels.value.find(c=> c.subscriptionScope.main == q.main && !q.sub || (c.subchannels && c.subchannels.find(s=>s.subscriptionScope.sub == q.sub))  );

const pinChannel = (q:QualifiedChannel)=>{
  if(channelIsPinned(q)) return;
  let main = parentChannel(q);
  if (!main) return;
  main.subchannels?.push({name: q.sub ||"", subscriptionScope: q});
};

const parentChannel = (q:QualifiedChannel)=> channels.value.find(c=> c.subscriptionScope.main == q.main);

const parseChannelName = (s:string) =>{
  let parts = s.split("/");
  return {main:parts[0], sub:parts.length<2 ? undefined : parts[1]};
}

const subscriptionTrackingKey = (c:QualifiedChannel) => c.main +(c.sub?"/" + c.sub:"");

const isSubscribed = (c:ChannelItem)=>{

  return subscribedChannelNames.value.has(c.subscriptionScope.main) || subscribedChannelNames.value.has(subscriptionTrackingKey(c.subscriptionScope));
};

const isDirectSubscribed = (c:ChannelItem)=>{

  return subscribedChannelNames.value.has(subscriptionTrackingKey(c.subscriptionScope));
};

function subscribe(c:ChannelItem){
  var key = subscriptionTrackingKey(c.subscriptionScope);
  if(subscribedChannelNames.value.has(key))
    return;
  var channel = channelsClient.getChannel<any>(c.subscriptionScope.main, c.subscriptionScope.sub);
  channel.subscribe(onMessage);
  subscribedChannelNames.value.add(key);
}

function unsubscribe(c:ChannelItem){
  var key = subscriptionTrackingKey(c.subscriptionScope);
  if(!subscribedChannelNames.value.has(key))
    return;
  var channel = channelsClient.getChannel<any>(c.subscriptionScope.main, c.subscriptionScope.sub);
  channel.unsubscribe();
  subscribedChannelNames.value.delete(key);
}

function addSubchannel(c:Channel)
{
  if (newSubchannelName.value==="")return;
  if (c.subchannels == null) return;
  if (c.subchannels?.find(s=>s.name == newSubchannelName.value)) return;
  c.subchannels?.unshift({name:newSubchannelName.value,subscriptionScope:{main:c.name, sub: newSubchannelName.value}});
  subscribe(c.subchannels[0]);
  newSubchannelName.value="";
}

function selectMessage(m:Message){
  if (selectedMessage.value == m)
  {
    selectedMessage.value = undefined;
  }
  else
  {
    selectedMessage.value = m;
  }
}

async function sendMessage(){
  if(!newMessageChannel.value) return;
  var channel = channelsClient.getChannel<any>(newMessageChannel.value?.subscriptionScope.main,newMessageChannel.value?.subscriptionScope.sub);
  try{
    await channel.send(JSON.parse(newMessageText.value));
    uiHelper.showSuccess("Message sent");
    showNewMessage.value = false;
  }
  catch(e)
  {
    uiHelper.showError("Failed sending message: " + e);
  }
}

async function openNewMessageDialog(channelItem:ChannelItem){
  newMessageChannel.value = channelItem;
  newMessageText.value = "{}";
  showNewMessage.value = true;
  newMessageAuthSend.value = false;
  newMessageAuthSubscribe.value = false;
  newMessageErrors.value = "Waiting for validation";
  newMessageValid.value = false;
  await validateNewMessage();
}


onMounted(async ()=>{
  var u = await props.amberClient.user();
  loggedInUser.value = {id: u.id, name: u.name, email: u.email};
  users.value = await tenantApi.getUsers();
  for(var user of users.value){
      usersLookup.value.set(user.id, user);
  }
  
  
  channelsClient.onConnectionChanged(onConnectionChanged);
  channelsClient.connect();
  
  var channelInfos = await channelsAdminApi.getChannels();

  
  channels.value = channelInfos.map(
    (c)=>
      ({
        name: c.name,
        accessRightsMethod: c.accessRightsMethod,
        subchannels: c.hasSubchannels ? [] : null,
        subscriptionScope:{main:c.name}
      }));

});

async function validateNewMessage(){
  newMessageErrors.value = "";
  newMessageValid.value = false;
  newMessageAuthSend.value = false;
  newMessageAuthSubscribe.value = false;

  if (!newMessageChannel.value){
    newMessageErrors.value = "No channel selected";
    return;
  }
  try{
    let result = await channelsAdminApi.checkMessage(newMessageChannel.value.subscriptionScope.main, newMessageText.value, newMessageChannel.value.subscriptionScope.sub, currentUser()?.id);
    newMessageErrors.value = result.error || "";
    newMessageValid.value = result.isValid;
    newMessageAuthSend.value = result.publishAuthorized;
    newMessageAuthSubscribe.value = result.subscribeAuthorized;
  }
  catch(e) {
    newMessageErrors.value = "Unable to validate message: " + e;
  }
 
}

watch(currentSelectedUser, async (newVal)=>{
  showSelectUser.value = false;
  await validateNewMessage();
});

watch(newMessageText, async (newVal)=>{
  await validateNewMessage();
});

const filteredMessages = computed(()=>{
  if (selectedChannel.value == null)
  { // nothing selected, no filter
    return messages.value.slice(0,50); // max 50 messages 
  }
  else
  {
    if (selectedChannel.value?.subscriptionScope.sub)
    {
      // a subchannel is selected. Narrow the scope to it
      return messages.value.filter(m=>m.channelName.main ==selectedChannel.value?.subscriptionScope.main &&  m.channelName.sub == selectedChannel.value.subscriptionScope.sub).slice(0,50);
    }
    else
    { 
      // maybe the main parent is selected. Show all subchannel messages
      return messages.value.filter(m=>m.channelName.main ==selectedChannel.value?.subscriptionScope.main).slice(0,50);
    }
  }
});

const unpinAll = ()=>{
  for(var c of channels.value)
  {
    if(!c.subchannels) continue;
    for(var s of c.subchannels)
    {
      unsubscribe(s);
    }
    c.subchannels = [];
  }
};

const unsubscribeAll = ()=>{
  for(var c of channels.value)
  {
    unsubscribe(c);
    if(!c.subchannels) continue;
    for(var s of c.subchannels)
    {
      unsubscribe(s);
    }
  }
};

const subscribeAll = ()=>{
  for(var c of channels.value)
  {
    subscribe(c);
  }
};


</script>
<template>
  <v-container>
  <v-row>
    <v-col cols="3">
      <v-card>
        <v-card-title>Channels</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
            <v-btn
                color="medium-emphasis"
                icon="mdi-sync"
                size="small"
                title="Subscribe all"
                @click="subscribeAll()"
            ></v-btn>
            <v-btn
                color="medium-emphasis"
                icon="mdi-sync-off"
                size="small"
                title="Unsubscribe all"
                @click="unsubscribeAll()"
            ></v-btn>
            <v-btn
                color="medium-emphasis"
                icon="mdi-pin-off"
                size="small"
                title="Unpin all"
                @click="unpinAll()"
            ></v-btn>
        </v-card-actions>
      </v-card>
      <div id="channel-list">
        <template v-for="channel in channels" :key="channel.name">
        <div class="channel-item">
          <div :class="{'channel-name':true, 'selected-channel':selectedChannel == channel}" @click.stop="selectChannel(channel)" >{{channel.name}}
            <span class="channel-actions">
              <v-btn v-if="!isSubscribed(channel)" icon="mdi-sync" title="Subscribe" @click.stop="()=>{subscribe(channel)}" density="compact" variant="text"></v-btn>
              
              <v-btn v-if="isDirectSubscribed(channel)" icon="mdi-sync-off" title="Unsubscribe" @click.stop="()=>{unsubscribe(channel);}" density="compact" variant="text"></v-btn>
              
              <v-btn v-if="!channel.subchannels" icon="mdi-message-plus-outline" title="New message" @click.stop="openNewMessageDialog(channel)" density="compact" variant="text"></v-btn>              
            </span>
          </div>
        </div>
        <v-progress-linear indeterminate v-if="isSubscribed(channel)"></v-progress-linear>
          
        <div class="subchannel-list" v-if="channel.subchannels!=null">
          <div class="new-subchannel" v-if="selectedChannel == channel">
            <v-text-field label="Pin Subchannel" v-model="newSubchannelName" @keydown.enter.prevent="addSubchannel(channel)">
              <template v-slot:append>
                <v-btn :disabled="newSubchannelName == ''" icon="mdi-pin" title="Pin new subchannel" @click.stop="()=>{addSubchannel(channel);}" density="compact" variant="text"></v-btn>
              </template>
            </v-text-field>
          </div>
          <div v-for="subchannel in channel.subchannels">
            <div class="channel-item">
            <div :class="{'channel-name':true, 'selected-channel':selectedChannel == subchannel}" @click.stop="selectChannel(subchannel)">{{subchannel.name}}
              <span class="channel-actions">
                <v-btn v-if="!isSubscribed(subchannel)" icon="mdi-sync" title="Subscribe" @click.stop="()=>{subscribe(subchannel);}" density="compact" variant="text"></v-btn>
                  
                <v-btn v-if="isDirectSubscribed(subchannel)" icon="mdi-sync-off" title="Unsubscribe" @click.stop="()=>{unsubscribe(subchannel)}" density="compact" variant="text"></v-btn>
                <v-btn icon="mdi-message-plus-outline" title="New message" @click.stop="openNewMessageDialog(subchannel)" density="compact" variant="text"></v-btn>
              </span>
            </div>
          </div>
          <v-progress-linear indeterminate v-if="isSubscribed(subchannel)"></v-progress-linear>
              
          </div>  
        </div>
        
        </template>
      </div>
      
    </v-col>
    <v-col cols="9">
      <v-card>
        <v-card-title>Messages</v-card-title>
        <v-card-text>Received {{ messages.length }} messages</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
            <v-btn
                color="medium-emphasis"
                icon="mdi-cancel"
                size="small"
                title="Clear message list"
                @click="messages = []"
            ></v-btn>
        </v-card-actions>
      </v-card>
      <div id="message-list" v-if="filteredMessages.length > 0">
        <div v-for="m in filteredMessages" class="message" :class="{viewed:m == selectedMessage}" @click.stop="selectMessage(m)">
          <div class="message-header">
          <span class="message-channel">{{m.channelName.main}}</span>
          <span v-if="m.channelName.sub" class="message-subchannel">/{{m.channelName.sub}}</span>
          <span v-if="m.channelName.sub && !channelIsPinned(m.channelName)">&nbsp;<v-btn density="compact" icon="mdi-pin" title="Pin sub-channel to list" @click="pinChannel(m.channelName)"></v-btn></span>
          <span class="message-time">&nbsp;<RelativeTime :date="m.time" precision="seconds"></RelativeTime></span>
          </div>
          <div v-if="m == selectedMessage" class="message-content">
            {{ JSON.stringify(m.message,null,2) }}
          </div>
        </div>
      </div>
    </v-col>
  </v-row>
  
  </v-container>
  <v-dialog v-model="showNewMessage" v-if="newMessageChannel">
    <v-card :loading="messageInfoBusy">
      <v-card-title>
        New message to {{ newMessageChannel?.subscriptionScope.main }} <template v-if="newMessageChannel?.subscriptionScope.sub !== undefined">/ {{ newMessageChannel?.subscriptionScope.sub }} </template>
        as
        <template v-if="showSelectUser">
          <v-select
            v-model="currentSelectedUser"
            return-object
            label="User"
            clearable
            :item-title="(u)=>u.name + ' (' + u.email + ')'"
            :items="users"
          ></v-select>
        </template>
        <template v-else>
        {{ currentUser()?.name }} ({{ currentUser()?.email }}) <v-btn icon="mdi-pencil" small @click="showSelectUser = true" title="Change User"></v-btn>
        </template>
      </v-card-title>
      <v-card-subtitle>
        <div v-if="parentChannel(newMessageChannel.subscriptionScope)?.accessRightsMethod =='roles' ">
            User Channel Roles:
              <v-chip
                v-for="tag in currentUserAccess"
                :key="tag"
                outlined
              >{{ tag }}</v-chip>
          </div>
      </v-card-subtitle>
      <v-card-text>
        <JsonEdit v-model="newMessageText" @active="(v)=>jsonEditOpen=v"/>
      </v-card-text>
      <v-card-item>
        <v-alert type="error" v-if="!newMessageValid">
          <div>
            <strong>Document is not valid:</strong>
          </div>
          <div>
            {{ newMessageErrors }}
          </div>
        </v-alert>
        <v-alert type="info" v-else>
          <div>
            <strong>Document is valid.</strong>
          </div>
        </v-alert>

        <v-alert type="warning" v-if="!newMessageAuthSend">
          <div>
            <strong>The selected user would not be authorized to send this message</strong>
          </div>
        </v-alert>

        <v-alert type="warning" v-if="!newMessageAuthSubscribe">
          <div>
            <strong>The selected user would not be authorized subscribe to messages in this channel</strong>
          </div>
        </v-alert>
      </v-card-item>
      <v-card-actions>
        
        <v-btn color="secondary" :disabled="jsonEditOpen" text @click="showSelectUser=false;sendMessage();">Send</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="secondary" :disabled="jsonEditOpen" text @click="showNewMessage = false;showSelectUser=false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

  #channel-list{
    width:100%;
  }
  .channel-name{
    position:relative;
    width: 100%;
    border-radius: 4px;
    cursor: pointer;
    padding: 5px;
  }
  .channel-item{
    margin-bottom:10px;
  }

  .channel-item:hover{
    border-bottom: 2px rgb(var(--v-theme-primary)) solid;
    margin-bottom: 8px;
  }

  .channel-actions{
    position:absolute;
    right:0px;
  }
  .subchannel-list {
    margin-left: 10px;
    border-left: 5px rgb(var(--v-theme-primary)) solid;
    padding-left: 10px;
  }
  .selected-channel{
    background-color: rgb(var(--v-theme-primary));
  }

  #message-list {
    margin-top:10px;
    padding:10px;
    border-radius: 5px;
    background-color: rgb(var(--v-theme-surface-variant));
    width: 100%;
    .message {
      padding-bottom: 2px;
      padding-left: 20px;;
      width: 100%;
      position: relative;
      margin-bottom: 1px;
    }
    .message-header{
      margin-bottom: 1px;
      cursor: pointer;
    }

    .message-header:hover {
      border-bottom:1px rgb(var(--v-theme-primary)) solid;
      margin-bottom: 0px; 
    }
    
    .message.viewed {
      border-left: 4px solid rgb(var(--v-theme-primary));
      padding-left: 16px;
    }
    .message-subchannel{
      color:rgb(var(--v-theme-primary));
    }
  }
</style>
