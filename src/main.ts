import Vue from 'vue'
import App from './App.vue'
import router from './router'

import { RemoteAPI, reauth, clearAllCookies } from './core/util'
//import { ConfigFile, StorageInterface } from '@/core/storageinterface';
//import { ApplicationStoreInterface } from '@/core/applicationstore'
//import { HangboardConnector } from './core/hangboardconnector'
import { DeviceConnector } from './core/connectivity/deviceconnector'
import { IndexedDBStorageImpl, writeConfigObject } from './core/persistentstore'
import { RUNNING_ON_DEV_MACHINE } from './config'
import { SplashScreen } from '@capacitor/splash-screen';
import { Observable } from '@/js/object-observer'
import { AppContext } from '@/appcontext'

Vue.config.productionTip = false

console.log("kraftmaschine main file loaded!")
console.log(`has ble: ${window.bluetoothle}`)

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

async function startupApp() {
	console.log("startApp()");
	// this "fixes" missing keys when we add new properties to the specified default values, 
	// oterweise those new keys are missing on exsiting configs
	detectNotchs();
	const storage = new IndexedDBStorageImpl();
	AppContext.storage = storage;
	const store = await storage.getApplicationStore();
	const storeProxy = Observable.from(store);
	//storeProxy.observe((e:any) => { console.log(e) })
	console.log(store.user.id)
	storeProxy.user.id = 15
	console.log(store.user.id)
	await writeConfigObject(storeProxy);
	AppContext.device = new DeviceConnector();
	AppContext.backend = new RemoteAPI();
	//(window as any).StatusBar.backgroundColorByHexString('#99000000');
	console.log("starting vue");
	Vue.prototype.$store = storeProxy;
	Vue.prototype.$ctx = AppContext;
	(window as any).myVue = new Vue({
		router,
		render: h => h(App),
		mounted() {
			SplashScreen.hide();
		}
	}).$mount('#app');
	document.addEventListener("pause", () => {
		//TODO: nitify vue
	}, false);
	document.addEventListener("resume", () => {
		if (!reauth(AppContext.backend)) {
			clearAllCookies();
			window.location.reload(true);
		}
		//TODO: nitify vue
	}, false);
}

if (RUNNING_ON_DEV_MACHINE()) {
	startupApp();
} else {
	document.addEventListener("deviceready", () => {
		startupApp();
	}, false);
}