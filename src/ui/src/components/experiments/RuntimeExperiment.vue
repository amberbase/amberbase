<script setup lang="ts">
import {ref} from "vue"

const serverRuntimeState = ref("Not loaded yet...");

async function getNow(){
  var response = await fetch("/starttime");
  const text = await response.text();
  serverRuntimeState.value = text;
}

</script>

<template>
  <v-card height="150px" style="margin:20px" >
    <v-card-title>Get server uptime information</v-card-title>
    <v-card-text>{{ serverRuntimeState }}</v-card-text>
    <v-card-actions>
      <v-btn @click="getNow">Get Now</v-btn>
    </v-card-actions>
    
  </v-card>
</template>

<style scoped>

</style>
