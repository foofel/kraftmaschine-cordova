import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { HangboardConnector } from './core/hangboardconnector'
import { LocalSaveUploader, RemoteAPI, reauth, clearAllCookies } from './core/util'
import { ConfigFile, GetConfigObject, SaveConfigObject, SupplementDefaultKeys } from '@/core/localstore';

Vue.config.productionTip = false

console.log("kraftmaschine main file loaded!")

export interface GlobalStoreInterface {
  scaleBackend: HangboardConnector,
  backend: RemoteAPI,
  localSaveUploader: LocalSaveUploader,
  cfg: ConfigFile,
  staticData: null
}
export const GlobalStore = ({}) as GlobalStoreInterface

function startupApp() {
  console.log("startApp()");
  // this "fixes" missing keys when we add new properties to the specified default values, 
  // oterweise those new keys are missing on exsiting configs
  let cfg = GetConfigObject();
  cfg = SupplementDefaultKeys(cfg);
  SaveConfigObject(cfg);    
  GlobalStore.cfg = cfg;
  const backendApi = new RemoteAPI();
  const scaleDataBackend = new HangboardConnector(cfg.options.channel);
  const saveUploader = new LocalSaveUploader(backendApi);
  GlobalStore.scaleBackend = scaleDataBackend;
  GlobalStore.backend = backendApi;
  GlobalStore.localSaveUploader = saveUploader;
  console.log("starting vue");
  const inst = new Vue({
    router,
    data: GlobalStore,
    render: h => h(App)
  }).$mount('#app');
  document.addEventListener("pause", () => {
    GlobalStore.scaleBackend.onGlobalMessage("appPause");
  }, false);
  document.addEventListener("resume", () => {
    if(cfg.secret !== "" && !reauth(GlobalStore.backend)) {
      clearAllCookies();
      window.location.reload(true);
    }
    GlobalStore.scaleBackend.onGlobalMessage("appResume");
  }, false);  
}

const isCordovaApp = window.hasOwnProperty("cordova");
if(!isCordovaApp) {
  startupApp();
} else {
  document.addEventListener("deviceready", startupApp, false);
}