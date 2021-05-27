import Vue from 'vue'
import App from './App.vue'
import router from './router'
import { HangboardConnector } from './core/hangboardconnector'
import { RemoteAPI, reauth, clearAllCookies } from './core/util'
import { ConfigFile, StorageInterface } from '@/core/storageinterface';
import { proxylize, ApplicationStoreInterface } from '@/core/applicationstore'
import { IndexedDBStorageImpl, writeConfigObject } from './core/persistentstore'
import { RUNNING_WITH_CORDOVA } from './config'

Vue.config.productionTip = false

console.log("kraftmaschine main file loaded!")

export interface AppContextInterface {
	hangboardConnector: HangboardConnector,
	backend: RemoteAPI,
	storage: StorageInterface,
	store: ApplicationStoreInterface
	cfg: ConfigFile,
	staticData: null
}
export const AppContext = ({}) as AppContextInterface

function detectNotchs() {
	const notch = (window as any).AndroidNotch;
    if (notch) {
        const style = document.documentElement.style;
 
        // Apply insets as css variables
 
        notch.getInsetTop((px:any) => {
            style.setProperty("--notch-inset-top", px + "px");
        }, (err:any) => console.error("Failed to get insets top:", err));
        
        notch.getInsetRight((px:any) => {
            style.setProperty("--notch-inset-right", px + "px");
        }, (err:any) => console.error("Failed to get insets right:", err));
        
        notch.getInsetBottom((px:any) => {
            style.setProperty("--notch-inset-bottom", px + "px");
        }, (err:any) => console.error("Failed to get insets bottom:", err));
        
        notch.getInsetLeft((px:any) => {
            style.setProperty("--notch-inset-left", px + "px");
        }, (err:any) => console.error("Failed to get insets left:", err));
    }
}

function setupWindow() {
	const notch = (window as any).AndroidNotch;
}

async function startupApp() {
	console.log("startApp()");
	// this "fixes" missing keys when we add new properties to the specified default values, 
	// oterweise those new keys are missing on exsiting configs
	detectNotchs();
	setupWindow();
	const storage = new IndexedDBStorageImpl();
	AppContext.storage = storage;
	const store = await storage.getApplicationStore();
	const storeProxy = proxylize(store);
	console.log(store.user.id)
	storeProxy.user.id = 15
	console.log(store.user.id)
	AppContext.store = storeProxy;
	await writeConfigObject(storeProxy);
	AppContext.hangboardConnector = new HangboardConnector();
	AppContext.backend = new RemoteAPI();
	//(window as any).StatusBar.backgroundColorByHexString('#99000000');
	console.log("starting vue");
	Vue.prototype.$store = storeProxy;
	const _ = new Vue({
		router,
		data: AppContext,
		render: h => h(App)
	}).$mount('#app');
	document.addEventListener("pause", () => {
		AppContext.hangboardConnector.onGlobalMessage("appPause");
	}, false);
	document.addEventListener("resume", () => {
		if (!reauth(AppContext.backend)) {
			clearAllCookies();
			window.location.reload(true);
		}
		AppContext.hangboardConnector.onGlobalMessage("appResume");
	}, false);
}

if (!RUNNING_WITH_CORDOVA()) {
	startupApp();
} else {
	document.addEventListener("deviceready", () => {
		startupApp();
	}, false);
}