<script setup lang="ts">
import {ref} from "vue"
import {  AmberClient, AmberClientInit, type InvitationDetails, type UserDetails} from "amber-client"
import AmberGlobalAdmin from "./AmberGlobalAdmin.vue";
import type { VForm } from "vuetify/components";

const emit = defineEmits<{
  (e: 'userInTenant', details: {client: AmberClient,userId:string, userName:string, userEmail:string, tenant:string,roles:string[]} | null): void,
  (e: 'userReady', details: {client: AmberClient,userId:string, userName:string, userEmail:string, globalAdmin:boolean} | null): void,
}>();

var props = defineProps<{
  tenant?:string,
  allowGlobalTenantSelection?:boolean,
  skipTenantSelection?: boolean
  invitation?:string 
}>();

var tab = ref("login");
var showLogin = ref(false);
var showTenantSelector = ref(false);
var loginFailed = ref(false);
var userEmail = ref("");
var userPassword = ref("");
var showPassword = ref(false);
var showUserDetails = ref(false);
var userDetails = ref<UserDetails| null>(null);
var stayLoggedIn = ref(true);
var roles = ref<string[]>([]);
var login : (record:{email:string, pw:string, stayLoggedIn:boolean})=>void = ()=>{};
var tenant = ref("");
var tenantsToChooseFrom = ref<{ id: string; name: string; roles: string[]; }[]>([]);
var amber = ref<AmberClient | undefined>(undefined);
var invitationDetails = ref<InvitationDetails | null>(null);
var invitationFailure = ref("");
var registrationForm = ref<VForm|null>(null);

if (props.invitation)
{
  invitationFailure.value = "Loading invitation details";
}
var askedForLogin = false;
tenant.value = props.tenant || "";

var shouldShowRegisterUser = ()=>!!invitationDetails.value;

var tenantSelectorCallback:((id:string) =>void) | null = null;
var selectTenant = (tenantId:string)=>{
  tenant.value = tenantId;
  showTenantSelector.value = false;
  tenantSelectorCallback?.(tenantId);
}

var amberInit = new AmberClientInit()
  .withPath("/amber")
  .withTenantSelector(async (tenants)=>
  {
    if (tenant.value != '') return tenant.value;

    if (!props.allowGlobalTenantSelection)
    {
      tenants = tenants.filter(t=>t.id != "*");    
    }
    if (tenants.length == 1) return tenants[0].id;
    
    return await new Promise<string>((resolve, reject)=>{
      tenantSelectorCallback = resolve;
      tenantsToChooseFrom.value = tenants;
      showTenantSelector.value = true;
    });
  }
)
  .withCredentialsProvider(
    (failed)=>{
    askedForLogin = true;
    showLogin.value = true;
    loginFailed.value = failed; 
    return new Promise((resolve, reject)=>{
      showLogin.value = true;
      loginFailed.value = failed;
      login = resolve;
    })
  });

  amberInit.onUserChanged(async (user)=>{
    userDetails.value = user;
    userEmail.value = user?.email || "";
    if(props.invitation && invitationFailure.value == "")
    {
      var p = amber.value?.getUserApi()?.acceptInvitation(props.invitation);
      if (p)
      {
        await p;
      }
    }

    if (user == null)
    {
      showLogin.value = true;
      showTenantSelector.value = false;
      emit('userReady', null);
    }
    else
    {
      showLogin.value = false;
      showTenantSelector.value = false;
      emit('userReady', {
        client: amber.value!,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        globalAdmin: user.tenants["*"]?.includes("admin") || false
      });
    }
  });

  amberInit.onRolesChanged((newTenant, newRoles)=>{
    if (newRoles == null) 
    {
      roles.value = [];
    } else
    roles.value = newRoles;

    if (newTenant!= null && newRoles != null && newRoles.length > 0 && userDetails.value)
    {
      tenant.value = newTenant;
      var amberClient = amber.value!;
      var a : AmberClient = amberClient;
      emit('userInTenant', {
        client: amber.value!,
        userId: userDetails.value?.id || "",
        userName: userDetails.value?.name || "",
        userEmail: userDetails.value?.email || "",
        tenant: newTenant,
        roles: newRoles
      });
    }
    else
    {
      emit('userInTenant', null);
    }
  });

  amber.value = amberInit.start();

  if (props.invitation)
  {
    amber.value?.getUserApi().getInvitationDetails(props.invitation).then((details)=>{
      if(!details.isStillValid)
      {
        invitationFailure.value = "Invitation is no longer valid";
        return;
      }
      invitationDetails.value = details;
      invitationFailure.value = "";
    }).catch((e)=>{
      invitationFailure.value = "Invitation not found";
    });
  }

  var doLogin = ()=>{
    showLogin.value = false;
    var pw = userPassword.value;
    userPassword.value = "";
    login({email:userEmail.value, pw:pw, stayLoggedIn:stayLoggedIn.value});
  }

  var doLogout = ()=>{
    (amber.value)?.loginManager?.logout();
  }

 var validateEmail = (email:string) => {
    const re = /^[a-zA-Z0-9][a-zA-Z0-9_+\.\-]*@[a-zA-Z0-9][a-zA-Z0-9\.\-]*\.[a-zA-Z]{2,24}$/; // I don't like punny code and subdomain addresses ;-)
    if( !re.test(email))
    {
      return "Email is not in a valid format";
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
    if( pwConfirm != registerUserPassword.value)
    {
      return "Passwords do not match";
    }
    
    return true;
  }

  var registerUserEmail = ref("");
  var registerUserName = ref("");
  var registerUserPassword = ref("");
  var registerUserPasswordConfirm = ref("");

  var doRegister = async ()=>{
    var validationResult = await registrationForm.value?.validate();
    if (!validationResult || !validationResult?.valid)
    {
      return;
    }

    try{
      await amber.value?.getUserApi()?.registerUser(
      registerUserName.value,
      registerUserEmail.value,
      registerUserPassword.value,
      props.invitation
    );

    // well, we could just log in now
      invitationDetails.value = null;
      userEmail.value = registerUserEmail.value;
      userPassword.value = registerUserPassword.value;
      stayLoggedIn.value = true;
      doLogin();
    }
    catch(e)
    {
      // to do: give feedback
      return;
    }
  }



</script>

<template>
  <v-card style="margin:20px" v-if="userDetails != null && !showTenantSelector" :title="'Welcome ' + userDetails.name" :min-width="400">
    <v-card-text>
      <table>
        <tr>
        <th>
          Name
        </th>
        <td>
          {{userDetails?.name}}
        </td>
      </tr>
      <tr>
        <th>
          Email
        </th>
        <td>
          {{userDetails?.email}}
        </td>
      </tr>
      <tr v-if="!props.skipTenantSelection">
        <th>
          Tenant
        </th>
        <td>
          {{tenant}}
        </td>
      </tr>
      <tr v-if="!props.skipTenantSelection">
        <th>
          Roles
        </th>
        <td>
          <v-chip v-for="role in roles" :key="role">{{role}}</v-chip>
        </td>
      </tr>
      </table>    
    </v-card-text>
  </v-card>

  <v-card style="margin:20px" v-if="showLogin" :min-width="400">
    <v-tabs
      v-model="tab"
      bg-color="amber"
    >
      <v-tab value="login">Log In</v-tab>
      <v-tab value="register" v-if="shouldShowRegisterUser()">Create User</v-tab>
    </v-tabs>
    <v-tabs-window v-model="tab">
    <v-tabs-window-item value="login">
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
            label="Password"
          ></v-text-field>
      <v-checkbox v-model="stayLoggedIn" label="Stay logged in"></v-checkbox>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="doLogin()">Log In</v-btn>
    </v-card-actions>
  </v-tabs-window-item>
  <v-tabs-window-item value="register">
    <v-card-text>
    <v-form @submit.prevent ref="registrationForm">
    <v-text-field v-model="registerUserEmail" label="Email"
    :rules="[validateEmail]"
    ></v-text-field>
    <v-text-field v-model="registerUserName" label="Name"
    :rules="[validateName]"
    ></v-text-field>
      <v-text-field
            v-model="registerUserPassword"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw"
            @click:append="showPassword = !showPassword"
            :rules="[validatePassword]"
          ></v-text-field>
          <v-text-field
            v-model="registerUserPasswordConfirm"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :type="showPassword ? 'text' : 'password'"
            name="amber-register-pw-confirm"
            @click:append="showPassword = !showPassword"
            @keydown.enter.prevent="doRegister"
            :rules="[validatePasswordConfirm]"
          ></v-text-field>
        </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="doRegister()">Register</v-btn>
    </v-card-actions>
  </v-tabs-window-item>
  </v-tabs-window>
  <v-card-text v-if="invitationFailure" class="bg-amber-darken-4">{{ invitationFailure }}</v-card-text>
  <v-card-text v-if="invitationDetails" class="bg-amber-darken-4">You are invited to {{ invitationDetails.tenantName }} to the role {{ invitationDetails.roles.join(" and ") }}. Log in or create new user to accept the invitation.</v-card-text>
  </v-card>

  <v-card style="margin:20px" v-if="showTenantSelector" :min-width="400">
    <v-card-title>Select Tenant</v-card-title>
    <v-card-text>
      <v-list>
          <v-list-item v-for="tenant in tenantsToChooseFrom" :key="tenant.id">
            <v-list-item-title>{{tenant.name?tenant.name:"Manage Tenants"}} [{{ tenant.id }}] <v-chip v-for="role in tenant.roles">{{role}}</v-chip> </v-list-item-title>
            <v-list-item-action>
              <v-btn @click="selectTenant(tenant.id)">Select</v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>
    </v-card-text>
  </v-card>
</template>

<style scoped>

</style>
