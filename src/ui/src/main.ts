import './assets/main.css'
import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import Amber from './components/Amber.vue'
import { state } from './state'
import { amber } from 'vuetify/util/colors'
import type { UiConfig } from './config'

declare global {
  interface Window{
    amberUiConfig?: UiConfig
  }
}

const vuetify = createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
          mdi,
        }
    }
  });
  
  var hash = window.location.hash;
  if (hash.startsWith("#/")) {
    var params = new URLSearchParams(hash.substring(8));
    
    state.amberTenant = params.get("tenant") || "*";
    state.amberInvitation = params.get("invitation") || "";  
  }
  
  
  if(state.amberTenant !== "*"){
    state.defaultView = "amber";
  }

  if (window.amberUiConfig) {
    state.uiConfig = window.amberUiConfig;
  }

  createApp(Amber).use(vuetify).mount('#app')