<script setup lang="ts">
import {getCurrentInstance, ref, watch} from "vue"
import {  AmberClient, AmberClientInit} from "amber-client"
import AmberGlobalAdmin from "./AmberGlobalAdmin.vue";
import AmberLogin from "./AmberLogin.vue";
import { state, uiHelper } from "@/state";
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
const title = ref(state.uiConfig.title);
const tenant = ref(state.uiContext.tenant);
const tenantName = ref(state.uiContext.tenantName);
const invitation = ref(state.uiContext.invitation);
const confirmDialogOpen = ref(false);
const confirmDialogText = ref("");
var confirmDialogCallback: ((result:boolean)=>void) | null  = null;

uiHelper.confirmDialog = (text:string):Promise<boolean> =>
{
  confirmDialogOpen.value = true;
  confirmDialogText.value = text;
  return new Promise((resolve, reject) => {
    confirmDialogCallback = (result:boolean)=>
    {
      confirmDialogOpen.value = false;
      resolve(result);
    };
  });
};

var confirmDialogClose =(result:boolean)=>
{
  var callback = confirmDialogCallback;
  confirmDialogCallback = null;
  confirmDialogOpen.value = false;
  if (callback) {
    callback(result);
  }
};

watch(confirmDialogOpen, (newValue) => {
  if (!newValue) {
    if(confirmDialogCallback)
    {
      confirmDialogCallback(false);
      confirmDialogCallback = null;
    }
  }
});

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
    <v-app-bar >
      <v-app-bar-title>{{ title }} {{ tenantName? (" - " + tenantName) : "" }}</v-app-bar-title>
    </v-app-bar>
    <v-main class="d-flex" style="min-height: 300px;">
    <v-container v-if ="state.uiContext.view=='login'">
      <v-row>
        <AmberLogin @user-in-tenant="onUserLoggedInForApp"></AmberLogin>
      </v-row>
    </v-container>

    <v-container v-if ="state.uiContext.view=='invited'">
      <v-row>
        <AmberLogin @user-in-tenant="onUserLoggedInForApp" :tenant="tenant" :invitation="invitation"></AmberLogin>
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
      <v-row v-if="!amberUserInTenant || !amberUserInTenant.tenant || !amberUserInTenant.roles.includes(adminRole) || !amberClient">
        <AmberLogin @user-in-tenant="onUserInTenant" :tenant="tenant" :allowGlobalTenantSelection="true"></AmberLogin>
      </v-row>
      <v-row v-else>
        <AmberTenantAdmin :amber-client="amberClient" :tenant="tenant!" :tenant-name="tenantName!" :roles="[adminRole, ...state.uiConfig.availableRoles]"></AmberTenantAdmin>
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
    <v-dialog v-model="confirmDialogOpen" max-width="600">
      <v-card>
        <v-card-title class="headline">Confirm</v-card-title>
        <v-card-text>{{ confirmDialogText }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="confirmDialogClose(false)" color="red">Cancel</v-btn>
          <v-btn @click="confirmDialogClose(true)" color="green">OK</v-btn>
        </v-card-actions>
      </v-card>

    </v-dialog>
   </v-main>
   <v-footer app>
    <v-col class="text-center">
      <img src="@/assets/logo.svg" alt="Amber Logo" width="50" height="50" /> 
      <br>
      Powered by Amberbase. Visit our <v-btn variant="text" href="https://github.com/amberbase" target="_blank" prepend-icon="mdi-github">github</v-btn>
      </v-col>
   </v-footer>
  </v-app>
</template>

<style scoped>

</style>
