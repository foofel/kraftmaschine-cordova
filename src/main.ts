import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { HangboardConnector } from './core/hangboardconnector'
import { RemoteAPI, reauth, clearAllCookies } from './core/util'
import { ConfigFile, StorageInterface } from '@/core/storageinterface';
import { IndexedDBStorageImpl } from './core/persistentstore'
import { RUNNING_WITH_CORDOVA } from './config'

Vue.config.productionTip = false

console.log("kraftmaschine main file loaded!")

export interface GlobalStoreInterface {
	scaleBackend: HangboardConnector,
	backend: RemoteAPI,
	//localSaveUploader: LocalSaveUploader,
	storage: StorageInterface,
	cfg: ConfigFile,
	staticData: null
}
export const GlobalStore = ({}) as GlobalStoreInterface

async function startupApp() {
	console.log("startApp()");
	// this "fixes" missing keys when we add new properties to the specified default values, 
	// oterweise those new keys are missing on exsiting configs
	const storage = new IndexedDBStorageImpl();
	await storage.init();
	GlobalStore.storage = storage;
	GlobalStore.cfg = await storage.getConfigProxyObject();
	const backendApi = new RemoteAPI();
	const scaleDataBackend = new HangboardConnector(GlobalStore.cfg.options.channel);
	//const saveUploader = new LocalSaveUploader(backendApi);
	GlobalStore.scaleBackend = scaleDataBackend;
	GlobalStore.backend = backendApi;
	//GlobalStore.localSaveUploader = saveUploader;
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
		if (GlobalStore.cfg.secret !== "" && !reauth(GlobalStore.backend)) {
			clearAllCookies();
			window.location.reload(true);
		}
		GlobalStore.scaleBackend.onGlobalMessage("appResume");
	}, false);
}

// cordova needs some startup time to load plugins and stuff
const devReady = new Promise<void>((resolve, reject) => {
	if (!RUNNING_WITH_CORDOVA()) {
		resolve();
	} else {
		document.addEventListener("deviceready", () => {
			resolve();
		}, false);
	}
}).then(() => {
	startupApp();
});