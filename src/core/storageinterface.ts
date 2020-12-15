import { TimerSelectorEntry } from '@/components/typeexports';

export interface ConfigBoardSetup {
    [channel: string]: number;
}

export interface DeviceBoardMapping {
    [device: string]: number;
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
    deviceBoardMapping:DeviceBoardMapping;
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
    writeData(path:string, data:Blob): Promise<boolean>;
    readData(path:string): Promise<any>;
}