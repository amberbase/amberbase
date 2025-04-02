<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type Tenant, type UserDetails} from "amber-client"
var props = defineProps<{amberClient: AmberClient}>();

var allTenants = ref<Tenant[]>([]);
var newTenantName = ref("");
var newTenantId = ref("");

var adminApi = props.amberClient.getGlobalAdminApi()!;
var deleteTenant = async (tenantId :string)=>{
 
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
</script>
<template>
  <v-container>
  <v-row>
      <h2>You are admin for all tenants</h2>
  </v-row>
  <v-row>
    <v-card width="100%">
      <v-card-title>Manage tenants</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="tenant in allTenants" :key="tenant.id">
            <v-list-item-title>{{tenant.name}} [{{ tenant.id }}]</v-list-item-title>
            <v-list-item-action>
              <v-btn @click="deleteTenant(tenant.id)">Delete</v-btn>
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
