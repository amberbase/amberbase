<script setup lang="ts">
import {ref} from "vue"

var ws :WebSocket | null = null;
var websocketPrefix = 'ws://';
const message = ref('');
const serverStartTime = ref('not loaded yet');
const socketStartTime = ref('not loaded yet');
const socketAliveSeconds = ref(0);
const serverInstanceId = ref('not loaded yet');
const connectedState = ref<"connected"|"disconnected"|"reconnecting">( "disconnected");
const messageReceived = ref(false);

function getIcon() {
  return connectedState.value == "connected" ? 'mdi-check-circle' 
  : (connectedState.value == "disconnected" ?  'mdi-close-circle': 'mdi-help-circle');
}


if (location.protocol === 'https:') {
  websocketPrefix = 'wss://';
} 
const websocketEndpoint = `${websocketPrefix}${location.host}/amber/ws-test`;

function sendRandomMessage() {
  if (ws) {
    const rand = Math.floor(Math.random() * 10000);
    ws.send(JSON.stringify({req: `Hello ${rand}` }));
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
          serverInstanceId: string,
          socketStartTime: string,
          serverStartTime: string,
          socketAliveSeconds: number,
          resp: string | undefined
        } = JSON.parse(event.data);
      if (data.resp) {
        message.value = data.resp;
        return;
      }
      serverInstanceId.value = data.serverInstanceId;
      socketStartTime.value = data.socketStartTime;
      serverStartTime.value = data.serverStartTime;
      socketAliveSeconds.value = data.socketAliveSeconds;
      messageReceived.value = true;
    };
  }
}

</script>

<template>
   <v-flex class="tile">
  <v-card :append-icon="getIcon()" title = "Test websocket" width="600px" tile>
    <v-card-title v-if="connectedState == 'connected' ">Socket seems connected</v-card-title>
    <v-card-title v-if="connectedState == 'disconnected'">Socket not connected</v-card-title>
    <v-card-title v-if="connectedState == 'reconnecting'">Socket is reconnecting</v-card-title>
    <v-card-title v-if = "messageReceived">Message received from {{ serverInstanceId }}</v-card-title>
    <v-card-text v-if = "messageReceived">Server up since {{ serverStartTime }}</v-card-text>
    <v-card-text v-if = "messageReceived">Socket connected since {{ socketStartTime }}</v-card-text>
    <v-card-text v-if = "messageReceived">Socket online for {{ socketAliveSeconds }} seconds</v-card-text>
    <v-btn @click = "connect" v-if="connectedState == 'disconnected'">Connect</v-btn>
    <v-btn @click = "disconnect" v-if="connectedState == 'connected' ">Disconnect</v-btn>
  </v-card>
</v-flex>
<v-flex class="tile">
  <v-card :append-icon="getIcon()" title = "Test sending messages" width="600px" tile>
    <v-card-title v-if = "message">Response received {{ message }}</v-card-title>
    <v-btn @click = "sendRandomMessage" v-if="connectedState == 'connected'">Send Random Message</v-btn>
  </v-card>
</v-flex>
</template>

<style scoped>
.tile{
  margin: 10px;
  padding: 10px;
}
</style>
