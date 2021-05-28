import { Capacitor } from "@capacitor/core";

export function RUNNING_ON_DEV_MACHINE(): boolean {
    return Capacitor.getPlatform() == "web";
}

export function RUNNING_NATIVE(): boolean {
    return Capacitor.isNativePlatform()
}

export function IS_PRODUCTION(): boolean {
    return false;
    //return true;
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
    envCharacteristicId: "cccffd3c-04d9-4cfc-abfc-995fc7f5fdac",
    lightCharacteristicId: "328f1bc1-0fb7-4bcd-b646-374917218331",
    hwVersionCharacteristicId: "abe57162-bb8a-4689-a9df-1af2268bf398",
    deviceIdCharacteristicId: "b19e6ca8-4d24-4e1b-9f66-5b3990eeac4f"
}

export const BackendConfig = {
    backendDev: "https://192.168.1.20/api",
    backendLive: "https://kraftmaschine.org/api",
    backendUrl: () => { 
        if(IS_PRODUCTION()){
            return BackendConfig.backendLive;
        } else {
            return BackendConfig.backendDev;
        }
    }
};