<script setup lang="ts">
import {ref, onMounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails, type UserInfo, type CollectionDocument} from "amber-client"
import { de } from "vuetify/locale";

interface Document {
  title: string;
  description: string;
  id: string;
  changeNumber:number;
}

interface DocumentEntity {
  title: string;
  description: string;
  changeTimestamp: number;
}

interface LoadtestCommand{
  start: boolean;
  intervalMs?: number;
  jitterMs?: number;
  // creationPercentage is the default. That means 100 - (updatePercentage + deletionPercentage) is the percentage of creation.
  updatePercentage?: number;
  deletionPercentage?: number;
}

var props = defineProps<{
  amberClient: AmberClient, 
}>();
var show = ref(false);
var connectedToAmber = ref(false);
var docs = ref<Document[]>([]);
var updatesExecuted = ref(0);
var creationsExecuted = ref(0);
var deletionsExecuted = ref(0);
var documentUpdatesProcessed = ref(0);
var intervalCounter = ref(0);
var errors = ref<string[]>([]);
var runningId = ref<number>(0);
var latencyBuffer : number[] = [];
var latencyBufferSize = 5;
var avgLatency = ref<number>(0);
var collectionsApi = props.amberClient.getCollectionsApi();
var collectionApi = props.amberClient.getCollectionsApi().getCollection<DocumentEntity>("loadtest");
var channelApi = props.amberClient.getChannelsApi().getChannel<LoadtestCommand>("loadtest-command");

var percentageRanges = ref<number[]>([70,90]); // 0 .. percentageRanges[0] is the percentage of creation, the  percentageRanges[0] .. percentageRanges[1] updates and percentageRanges[1] .. 100 for deletion
var intervalMs = ref<number>(1000);
var jitterMs = ref<number>(0);

var running = ()=> {
  return runningId.value !== 0;
};

var recordLatency = (startTime: number) => {
  var endTime = Date.now();
  var latency = endTime - startTime;
  latencyBuffer.push(latency);
  if (latencyBuffer.length > latencyBufferSize) {
    latencyBuffer.shift();
  }
  avgLatency.value = latencyBuffer.reduce((a, b) => a + b, 0) / latencyBuffer.length;
};

var loremIpsumWords = [
  "Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et",
  "dolore", "magna", "aliqua",
  "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation",
  "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
  "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat",
  "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat"
];

function generateLoremIpsumSentence(numWords: number): string {
  let result = "";
  for (let i = 0; i < numWords; i++) {
    result += loremIpsumWords[Math.floor(Math.random() * loremIpsumWords.length)] + " ";
  }
  return result.charAt(0).toUpperCase() + result.substring(1).trim() + ".";
}

function generateLoremIpsumText(numSentences: number): string {
  let result = "";
  for (let i = 0; i < numSentences; i++) {
    result += generateLoremIpsumSentence(Math.floor(Math.random() * 8) + 3) + " ";
  }
  return result.trim();
}

function generateRandomDocument(): DocumentEntity {
  return {
    title: generateLoremIpsumSentence(3),
    description: generateLoremIpsumText(5),
    changeTimestamp: Date.now()
  };
} 

function getRandomDocumentFromLocal() : Document | null
{
  if (docs.value.length === 0) {
    return null;
  }
  var selectedDoc = docs.value[Math.floor(Math.random() * docs.value.length)];
  return selectedDoc;
}

var updateDocument = async () => {
    var doc = getRandomDocumentFromLocal();
    if (doc){
      try {
      await collectionApi.updateDoc(
        doc.id,
        doc.changeNumber,
        {
          title: doc.title,
          description: generateLoremIpsumText(5),
          changeTimestamp: Date.now()
        }
      );
      updatesExecuted.value++;
    } catch (error) {
      errors.value.push("Error updating document: " +error);
    }
  }
};

var deleteDocument = async () => {
    var doc = getRandomDocumentFromLocal();
    if (doc){
      try {
      await collectionApi.deleteDoc(
        doc.id
      );
      deletionsExecuted.value++;
    } catch (error) {
      errors.value.push("Error deleting document: " +error);
    }
  }
};

var createDocument = async () => {
    var doc = generateRandomDocument();
    if (doc){
      try {
      await collectionApi.createDoc(
        doc
      );
      creationsExecuted.value++;
    } catch (error) {
      errors.value.push("Error creating document: " +error);
    }
  }
};

var executeLoadtestCommand = (command:LoadtestCommand) => {
  if (runningId.value !== 0) {
    clearInterval(runningId.value);
    runningId.value = 0;
  }
  if(command.start)
  {
    var interval = command.intervalMs || 10_000;
    var updatePercentage = command.updatePercentage || 0;
    var deletionPercentage = command.deletionPercentage || 0;
    intervalMs.value = interval;
    jitterMs.value = command.jitterMs || 0;
    percentageRanges.value = [100 - (updatePercentage + deletionPercentage), 100 - deletionPercentage];

     var intervalId = setInterval(() => {
      setTimeout(() => {

        if (runningId.value !== intervalId) {
          return;
        }
        intervalCounter.value++;
        var randomValue = Math.random() * 100;
      if (randomValue < updatePercentage) {
        updateDocument();
      } else if (randomValue < updatePercentage + deletionPercentage) {
        deleteDocument();
      } else {
        createDocument();
      }
      }, command.jitterMs || 0);
    }, interval);
    runningId.value = intervalId;
  }
};

var startLoadTest = async () => {
  channelApi.send({
    start: true,
    intervalMs: intervalMs.value,
    jitterMs: jitterMs.value,
    updatePercentage: percentageRanges.value[1] - percentageRanges.value[0],
    deletionPercentage: 100 - percentageRanges.value[1]
  });
};

var stopLoadTest = async () => {
  channelApi.send({
    start: false
  });
};

onMounted(async () => {
  if (props.amberClient) {
    connectedToAmber.value = false;
    
    try {
      collectionApi.subscribe(
        0,
        (doc)=>{
            recordLatency(doc.data.changeTimestamp);
            documentUpdatesProcessed.value++;
            const index = docs.value.findIndex((d) => d.id === doc.id);
            var newdoc : Document = {
                title: doc.data.title,
                description: doc.data.description,
                id: doc.id,
                changeNumber: doc.change_number,
            };
             
            if (index !== -1) {
              Object.assign(docs.value[index], newdoc); 
            } else {
              docs.value.push(newdoc);
            }
        },
        (deletedDoc:string)=>{
            const index = docs.value.findIndex((d) => d.id === deletedDoc);
            if (index !== -1) {
              docs.value.splice(index, 1);
            }
        }
      );
      
      collectionsApi.onConnectionChanged(
        (connected:boolean)=>
        {
          connectedToAmber.value = connected;
        });

      channelApi.subscribe(
        (message)=> {
          if (message) {
            try {
              executeLoadtestCommand(message);
            } 
            catch (error) {
              errors.value.push("Error parsing message: " + error);
            }
          }
        },
      );
      collectionsApi.connect();
    } catch (error) {
      console.error("Error connecting to Amber: ", error);
    }
  }
});
</script>
<template>
  <v-container>
    <v-row>
        <h2>Amber collections load test
          <v-btn v-if="!show" icon="mdi-menu-down" @click="show = true"></v-btn>
          <v-btn v-if="show" icon="mdi-menu-up" @click="show = false"></v-btn>
        </h2>
    </v-row>
    <v-alert v-if="show && !connectedToAmber" text="No connection to amber" type="warning"></v-alert>
    <v-row v-if="show">
      <v-col cols="3">
        <v-btn @click="stopLoadTest()" v-if ="running()">Stop Test</v-btn>
        <v-btn @click="startLoadTest()" v-if ="!running()">Start Test</v-btn>
        <h5>Interval in ms</h5>
        <v-number-input v-model="intervalMs" :min="1" :max="60000"></v-number-input>
        <h5>Jitter in ms</h5>
        <v-number-input v-model="jitterMs" :min="0" :max="1000"></v-number-input>
        <h4>Propabilities</h4>
        <v-range-slider :min="0" :max="100" :step="1" direction="vertical" :disabled = "running()" v-model="percentageRanges"></v-range-slider>
        <div>Deletion {{ 100 - percentageRanges[1] }}%</div>
        <div>Update {{ percentageRanges[1] - percentageRanges[0] }}%</div>
        <div>Creation {{ percentageRanges[0] }}%</div>
      </v-col>
      <v-col cols="9">
        <v-card>
          <v-card-title>{{ running()?"Test is running" : "No test running" }}</v-card-title>
          <v-card-subtitle v-if="running()">Interval number {{ intervalCounter }}</v-card-subtitle>
          <v-card-text>
              <table>
                <tr>
                  <th>Creations</th>
                  <td>{{ creationsExecuted }}</td>
                </tr>
                <tr>
                  <th>Updates</th>
                  <td>{{ updatesExecuted }}</td>
                </tr>
                <tr>
                  <th>Deletions</th>
                  <td>{{ deletionsExecuted }}</td>
                </tr>
                <tr>
                  <th>Documents</th>
                  <td>{{ docs.length }}</td>
                </tr>
                <tr>
                  <th>Avg Latency</th>
                  <td>{{ avgLatency }} ms</td>
                </tr>
                
                <tr>
                  <th>Processed Documents</th>
                  <td>{{ documentUpdatesProcessed }}</td>
                </tr>
                <tr>
                  <th>Errors</th>
                  <td>{{ errors.length }}</td>
                </tr>
              </table>
          </v-card-text>
        </v-card>
      </v-col>
     
    </v-row>
  </v-container>
</template>

<style scoped>

</style>
