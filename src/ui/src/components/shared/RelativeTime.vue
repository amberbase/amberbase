<script setup lang="ts">
import type { ComputedRefSymbol } from "@vue/reactivity";
import { sleep } from "amber-client/dist/src/shared/helper";
import {onMounted, onUnmounted, computed, getCurrentInstance,type ComponentInternalInstance, ref} from "vue"
import type { VTextarea } from "vuetify/components";

export interface RelativeTimeProps{
  date: Date,
  precision?:"day"| "hour" | "minute" | "tenSeconds" | "seconds"
}
const props = withDefaults(defineProps<RelativeTimeProps>(),{
    precision : ()=> "tenSeconds"
});



function renderRelativeTime():string {
    if (!props.date) return "N/A";
    var d = new Date(props.date);
    var now = new Date();
    var diff = now.getTime() - d.getTime();
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    if (days > 0) return days + " day(s) ago";
    if (props.precision == "day") return "today";
    if (hours > 0) return hours + " hour(s) ago";
    if (props.precision == "hour") return "in the last hour";
    if (minutes > 0) return minutes + " minute(s) ago";
    if (props.precision == "minute") return "just now";
    var tens = Math.floor(seconds / 10);
    if (props.precision == "tenSeconds")
    {
        if(tens > 0) return tens+"0 seconds ago";
        return "just now";
    }
    return (seconds > 1)? seconds + " seconds ago" : "just now";
}  

const title = computed(()=>{
    return props.date.toISOString();
});

const text = ref(renderRelativeTime());

const update = ()=>{
    text.value = renderRelativeTime();
};

onMounted(()=>{
    var thisComponent = getCurrentInstance();
    if (thisComponent){
        updater.add(update);
    }
});

onUnmounted(()=>{
    var thisComponent = getCurrentInstance();
    if (thisComponent){
        updater.delete(update);
    }
});
</script>
<script lang="ts">
    const updater = new Set<()=>void>();
    setInterval(()=>{
        for (const u of updater) {
            u();
        }
    }, 1 * 1000);

</script>
<template>
 <span class="relative-time" :title="title">{{ text }}</span>  
</template>

<style scoped>

</style>
