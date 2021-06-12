import { AppContext } from '@/appcontext';
import { compress, decompress } from 'lz-string';
import { RemoteAPI } from './util';

export enum LocalUploadSaveKey {
    "save-training",
    "save-benchmark"
}

export interface LocalUploadSave {
    type: LocalUploadSaveKey;
    params: Array<string>;
    date: Date;
    compressData: boolean;
    data: any;
}

function MakeSaveName(): string {
    function dec2hex (dec: number) {
        return ('0' + dec.toString(16)).substr(-2)
    }    
    const arr = new Uint8Array((20) / 2)
    window.crypto.getRandomValues(arr)
    const id = Array.from(arr, dec2hex).join('')
    return `${id}`;
}

export interface Storage<T> {
    save(id: string, entry: T): void;
    load(id: string): T | null;
    delete(id: string): void;
    keyExists(id: string): boolean;
}

export async function GetLocalUploadSaves(): Promise<Map<string, LocalUploadSave>> {
    const saves: Map<string, LocalUploadSave> = new Map<string, LocalUploadSave>();
    for(const type of Object.entries(LocalUploadSaveKey)) {
        const [key, val] = type;
        const entries = await AppContext.storage.readTypedObjects(key);
        for(const entry of entries) {
            const typedSave: LocalUploadSave = entry as LocalUploadSave;
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
    /*const saveData = { ...data };
    if(data.compressData) {
        saveData.data = compress(JSON.stringify(data.data));
    }
    AppContext.storage.writeTypedObject(MakeSaveName(), data.type, saveData);*/
}

export function DeleteLocalUploadSave(storageId: number) {
    AppContext.storage.deleteTypedObject(storageId);
}

export class LocalSaveUploader {
    //uploadInterval:number = 60;
    constructor (private backend: RemoteAPI) {}
    async uploadLocalSaves() {
       /* try {
            const entries = await GetLocalUploadSaves();
            for(const entry of entries) {
                const [key, save] = entry;
                if(save.type === "save-training") {
                    const result = await this.backend.addTraining(save.data);
                    if(result.status === 200) {
                        console.log(`uploaded training from: ${save.date}`);
                        DeleteLocalUploadSave(key);
                    } else {
                        console.log(`unable to upload training from ${save.date}, error: ${result.status}`);
                    }
                }
                else if(save.type === "save-benchmark") {
                    const obj: LocalBenchmarkSaveData = save.data as LocalBenchmarkSaveData;
                    if(obj) {
                        const result = await this.backend.addBenchmark(
                            obj.boardId,
                            obj.leftId,
                            obj.rightId,
                            obj.userWeight,
                            obj.hangWeight, 
                            obj.activeTime,
                            obj.data
                        );
                        if(result.status === 200) {
                            console.log(`uploaded benchmark from: ${save.date}`);
                            DeleteLocalUploadSave(key);
                        } else {
                            console.log(`unable to upload benchmark from ${save.date}, error: ${result.status}`);
                        }
                    }
                }
            }
        } catch(e) {
            console.log("error while uploading local saves: " + e);
        }*/
    }
}