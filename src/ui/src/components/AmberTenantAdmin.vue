<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails} from "amber-client"
var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string,
  tenantName : string,
  roles : string[]
}>();
var users = ref<UserWithRoles[]>([]);
var loadingUsers = ref(false);
var loadingInvitation = ref(false);
var createdInvitationLink = ref("");
var newUserRoles = ref<string[]>([]);
var adminApi = props.amberClient.getAdminApi()!;
onMounted(async ()=>{
  await refreshUsers();
});

var refreshUsers = async ()=>{
  loadingUsers.value = true;
  try{
    var usersFetched = await adminApi.getUsers();
    usersFetched.sort((a,b)=>
    {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    users.value = usersFetched;

  }catch(e){
    console.error("Error loading users", e);
  }
  loadingUsers.value = false;
};

var removeUser = async (userId:string)=>{
  try{
    await adminApi.deleteUser(userId);
    await refreshUsers();
  }catch(e){
    console.error("Error removing user", e);
  }
};


var createInvitation= async (roles: string[])=>{
  try{
    
    createdInvitationLink.value = "";
    loadingInvitation.value = true;
    try{
    var invitationToken = await adminApi.createInvitation({expiresInDays:14, roles:roles});

    var loc = window.location.pathname;
    var dir = loc.substring(0, loc.lastIndexOf('/'));
    createdInvitationLink.value =  window.location.protocol +"//"+ window.location.host + dir + "/invitation" +"?tenant="+props.tenant+"&invitation="+invitationToken;
    }
    catch(e){
      console.error("Error creating invitation", e);
    }
    loadingInvitation.value = false;
  }catch(e){
    console.error("Error inviting user", e);
  }
};

var onRemoveRole = async (user:UserWithRoles, role:string)=>{
  var roles = user.roles.filter(r=>r != role);
  try{
    await adminApi.setRolesOfUser(user.id, roles);
    await refreshUsers();
  }catch(e){
    console.error("Error removing role", e);
  }
};

var onAddRole = async (user:UserWithRoles, role:string)=>{
  if (user.roles.find(r=>r == role)) return;
  var roles = [role, ...user.roles];
  try{
    await adminApi.setRolesOfUser(user.id, roles);
    await refreshUsers();
  }catch(e){
    console.error("Error removing role", e);
  }
};

const copy =async (text:string) => {
  try{
    await navigator.clipboard.writeText(text);
    console.log("Copied to clipboard");
  }
  catch(e){
    console.error("Error copying to clipboard", e);
  }
};

</script>
<template>
  <v-container>
  <v-row>
      <h2>Manage {{props.tenantName}} ({{props.tenant}})        
      </h2>
  </v-row>
  <v-row>
    <v-card width="100%" class="mt-3">
      <v-card-title>New Invitation</v-card-title>
      <v-card-actions>
        <v-container>
          <v-row>
        <v-select
          v-model="newUserRoles"
          :items="props.roles"
          hint="Pick roles"
          label="Roles"
          multiple
          persistent-hint
        ></v-select>
        <v-btn @click="createInvitation(newUserRoles)" :disabled="newUserRoles.length < 1" :loading="loadingInvitation" prepend-icon="mdi-card-account-mail">Create Invitation</v-btn>
      </v-row>
      <v-row v-if="!!createdInvitationLink">
         <pre style="font-size: 10pt;">{{createdInvitationLink}} </pre> <v-btn density="compact" icon="mdi-content-copy" title="copy" @click="copy(createdInvitationLink)"></v-btn>
         (valid for 14 days)
      </v-row>
      </v-container>
     </v-card-actions>
      
    </v-card>
  </v-row>
  <v-row >
    <v-card width="100%" class="mt-3">
      <v-card-title>Users</v-card-title>
      <v-card-text>
        <table class="items" >
          <tr v-for="user in users" :key="user.id">
            <th>{{user.name}} [{{ user.email }}]</th>
            <td>
              <v-chip v-for="role in user.roles" :key="role">{{role}}
              <template #close>
                <v-icon title="Remove Role" v-if="user.roles.length>1" icon="mdi-close-circle" @click.stop="onRemoveRole(user, role);" />
              </template>  
              </v-chip>
            </td>
            <td style="text-align:right;width:100px;">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-plus-circle" v-bind="props" title = "Add Role"></v-btn>
              </template>

              <v-list>
                <template v-for="role in props.roles" :key="role">
                  <v-list-item  @click="onAddRole(user, role)"  v-if="!user.roles.find(r=>r == role)">
                    <v-list-item-title>{{role}}</v-list-item-title>
                  </v-list-item>
                </template>
              </v-list>
            </v-menu>
            <v-btn icon="mdi-delete-outline" @click="removeUser(user.id)" title = "Remove"></v-btn>
            </td>
          </tr>
        </table>
      </v-card-text>
      
    </v-card>
  </v-row>
</v-container>
</template>

<style scoped>

</style>
