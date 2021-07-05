import { defaultApplicationStoreObject, ApplicationStoreInterface, updateFrom } from "@/core/data/applicationstore"
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

export interface StorageInterface {
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

export class IndexedDBStorageImpl implements StorageInterface {
    async writeObject(key:string, data:any): Promise<string> {
        const result = await db.keyVal.put({ id: key, data: data });
        return result;
    }
    async readObject(key:string): Promise<any> {
        const result = await db.keyVal.get(key);
        return result?.data;
    }
    async deleteObject(key:string) {
        const result = await db.keyVal.delete(key);
        return result;1
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
    async deleteTypedObject(key:number) {
        const result = await db.typedData.delete(key);
        return result;
    }
    async readTypedObjects(type:string): Promise<any[]> {
        const result = await db.typedData.where("type").equals(type).toArray();
        return result
    }    
    async getTypedObjectKeys():Promise<number[]> {
        const result = await db.typedData.toCollection().primaryKeys();
        return result;
    }
}

export async function loadApplicationStore() : Promise<ApplicationStoreInterface> {
    const first = await db.config.get(1);
    if(first?.config == null) {
        return defaultApplicationStoreObject();
    }
    const config = first?.config;
    const storeDefaults = defaultApplicationStoreObject();
    const augmentedStore = updateFrom(storeDefaults, config);
    return augmentedStore;    
    return first?.config;
}

export async function saveApplicationStore(cfg:ApplicationStoreInterface): Promise<boolean> {
    const plainObject = JSON.parse(JSON.stringify(cfg));
    const insert = await db.config.put({ id: 1, config: plainObject });
    return insert == 1;
}