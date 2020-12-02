import { HANGTIMER_FINISHED } from './messages';

let CORDOVA_BASE_PATH_VAL = ""
const isCordovaApp = window.hasOwnProperty("cordova");
if(isCordovaApp) {
    CORDOVA_BASE_PATH_VAL = "file:///android_asset/www";
}

export function CORDOVA_BASE_PATH(): string {
    return CORDOVA_BASE_PATH_VAL;
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

export const BackendServers = {
    webscaleServerRemote: "wss://bb.urbsch.at:7324/",
    webscaleServerLocal: "wss://192.168.0.136:7324/",
    webscaleServer: () => { return BackendServers.webscaleServerRemote },
    backendLocal: "https://localhost:25834/",
    backendRemote: "https://bb.urbsch.at:25834/",
    backend: () => { return BackendServers.backendRemote; }
};