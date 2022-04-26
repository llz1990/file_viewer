import Vue from 'vue'
import App from './App.vue'
import VueViewer from 'v-viewer';
import 'viewerjs/dist/viewer.css';
import './common/flexible';
import router from './router';
Vue.config.productionTip = false

Vue.use(VueViewer)

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
