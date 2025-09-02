<script setup lang="ts">
import {ref} from "vue"
import {  AmberClient, AmberClientInit, AmberUserApi, type InvitationDetails, type UserDetails} from "amber-client"
import AmberGlobalAdmin from "./AmberGlobalAdmin.vue";
import type { VForm } from "vuetify/components";
import { uiHelper } from "@/common";
import { sleep } from "amber-client/dist/src/shared/helper";

const emit = defineEmits<{
  (e: 'passwordChanged'): void
}>();

var props = defineProps<{
  token:string,
  userEmail:string
}>();

var userPassword = ref("");
var userPasswordConfirm = ref("");
var showPassword = ref(false);
var userEmail = ref(props.userEmail);
var amberUserApi = new AmberUserApi("/amber", null);


  var changePassword = async ()=>{
    
    var pw = userPassword.value;
    try{
      var result = await amberUserApi.changePasswordWithToken(props.token, pw);
      
      if(result)
      {
        uiHelper.showSuccess("Password changed successfully");
        await sleep(2000);
        emit("passwordChanged");
        return;
      }
    }
    catch(e){}
    uiHelper.showError("Could not change password");
  }

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
  }

  var validatePasswordConfirm = (pwConfirm:string)=>{
    if( pwConfirm != userPassword.value)
    {
      return "Passwords do not match";
    }
    
    return true;
  }

</script>

<template>
  <v-card style="margin:20px" :min-width="400">
    <v-card-title>Reset password for {{ userEmail }}</v-card-title>
   
    <v-card-text>
      <v-form>
      <v-text-field
            v-model="userPassword"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-pw"
            @click:append="showPassword = !showPassword"
            label="New Password"
            :rules="[validatePassword]"
          ></v-text-field>
          <v-text-field
            v-model="userPasswordConfirm"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw-confirm"
            @click:append="showPassword = !showPassword"
            label="Confirm Password"
            :rules="[validatePasswordConfirm]"
          ></v-text-field>
        </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="changePassword()">Set new Password</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>

</style>
