import { TimerSelectorEntry } from '@/components/typeexports';

export interface DeviceBoardMapping {
    [device: string]: number;
}

export interface ConfigData {
    runCount: number;
    firstRun: boolean;
    skipSplash: boolean;
    savedTimers: Array<TimerSelectorEntry>;
    enableBeep: boolean;
    beepTimeOffset: number;
    forceMaxVolumeBeep: boolean;
    enableVibrate: boolean;
    deviceId: string;
    deviceAddress: string;
    deviceBoardMapping:DeviceBoardMapping;
    gbDrawTimeMarkers: boolean;
    gbDrawPercentileMarkers: boolean;
}

export interface IteratableConfigData {
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

/*export interface LocalUploadSave {
    type: LocalUploadSaveKey;
    params: Array<string>;
    date: Date;
    compressData: boolean;
    data: any;
}*/

export interface StorageInterface {
    init():Promise<boolean>;
    getConfigProxyObject():Promise<ConfigFile>;

    writeObject(key:string, data:any): Promise<string>;
    readObject(key:string): Promise<any>;
    deleteObject(key:string): Promise<void>;
    getObjectKeys():Promise<string[]>;

    writeTypedObject(key:string, type:string, data:any): Promise<number>;
    readTypedObject(key:number): Promise<any[]>;
    deleteTypedObject(key:number): Promise<void>;
    readTypedObjects(type:string): Promise<any[]>;
    getTypedObjectKeys():Promise<number[]>;
}