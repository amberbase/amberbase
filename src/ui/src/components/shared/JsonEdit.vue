<script setup lang="ts">
import { sleep } from "amber-client/dist/src/shared/helper";
import {ref, onMounted, watch} from "vue"
import type { VTextarea } from "vuetify/components";
import { sl } from "vuetify/locale";

const model = defineModel<string>();

const modelValue = ref<string>(model.value || "{}");
defineProps<{
  rows?: number,
  label?: string
}>();

const emit = defineEmits<{
  (e: 'active', isActive: boolean): void
}>();


var inEditMode = ref(false);
var buttonactionmode = ref(false);
const refTextArea = ref<VTextarea | null>(null);
watch(model, (newVal)=>{
  modelValue.value = newVal || "{}";
});

watch(inEditMode, (newVal)=>{
  emit('active', newVal);
});

onMounted(async ()=>{

});

var validjson = () : boolean => {
  try {
    JSON.parse(modelValue.value as string);
    return true;
  }
  catch
  {
    return false;
  }
};

var prettyPrint = () => {
  try {
    return  JSON.stringify( JSON.parse(model.value as string), null, 2);
  }
  catch
  {
    return "Invalid JSON";
    // ignore
  }
};

var commitIfValid = async  () => {
    await sleep(10); // let any other events process first
    if (buttonactionmode.value)
        return; // the button decides what to do
    if (validjson())
    {
        model.value = modelValue.value;
    }
    else
    {
        modelValue.value = model.value || "{}";
    }
    inEditMode.value = false;
};

var reset = () => {
    var current = model.value;
    modelValue.value = current || "{}";
    inEditMode.value = true;
};

var focusTextArea = async () => {
  await sleep(50);
  (refTextArea!.value as VTextarea)?.focus();
  (refTextArea!.value as VTextarea)?.select();
};

</script>
<template>
  <div class="v-label" style="font-size:90%;margin-left:20px;">{{label}}</div>  
  <div class="json-edit" v-if="inEditMode">
  
  <v-textarea
    ref="refTextArea"
    v-model="modelValue"
    :rows="rows || 10"
    auto-grow
    @blur="commitIfValid()"
    @keyup.escape="inEditMode = false; modelValue = model || '{}';"
    ></v-textarea>
    <span class="edit-buttons">
    <v-icon title = "Invalid JSON" v-if="!validjson()">mdi-alert-box-outline</v-icon>
    <v-btn icon :disabled="!validjson()" @mousedown="buttonactionmode = true" @mouseup="buttonactionmode = false" @click="inEditMode = false; model = modelValue;" density="compact"><v-icon title = "OK">mdi-check</v-icon></v-btn>
    <v-btn icon @click="reset(); focusTextArea();" density="compact" @mousedown="buttonactionmode = true" @mouseup="buttonactionmode = false"><v-icon title = "Reset">mdi-arrow-u-left-top</v-icon></v-btn>
    <v-btn icon @click="inEditMode = false; modelValue = model || '{}';" title="Cancel" density="compact" @mousedown="buttonactionmode = true" @mouseup="buttonactionmode = false"><v-icon>mdi-close</v-icon></v-btn>
    </span>
  </div>
   <div class="json-view"  v-else>
    <v-btn class = "edit-icon" icon @click.="inEditMode = true; focusTextArea();" density="compact" title="edit"><v-icon>mdi-pencil</v-icon></v-btn>
    <pre style="white-space: pre-wrap; word-break: break-all;margin-left:5px;min-height: 32px;" @click="inEditMode = true; focusTextArea();">{{prettyPrint()}}</pre>
   </div> 
</template>

<style scoped>
.json-view {
  position: relative;
  border-radius: 4px;
  padding: 10px;
  font-family: monospace;
  white-space: pre-wrap; /* Preserve whitespace and wrap as needed */
  word-break: break-all; /* Break long words to prevent overflow */
}
.edit-icon {
  position: absolute;
  top: 5px;
  right: 5px;
  display: none;
}

.json-view:hover .edit-icon {
  display: block;
}

.json-edit {
  position: relative;
}
.edit-buttons {
  position: absolute;
  top: 5px;
  right: 5px;
}
</style>
