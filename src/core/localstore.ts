import { LocalTrainingSaveData, TimerSelectorEntry } from '@/components/typeexports';
import { uuidv4 } from './util';
import { GlobalConfig } from '@/config';
import { compress, decompress } from 'lz-string';

export interface Storage<T> {
    save(id: string, entry: T): void;
    load(id: string): T | null;
    delete(id: string): void;
    keyExists(id: string): boolean;
}

export class LocalStorage<T> implements Storage<T> {
    constructor() {}
    save(id: string, entry: T): void {
        localStorage.setItem(id, JSON.stringify(entry));
    }
    load(id: string): T | null {
        const entry = localStorage.getItem(id);
        if(entry) {
            const object = JSON.parse(entry);
            return object as T;
        }
        return null;
    }
    delete(id: string): void {
        localStorage.removeItem(id);
    }
    keyExists(id: string): boolean {
        const obj = localStorage.getItem(id);
        return obj !== null;
    }
}

export function GetStore<T>(): Storage<T> {
    return new LocalStorage<T>();
}

export interface ConfigBoardSetup {
    [channel: string]: number;
}

export interface ConfigData {
    runCount: number;
    firstLogin: boolean;
    skipSplash: boolean;
    savedTimers: Array<TimerSelectorEntry>;
    enableBeep: boolean;
    beepTimeOffset: number;
    forceMaxVolumeBeep: boolean;
    enableVibrate: boolean;
    channel: string;
    boardSetups: ConfigBoardSetup;
    gbDrawTimeMarkers: boolean;
    gbDrawPercentileMarkers: boolean;
    [key: string]: any;
}

export interface ConfigFile {
    id: number;
    secret: string;
    alias: string;
    email: string;
    name: string;
    options: ConfigData;
}

export const LOCAL_SAVE_PREFIX = "save-";
export type LocalUploadSaveKey = "save-training" | "save-benchmark";

function MakeSaveName(type: LocalUploadSaveKey): string {
    function dec2hex (dec: number) {
        return ('0' + dec.toString(16)).substr(-2)
    }    
    const arr = new Uint8Array((20) / 2)
    window.crypto.getRandomValues(arr)
    const id = Array.from(arr, dec2hex).join('')
    return `${type}-${id}`;
}

function BuildInitialConfig(): ConfigFile {
    return {
        id: -1,
        alias: "",
        email: "",
        name: "",
        secret: "",
        options: { 
            runCount: 0,
            firstLogin: true,
            skipSplash: false,
            savedTimers: [],
            beepTimeOffset: 0.3,
            enableBeep: true,
            forceMaxVolumeBeep: false,
            enableVibrate: true,
            channel: "test",
            boardSetups: {},
            gbDrawTimeMarkers: true,
            gbDrawPercentileMarkers: true          
        }
    }
}

function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: any, source: any) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
}

export function SupplementDefaultKeys(real: ConfigFile) {
    return mergeDeep(BuildInitialConfig(), real);
}

export function GetConfigObject(): ConfigFile {
    const store = new LocalStorage<ConfigFile>();
    let cfg = store.load(GlobalConfig.configKey);
    if(!cfg) {
        cfg = BuildInitialConfig();
        store.save(GlobalConfig.configKey, cfg);
    }
    return cfg;
}

export function SaveConfigObject(config: ConfigFile) {
    const store = new LocalStorage<ConfigFile>();
    store.save(GlobalConfig.configKey, config);
}

export interface LocalUploadSave {
    type: LocalUploadSaveKey;
    params: Array<string>;
    date: Date;
    compressData: boolean;
    data: any;
}

export function GetLocalUploadSaves(type: LocalUploadSaveKey|null = null): Map<string, LocalUploadSave> {
    const saves: Map<string, LocalUploadSave> = new Map<string, LocalUploadSave>();
    const lookup: string = type || LOCAL_SAVE_PREFIX;
    for(const entry of Object.entries(localStorage)) {
        const [key, data] = entry;
        if(key.startsWith(lookup)) {
            const typedSave: LocalUploadSave = JSON.parse(data) as LocalUploadSave;
            if(typedSave) {
                if(typedSave.compressData) {
                    const decomp = decompress(typedSave.data);
                    if(decomp) {
                        typedSave.data = JSON.parse(decomp);
                    } else {
                        console.log("unable to decompress local save data, key: " + key);
                    }
                }
                saves.set(key, typedSave);
            } else {
                console.log("unable to parse local save data, key: " + key);
            }
        }
    }
    return saves;
}
export function AddLocalUploadSave(data: LocalUploadSave) {
    const storage: LocalStorage<LocalUploadSave> = new LocalStorage<LocalUploadSave>();
    const saveKey = MakeSaveName(data.type);
    const saveData = { ...data };
    if(data.compressData) {
        saveData.data = compress(JSON.stringify(data.data));
    }
    storage.save(saveKey, saveData);
}

export function DeleteLocalUploadSave(storageId: string) {
    const storage: LocalStorage<LocalUploadSave> = new LocalStorage<LocalUploadSave>();
    storage.delete(storageId);
}