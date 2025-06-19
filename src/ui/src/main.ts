import './assets/main.css'
import { createApp } from 'vue'

// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

import AmberUi from './components/AmberUi.vue'
import { state } from './common'
import { amber } from 'vuetify/util/colors'
import type { AmberUiConfig, AmberUiContext } from '../../shared/src'

declare global {
  interface Window{
    amberUiConfig?: AmberUiConfig,
    amberUiContext?: AmberUiContext
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
  
  
  if (window.amberUiConfig) {
    state.uiConfig = window.amberUiConfig;
    if (state.uiConfig.title)
    {
      document.title = state.uiConfig.title;
    }
  }

  if (window.amberUiContext) {
    state.uiContext = window.amberUiContext;

    switch (state.uiContext.view){
      case 'tenant-admin':
        document.title += " Admin";
        break;
      case 'global-admin':
        document.title += " Global Admin";
        break;
      case 'user-profile':
        document.title = " My Profile";
        break;
      case 'login':
        document.title = " Login";
        break;
      case 'global-monitoring':
      case 'tenant-monitoring':
        document.title += " Monitoring";
      case 'invited':
        document.title += " Register";
      default:
        document.title = "";
    }
  }
  
  createApp(AmberUi).use(vuetify).mount('#app')