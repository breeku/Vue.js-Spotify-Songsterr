import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import VueAnalytics from 'vue-analytics'

Vue.use(VueAnalytics, {
  id: 'UA-112318085-3'
})

Vue.config.productionTip = false

new Vue({
  render: h => h(App)
}).$mount('#app')
