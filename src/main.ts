import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'

import VueStash from 'vue-stash'
import store from './store/index'

Vue.use(VueStash)
Vue.config.productionTip = false
Vue.prototype.global1 = window
new Vue({
  router,
  vuetify,
  data: { store },
  render: h => h(App),
}).$mount('#app')
