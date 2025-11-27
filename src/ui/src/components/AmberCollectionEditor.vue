<script setup lang="ts">
import {ref, onMounted, watch, toRaw, computed, useTemplateRef} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails, type TenantDetails, type UserInfo, amberClient, type AmberCollection} from "amber-client"
import { copy, generatePassword, renderIsoTime, renderRelativeTime, uiHelper} from "@/common"
import JsonEdit from "./shared/JsonEdit.vue"
import type { CollectionAccessInfo, CollectionDocument, CollectionInfo } from "amber-client/dist/src/shared/dtos";
import { adminRole } from "../../../shared/src";
var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string,
  collectionName: string,
  hasAccessTags:boolean;
  hasTags:boolean;
  accessRightsMethod: "code" | "roles" | "none";
  users:UserInfo[]
}>();


const data = ref<Map<string, CollectionDocument<any>>>(new Map<string, CollectionDocument<any>>());
const lastChangeNumber = ref<number>(0);
const live=ref<boolean>(false);

var api = props.amberClient.getCollectionsApi()!.getCollection<any>(props.collectionName);
var adminApi = props.amberClient.getCollectionsApi()!.getCollectionAdmin<any>(props.collectionName);
const usersLookup = ref<Map<string, UserInfo>>(new Map());

var loggedInUser = ref<UserInfo|null>(null);

const currentSelectedUser = ref<UserInfo|null>(null);
const currentUser = ()=>currentSelectedUser.value || loggedInUser!.value!;
const showSelectUser = ref<boolean>(false);
const currentUserAccess = ref<CollectionAccessInfo>({accessTags:[]});
const collectionsClient = props.amberClient.getCollectionsApi();
var collectionApi = props.amberClient.getCollectionsApi()!;

var editEntity = ref<CollectionDocument<any>|null>(null);
const showEditEntity = ref<boolean>(false);
const selectedEntityTags = ref<string[]>([]);
const selectedEntityAccessTags = ref<string[]>([]);
const jsonEditOpen = ref<boolean>(false);
const editEntityAccessTags = ref<string[]>([]);
const editEntityTags= ref<string[]>([]);
const editEntityValid= ref<boolean>(false);
const editEntityValidationErrors = ref<string>();
const editEntityAuthorized = ref<boolean>(false);
const entityInfoBusy = ref<boolean>(false);
var viewEntityId = ref<string>("");
var editJson = ref<string>("");

var receiveEntitySync = (msg: CollectionDocument<any>)=>{
    lastChangeNumber.value = msg.change_number;
    data.value.set(msg.id, msg);
    };

var receiveEntityRemoval  = (msgId: string)=>{
        data.value.delete(msgId);
    };

type SearchOperator = "equal" | "notEqual" | "similar" | "regex" | "largerOrEqual" | "smallerOrEqual" | "exists";
const SearchScopeAll = "all";
const SearchScopeId = "id";
const SearchScopeUser = "user";
const SearchScopeDate = "date";
const SearchScopeData = ".";

const renderSearchScope = (searchScope:string):string=>{
    if (searchScope == SearchScopeAll) return "Any Property";
    if (searchScope == SearchScopeId) return "Document ID";
    if (searchScope == SearchScopeUser) return "Changed By User";
    if (searchScope == SearchScopeDate) return "Change Time";
    if (searchScope.startsWith(SearchScopeData)) return `Data Path .${searchScope.substring(1)}.*`;
    return searchScope;
};

const renderSearchOperator = (operator:SearchOperator):string=>{
    switch(operator)
    {
        case "equal": return "Equals";
        case "notEqual": return "Not Equals";
        case "similar": return "Contains";
        case "regex": return "Regular Expression";
        case "largerOrEqual": return "Larger or Equal";
        case "smallerOrEqual": return "Smaller or Equal";
        case "exists": return "Exists";
    }
    return operator;
};

interface SearchCondition{
    scope: string;
    operator: SearchOperator;
    value: string;
}

const searchConditions = ref<SearchCondition[]>([]);

const editSearchScope = ref<string>(SearchScopeAll);
const editSearchScopeDataPath = ref<string>("");
const editSearchOperator = ref<SearchOperator>("similar");
const editSearchValue = ref<string>("");
const editSelectedConditionIndex = ref<number | null>(null);

const addSearchCondition = ()=>{
    searchConditions.value.push({
        scope: editSearchScope.value + (editSearchScope.value == SearchScopeData ? editSearchScopeDataPath.value : ""),
        operator: editSearchOperator.value,
        value: editSearchOperator.value != "exists" ? editSearchValue.value : ""
    });
};

const dataLoaded=()=> lastChangeNumber.value >0;

const updateSearchCondition = ()=>{
    if (editSelectedConditionIndex.value == null) return;
    var condition = searchConditions.value[editSelectedConditionIndex.value];
    condition.scope = editSearchScope.value + (editSearchScope.value == SearchScopeData ? editSearchScopeDataPath.value : "");
    condition.operator = editSearchOperator.value;
    condition.value = editSearchOperator.value != "exists" ? editSearchValue.value : "";
};

const replaceSearchConditions = ()=>{
  if(!(lastChangeNumber.value) && !(live.value))
  {
    switchSubscription(true);    
  }
    searchConditions.value = [{
        scope: editSearchScope.value + (editSearchScope.value == SearchScopeData ? editSearchScopeDataPath.value : ""),
        operator: editSearchOperator.value,
        value: editSearchOperator.value != "exists" ? editSearchValue.value : ""
    }];
    editSelectedConditionIndex.value = 0;
};

const newSearchCondition = ()=>{
    editSearchScope.value = SearchScopeAll;
    editSearchOperator.value = "similar";
    editSearchValue.value = "";
    editSelectedConditionIndex.value = null;
}

const editSearchCondition = (index:number)=>{
    var condition = searchConditions.value[index];
    if (condition.scope.startsWith(SearchScopeData))
    {
        editSearchScope.value = SearchScopeData;
        editSearchScopeDataPath.value = condition.scope.substring(1);
    }
    else
    {
        editSearchScope.value =  condition.scope;
        editSearchScopeDataPath.value = "";
    }
    editSearchScope.value = condition.scope;
    editSearchOperator.value = condition.operator;
    editSearchValue.value = condition.value;
    editSelectedConditionIndex.value = index;
}

const removeSearchCondition = (index:number)=>{
    searchConditions.value.splice(index, 1);
    editSelectedConditionIndex.value = null;
}

var flattenValue = (value:any):string[]=>{
    var result: string[] = [];
    if (value == null) return result;
    if (Array.isArray(value))
    {
        for(var v of value)
        {
            result.push(...flattenValue(v));
        }
    }
    else if (typeof value == "object")
    {
        for(var o of Object.values(value))
        {
            result.push(...flattenValue(o));
        }
    }
    else
    {
        result.push(String(value));
    }
    return result;
};

const match = (doc:CollectionDocument<any>, condition:SearchCondition):boolean=>{
    var scope = condition.scope;
    var operator = condition.operator;
    var value = condition.value;

    var targetValues: any[] = [];
    if (scope == SearchScopeAll)
    {
        targetValues.push(doc.id);
        targetValues.push(doc.change_user);
        targetValues.push(doc.change_time);
        targetValues.push(...flattenValue(doc.data));
    }
    else if (scope == SearchScopeId)
    {
        targetValues.push( doc.id);
    }
    else if (scope == SearchScopeUser)
    {
        targetValues.push( doc.change_user);
    }
    else if (scope == SearchScopeDate)
    {
        targetValues.push( doc.change_time);
    }
    else if (scope.startsWith(SearchScopeData))
    {
        var dataPath = scope.substring(1);
        var paths = dataPath.split(".");
        var currentData: any = doc.data;
        for(var p of paths)
        {
            if (p == "") continue;
            if (currentData && p in currentData)
            {
                currentData = currentData[p];
            }
            else
            {
                currentData = null;
                break;
            }
        }

        targetValues.push(...flattenValue(currentData));
    }

    for(var targetValue of targetValues)
    {
        switch(operator)
        {
            case "equal":
                if (String(targetValue) == value) return true;
                break;
            case "notEqual":
                if (String(targetValue) != value) return true;
                break;
            case "similar":
                if (String(targetValue).toLowerCase().includes(value.toLowerCase())) return true;
                break;
            case "regex":
                try{
                    var re = new RegExp(value);
                    if (re.test(String(targetValue))) return true;
                }
                catch(e){
                    console.error(`Invalid regex ${value}: ${e}`);
                }
                break;
            case "largerOrEqual":
                if (String(targetValue) >= value) return true;
                break;
            case "smallerOrEqual":
                if (String(targetValue) <= value) return true;
                break;
            case "exists":
                if (targetValue != null) return true;
                break;
        }
    }

    return false;
};  

const searchFilter = (doc:CollectionDocument<any>):boolean=>{
    for(var condition of searchConditions.value)
    {
        if (!match(doc, condition))
        {
            return false;
        }
    }
    return true;
};



const searchfield = useTemplateRef<HTMLInputElement>("searchfield");

onMounted(async ()=>{
  var u = await props.amberClient.user();
  loggedInUser.value = {id: u.id, name: u.name, email: u.email};
  
  for(var user of props.users){
      usersLookup.value.set(user.id, user);
  }

  await updateUserCollectionDetails();
  setTimeout(()=>{
    searchfield.value?.focus();
  }, 100);
});

const getUser = (userId:string | null)=>{
    if (!userId) return "No one";
    var u = usersLookup.value.get(userId);
    if (u) return u.name + " (" + u.email + ")";
    return  "Unknown User";
};

const updateUserCollectionDetails = async ()=>{
    var userId = currentUser()?.id;
    if (!userId) {
        currentUserAccess.value = {accessTags:[]};
        return;
    }
    var collectionAdminApi = collectionsClient.getCollectionAdmin<any>(props.collectionName);
    currentUserAccess.value = await collectionAdminApi.getUserAccess(userId);
};

const switchSubscription = ( subscribe:boolean )=>{
    
    if (live.value == subscribe) return;
    if (subscribe)
    {
      api.subscribe(lastChangeNumber.value, receiveEntitySync, receiveEntityRemoval);
      live.value = true;
      uiHelper.showSuccess(`Subscribed to ${props.collectionName} changes`);
    }
    else
    {
      api.unsubscribe();
      live.value = false;
      uiHelper.showSuccess(`Unsubscribed from ${props.collectionName} changes`);
    }
};

const getEntityInfo = async ()=>{
  entityInfoBusy.value = true;
  try{
    if (!editEntity.value)
        return;
    var res = await adminApi.getDocumentInfo(editEntity.value.id);
    if (res){
        selectedEntityTags.value = res.tags || [];
        selectedEntityAccessTags.value = res.access_tags || [];
    }
  }catch(e){
      console.error(`Failed to get document info: ${e}`);
  }
  entityInfoBusy.value = false;
};


const validateEditEntity = async ()=>{
    if (showEditEntity.value == false)
        return;
    entityInfoBusy.value = true;
    try{
      if (!editEntity.value)
      {
          entityInfoBusy.value = false;
          return;
      }
      var checkInfo = await adminApi.checkDocument(JSON.parse(editJson.value), currentUser()?.id, editEntity.value?.id);
      editEntityAccessTags.value = checkInfo.createdAccessTags || [];
      editEntityTags.value = checkInfo.createdTags || [];
      editEntityValid.value = checkInfo.isValid;
      editEntityValidationErrors.value = checkInfo.error || "";
      editEntityAuthorized.value = checkInfo.authorized;
    }
    catch(e){
        editEntityAccessTags.value = [];
        editEntityTags.value = [];
        editEntityValid.value = false;
        editEntityValidationErrors.value = "Failed to validate document";
        editEntityAuthorized.value = true;
    }
    finally{
        entityInfoBusy.value = false;
    }
};



const selectEditEntity = async (entity: CollectionDocument<any> | null)=>{
  editEntity.value = entity;
  editEntityAccessTags.value =  [];
  editEntityTags.value = [];
  editEntityValid.value = true;
  editEntityValidationErrors.value = "";
  editEntityAuthorized.value = true;
  if (entity)
  {
    editJson.value = JSON.stringify(entity.data, null, 2);
  }
  else
  {
    editJson.value = "";
  }
  showEditEntity.value = true;
  await getEntityInfo();
  await validateEditEntity();
};

const saveEditEntity = async ()=>{
    setTimeout(async () => {
     entityInfoBusy.value = true;
    var isUpdate = editEntity.value != null;
    try{
      var updatedDoc = await adminApi.createOrUpdateDocument(
        JSON.parse(editJson.value),
        editEntity.value?.id,
        currentUser().id
      );
      showEditEntity.value = false;
      if (isUpdate)
      {
        uiHelper.showSuccess(`Document ${updatedDoc.result} updated successfully`);
      }
      else
      {
        uiHelper.showSuccess(`Document ${updatedDoc.result} created successfully`);
      }
      
    }
    catch(e){
        uiHelper.showError(`Failed to save document: ${e}`);
    }
    finally{
        entityInfoBusy.value = false;
    } 
    }, 10); // we allow the blur event of the json edit to process first
    
};

const deleteEditEntity = async ()=>{

  if (!editEntity.value)
        return;
  var confirmed = await uiHelper.confirmDialog(`Are you sure you want to delete document ${editEntity.value?.id}? This action cannot be undone.`);
  if (!confirmed)
      return;
    
    entityInfoBusy.value = true;
    try{
      await api.deleteDoc(editEntity.value.id);
      showEditEntity.value = false;
      uiHelper.showSuccess(`Document ${editEntity.value.id} deleted successfully`);
    }
    catch(e){
        uiHelper.showError(`Failed to delete document: ${e}`);
    }
    finally{
        entityInfoBusy.value = false;
    } 
};

const newEditDocument = async ()=>{
    
    editEntity.value = null;
    editJson.value = "{}";
    selectedEntityTags.value = [];
    selectedEntityAccessTags.value = [];
    showEditEntity.value = true;
    await validateEditEntity();
    
};

const selectViewEntity = (entity: CollectionDocument<any> | null)=>{
  if (!entity || viewEntityId.value == entity.id )
  {
    viewEntityId.value = "";
    return;
  }
  viewEntityId.value = entity?.id || "";
};


const visibleEntities = computed(()=>{
  var result: CollectionDocument<any>[] = [];
  
  for (var doc of data.value.values())
  {
    if(result.length >= 50)
      break;  
    if (!searchFilter(doc))
      continue;
    result.push(doc);
  }
  return result;
});

watch(currentSelectedUser, async (newVal)=>{
  showSelectUser.value = false;
  await updateUserCollectionDetails();
  await validateEditEntity();
});

watch(editJson, async (newVal)=>{
  await validateEditEntity();
});


</script>
<template>
  <v-container>
<v-row >
    <v-col cols="12">
      <v-card prepend-icon="mdi-database">
      <template v-slot:title>
        <v-badge v-if = "dataLoaded()" floating  :offset-x="-10" location="right" color="primary" :content=" data.size">
          {{props.collectionName}}
        </v-badge>     
        <span v-else>
          {{props.collectionName}}
        </span>
      </template>
      <template v-slot:append>
        <v-btn :disabled="live" :loading="live == true" icon="mdi-database-sync" density="compact" title="View and Sync Data into the Browser" @click="switchSubscription(true)"></v-btn>
        <v-btn :disabled="!live" icon="mdi-sync-off" density="compact" title="Stop Data Sync" @click="switchSubscription(false)"></v-btn>
        </template>
      <v-card-subtitle>
        <v-icon small v-if="accessRightsMethod =='roles'" title="Role based access control">mdi-account-lock</v-icon>
        <v-icon small v-if="accessRightsMethod =='code'" title="Code based access control">mdi-shield-lock</v-icon>
        <v-icon small v-if="accessRightsMethod =='none'" title="No access control">mdi-lock-open-variant</v-icon>
        <v-icon small v-if="hasAccessTags" title="Access tags enabled">mdi-account-tag</v-icon>
        <v-icon small v-if="hasTags" title="Searchable tags enabled">mdi-tag-search</v-icon>
      </v-card-subtitle>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn prepend-icon = "mdi-plus" class="mt-2" color="primary" @click="newEditDocument()">New Document</v-btn> 
      </v-card-actions>
    </v-card>
    </v-col>
</v-row>
  <v-row>
    <v-col cols="12" >
    <v-card class="fill-height" prepend-icon="mdi-magnify">
      <template v-slot:title>
        <v-badge v-if = "dataLoaded()" floating  :offset-x="-10" location="right" color="primary" :content=" visibleEntities.length">
          Search
        </v-badge>  
        <span v-else>
          Search
        </span>   

      </template>
      <v-card-text>
        <div>
          <v-chip
            v-for="(condition, index) in searchConditions"
            :key="index"
            :color="index == editSelectedConditionIndex ? 'primary':''"
            class="ma-1"
          >
            <span>{{ renderSearchScope(condition.scope) }} {{ renderSearchOperator(condition.operator) }} <template v-if="condition.operator != 'exists'">"{{ condition.value }}"</template> </span>
            <v-icon
              small
              class="ml-2"
              @click="editSearchCondition(index)"
              title="Edit Condition">mdi-pencil</v-icon>
            <v-icon
              small
              class="ml-2"
              @click="removeSearchCondition(index)"
              title="Remove Condition">mdi-close</v-icon>
          </v-chip>
          <v-chip class="ma-1" @click="newSearchCondition()" v-if="editSelectedConditionIndex != null">
            <v-icon
              small
              class="ml-2"
              title="New Search Condition">mdi-plus</v-icon>
          </v-chip>
        </div>
        <v-row>
          <v-col xl="6">
            <h4>Scope</h4>
            <div>
              <v-btn-toggle v-model="editSearchScope" color="primary" :border="true"  mandatory rounded="0">
                <v-btn icon="mdi-text-box-search-outline" :value="SearchScopeAll" title="search in all properties"></v-btn>
                <v-btn icon="mdi-identifier" :value="SearchScopeId" title="search in the document id"></v-btn>
                <v-btn icon="mdi-account-search" :value="SearchScopeUser" title="search based on the user who changed the document"></v-btn>
                <v-btn icon="mdi-calendar-range" :value="SearchScopeDate" title="search based on the sortable ISO time"></v-btn>
                <v-btn icon="mdi-file-tree" :value="SearchScopeData" title="search in the document data"></v-btn>
              </v-btn-toggle>
            </div>
            <div>
            <v-text-field
              v-if="editSearchScope == SearchScopeData"
              v-model="editSearchScopeDataPath"
              label="Data Path, separate by . for nested properties"
              prepend-icon="mdi-file-tree"
              class="mt-2"
            ></v-text-field>
            </div>
          </v-col>
          <v-col xl="4" >
            <h4>Operator</h4>
            <v-btn-toggle v-model="editSearchOperator" color="primary" class="mt-2" :border="true"  mandatory rounded="0">
              <v-btn icon="mdi-equal" value="equal" title="equals"></v-btn>
              <v-btn icon="mdi-not-equal" value="notEqual" title="equals"></v-btn>
              <v-btn icon="mdi-approximately-equal" value="similar" title="contains"></v-btn>
              <v-btn icon="mdi-regex" value="regex" title="regular expression"></v-btn>
              <v-btn icon="mdi-greater-than-or-equal" value="largerOrEqual" title="larger or equal"></v-btn>
              <v-btn icon="mdi-less-than-or-equal" value="smallerOrEqual" title="smaller or equal"></v-btn>
              <v-btn icon="mdi-checkbox-multiple-marked-outline" value="exists" title="existence of a property"></v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row>
          <v-col xl="8" v-if ="editSearchOperator !='exists'">
            <h4>Value</h4>
            <v-text-field
            v-model="editSearchValue"
            label="Search Value"
            prepend-icon="mdi-form-textbox"
            class="mt-2"
            @keyup.enter="editSelectedConditionIndex != null ? updateSearchCondition() : replaceSearchConditions()"
            ref="searchfield"
            > </v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn prepend-icon = "mdi-check" class="mt-2" color="primary" @click="updateSearchCondition()" v-if="editSelectedConditionIndex != null">Update Term</v-btn>
        <v-btn prepend-icon = "mdi-plus" class="mt-2" color="primary" @click="addSearchCondition()" v-if="searchConditions.length>0">Add Term</v-btn>
        <v-btn prepend-icon= "mdi-magnify" class="mt-2" color="primary" @click="replaceSearchConditions()" v-if="searchConditions.length!=1 || editSelectedConditionIndex == null">New Search</v-btn>
      </v-card-actions>
    </v-card>
    </v-col>
  </v-row>
  <v-row>
    
    <div id="entity-list">
      <v-btn v-if="!dataLoaded() && !live" color="primary" prepend-icon="mdi-database-sync" @click="switchSubscription(true)">Load data by starting synchronization</v-btn>
      <div class="entity-row" v-for="doc of visibleEntities" :key="doc.id" @click="selectViewEntity(doc)" style="cursor: pointer;" :class="{selected:editEntity?.id == doc.id && showEditEntity, viewed: doc.id == viewEntityId}">
          <span class="id" :title="doc.id">
            #{{ doc.id }}
          </span>
          <span class="time" :title="renderIsoTime(doc.change_time)">
            {{ renderRelativeTime(doc.change_time) }}
          </span>
          <span class="user">
            by {{getUser(doc.change_user)}}
          </span>
          <span class="edit-entity-action">
            <v-btn icon="mdi-pencil" density="compact" title="Edit Document" @click.stop="selectEditEntity(doc)" size="small"></v-btn>
          </span>
      <div @click.stop="selectEditEntity(doc)" id="selected-json" v-if = "doc.id == viewEntityId || visibleEntities.length ==1">
        <pre>{{ JSON.stringify(doc.data, null, 2) }}</pre>
      </div>
      </div>
    </div>
  </v-row>
  </v-container>
  <v-dialog v-model="showEditEntity">
    <v-card :loading="entityInfoBusy">
      <v-card-title>
        <template v-if="editEntity!=null">Edit Document {{ editEntity.id }} as </template>
        <template v-if="editEntity==null">New Document as </template>
        <template v-if="showSelectUser">
          <v-select
            v-model="currentSelectedUser"
            return-object
            label="User"
            clearable
            :item-title="(u)=>u.name + ' (' + u.email + ')'"
            :items="users"
          ></v-select>
        </template>
        <template v-else>
        {{ currentUser()?.name }} ({{ currentUser()?.email }}) <v-btn icon="mdi-pencil" small @click="showSelectUser = true" title="Change User"></v-btn>
        </template>
      </v-card-title>
      <v-card-subtitle>
        <div v-if="accessRightsMethod =='roles' ">
            User Collection Roles:
              <v-chip
                v-for="tag in currentUserAccess.accessRights"
                :key="tag"
                outlined
              >{{ tag }}</v-chip>
          </div>
          <div v-if="hasAccessTags">
            User Access Tags for Collection:
              <div v-if="currentUserAccess.accessTags?.length < 1">No access tags assigned</div>
              <v-chip
                v-for="tag in currentUserAccess.accessTags"
                :key="tag"
                outlined
              >{{ tag }}</v-chip>
          </div>
      </v-card-subtitle>
      <v-card-subtitle v-if="editEntity != null">
        <div v-if="hasAccessTags ">
            Document Access Tags:
              <v-chip
                v-for="tag in selectedEntityAccessTags"
                :key="tag"
                outlined
              >{{ tag }}</v-chip>
          </div>
          <div v-if="hasTags">
            Document Tags:
              <v-chip
                v-for="tag in selectedEntityTags"
                :key="tag"
                outlined
              >{{ tag }}</v-chip>
          </div>
      </v-card-subtitle>
      <v-card-text>
        <JsonEdit v-model="editJson" @active="(v)=>jsonEditOpen=v"/>
      </v-card-text>
      <v-card-item>
        <v-alert type="error" v-if="!editEntityValid">
          <div>
            <strong>Document is not valid:</strong>
          </div>
          <div>
            {{ editEntityValidationErrors }}
          </div>
        </v-alert>
        <v-alert type="info" v-else>
          <div>
            <strong>Document is valid.</strong>
          </div>
        </v-alert>

        <v-alert type="warning" v-if="!editEntityAuthorized">
          <div>
            <strong>The selected user would not be authorized to do this change</strong>
          </div>
        </v-alert>
      </v-card-item>

      <v-card-item>
        <template v-if="hasTags">
        <div>
          <strong>Generated Tags:</strong>
        </div>
        <div>
          <span v-if="editEntityTags.length == 0">No tags generated</span>
          <v-chip
            v-for="tag in editEntityTags"
            :key="tag"
            outlined
          >{{ tag }}</v-chip>
        </div>
        </template>
        <template v-if="hasAccessTags">
        <div>
          <strong>Generated Access Tags:</strong>
        </div>
        <div>
          <span v-if="editEntityAccessTags.length == 0">No access tags generated</span>
          <v-chip
            v-for="tag in editEntityAccessTags"
            :key="tag"
            outlined
          >{{ tag }}</v-chip>
        </div>
        </template>
      </v-card-item>
      <v-card-actions>
        
        <v-btn color="secondary" :disabled="jsonEditOpen" text @click="showSelectUser=false;saveEditEntity();">Save</v-btn>
        <v-btn color="secondary" v-if="editEntity!=null" :disabled="jsonEditOpen" text @click="showSelectUser=false;deleteEditEntity();">Delete</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="secondary" :disabled="jsonEditOpen" text @click="showEditEntity = false;showSelectUser=false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

  #entity-list {
    margin:10px;
    padding:10px;
    border-radius: 5px;
    background-color: rgb(var(--v-theme-surface-variant));
    width: 100%;
    .entity-row {
      padding-bottom: 2px;
      padding-left: 20px;;
      width: 100%;
      position: relative;
      margin-bottom: 1px;
    }
    span.id{
      font-size: 80%;
      font-family: monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
      font-weight: lighter;
      width: 300px;
      display: inline-block;
    }
    span{
      font-size: 80%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding-left: 5px;
    }
    #selected-json{
      margin-left: 20px;
      margin-top: 5px;
      margin-bottom: 10px;
      border-left: 2px solid rgb(var(--v-theme-primary));
      padding-left: 10px;
    }
    #selected-json:hover{
      cursor: pointer;
      border-left: 2px solid rgb(var(--v-theme-secondary));
    }

    .edit-entity-action{
      visibility:hidden;
      position: absolute;
      right:25px;
      top:5px;
    }
    .entity-row:hover {
      border-bottom:1px rgb(var(--v-theme-primary)) solid;
      margin-bottom: 0px;
      .edit-entity-action{
      visibility:visible;
    } 
    }
    .entity-row.selected {
      background-color:rgb(var(--v-theme-secondary));
    }
    .entity-row.viewed {
      border-left: 4px solid rgb(var(--v-theme-primary));
      padding-left: 6px;
    }
  }
  

</style>
