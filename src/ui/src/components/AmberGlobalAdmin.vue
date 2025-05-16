<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type Tenant} from "amber-client"
import { globalTenant } from "../../../shared/src"
import { uiHelper} from "@/state"
import { state } from "@/state";
var props = defineProps<{amberClient: AmberClient}>();

var allTenants = ref<Tenant[]>([]);
var newTenantName = ref("");
var newTenantId = ref("");
var adminApi = props.amberClient.getGlobalAdminApi()!;
var deleteTenant = async (tenantId :string)=>{
 
    if (!(await uiHelper.confirmDialog("Are you sure you want to delete tenant " + tenantId + "?")))
    {
      console.log("User cancelled delete tenant");
      return;
    }

    var result = await adminApi.deleteTenant(tenantId);
    if (result.success)
    {
      allTenants.value = allTenants.value.filter(t=>t.id != tenantId);
    }
    
 };

var createTenant = async (id:string, name : string)=>{
    var result = await adminApi.createTenant({id:id, name:name,data:"{}"});
    await refreshTenants();
};

var refreshTenants = async ()=>{
  var tenants = await adminApi.getTenants();
  allTenants.value = tenants;
};

onMounted(async ()=>{
  await refreshTenants();
});

var createLinkToTenantApp = (tenantId:string) :string =>
{
  var targetUrl = state.uiConfig.loginTargetUrl || "/";
  targetUrl = targetUrl.replace('{tenant}', tenantId);
    
  return targetUrl;
};
</script>
<template>
  <v-container>
  <v-row>
      <h2>Manage tenants
      </h2>
    </v-row>
    <v-row >
    <v-card width="100%">
      <v-card-text>
        <v-list>
          <v-list-item v-for="tenant in allTenants" :key="tenant.id">
            <v-list-item-title>{{tenant.name}} [{{ tenant.id }}]</v-list-item-title>
            <v-list-item-action>
              <v-btn icon="mdi-delete-outline" @click="deleteTenant(tenant.id)" title="delete" v-if="tenant.id != globalTenant"></v-btn>
              <v-btn icon="mdi-application-edit" title="manage" :href='"admin?tenant=" + tenant.id'></v-btn>
              <v-btn icon="mdi-open-in-new" title="visit" :href='createLinkToTenantApp(tenant.id)'></v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-text-field v-model="newTenantName" label="New tenant name"></v-text-field>
        <v-text-field v-model="newTenantId" label="New tenant id"></v-text-field>
        <v-btn @click="createTenant(newTenantId, newTenantName)">Create new</v-btn>
      </v-card-actions>
    </v-card>
  </v-row>
</v-container>
</template>

<style scoped>

</style>
