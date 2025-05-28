<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails} from "amber-client"
import { copy, generatePassword, uiHelper} from "@/common"

var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string,
  tenantName : string,
  roles : string[]
}>();
const users = ref<UserWithRoles[]>([]);
const loadingUsers = ref(false);
const loadingInvitation = ref(false);
const createdInvitationLink = ref("");
const newUserRoles = ref<string[]>([]);
const pwDialogOpen = ref(false);
const newPassword = ref("");
const showPassword = ref(false);
const focussedUser = ref<UserWithRoles | null>(null);
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

var removeUser = async (user:UserWithRoles)=>{
  try{
    if (!(await uiHelper.confirmDialog("Are you sure you want to remove the user " + user.name + " (" + user.email + ")?")))
    {
      
      return;
    }
    
    await adminApi.deleteUser(user.id);
    await refreshUsers();
    uiHelper.showSuccess("User removed successfully");
  }catch(e){
    uiHelper.showError("Error removing user: " + e);
  }
};


var createInvitation= async (roles: string[])=>{
   
    createdInvitationLink.value = "";
    loadingInvitation.value = true;
    try{
    var invitationToken = await adminApi.createInvitation({expiresInDays:14, roles:roles});

    var loc = window.location.pathname;
    var dir = loc.substring(0, loc.lastIndexOf('/'));
    createdInvitationLink.value =  window.location.protocol +"//"+ window.location.host + dir + "/invitation" +"?tenant="+props.tenant+"&invitation="+invitationToken;
    }
    catch(e){
      uiHelper.showError("Error creating invitation: " + e);
    }
    loadingInvitation.value = false;
  
};

var onRemoveRole = async (user:UserWithRoles, role:string)=>{
  var roles = user.roles.filter(r=>r != role);
  try{
    await adminApi.setRolesOfUser(user.id, roles);
    await refreshUsers();
    uiHelper.showSuccess("Removed role " + role + " from user " + user.name);
  }catch(e){
    uiHelper.showError("Error removing role " + role + " from user " + user.name + ": " + e);
  }
};

var onAddRole = async (user:UserWithRoles, role:string)=>{
  if (user.roles.find(r=>r == role)) return;
  var roles = [role, ...user.roles];
  try{
    await adminApi.setRolesOfUser(user.id, roles);
    await refreshUsers();
    uiHelper.showSuccess("Added role " + role + " to user " + user.name);
  }catch(e){
    uiHelper.showError("Error adding role " + role + " to user " + user.name + ": " + e);
  }
};


const changePassword = async (user:UserWithRoles)=>{
  
  newPassword.value = generatePassword();
  focussedUser.value = user;
  pwDialogOpen.value = true;
  showPassword.value = false;
};

const doChangePassword = async ()=>{
  pwDialogOpen.value = false;
  if (!focussedUser.value) return;
  try{
    await adminApi.changePasswordOfSingleTenantUser(focussedUser.value.id, newPassword.value);
    uiHelper.showSuccess("Password changed successfully");
  }catch(e){
    uiHelper.showError("Error changing password: " + e);
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
            <td style="text-align:left;width:150px;">
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
            <v-btn icon="mdi-delete-outline" @click="removeUser(user)" title = "Remove"></v-btn>
            <v-btn icon="mdi-key-variant" v-if="user.singleTenant" @click="changePassword(user)" title = "Reset Password"></v-btn>
            </td>
          </tr>
        </table>
      </v-card-text>
    </v-card>
  </v-row>
</v-container>
<v-dialog v-model="pwDialogOpen" max-width="600">
      <v-card>
        <v-card-title class="headline">Change User Password</v-card-title>
        <v-card-subtitle class="headline">You can reset the password of {{ focussedUser?.name }} ({{ focussedUser?.email }}) since he/she is only member of {{ props.tenantName }}</v-card-subtitle>
        <v-card-text>
          <v-text-field
            v-model="newPassword"
            label="New Password"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw"
            @click:append="showPassword = !showPassword"
          ></v-text-field>
          <v-btn density="compact" icon="mdi-content-copy" title="copy" @click="copy(newPassword)"></v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="doChangePassword()">OK</v-btn>
          <v-btn @click="pwDialogOpen = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<style scoped>

</style>
