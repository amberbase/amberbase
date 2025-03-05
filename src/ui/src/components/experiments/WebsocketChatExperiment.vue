<script setup lang="ts">
import {ref} from "vue"

var ws :WebSocket | null = null;
var websocketPrefix = 'ws://';
const message = ref('');
const topic = ref('');
const messagesReceived = ref<{message:string, topic:string}[]>([]);
const connectedState = ref<"connected"|"disconnected"|"reconnecting">( "disconnected");
const topicSubscriptions = ref<string[]>(["test"]);

function getIcon() {
  return connectedState.value == "connected" ? 'mdi-check-circle' 
  : (connectedState.value == "disconnected" ?  'mdi-close-circle': 'mdi-help-circle');
}


if (location.protocol === 'https:') {
  websocketPrefix = 'wss://';
} 
const websocketEndpoint = `${websocketPrefix}${location.host}/amber/ws-chat`;

function sendMessage(topic:string, message:string) {
  if (ws) {
    
    ws.send(JSON.stringify({topic: topic, message: message }));
  }
}

function addTopic(topic:string) {
  if (topicSubscriptions.value.includes(topic)) {
    return;
  }
  topicSubscriptions.value.push(topic);

  if (ws) {
    ws.send(JSON.stringify({topics: topicSubscriptions.value}));
  }
}

function removeTopic(topic:string) {
  topicSubscriptions.value = topicSubscriptions.value.filter((t) => t != topic);
  if (ws) {
    ws.send(JSON.stringify({topics: topicSubscriptions.value}));
  }
}


function disconnect() {
  if (ws) {
    connectedState.value = "disconnected";
    ws.close();
    ws = null;
  }
}

function connect() {
  if (!ws) {
    ws = new WebSocket(websocketEndpoint, "foo-protocol");
    ws.onopen = () => {
      console.log('Connected');
      connectedState.value = "connected";
    };
    ws.onclose = () => {
      console.log('Disconnected');
      ws = null;
      if (connectedState.value != "disconnected") {
        connectedState.value = "reconnecting";
        setTimeout(() => {
          connect();
        }, 1000);
      }
    };
    ws.onmessage = (event) => {
      console.log('Message received:', event.data);
      var data:{
          message: string,
          topic: string
        } = JSON.parse(event.data);
      messagesReceived.value.push(data);
    };
  }
}

</script>

<template>
   <v-flex class="tile">
  <v-card :append-icon="getIcon()" title = "Websocket" tile>
    <v-card-title v-if="connectedState == 'connected' ">Socket seems connected</v-card-title>
    <v-card-title v-if="connectedState == 'disconnected'">Socket not connected</v-card-title>
    <v-card-title v-if="connectedState == 'reconnecting'">Socket is reconnecting</v-card-title>
    <v-btn @click = "connect" v-if="connectedState == 'disconnected'">Connect</v-btn>
    <v-btn @click = "disconnect" v-if="connectedState == 'connected' ">Disconnect</v-btn>
  </v-card>
</v-flex>
<v-flex class="tile">
  <v-card :append-icon="getIcon()" title = "Test sending messages" width="600px" tile>
    <v-text-field
            v-model="topic"
            :append-icon="'mdi-chat-plus'"
            label="Topic"
            type="text"
            variant="filled"
            clearable
            @click:append="addTopic(topic)"
          ></v-text-field>
          <v-chip-group>
            <v-chip
              v-for="topic in topicSubscriptions"
              :key="topic"
              closable
              @click:close="removeTopic(topic)"
            >
              {{ topic }}
            </v-chip>
          </v-chip-group>
    <v-text-field
            v-model="message"
            :append-icon="'mdi-send'"
            label="Message"
            type="text"
            variant="filled"
            clearable
            @click:append="sendMessage(topic,message)"
          ></v-text-field>
    <v-list>
      <v-list-item v-for="msg in messagesReceived" :key="msg.message">
        <v-list-item-content>
          <v-list-item-title>{{ msg.topic }}</v-list-item-title>
          <v-list-item-subtitle>{{ msg.message }}</v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
</v-flex>

</template>

<style scoped>
.tile{
  margin: 10px;
  padding: 10px;
}
</style>
