<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import { AmberClient, type Tenant, type UserDetails, type UserInfo} from "amber-client"
import { globalTenant } from "../../../shared/src"
import { copy, generatePassword, uiHelper} from "@/common"
import { state } from "@/common";
var props = defineProps<{amberClient: AmberClient}>();

const allTenants = ref<Tenant[]>([]);
const newTenantName = ref("");
const newTenantId = ref("");
const adminApi = props.amberClient.getGlobalAdminApi()!;
const allUsers = ref<UserInfo[]>([]);
const userFilter = ref("");
const tab  = ref<"tenants"|"users">("tenants");
const selectedUser = ref<UserDetails | null>(null);
const editSelectedUserName = ref("");
const editSelectedUserEmail = ref("");
const pwDialogOpen = ref(false);
const newPassword = ref("");
const showPassword = ref(false);

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
  var users = await adminApi.getUsers();

  users.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  allUsers.value = users;
});

var createLinkToTenantApp = (tenantId:string) :string =>
{
  var targetUrl = state.uiConfig.loginTargetUrl || "/";
  targetUrl = targetUrl.replace('{tenant}', tenantId);
    
  return targetUrl;
};

const filteredUsers = computed(() => {
  return (allUsers.value.filter(user => { 
    return !userFilter || user.name.toLowerCase().includes(userFilter.value.toLowerCase()) ||
           user.email.toLowerCase().includes(userFilter.value.toLowerCase()) ||
           user.id == userFilter.value.trim();
  })).slice(0, 20); // Limit to 20 results
});

var selectUser = async (userId: string | null) => {
  if (!userId) {
    selectedUser.value = null;
    return;
  }
  selectedUser.value = await adminApi.getUserDetails(userId);
  if (selectedUser.value) {
    editSelectedUserName.value = selectedUser.value.name;
    editSelectedUserEmail.value = selectedUser.value.email;
  } else {
    uiHelper.showError("User not found");
  }
};

var updateSelectedUser = async () => {
  if (selectedUser.value) {
    var userChanging = allUsers.value.find(u => u.id === selectedUser.value!.id);
    if (!userChanging) {
      return;
    }
    var newName = editSelectedUserName.value.trim();
    var newEmail = editSelectedUserEmail.value.trim();
    
    var result = await adminApi.updateUserDetails(selectedUser.value.id, {
      userName: newName,
      email: newEmail
    });
    if (!result.success) {
      uiHelper.showError("Error updating user: " + result.error);
      return;
    }
    userChanging.name = newName;
    userChanging.email = newEmail;
    
    uiHelper.showSuccess("User updated successfully");
  }
};

const changePassword = ()=>{
  newPassword.value = generatePassword();
  pwDialogOpen.value = true;
  showPassword.value = false;
};

const doChangePassword = async ()=>{
  pwDialogOpen.value = false;
  if (!selectedUser.value) return;
  try{
    await adminApi.updateUserDetails(selectedUser.value.id, {
      newPassword: newPassword.value
    });
    uiHelper.showSuccess("Password changed successfully");
  }catch(e){
    uiHelper.showError("Error changing password: " + e);
  }
};

const deleteUser = async () => {
  if (!selectedUser.value) return;
  if (!(await uiHelper.confirmDialog("Are you sure you want to delete user " + selectedUser.value.name + "?"))) {
    return;
  }
  try {
    await adminApi.deleteUser(selectedUser.value.id);
    uiHelper.showSuccess("User deleted successfully");
    selectedUser.value = null;
    allUsers.value = allUsers.value.filter(u => u.id !== selectedUser.value!.id);
  } catch (e) {
    uiHelper.showError("Error deleting user: " + e);
  }
};


</script>
<template>
  <v-container>
    <v-tabs
      v-model="tab"
      bg-color="amber"
    >
      <v-tab value="tenants">Manage Tenants</v-tab>
      <v-tab value="users">Manage User</v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
    <v-tabs-window-item value="tenants">
    <v-row >
      <v-card width="100%">
        <v-card-text>
          <v-list>
            <v-list-item v-for="tenant in allTenants" :key="tenant.id">
              <v-list-item-title>{{tenant.name}} [{{ tenant.id }}]</v-list-item-title>
              <v-list-item-action>
                <v-btn icon="mdi-application-edit" title="manage" :href='"admin?tenant=" + tenant.id'></v-btn>
                <v-btn icon="mdi-open-in-new" title="visit" :href='createLinkToTenantApp(tenant.id)' v-if="tenant.id != globalTenant"></v-btn>
                <v-btn icon="mdi-chart-line" title="monitoring" :href='"monitoring?tenant="+tenant.id'></v-btn>
                <v-btn icon="mdi-delete-outline" @click="deleteTenant(tenant.id)" title="delete" v-if="tenant.id != globalTenant"></v-btn>
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
    </v-tabs-window-item>
    <v-tabs-window-item value="users">
      <v-row>
        <v-card width="100%">
          <v-card-text v-if="selectedUser">
            <p style="text-align:right; color:#777">Id: {{ selectedUser.id }}</p>
            <v-text-field v-model="editSelectedUserName" label="Username"></v-text-field>
            <v-text-field v-model="editSelectedUserEmail" label="Email"></v-text-field>
            <v-chip-group>
              <v-chip v-for="tenant in Object.keys(selectedUser.tenants)" :key="tenant" :title="selectedUser.tenants[tenant]?.toString()" :href='"admin?tenant=" + tenant'>
                <span>{{ tenant }}</span>
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-actions v-if="selectedUser">
            <v-btn @click="selectUser(null)" prepend-icon="mdi-arrow-left-circle">Back to user list</v-btn>
            <v-btn @click="updateSelectedUser" prepend-icon="mdi-check-circle" :disabled="editSelectedUserName == selectedUser.name && editSelectedUserEmail == selectedUser.email">Update User</v-btn>
            <v-btn @click="changePassword()" prepend-icon="mdi-key-variant">Change Password</v-btn>
            <v-btn @click="deleteUser()" prepend-icon="mdi-delete">Delete User</v-btn>

          </v-card-actions>
          <v-card-text v-if="!selectedUser">
            <v-text-field v-model="userFilter" label="Filter users by name, email or id"></v-text-field>
            <v-list>
              <v-list-item v-for="user in filteredUsers" :key="user.id" @click="selectUser(user.id)">
                <v-list-item-title>{{user.name}}</v-list-item-title>
                <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-row>
    </v-tabs-window-item>
    </v-tabs-window>
    <v-dialog v-model="pwDialogOpen" max-width="600">
      <v-card>
        <v-card-title class="headline">Change User Password</v-card-title>
        <v-card-subtitle class="headline">Reset the password of {{ selectedUser?.name }} ({{ selectedUser?.email }}). Feel free to use the autogenerated password below or create your own.</v-card-subtitle>
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
</v-container>
</template>

<style scoped>

</style>
