<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails, type TenantDetails} from "amber-client"
import { copy, generatePassword, uiHelper} from "@/common"
import JsonEdit from "./shared/JsonEdit.vue"
var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string,
  roles : string[]
}>();

const emit = defineEmits<{
  (e: 'tenantChanged', tenantName: string): void;
}>();

const users = ref<UserWithRoles[]>([]);
const loadingUsers = ref(false);
const loadingInvitation = ref(false);
const createdInvitationLink = ref("");

const createdPasswordResetLink = ref("");


const newUserRoles = ref<string[]>([]);
const pwDialogOpen = ref(false);
const newPassword = ref("");
const showPassword = ref(false);
const focussedUser = ref<UserWithRoles | null>(null);
const tab = ref<"users" | "settings" | "data" >("users");
const tenantName = ref<string>("");
const tenantData = ref<string>("{}");

const editTenantName = ref<string>("");
const editTenantData = ref<string>("{}");

var adminApi = props.amberClient.getAdminApi()!;
onMounted(async ()=>{
  await Promise.all([ refreshUsers(),refreshTenantInfo()]);
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

var refreshTenantInfo = async ()=>{
  try{
    var tenant = await adminApi.getTenantInfo();
    tenantName.value = tenant.name;
    tenantData.value = tenant.data;
    editTenantName.value = tenant.name;
    editTenantData.value = tenant.data;
  }catch(e){
    console.error("Error loading tenant info", e);
  }
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
    uiHelper.showSuccess("Invitation created successfully: " + createdInvitationLink.value);
    }
    catch(e){
      uiHelper.showError("Error creating invitation: " + e);
    }
    loadingInvitation.value = false;
  
};

var createUserPasswordResetLink= async (user:UserWithRoles)=>{
    createdPasswordResetLink.value = "";
    try{
    var passwordResetToken = await adminApi.createPasswordResetTokenOfSingleTenantUser(user.id);

    var loc = window.location.pathname;
    var dir = loc.substring(0, loc.lastIndexOf('/'));
    createdPasswordResetLink.value =  window.location.protocol +"//"+ window.location.host + dir + "/resetpassword" +"?token="+passwordResetToken;
    }
    catch(e){
      uiHelper.showError("Error creating password reset link: " + e);
    }
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
  
  await createUserPasswordResetLink(user);
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

const updateTenant = async ()=>{
  try{
    var tenant: TenantDetails = {
      name: editTenantName.value,
      data: editTenantData.value
    };
    await adminApi.updateTenant(tenant);
    tenantName.value = tenant.name;
    tenantData.value = tenant.data;
    emit("tenantChanged", tenant.name);
    uiHelper.showSuccess("Tenant updated successfully");
  }catch(e){
    uiHelper.showError("Error updating tenant: " + e);
  }
};

</script>
<template>
  <v-container>
  <v-row>
    <v-tabs
      v-model="tab"
      bg-color="amber"
    >
      <v-tab value="users">Users</v-tab>
      <v-tab value="settings">Settings</v-tab>
      <v-tab value="data">Collection Data</v-tab>
    </v-tabs>    
  </v-row>
  </v-container>
  <v-container>
    <v-tabs-window v-model="tab">
    <v-tabs-window-item value="users">
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
                <v-btn icon="mdi-key-variant" v-if="user.singleTenant" @click="changePassword(user)" title = "Reset Password Options"></v-btn>
                </td>
              </tr>
            </table>
          </v-card-text>
        </v-card>
      </v-row>
    </v-tabs-window-item>
    <v-tabs-window-item value="settings">
      <v-row>
        <v-card width="100%" class="mt-3">
          <v-card-title>Tenant Settings for "{{ props.tenant }}"</v-card-title>
          <v-card-text>
            <v-form>
              <v-text-field
                v-model="editTenantName"
                label="Tenant Name"
              ></v-text-field>
              <json-edit v-model="editTenantData" label="Tenant Data (JSON)" :rows="10"></json-edit>
              <v-btn :disabled="editTenantData==tenantData && editTenantName==tenantName" @click="updateTenant()" prepend-icon="mdi-content-save">Save Changes</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-row>
    </v-tabs-window-item>
    <v-tabs-window-item value="data">
      Coming soon: collection data administration view
    </v-tabs-window-item>
    </v-tabs-window>
  
</v-container>

<v-dialog v-model="pwDialogOpen" max-width="600">
      <v-card>
        <v-card-title class="headline">Reset User Password</v-card-title>
        <v-card-subtitle class="headline">Reset the password of {{ focussedUser?.name }} ({{ focussedUser?.email }}).</v-card-subtitle>
        <v-card-text>
          This is only possible since he/she is only member of {{ tenantName }} and no other tenant.
        </v-card-text>
        <v-card-text>
          <p>Feel free to use the autogenerated password below or create your own. </p>
          <v-text-field
            v-model="newPassword"
            label="New Password"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw"
            @click:append="showPassword = !showPassword"
          ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="copy(newPassword);doChangePassword();">Copy and Apply New Password</v-btn>
        </v-card-actions>  
        </v-card-text>
        <v-card-text>
          <div v-if="!!createdPasswordResetLink">You can also use a link and send it to the user so that he/she can set the password themselves (valid for 7 days): <br/>
            <span style="font-size: 10pt; font-family: monospace;">{{createdPasswordResetLink}} </span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="copy(createdPasswordResetLink); pwDialogOpen=false;">Copy Link and Close</v-btn>
          <v-btn @click="pwDialogOpen = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<style scoped>

</style>
