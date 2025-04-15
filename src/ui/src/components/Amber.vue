<script setup lang="ts">
import {ref} from "vue"
import {  AmberClient, AmberClientInit, type InvitationDetails, type UserDetails} from "amber-client"
import AmberGlobalAdmin from "./AmberGlobalAdmin.vue";
import AmberLogin from "./AmberLogin.vue";
import { state } from "@/state";
import AmberTenantAdmin from "./AmberTenantAdmin.vue";
import AmberToDoTest from "./AmberToDoTest.vue";
import AmberNotesTest from "./AmberNotesTest.vue";
import AmberTenantStats from "./AmberTenantStats.vue";
import AmberLoadTest from "./AmberLoadTest.vue";

interface AmberUserDetails
{
  userId:string,
  userName:string,
  userEmail:string,
  tenant:string,
  roles:string[]
}

const amberUser = ref<AmberUserDetails | null>(null);
const amberClient= ref<AmberClient | null>(null);

var onUserReady = (details:{client: AmberClient,userId:string, userName:string, userEmail:string, tenant:string,roles:string[]} | null)=>
{
  if(details!=null)
  {
    amberUser.value = details;
    amberClient.value = details.client;
  }
    else
    {
        amberUser.value = null;
        amberClient.value = null;
    }
};

</script>

<template>
    <v-container>
    <v-row>
      <AmberLogin @user-ready="onUserReady"></AmberLogin>
    </v-row>
    <v-row v-if="amberUser && amberUser.tenant=='*' && amberUser.roles.includes('admin') && amberClient">
      <AmberGlobalAdmin :amber-client="amberClient"></AmberGlobalAdmin>
      <AmberTenantAdmin :amber-client="amberClient" :tenant="amberUser.tenant" :roles="['admin']"></AmberTenantAdmin>
    </v-row>
    <v-row v-if ="amberUser && amberUser.roles.includes('admin')">
      <AmberTenantStats v-if="amberUser && amberClient" :amber-client="amberClient" :tenant="amberUser.tenant" :roles="['admin','editor','reader']"></AmberTenantStats>
    </v-row>
    <v-row v-if ="amberUser && amberUser.tenant!='*'">
      <AmberTenantAdmin v-if="amberUser && amberClient  && amberUser.roles.includes('admin')" :amber-client="amberClient" :tenant="amberUser.tenant" :roles="['admin','editor','reader']"></AmberTenantAdmin>
    </v-row>
    <v-row v-if ="amberUser && amberUser.tenant!='*' && (amberUser.roles.includes('reader') || amberUser.roles.includes('editor'))">
      <AmberToDoTest v-if="amberUser && amberClient" :amber-client="amberClient"></AmberToDoTest>
    </v-row>
    <v-row v-if ="amberUser && amberUser.tenant!='*' && (amberUser.roles.includes('reader') || amberUser.roles.includes('editor'))">
      <AmberNotesTest v-if="amberUser && amberClient" :amber-client="amberClient"></AmberNotesTest>
    </v-row>
    <v-row v-if ="amberUser && amberUser.tenant!='*' &&  amberUser.roles.includes('editor')">
      <AmberLoadTest v-if="amberUser && amberClient" :amber-client="amberClient"></AmberLoadTest>
    </v-row>
    </v-container>
</template>

<style scoped>

</style>
