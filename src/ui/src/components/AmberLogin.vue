<script setup lang="ts">
import {ref} from "vue"
import {  AmberClient, AmberClientInit, type UserDetails} from "amber-client"
import AmberGlobalAdmin from "./AmberGlobalAdmin.vue";
import { state } from "@/state";

var showLogin = ref(false);
var loginFailed = ref(false);
var userEmail = ref("");
var userPassword = ref("");
var showPassword = ref(false);
var userDetails = ref<UserDetails| null>(null);
var stayLoggedIn = ref(false);
var roles = ref<string[]>([]);
var login : (record:{email:string, pw:string, stayLoggedIn:boolean})=>void = ()=>{};
var tenant = ref("*");
var amber = ref<AmberClient | undefined>(undefined);

tenant.value = state.amberTenant;

var amberInit = new AmberClientInit()
  .withPath("/amber")
  .withTenant(tenant.value)
  .withCredentialsProvider(
    (failed)=>{
    showLogin.value = true;
    loginFailed.value = failed; 
    return new Promise((resolve, reject)=>{
      showLogin.value = true;
      loginFailed.value = failed;
      login = resolve;
    })
  });

  amberInit.onUserChanged((user)=>{
    userDetails.value = user;
    userEmail.value = user?.email || "";
  });

  amberInit.onRolesChanged((newTenant, newRoles)=>{
    if (newRoles == null) 
    {
      roles.value = [];
      return;
    }
    roles.value = newRoles;
    if (newTenant == '*' && newRoles.includes('admin')){
      
    }
  });

  amber.value = amberInit.start();

  var getAmberClient = ()=>amber.value;

  var doLogin = ()=>{
    showLogin.value = false;
    var pw = userPassword.value;
    userPassword.value = "";
    login({email:userEmail.value, pw:pw, stayLoggedIn:stayLoggedIn.value});
  }

  var doLogout = ()=>{
    (amber.value)?.loginManager?.logout();
  }
</script>

<template>
  <v-container>
  <v-row>
  <v-card style="margin:20px" v-if="userDetails != null">
    <v-card-title>Welcome {{userDetails.name}}</v-card-title>
    <v-card-text><p>{{ userDetails.email }}</p>
      <table>
        <tr v-for="role in userDetails.tenants[tenant]">
        <td>
        </td>
        <td>
         <v-chip >{{ role }}</v-chip>
        </td>
      </tr>
      </table>    

    </v-card-text>
    <v-card-actions>
      <v-btn @click="amber?.loginManager?.logout()">Log Out</v-btn>
    </v-card-actions>
  </v-card>

  <v-card style="margin:20px" width="400px" v-if="showLogin">
    <v-card-title>LogIn</v-card-title>
    <v-card-text><p v-if="tenant">Tenant {{ tenant }}</p></v-card-text>
    <v-card-text><p v-if="loginFailed">Wrong email or password</p>
      <v-text-field v-model="userEmail" label="Email"></v-text-field>
      <v-text-field
            v-model="userPassword"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-pw"
            @click:append="showPassword = !showPassword"
            @keydown.enter.prevent="doLogin"
          ></v-text-field>
      <v-checkbox v-model="stayLoggedIn" label="Stay logged in"></v-checkbox>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="doLogin()">Log In</v-btn>
    </v-card-actions>
  </v-card>
  </v-row>
  <amber-global-admin :amber-client="amber!" v-if="tenant == '*' && roles.includes('admin')"> 
  </amber-global-admin>
  </v-container>
</template>

<style scoped>

</style>
