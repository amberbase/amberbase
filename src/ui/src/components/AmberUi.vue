<script setup lang="ts">
import {ref} from "vue"
import {  AmberClient, AmberClientInit} from "amber-client"
import AmberGlobalAdmin from "./AmberGlobalAdmin.vue";
import AmberLogin from "./AmberLogin.vue";
import { state } from "@/state";
import AmberTenantAdmin from "./AmberTenantAdmin.vue";
import AmberTenantStats from "./AmberTenantStats.vue";
import { adminRole, globalTenant } from "../../../shared/src";

interface AmberUserInTenantDetails
{
  userId:string,
  userName:string,
  userEmail:string,
  tenant:string,
  roles:string[]
}

interface AmberUserDetails
{
  userId:string,
  userName:string,
  userEmail:string,
}

const amberUserInTenant = ref<AmberUserInTenantDetails | null>(null);
const amberUser = ref<AmberUserDetails | null>(null);
const amberClient= ref<AmberClient | null>(null);
const theme = ref(state.uiConfig.theme);
var onUserInTenant = (details:{client: AmberClient,userId:string, userName:string, userEmail:string, tenant:string,roles:string[]} | null)=>
{
  if(details!=null)
  {
    amberUserInTenant.value = details;
    amberClient.value = details.client;
  }
    else
    {
      amberUserInTenant.value = null;
        amberClient.value = null;
    }
};

var onUserReady = (details:{client: AmberClient,userId:string, userName:string, userEmail:string} | null)=>
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

var onUserLoggedInForApp = (details:{client: AmberClient,userId:string, userName:string, userEmail:string, tenant:string,roles:string[]} | null)=>
{
  if(details!=null)
  {
    var targetUrl = state.uiConfig.loginTargetUrl || "/";
    targetUrl = targetUrl.replace('{tenant}', details.tenant);
    window.location.href = targetUrl;
  }
    else
    {
        amberUser.value = null;
        amberClient.value = null;
    }
};

</script>

<template>
  <v-app :theme="theme">
    <v-container v-if ="state.uiContext.view=='login'">
      <v-row>
        <AmberLogin @user-in-tenant="onUserLoggedInForApp"></AmberLogin>
      </v-row>
    </v-container>

    <v-container v-if = "state.uiContext.view=='global-admin'">
      <v-row v-if="!amberUserInTenant || amberUserInTenant.tenant != globalTenant || !amberUserInTenant.roles.includes(adminRole) || !amberClient">
        <AmberLogin @user-in-tenant="onUserInTenant" :tenant="globalTenant"></AmberLogin>
      </v-row>
      <v-row v-else>
        <AmberGlobalAdmin :amber-client="amberClient"></AmberGlobalAdmin>
      </v-row>
    </v-container>

    <v-container v-if = "state.uiContext.view=='tenant-admin'">
      <v-row v-if="!amberUserInTenant || amberUserInTenant.tenant == globalTenant || !amberUserInTenant.tenant || !amberUserInTenant.roles.includes(adminRole) || !amberClient">
        <AmberLogin @user-in-tenant="onUserInTenant"></AmberLogin>
      </v-row>
      <v-row v-else>
        <AmberTenantAdmin :amber-client="amberClient" :tenant="amberUserInTenant.tenant" :roles="[adminRole, ...state.uiConfig.availableRoles]"></AmberTenantAdmin>
      </v-row>
    </v-container>

    <v-container v-if = "state.uiContext.view=='tenant-monitoring'">
      <v-row v-if="!amberUserInTenant || amberUserInTenant.tenant == globalTenant || !amberUserInTenant.tenant || !amberUserInTenant.roles.includes(adminRole) || !amberClient">
        <AmberLogin @user-in-tenant="onUserInTenant"></AmberLogin>
      </v-row>
      <v-row v-else>
        <AmberTenantStats :amber-client="amberClient" :tenant="amberUserInTenant.tenant"></AmberTenantStats>
      </v-row>
    </v-container>

    <v-container v-if = "state.uiContext.view=='global-monitoring'">
      <v-row v-if="!amberUserInTenant || amberUserInTenant.tenant != globalTenant || !amberUserInTenant.tenant || !amberUserInTenant.roles.includes(adminRole) || !amberClient">
        <AmberLogin @user-in-tenant="onUserInTenant" :tenant = "globalTenant"></AmberLogin>
      </v-row>
      <v-row v-else>
        <AmberTenantStats :amber-client="amberClient" :tenant="globalTenant"></AmberTenantStats>
      </v-row>
    </v-container>
    
    <v-container v-if = "state.uiContext.view=='user-profile'">
      <v-row v-if="!amberUser || !amberClient">
        <AmberLogin @user-ready="onUserReady"></AmberLogin>
      </v-row>
      <v-row v-else>
        Hey {{ amberUser.userName }}, coming soon: user profile 
      </v-row>
    </v-container>
  </v-app>
</template>

<style scoped>

</style>
