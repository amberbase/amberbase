<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails, type UserInfo, type CollectionDocument} from "amber-client"

interface Note {
  title: string;
  description: string;
  id: string;
  ownerUser: string;
  ownerShip: "public" | "mine" | "shared";
  changeNumber:number;
  owner:string;
  sharedWith:string[];
  isPublic:boolean;
}

interface NoteEntity {
  title: string;
  description: string;
  owner:string;
  sharedWith:string[];
  isPublic:boolean;
}

var props = defineProps<{
  amberClient: AmberClient, 
}>();
var show = ref(false);
var roles = ref<string[]>([]);
var isAdmin = ()=> roles.value.includes("admin");
var isEditor = ()=> roles.value.includes("editor");
var isReader = ()=> roles.value.includes("reader");
var users = ref<UserInfo[]>([]);
var thisUser =ref<string>(props.amberClient.loginManager.user?.id || "");
var loadingUsers = ref(false);
var connectedToAmber = ref(false);
var notes = ref<Note[]>([]);
var selectedNote = ref<Note | null>(null);
var editMode = ref(false);
var notesSortedByTitle = ()=> {
  return  [...notes.value].sort((a, b) => a.title.localeCompare(b.title));
};

var collectionApi = props.amberClient.getCollectionsApi().getCollection<NoteEntity>("notes");

var editDescription = ref<string>("");
var editTitle = ref<string>("");

var userNameById = (userId:string) => {
  const user = users.value.find((user) => user.id === userId);
  return user ? user.name : "Unknown";
};

var selectNote = (todo: Note|null) => {
  selectedNote.value = todo;
  if (todo) {
    editDescription.value = todo.description;
    editTitle.value = todo.title;
    editMode.value = false;
  } else {
    editDescription.value = "";
    editTitle.value = "";
    editMode.value = true;
  }
};

var usersToShareTo:()=>UserInfo[] = ()=>{
  if (selectedNote.value) {
    const note = selectedNote.value;
    return users.value.filter((user) => user.id !== note.owner && !note.sharedWith.includes(user.id));
  }
  return [];

}

var save = async () => {
  if (selectedNote.value) {
    const note = selectedNote.value;
    
    try {
      await collectionApi.updateDoc(
        note.id,
        note.changeNumber,
        {
          title: editTitle.value,
          description: editDescription.value,
          isPublic: note.isPublic,
          owner: note.owner,
          sharedWith: note.sharedWith
        }
      );
    } catch (error) {
      console.error("Error updating note:", error);
    }
    editMode.value = false;
  }
};

var deleteNote = async () => {
  if (selectedNote.value) {
    const note = selectedNote.value;
    
    try {
      await collectionApi.deleteDoc(
        note.id
      );
    } catch (error) {
      console.error("Error deleting note:", error);
    }
    editMode.value = false;
  }
};

var makePublic = async (p:boolean) => {
  if (selectedNote.value) {
    const note = selectedNote.value;
    
    try {
      await collectionApi.updateDoc(
        note.id,
        note.changeNumber,
        {
          title: editTitle.value,
          description: editDescription.value,
          isPublic: p,
          owner: note.owner,
          sharedWith: []
        }
      );
    } catch (error) {
      console.error("Error updating note:", error);
    }
    editMode.value = false;
  }
};

var share = async (userId:string) => {
  if (selectedNote.value) {
    const note = selectedNote.value;
    
    try {
      var sharedWith = new Set<string>(note.sharedWith);
      sharedWith.add(userId);
      await collectionApi.updateDoc(
        note.id,
        note.changeNumber,
        {
          title: editTitle.value,
          description: editDescription.value,
          isPublic: note.isPublic,
          owner: note.owner,
          sharedWith: Array.from(sharedWith)
        }
      );
    } catch (error) {
      console.error("Error updating note:", error);
    }
    editMode.value = false;
  }
};

var unshare = async (userId:string) => {
  if (selectedNote.value) {
    const note = selectedNote.value;
    
    try {
      var sharedWith = new Set<string>(note.sharedWith);
      sharedWith.delete(userId);
      await collectionApi.updateDoc(
        note.id,
        note.changeNumber,
        {
          title: editTitle.value,
          description: editDescription.value,
          isPublic: note.isPublic,
          owner: note.owner,
          sharedWith: Array.from(sharedWith)
        }
      );
    } catch (error) {
      console.error("Error updating note:", error);
    }
    editMode.value = false;
  }
};

var create = async () => {
  try {
    const newNote = {
      title: editTitle.value,
      description: editDescription.value,
      isPublic : false,
      owner: thisUser.value,
      sharedWith:[]
    } as NoteEntity;
    
    const createdDoc = await collectionApi.createDoc(
      newNote
    );
    editMode.value = false;
    
    if (createdDoc) {
      var foundNote = notes.value.find((note) => note.id === createdDoc);
      if (foundNote)
      {
        selectNote(foundNote);
      }
    }
  } catch (error) {
    console.error("Error creating todo:", error);
  }
};

onMounted(async () => {
  if (props.amberClient) {
    connectedToAmber.value = false;
    roles.value = await props.amberClient.loginManager.roles;
    try {
      loadingUsers.value = true;
      const usersResponse = await props.amberClient.getAmberApi()?.getUsers();
      
      users.value = usersResponse || [];
      loadingUsers.value = false;
      var collectionsApi = props.amberClient.getCollectionsApi();
      if (!collectionsApi) {
        console.error("Collections API is not available.");
        return;
      }

      collectionApi.subscribe(
        0,
        (doc)=>{
            const index = notes.value.findIndex((note) => note.id === doc.id);
            var note = {
                title: doc.data.title,
                description: doc.data.description,
                id: doc.id,
                ownerUser: users.value.find((user) => user.id === doc.data.owner)?.name || "Unknown",
                changeNumber: doc.change_number,
                isPublic:doc.data.isPublic,
                owner:doc.data.owner,
                sharedWith: doc.data.sharedWith,
                ownerShip: doc.data.owner === thisUser.value ? 
                  "mine" : 
                  (doc.data.sharedWith.includes(thisUser.value) 
                    ? "shared" : "public")
                
            } as Note;
             
            if (index !== -1) {
              Object.assign(notes.value[index], note); 
            } else {
              notes.value.push(note);
            }
        },
        (deletedDoc:string)=>{
            const index = notes.value.findIndex((note) => note.id === deletedDoc);
            if (index !== -1) {
              notes.value.splice(index, 1);
              if (selectedNote.value && selectedNote.value.id === deletedDoc) {
                selectNote(null);
              }
            }
        }
      );
      
      collectionsApi.onConnectionChanged(
        (connected:boolean)=>
        {
          connectedToAmber.value = connected;
        });

      collectionsApi.connect();
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }
});
</script>
<template>
  <v-container>
    <v-row>
        <h2>Amber powered Notes app 
          <v-btn v-if="!show" icon="mdi-menu-down" @click="show = true"></v-btn>
          <v-btn v-if="show" icon="mdi-menu-up" @click="show = false"></v-btn>
        </h2>
    </v-row>
    <v-alert v-if="show && !connectedToAmber" text="No connection to amber" type="warning"></v-alert>
    <v-row v-if="show">
      <v-col cols="3">
        <v-btn @click="selectNote(null)" v-if="isEditor()">Create New</v-btn>
        <v-list>
            <v-list-item v-for="note in notesSortedByTitle()" :key="note.title" @click="selectNote(note)">
              <v-list-item-content>
                <v-list-item-title>{{ note.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ note.ownerShip }} by {{ note.ownerUser }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
        </v-list>
      </v-col>
      <v-col cols="9" v-if="selectedNote != null && !editMode">
        <v-card>
          <v-card-title>{{ selectedNote.title }}</v-card-title>
          <v-card-subtitle>By {{ selectedNote.ownerUser }}</v-card-subtitle>
          <v-card-text>
            {{ selectedNote.description }}            
          </v-card-text>
          <v-card-item>
            <v-icon icon="mdi-lock" v-if="!selectedNote.isPublic && selectedNote.sharedWith.length == 0" title="Private"></v-icon>
            <v-icon icon="mdi-eye" v-if="selectedNote.isPublic" title="Public"></v-icon>
            <v-icon icon="mdi-account-group" v-if="selectedNote.sharedWith.length>0" title="Shared"></v-icon>
          </v-card-item>
          <v-card-item v-if="selectedNote.ownerShip=='mine' && selectedNote.sharedWith.length>0">
            <v-chip v-for="user in selectedNote.sharedWith" :key="user">{{userNameById(user)}}
              <template #close>
                <v-icon tile="Remove Role" icon="mdi-close-circle" @click.stop="unshare(user);" />
              </template>  
            </v-chip>
          </v-card-item>
          <v-card-item v-if="selectedNote.ownerShip=='mine' && !selectedNote.isPublic">
            <v-menu location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                >
                  Share with ...
                </v-btn>
              </template>

              <v-list>
                <v-list-item
                  v-for="(user, index) in usersToShareTo()"
                  :key="index"
                  :value="index"
                  @click="share(user.id)"
                >
                  <v-list-item-title>{{ user.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            
          </v-card-item>
          <v-card-actions>
            <v-btn @click="editMode = true"  v-if="selectedNote.ownerShip=='mine'">Edit</v-btn>
            <v-btn @click="deleteNote()"  v-if="selectedNote.ownerShip=='mine'">Delete</v-btn>
            <v-btn @click="makePublic(true)"  v-if="selectedNote.ownerShip=='mine' && !selectedNote.isPublic">Publish</v-btn>
            <v-btn @click="makePublic(false)"  v-if="selectedNote.ownerShip=='mine' && selectedNote.isPublic">Unpublish</v-btn>
          </v-card-actions>  
        </v-card>
      </v-col>
      <v-col cols="9" v-if="editMode">
        <v-card>
          <v-card-title v-if="selectedNote == null">Create New</v-card-title>
          <v-card-title v-if="selectedNote != null">Edit</v-card-title>
          
          <v-card-text>
            <v-text-field v-model="editTitle" label="Title" placeholder="Title"></v-text-field>
            <v-textarea v-model="editDescription" label="Description" placeholder="Description"></v-textarea>
          </v-card-text>
          
          <v-card-actions>
            <v-btn @click="editMode = false" v-if="selectedNote != null">Cancel</v-btn>
            <v-btn @click="create()" v-if="selectedNote == null">Create</v-btn>
            <v-btn @click="save()" v-if="selectedNote != null">Save</v-btn>
          </v-card-actions>  
        </v-card>
      </v-col>
      
    </v-row>
  </v-container>
</template>

<style scoped>

</style>
