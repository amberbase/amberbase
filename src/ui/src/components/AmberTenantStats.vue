<script setup lang="ts">
import {ref, onMounted, onUnmounted} from "vue"
import { AmberClient, type UserWithRoles, type Tenant, type UserDetails, type MetricValue, type AmberMetricsBucket, type AmberMetricName} from "amber-client"
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, type Color } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

var props = defineProps<{
  amberClient: AmberClient, 
  tenant : string
}>();
var show = ref(false);

var metrics = ref<AmberMetricName[]>([]);

var buckets = ref<AmberMetricsBucket[]>([]);
var adminApi = props.amberClient.getAdminApi()!;

var byHour = ref(false);
var zoomedIn = ref(false);

var selectedMetric = ref<AmberMetricName | null>(null); 

var setByHour = (value:boolean) => {
  byHour.value = value;
  refreshMetrics();
};

var color = ref<Color>("red");

var labels = () =>{
  var l = buckets.value.map((bucket) => {
    return bucket.bucket;
  });
  if(zoomedIn.value)
  {
    l = l.slice(-10);
  }
  return l;
};

var values = () => {
  var l = buckets.value.map((bucket) => {
    if (selectedMetric.value === null) {
      return 0;
    }
    var metric = bucket.metrics[selectedMetric.value];
    if (metric === undefined) {
      return 0;
    }
    switch (selectedMetric.value) {
      case "chan-sub":
        return metric.max;
      case "col-docs":
        return metric.max;
      case "col-sub":
        return metric.max;
      default:
        return metric.sum;
    }
  });
  if(zoomedIn.value)
  {
    l = l.slice(-10);
  }
  return l;
};

var refreshMetrics = async () => {
  try {
    const response = byHour.value ? (await adminApi.getMetricsByHour()) : (await adminApi.getMetricsByMinutes());
    buckets.value = response;
    var metricsCollected = new Set<AmberMetricName>();
    response.forEach((bucket) => {
      Object.keys(bucket.metrics).forEach((metric) => {
        metricsCollected.add(<AmberMetricName>metric);
      });
    });
    metrics.value = Array.from(metricsCollected).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching metrics:", error);
  }
};
var registeredCallback : number | null = null;
onMounted(async ()=>{
  refreshMetrics();
  registeredCallback = setInterval(refreshMetrics, 1000 * 10 ); // Refresh every 10 seconds
});

onUnmounted(() => {
  if (registeredCallback !== null)
  {
      clearInterval(registeredCallback);
  }
});



</script>
<template>
  <v-container>
  <v-row>
      <h2>Statistics for {{ props.tenant }}
        <v-btn v-if="!show" icon="mdi-menu-down" @click="show = true"></v-btn>
          <v-btn v-if="show" icon="mdi-menu-up" @click="show = false"></v-btn>
      </h2>
  </v-row>
  <v-row v-if="show">
    <v-col cols = "2">
      <v-btn @click="setByHour(!byHour)">{{ byHour ? "By Hour" : "By Minute" }}</v-btn>
      <v-btn @click="zoomedIn = !zoomedIn"><v-icon :icon="zoomedIn?'mdi-magnify-minus-outline' : 'mdi-magnify-plus-outline'"></v-icon></v-btn>
      <h3>Metrics</h3>
      <v-list>
        <v-list-item-group v-for="metric in metrics" :key="metric">
          <v-list-item @click="selectedMetric = metric">{{ metric }}</v-list-item>
        </v-list-item-group>
      </v-list>
    </v-col>
    <v-col cols = "10">
      <h3>Metrics</h3>
      <Line :data="{labels:labels(), datasets:[{ label:<string>selectedMetric, data:values(), borderColor:color}]}" :options="{}" ></Line>

    </v-col>
  </v-row>

</v-container>
</template>

<style scoped>

</style>
