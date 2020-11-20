import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { HangboardScale } from './core/hangboardscale'
import { LocalSaveUploader, RemoteAPI, reauth, clearAllCookies } from './core/util'
//import VueAwesomeSwiper from 'vue-awesome-swiper'
import { GetConfigObject, SaveConfigObject, SupplementDefaultKeys } from '@/core/localstore';

Vue.config.productionTip = false

console.log("boulderbash main file loaded!")

// this "fixes" missing keys when we add new properties to the specified default values, 
// oterweise those new keys are missing on exsiting configs
let cfg = GetConfigObject();
cfg = SupplementDefaultKeys(cfg);
SaveConfigObject(cfg);

const backendApi = new RemoteAPI();
const scaleDataBackend = new HangboardScale(cfg.options.channel);
const saveUploader = new LocalSaveUploader(backendApi);
export const GlobalStore = {
  scaleBackend: scaleDataBackend,
  backend: backendApi,
  localSaveUploader: saveUploader,
  cfg:cfg,
  staticData: null
}

function startupApp() {
  console.log("starting app!")
  let inst = new Vue({
    router,
    data: GlobalStore,
    render: h => h(App)
  }).$mount('#app');
}

function onDeviceReady() {
  startupApp();
  document.addEventListener("pause", () => {
    scaleDataBackend.onGlobalMessage("appPause");
  }, false);
  document.addEventListener("resume", () => {
    if(cfg.secret !== "" && !reauth(backendApi)) {
      clearAllCookies();
      window.location.reload(true);
    }
    scaleDataBackend.onGlobalMessage("appResume");
  }, false);
}
let isCordovaApp = !!window.cordova;
if(!isCordovaApp) {
  startupApp();
} else {
  document.addEventListener("deviceready", onDeviceReady, false);
}