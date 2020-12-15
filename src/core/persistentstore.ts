import { ConfigFile, StorageInterface } from "./storageinterface";
import Dexie from 'dexie';

interface Config {
    id: number;
    config?: any;
}

interface TypedData {
    id?: number;
    type: string
    data?: any;
}

interface KeyVal {
    id: string;
    data?: any;
}

class AppStorage extends Dexie {
    public config: Dexie.Table<Config, number>; // id is number in this case
    public typedData: Dexie.Table<TypedData, number>; // id is number in this case
    public keyVal: Dexie.Table<KeyVal, string>; // id is number in this case

    public constructor() {
        super("AppStorage");
        this.version(1).stores({
            config: "id",
            typedData: "++id, type",
            keyVal: "id"
        });
        this.config = this.table("config");
        this.typedData = this.table("typedData");
        this.keyVal = this.table("keyVal");
    }
}

const db = new AppStorage();

export const defaultConfigFile = () : ConfigFile => {
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
            channel: "",
            deviceBoardMapping: {},
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

function createOnChangeProxy(onChange:Function, target:any):any {
    return new Proxy(target, {
        get(target, property) {
            const item = target[property]
            if (item && typeof item === 'object') return createOnChangeProxy(onChange, item)
            return item
        },
        set(target, property, newValue) {
            target[property] = newValue
            onChange()
            return true
        },
    })
}

async function getConfigObject() : Promise<ConfigFile> {
    const first = await db.config.get(1);
    if(first?.config == null) {
        return defaultConfigFile();
    }
    return first?.config;
}

async function writeConfigObject(cfg:ConfigFile):Promise<boolean> {
    const insert = await db.config.put({ id: 1, config: cfg });
    return insert == 1;
}

class ConfigProxyMaker {
    configProxy:any = null;
    configUpdateTimeout:any = null;
    timeoutResetCounter:number = 0;
    hasChangedSinceWrite = false;

    constructor(public cfg:ConfigFile) {}

    getConfigProxyObject():Promise<ConfigFile> {
        if(this.configProxy !== null) {
            return this.configProxy;
        }
        /*let cfg = await readConfigObject();
        if(cfg == null) {
            cfg = defaultConfigFile();
        }
        cfg = mergeDeep(defaultConfigFile(), cfg);*/
        this.configProxy = createOnChangeProxy(() => {
            if(this.configUpdateTimeout && this.timeoutResetCounter < 100) {
                clearTimeout(this.configUpdateTimeout);
                this.configUpdateTimeout = null;
                this.timeoutResetCounter++;
            }
            this.hasChangedSinceWrite = true;
            if(!this.configUpdateTimeout) {
                const updater = async () => {
                    this.hasChangedSinceWrite = false;
                    const rw = await writeConfigObject(this.cfg);
                    this.timeoutResetCounter = 0;
                    this.configUpdateTimeout = null;
                    if(this.hasChangedSinceWrite) {
                        this.configUpdateTimeout = setTimeout(updater, 100);
                    }
                }
                this.configUpdateTimeout = setTimeout(updater, 100);
            }
        }, this.cfg);
        return this.configProxy;
    }
}

export class IndexedDBStorageImpl implements StorageInterface {
    cfgProxy:ConfigProxyMaker|null = null
    async init(): Promise<boolean> {
        let cfg = await getConfigObject();
        cfg = mergeDeep(defaultConfigFile(), cfg);  
        this.cfgProxy = new ConfigProxyMaker(cfg);
        return true;
    }
    async getConfigProxyObject():Promise<ConfigFile> {
        return this.cfgProxy!.getConfigProxyObject();
    }
    async writeObject(key:string, data:any): Promise<string> {
        const result = await db.keyVal.put({ id: key, data: data });
        return result;
    }
    async readObject(key:string): Promise<any> {
        const result = await db.keyVal.get(key);
        return result?.data;
    }
    async getObjectKeys():Promise<string[]> {
        const result = await db.keyVal.toCollection().primaryKeys();
        return result;
    }
    async writeTypedObject(key:string, type:string, data:any): Promise<number> {
        const result = await db.typedData.put({ type: type, data: data });
        return result;
    }
    async readTypedObject(key:number): Promise<any[]> {
        const result = await db.typedData.get(key);
        return result?.data;
    }
    async readTypedObjects(type:string): Promise<any[]> {
        const result = await db.typedData.where("type").equals(type);
        return result.toArray();
    }    
    async getTypedObjectKeys():Promise<number[]> {
        const result = await db.typedData.toCollection().primaryKeys();
        return result;
    }
}

