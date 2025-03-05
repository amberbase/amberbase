<script setup lang="ts">
import {ref} from "vue"
import RuntimeExperiment from './components/experiments/RuntimeExperiment.vue'
import WebsocketExperiment from './components/experiments/WebsocketExperiment.vue'
import WebsocketChatExperiment from "./components/experiments/WebsocketChatExperiment.vue";
import AmberLogin from "./components/AmberLogin.vue";
import { state } from "./state";
type Experiment = "runtime"|"websocket"|"websocketchat"|"amberlogin";
const navOpen = ref(true);
const experiment = ref<Experiment>("runtime");

function selectExperiment (exp:Experiment) {
  experiment.value = exp;
  navOpen.value = false;
  
  }

if (state.defaultView == "amber")
{
  selectExperiment("amberlogin");
}
</script>

<template>
  <v-app theme="dark">
    <v-app-bar app>
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="navOpen = !navOpen" :icon="navOpen?'mdi-close-circle':'mdi-menu'"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>Ambers Testbench</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer app :width="300" v-model="navOpen">
      <v-list-item title="Experiments" subtitle="To test some basics"></v-list-item>
      <v-divider></v-divider>
      <v-list-item link title="Test runtime" @click="selectExperiment('runtime')"></v-list-item>
      <v-list-item link title="Test websocket" @click="selectExperiment('websocket')"></v-list-item>
      <v-list-item link title="Test chat" @click="selectExperiment('websocketchat')"></v-list-item>
      <v-list-item link title="Test amber login" @click="selectExperiment('amberlogin')"></v-list-item>
    </v-navigation-drawer>

    <v-main class="d-flex" style="min-height: 300px;">
      <v-container fluid grid-list-md>
        <v-flex>
          <v-layout row wrap>
            <RuntimeExperiment v-if ="experiment == 'runtime'"></RuntimeExperiment>
            <WebsocketExperiment v-if ="experiment == 'websocket'"></WebsocketExperiment>
            <WebsocketChatExperiment v-if ="experiment == 'websocketchat'"></WebsocketChatExperiment>
            <AmberLogin v-if ="experiment == 'amberlogin'"></AmberLogin>
          </v-layout>
        </v-flex>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>

</style>
