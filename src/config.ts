import { HANGTIMER_FINISHED } from './messages';

let CORDOVA_BASE_PATH_VAL = ""
const isCordovaApp = window.hasOwnProperty("cordova");
if(isCordovaApp) {
    CORDOVA_BASE_PATH_VAL = "file:///android_asset/www";
}

export function CORDOVA_BASE_PATH(): string {
    return CORDOVA_BASE_PATH_VAL;
}

export function RUNNING_WITH_CORDOVA(): boolean {
    return isCordovaApp;
}

export function RUNNING_ON_DEV_MACHINE(): boolean {
    return navigator.platform === "Win32";
}

export const GlobalConfig = {
    configKey: "config",
    compressLocalSaves: true
}

export const AppVersion = {
    releaseName: "beta already?",
    major: 1,
    minor: 1,
    patch: 0,
    versionString: () => `${AppVersion.major}.${AppVersion.minor}.${AppVersion.patch}`,
    versionNumber: () => { return AppVersion.major * 10000 + AppVersion.minor * 100 + AppVersion.patch; }
};

export const RequiredBackendVersion = {
    major: 1,
    minor: 0,
    patch: 4,
    versionString: () => `${RequiredBackendVersion.major}.${RequiredBackendVersion.minor}.${RequiredBackendVersion.patch}`,
    versionNumber: () => { return RequiredBackendVersion.major * 10000 + RequiredBackendVersion.minor * 100 + RequiredBackendVersion.patch; }
};

export const BLEServiceInfo = {
    servidceId: "03257878-beb5-4087-ab68-ae6a82e4c4d9",
    weightCharacteristicId: "095aac41-c04d-436f-93c1-8ef1cea45016",
    hwVersionCharacteristicId: "abe57162-bb8a-4689-a9df-1af2268bf398",
    deviceIdCharacteristicId: "b19e6ca8-4d24-4e1b-9f66-5b3990eeac4f"
}

export const BackendServers = {
    webscaleServerRemote: "wss://bb.urbsch.at:7324/",
    webscaleServerLocal: "wss://192.168.1.20:7324/",
    webscaleServer: () => { return BackendServers.webscaleServerRemote },
    backendLocal: "https://192.168.1.20:25834/",
    backendRemote: "https://bb.urbsch.at:25834/",
    backend: () => { return BackendServers.backendLocal; }
};