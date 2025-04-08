<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails, type UserInfo, type CollectionDocument} from "amber-client"

interface ToDo {
  title: string;
  description: string;
  completed: boolean;
  id: string;
  userName: string;
  changeNumber:number;
}

interface ToDoEntity {
  title: string;
  description: string;
  completed: boolean;
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
var loadingUsers = ref(false);
var connectedToAmber = ref(false);
var todos = ref<ToDo[]>([]);
var selectedTodo = ref<ToDo | null>(null);
var editMode = ref(false);
var todosSortedByTitle = ()=> {
  return  [...todos.value].sort((a, b) => a.title.localeCompare(b.title));
};



var editDescription = ref<string>("");
var editTitle = ref<string>("");

var complete = async () => {
  if (selectedTodo.value) {
    const todo = selectedTodo.value;
    
    try {
      await props.amberClient.getCollectionsApi()?.updateDoc<ToDoEntity>(
        "todos",
        todo.id,
        todo.changeNumber,
        {
          title: todo.title,
          description: todo.description,
          completed: true,
        }
      );
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  }
};

var selectToDo = (todo: ToDo|null) => {
  selectedTodo.value = todo;
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

var save = async () => {
  if (selectedTodo.value) {
    const todo = selectedTodo.value;
    
    try {
      await props.amberClient.getCollectionsApi()?.updateDoc<ToDoEntity>(
        "todos",
        todo.id,
        todo.changeNumber,
        {
          title: editTitle.value,
          description: editDescription.value,
          completed: todo.completed,
        }
      );
    } catch (error) {
      console.error("Error updating todo:", error);
    }
    editMode.value = false;
  }
};

var create = async () => {
  try {
    const newTodo = {
      title: editTitle.value,
      description: editDescription.value,
      completed: false,
    } as ToDoEntity;
    
    const createdDoc = await props.amberClient.getCollectionsApi()?.createDoc<ToDoEntity>(
      "todos",
      newTodo
    );
    editMode.value = false;
    
    if (createdDoc) {
      var foundToDo = todos.value.find((todo) => todo.id === createdDoc);
      if (foundToDo)
      {
        selectToDo(foundToDo);
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

      collectionsApi.subscribe<ToDoEntity>(
        "todos",
        0,
        (doc)=>{
            const index = todos.value.findIndex((todo) => todo.id === doc.id);
            var todo = {
                title: doc.data.title,
                description: doc.data.description,
                completed: doc.data.completed,
                id: doc.id,
                userName: users.value.find((user) => user.id === doc.change_user)?.name || "Unknown",
                changeNumber: doc.change_number
            } as ToDo;
             
            if (index !== -1) {
              Object.assign(todos.value[index], todo); // I hope that works with vue.js
            } else {
              todos.value.push(todo);
            }
        },
        (deletedDoc:string)=>{
            const index = todos.value.findIndex((todo) => todo.id === deletedDoc);
            if (index !== -1) {
              todos.value.splice(index, 1);
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
        <h2>Amber powered ToDo app
          <v-btn v-if="!show" icon="mdi-menu-down" @click="show = true"></v-btn>
          <v-btn v-if="show" icon="mdi-menu-up" @click="show = false"></v-btn>
        </h2>
    </v-row>
    <v-row v-if="show">
      <v-col cols="3">
        <v-btn @click="selectToDo(null)" v-if="isEditor()">Create New</v-btn>
        <v-list>
            <v-list-item v-for="todo in todosSortedByTitle()" :key="todo.title" @click="selectToDo(todo)">
              <v-list-item-content>
                <v-list-item-title>{{ todo.title }}</v-list-item-title>
                <v-list-item-subtitle><v-icon :icon="todo.completed? 'mdi-check-circle-outline':'mdi-clock-outline'"></v-icon></v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
        </v-list>
      </v-col>
      <v-col cols="9" v-if="selectedTodo != null && !editMode">
        <v-card>
          <v-card-title>{{ selectedTodo.title }}</v-card-title>
          <v-card-subtitle>By {{ selectedTodo.userName }}</v-card-subtitle>
          <v-card-text>
            {{ selectedTodo.description }}            
          </v-card-text>
          <v-card-item>
            <v-icon :icon="selectedTodo.completed? 'mdi-check-circle-outline':'mdi-clock-outline'"></v-icon>
          </v-card-item>
          <v-card-actions>
            <v-btn @click="editMode = true"  v-if="isEditor()">Edit</v-btn>
            <v-btn @click="complete()" v-if="!selectedTodo.completed && isEditor()" >Complete</v-btn>
          </v-card-actions>  
        </v-card>
      </v-col>
      <v-col cols="9" v-if="editMode">
        <v-card>
          <v-card-title v-if="selectedTodo == null">Create New</v-card-title>
          <v-card-title v-if="selectedTodo != null">Edit</v-card-title>
          
          <v-card-text>
            <v-text-field v-model="editTitle" label="Title" placeholder="Title"></v-text-field>
            <v-textarea v-model="editDescription" label="Description" placeholder="Description"></v-textarea>
          </v-card-text>
          
          <v-card-actions>
            <v-btn @click="editMode = false" v-if="selectedTodo != null">Cancel</v-btn>
            <v-btn @click="create()" v-if="selectedTodo == null">Create</v-btn>
            <v-btn @click="save()" v-if="selectedTodo != null">Save</v-btn>
          </v-card-actions>  
        </v-card>
      </v-col>
      
    </v-row>
  </v-container>
</template>

<style scoped>

</style>
