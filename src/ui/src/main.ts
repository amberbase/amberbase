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
  }

  if (window.amberUiContext) {
    state.uiContext = window.amberUiContext;
  }

  createApp(AmberUi).use(vuetify).mount('#app')