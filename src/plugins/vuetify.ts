import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: '#006064',
        secondary: '#424242',
        accent: '#FF9800',
      },
    },
  },
})
