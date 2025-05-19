<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type TenantWithRoles, type Tenant, type UserDetails, amberClient} from "amber-client"
import { globalTenant } from "../../../shared/src"
import { uiHelper} from "@/state"
import { state } from "@/state";
var props = defineProps<{amberClient: AmberClient}>();
var tenantsWithRoles = ref<TenantWithRoles[]>([]);
var mode = ref<"changepw" | "changename" |"">("");
var userApi = props.amberClient.getUserApi()!;
var amberUser = ref<UserDetails>({} as UserDetails);
var nameToChange = ref("");
var changeUserPassword = ref("");
var changeUserPasswordConfirm = ref("");
var changeUserOldPassword = ref("");
var showPassword = ref(false);
var validatePassword = (pw:string)=>{
    if( pw.length < 8)
    {
      return "Password must be at least 8 characters long";
    }

    if(pw.trim() != pw)
    {
      return "Password must not contain leading or trailing spaces";
    }

    return true;
  };

var validateName = (name:string) => {
    if (name.length < 3) {
      return "Name must be at least 3 characters long";
    }
    if (name.trim() != name) {
      return "Name must not contain leading or trailing spaces";
    }
    return true;
  };
 var validatePasswordConfirm = (pwConfirm:string)=>{
    if( pwConfirm != changeUserPassword.value)
    {
      return "Passwords do not match";
    }
    
    return true;
  }

onMounted(async ()=>{
  tenantsWithRoles.value = await userApi.getUserTenants();
  amberUser.value = await userApi.getUserDetails();
  nameToChange.value = amberUser.value.name;
});

var changeName = async () =>
{
  if (nameToChange.value !== amberUser.value.name)
  {
    var result = await userApi.updateUserDetails( nameToChange.value);
    if(result?.success !== true)
    {
      uiHelper.showError("Error changing name: " + result.error);
      return;
    }
    else
    {
      amberUser.value.name = nameToChange.value;  
      props.amberClient.loginManager.refreshUser();
      uiHelper.showSuccess("Name changed successfully");
    }
  }
  else
  {
    uiHelper.showMessage("Name is the same as before");
  }
};

var doChangePassword = async () =>
{
  if (changeUserPassword.value !== changeUserPasswordConfirm.value)
  {
    uiHelper.showError("Passwords do not match");
    return;
  }
  if (changeUserPassword.value === changeUserOldPassword.value)
  {
    uiHelper.showError("New password must be different from old password");
    return;
  }
  var result = await userApi.changePassword(amberUser.value.id, changeUserOldPassword.value, changeUserPassword.value);
  if (result?.success !== true)
  {
    uiHelper.showError("Error changing password: " + result.error);
    return;
  }
    uiHelper.showSuccess("Password changed successfully");
};

</script>
<template>
  <v-container>
  <v-card>
    <v-card-title class="headline"> Things you can do...</v-card-title>
    <v-card-actions>
      <v-btn @click="props.amberClient.getUserApi().logout()">Logout</v-btn>
      <v-btn @click="mode = 'changename'">Change Name</v-btn>
      <v-btn @click="mode = 'changepw'">Change Password</v-btn>
    </v-card-actions>
    <v-card-text v-if="mode === 'changename'">
      <v-text-field
        v-model="nameToChange"
        label="Change your user name"
        @keyup.enter="changeName()"
        autofocus
        :rules="[validateName]"
      ></v-text-field>
      <v-btn @click="changeName()" :disabled="validateName(nameToChange) !== true">Change Name</v-btn>
    </v-card-text>
    <v-card-text v-if="mode === 'changepw'">
      <v-text-field
            label="Old Password"

            v-model="changeUserOldPassword"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-old-pw"
            @click:append="showPassword = !showPassword"
          ></v-text-field>
      <v-text-field
            label="New Password"
            v-model="changeUserPassword"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw"
            @click:append="showPassword = !showPassword"
            :rules="[validatePassword]"
          ></v-text-field>
          <v-text-field
            label="Confirm New Password"
            v-model="changeUserPasswordConfirm"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw-confirm"
            @click:append="showPassword = !showPassword"
            @keydown.enter.prevent="doChangePassword()"
            :rules="[validatePasswordConfirm]"
          ></v-text-field>
      <v-btn @click="doChangePassword()" :disabled="validatePassword(changeUserPassword) !== true || validatePasswordConfirm(changeUserPasswordConfirm) !== true">Change Password</v-btn>
    </v-card-text>
    
  </v-card>
</v-container>
</template>

<style scoped>

</style>
