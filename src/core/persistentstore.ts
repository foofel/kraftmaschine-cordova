///// <reference path="../types/cordova-plugin-file.d.ts" />
import { RUNNING_ON_DEV_MACHINE } from "@/config";
import { ConfigFile, StorageInterface } from "./storageinterface";
const CONFIG_FILE_NAME = "config.json";
import Dexie from 'dexie';

interface Config {
    id?: number;
    config?: string;
}

interface TrainSave {
    id?: number;
    data?: string;
}

interface HighscoreSave {
    id?: number;
    data?: string;
}


class AppStorage extends Dexie {
    public config: Dexie.Table<Config, number>; // id is number in this case
    public trainings: Dexie.Table<TrainSave, number>; // id is number in this case
    public highscores: Dexie.Table<HighscoreSave, number>; // id is number in this case

    public constructor() {
        super("AppStorage");
        this.version(1).stores({
            config: "++id",
            trainings: "++id",
            highscores: "++id"
        });
        this.config = this.table("config");
        this.trainings = this.table("trainings");
        this.highscores = this.table("highscores");
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

function _readFile(fileEntry:FileEntry):Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        fileEntry.file(function (file) {
            const reader = new FileReader();

            reader.onloadend = function() {
                console.log("Successful file read: " + this.result);
                console.log(fileEntry.fullPath + ": " + this.result);
                if(this.result) {
                    resolve(this.result as ArrayBuffer); // we know it has to be an array buffer
                } else {
                    resolve(new ArrayBuffer(0));
                }
            };

            reader.readAsArrayBuffer(file)

            }, function(e) { 
                console.log(e); 
            }
        );
    });
}


function _writeFile(fileEntry:FileEntry, dataObj:Blob):Promise<boolean> {
    // Create a FileWriter object for our FileEntry (log.txt).
    return new Promise((resolve, reject) => {
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function() {
                console.log("Successful file write: " + this.length);
                resolve(true);
            };
            fileWriter.onerror = function (e) {
                reject(e);
            };
            fileWriter.write(dataObj);
        });
    });
}

function _truncateFile(fileEntry:FileEntry, dataObj:Blob):Promise<boolean> {
    // Create a FileWriter object for our FileEntry (log.txt).
    return new Promise((resolve, reject) => {
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function() {
                console.log("Successful truncate to: " + this.length);
                resolve(true);
            };
            fileWriter.onerror = function (e) {
                reject(e);
            };
            fileWriter.truncate(dataObj.size);
        });
    });
}

function _getFileSystem() : Promise<FileSystem> {
    return new Promise((resolve, reject) => {
        window.requestFileSystem(
            LocalFileSystem.PERSISTENT, 
            0, 
            function (fs) {
                resolve(fs);
            }, function(e) { 
                reject(e); 
            }
        );
    });
}

async function _getFileHandle(path:string, fs:FileSystem, params:Flags): Promise<FileEntry> {
    return new Promise((resolve, reject) => {
        fs.root.getFile(
            path, 
            params, 
            function (fileEntry) {
                console.log("fileEntry is file?" + fileEntry.isFile.toString());
                resolve(fileEntry);
            }, 
            function(e) { 
                reject(e); 
            }
        );
    });
}

export async function writeData(path:string, data:Blob): Promise<boolean> {
    const fs = await _getFileSystem();
    const file = await _getFileHandle(path, fs, { create: true,  exclusive: false });
    const success = await _writeFile(file, data);
    const trunc = await _truncateFile(file, data);
    return true;
}
export async function readData(path:string):Promise<ArrayBuffer> {
    const fs = await _getFileSystem();
    const file = await _getFileHandle(path, fs, { create: false,  exclusive: false });
    const data = await _readFile(file);
    return data;
}
export function objectExists(path:string) {}
export function getFolderFiles(path:string) {}


async function writeConfigObject(data:ConfigFile):Promise<boolean> {
    return writeData(CONFIG_FILE_NAME, new Blob([JSON.stringify(data)], { type: "text/plain" }));
}
async function readConfigObject():Promise<ConfigFile> {
    try {
        const data = await readData(CONFIG_FILE_NAME);
        const decoder = new TextDecoder("utf-8");
        const decoded = decoder.decode(data);
        return JSON.parse(decoded);        
    } catch(e) {
        return defaultConfigFile();
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

/*function getUpdateProxy(cfg:ConfigFile) {
    return {
        configProxy: null,
        configUpdateTimeout: 0,
        timeoutResetCounter: 0,
        hasChangedSinceWrite: false,
        getConfigProxyObject: function() {
            if(this.configProxy !== null) {
                return this.configProxy;
            }
            this.configProxy = createOnChangeProxy(() => {
                if(this.configUpdateTimeout && this.timeoutResetCounter < 100) {
                    clearTimeout(this.configUpdateTimeout);
                    this.configUpdateTimeout = 0;
                    this.timeoutResetCounter++;
                }
                this.hasChangedSinceWrite = true;
                if(!this.configUpdateTimeout) {
                    const updater = async () => {
                        this.hasChangedSinceWrite = false;
                        const rw = await writeConfigObject(cfg);
                        this.timeoutResetCounter = 0;
                        this.configUpdateTimeout = 0;
                        if(this.hasChangedSinceWrite) {
                            this.configUpdateTimeout = setTimeout(updater, 100);
                        }
                    }
                    this.configUpdateTimeout = setTimeout(updater, 100);
                }
            }, origin);
            return this.configProxy;
        }
    }
}*/


export class FileStorageImpl implements StorageInterface {
    cfg:ConfigFile = defaultConfigFile();
    cfgProxy:ConfigProxyMaker|null = null
    async init(): Promise<boolean> {
        let cfg = await readConfigObject();
        if(cfg == null) {
            cfg = defaultConfigFile();
        }
        cfg = mergeDeep(defaultConfigFile(), cfg);  
        this.cfgProxy = new ConfigProxyMaker(cfg);
        return true;
    }
    async getConfigProxyObject():Promise<ConfigFile> {
        return this.cfgProxy!.getConfigProxyObject();
    }
    writeData(path:string, data:Blob): Promise<boolean> {
        return writeData(path, data);
    }
    readData(path:string): Promise<any> {
        return readData(path);
    }
}

/*export class WebStorageImpl implements StorageInterface {
    cfg:ConfigFile = defaultConfigFile();
    cfgProxy:ConfigProxyMaker|null = null
    async init(): Promise<boolean> {
        let cfg = await readConfigObject();
        if(cfg == null) {
            cfg = defaultConfigFile();
        }
        cfg = mergeDeep(defaultConfigFile(), cfg);  
        this.cfgProxy = new ConfigProxyMaker(cfg);
        return true;
    }
    async getConfigProxyObject():Promise<ConfigFile> {
        return this.cfgProxy!.getConfigProxyObject();
    }
    async writeData(path:string, data:Blob): Promise<boolean> {
        const ab = await data.arrayBuffer();
        const text = new TextDecoder().decode(ab);
        localStorage.setItem(path, text);
        return true;
    }
    readData(path:string): Promise<any> {
        const data = localStorage.getItem(path);
        if(data) {
            return JSON.parse(data);
        } else {
            // return {} does not work, i dont know why (at least in the linter)
            return JSON.parse(JSON.stringify({})); //new Promise<any>((resolve) => { resolve({}); });
        }
    }
}*/

























/*export async function writeScoped(path:string, data:ConfigFile):Promise<boolean> {
    return new Promise((resolve, reject) => {
        window.requestFileSystem(
            LocalFileSystem.PERSISTENT, 
            0, 
            function (fs) {              
                console.log("[fs] got file system");
                fs.root.getFile(
                    CONFIG_FILE_NAME,
                    { create: true,  exclusive: false },
                    function (fileEntry:FileEntry) {
                        console.log("[fs] got file entry");
                        fileEntry.createWriter(function (fileWriter) {
                            fileWriter.onwriteend = function() {
                                console.log("Successful file write: " + this.length);
                                resolve(true);
                            };
                            fileWriter.onerror = function (e) {
                                reject(e);
                            };
                            fileWriter.write(JSON.stringify(data));
                        });
                    }, 
                    function(e) { 
                        reject(e); 
                    }
                );
            }, function(e) { 
                reject(e);
            }
        );
    });
}*/