<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserInfo} from "amber-client"
import type { CollectionAccessInfo} from "amber-client/dist/src/shared/dtos";
import AmberCollectionEditor from "./AmberCollectionEditor.vue"
var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string
}>();


const users = ref<UserInfo[]>([]);
const usersLookup = ref<Map<string, UserInfo>>(new Map());
var loggedInUser = ref<UserInfo|null>(null);

const currentSelectedUser = ref<UserInfo|null>(null);
const currentUser = ()=>currentSelectedUser.value || loggedInUser.value;
var collectionApi = props.amberClient.getCollectionsApi()!;
var tenantApi = props.amberClient.getAmberApi()!;

interface Collection{
  name: string;
  hasAccessTags: boolean;
  hasTags: boolean;
  accessRightsMethod: "roles" | "code" | "none";
}

const collections = ref<Collection[]>([]);
const selectedCollectionName = ref<string|null>(null);
const onConnectionChanged = (connected:boolean)=>{
    if(connected)
    {
      console.debug(`Connected to collection sync service`);
    }
    else
    {
      console.error(`Disconnected from collection sync service`);
    }
      
};

onMounted(async ()=>{
  var u = await props.amberClient.user();
  loggedInUser.value = {id: u.id, name: u.name, email: u.email};
  users.value = await tenantApi.getUsers();
  for(var user of users.value){
      usersLookup.value.set(user.id, user);
  }
  var collectionInfos = (await collectionApi.getCollectionsInfo());
  
  collectionApi.onConnectionChanged(onConnectionChanged);
  collectionApi.connect();
  
  
  collections.value = collectionInfos.map(
    (c)=>
      ({
        name: c.name,
        hasAccessTags: c.hasAccessTags,
        hasTags: c.hasTags,
        accessRightsMethod: c.accessRightsMethod
      }));

});


</script>
<template>
  <v-container>
  <v-row>
    <v-col cols="12">
      <v-tabs
        v-model="selectedCollectionName"
        bg-color="amber">
        <v-tab v-for="collection of collections" :value="collection.name">{{ collection.name }}</v-tab>
      </v-tabs>
    </v-col>
  </v-row>
  <v-window v-model="selectedCollectionName">
      <v-window-item v-for="collection of collections" :value="collection.name" >
        <keep-alive>
          <AmberCollectionEditor
            :amber-client="props.amberClient"
            :tenant="props.tenant"
            :collection-name="collection.name"
            :key="collection.name"
            :access-rights-method="collection.accessRightsMethod"
            :has-access-tags="collection.hasAccessTags"
            :has-tags="collection.hasTags"
            :users="users"
          />
        </keep-alive>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<style scoped>

</style>
