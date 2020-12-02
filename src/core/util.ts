import { GetLocalUploadSaves, DeleteLocalUploadSave, GetConfigObject, SaveConfigObject } from './localstore';
import { LocalBenchmarkSaveData, SelectedHolds, BenchmarkVisualHighscoreEntry } from '../components/typeexports';
import { BackendServers, RequiredBackendVersion } from '../config'

export function uuidv4(): string {
    const str = ""+[1e7]+-1e3+-4e3+-8e3+-1e11;
    return str.replace(/[018]/g, (c: any) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

export function makeid(length: number) {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/*export function format(format:string, ...args: any[]) {
    return format.replace(/{(\d+)}/g, function(match:any, number:any) { 
      return typeof args[number] !== 'undefined' ? args[number] : match;
    });
};*/

export type RemoteAPIMethod = "GET" | "POST" | "PUT" | "DELETE"

export class RemoteAPI {
    connectionString: string = BackendServers.backend();
    authenticated = false;
    constructor() {
    }
    async authBackend(secret: string): Promise<any> {
        const res = await this.authenticate(secret);
        const obj = await res.json();
        if(res.status === 200) {
            this.authenticated = true;
            return { result: res, data: obj, authenticated: true };
        } else {
            return { result: res, data: obj, authenticated: false };
        }
    }
    isAuthenticated() {
        return this.authenticated;
    }
    async getVersion(): Promise<Response> {
        const response = this.makeCall("GET", "")
        return response;
    }    
    async createAccount(alias: string): Promise<Response> {
        const response = this.makeCall("POST", "create-account", { 
            alias: alias
        });
        return response;
    }    
    async userExists(alias: string): Promise<Response> {
        const response = this.makeCall("GET", "user-exists", { alias: alias });
        return response;
    }       
    private async authenticate(secret: string): Promise<Response> {
        const response = this.makeCall("POST", "authenticate", { secret: secret });
        return response;
    }
    async getTrainings(): Promise<Response> {
        const response = this.makeCall("GET", "trainings/me")
        return response;
    }
    async addTraining(data: any): Promise<Response> {
        const response = this.makeCall("POST", "trainings/me", data)
        return response;
    }
    async deleteTraining(id: string): Promise<Response> {
        const response = this.makeCall("DELETE", `trainings/me/${id}`);
        return response;
    }
    async updateUserData(name: string|null, email: string|null, options: any|null): Promise<Response> {
        const response = this.makeCall("PUT", `users/me`, { name: name, email: email, options: options });
        return response;
    }
    async getReferenceHighscore(order: "wabs"|"wrel"|"time"): Promise<Response> {
        const response = this.makeCall("GET", "highscore/reference", {
            order: order
        });
        return response;
    }
    async getInitialData() {
        const response = this.makeCall("GET", `init/all`);
        return response;
    }
    async getHighscore(board: number, left: number|null, right: number|null, minTime: number|null, order: Array<["depth", "wrel"|"wabs"|"time"]>): Promise<Response> {
        const response = this.makeCall("GET", "highscore", { 
            board: board, 
            left: left, 
            right: right, 
            minTime: minTime,
            order: order
        });
        return response;
    }    
    async addBenchmark(boardId: number, leftId: number|null, rightId: number|null, userWeight: number, hangWeight: number, activeTime: number, data: any): Promise<Response> {
        const response = this.makeCall("POST", "benchmarks/me", { 
            boardId: boardId, 
            leftId: leftId, 
            rightId: rightId, 
            userWeight: userWeight,
            hangWeight: hangWeight,
            activeTime: activeTime,
            data: data
        });
        return response;
    }
    async getCurrentExclusiveBenchmarkAccess(): Promise<Response> {
        const response = this.makeCall("GET", "benchmark/exclusive-acces/query");
        return response;
    }
    async requestExclusiveBenchmarkAccess(): Promise<Response> {
        const response = this.makeCall("GET", "benchmark/exclusive-acces/request");
        return response;
    }
    async releaseExclusiveBenchmarkAccess(): Promise<Response> {
        const response = this.makeCall("GET", "benchmark/exclusive-acces/release");
        return response;
    }    
    async forceEndExclusiveBenchmarkAccess(): Promise<Response> {
        const response = this.makeCall("GET", "benchmark/exclusive-acces/force-reset");
        return response;
    }            
    private async makeCall(method: RemoteAPIMethod, endpoint: string, payload: any = undefined): Promise<Response> {
        const url = new URL(`${this.connectionString}${endpoint}`);
        // HEAD/GET can not have payload therefore we convert those to query params
        if(method === "GET" && payload != null) {
            Object.keys(payload).forEach(key => url.searchParams.append(key, payload[key]))
            payload = undefined
        }
        const response = await fetch(url.toString(), {
            headers: { 
                "Content-Type": "application/json; charset=utf-8" 
            },
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'include',
            method: method,
            body: JSON.stringify(payload)
        });
        return response;
    }
}

export class EasyRemoteApiHelpers {
    public static async authenticate(api: RemoteAPI, secret: string): Promise<any> {
        try {
            const res = await api.authBackend(secret);
            return res;
        } catch(e) {
            return { result: { status: 0 }, data: {}, authenticated: false };
        }
    }
    public static async getVersion(api: RemoteAPI): Promise<{ versionNumber: number; versionString: string }|false> {
        try {
            const result = await api.getVersion();
            if(result.status !== 200) {
                return false;
            }
            const data = await result.json();
            return data;
        } catch (error) {
            return false;
        }
    }
    public static async createAccount(api: RemoteAPI, alias: string): Promise<any> {
        try {
            const result = await api.createAccount(alias);
            if(result.status === 200) {
                return await result.json();
            }
            return null;
        } catch (e) {
            return null;
        }
    }
    public static async userExists(api: RemoteAPI, alias: string): Promise<any> {
        try {
            const result = await api.userExists(alias);
            if(result.status === 200) {
                const data = await result.json();
                return { result: result, data: data, userExists: data.exists };
            }
            return { result: result, data: {}, userExists: false };
        } catch (error) {
            return { result: {status: 0}, data: {}, userExists: false };
        }        
    }
    /*public static async authenticate(api:RemoteAPI, userId:string):Promise<boolean> {
        try {
            let result = await api.authenticate(userId);
            if(result.status === 200) {
                return true;
            }            
            return false;
        } catch (e) {
            return false;
        }
    }*/    
    public static async getTrainings(api: RemoteAPI): Promise<any> {
        try {
            const result = await api.getTrainings();
            if(result.status !== 200) {
                return [];
            }
            const data = await result.json();
            return data;
        } catch (error) {
            return [];
        }
    } 
    public static async addTraining(api: RemoteAPI, data: any): Promise<boolean> {
        try {
            const result = await api.addTraining(data);
            if(result.status !== 200) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    public static async updateUserData(api: RemoteAPI, name: string|null, email: string|null, options: any|null): Promise<any> {
        try {
            const result = await api.updateUserData(name, email, options);
            if(result.status !== 200) {
                return false;
            }
            return await result.json();
        } catch (error) {
            return false;
        }
    }
    public static async getReferenceHighscore(api: RemoteAPI, order: "wabs"|"wrel"|"time"): Promise<any> {
        try {
            const result = await api.getReferenceHighscore(order);
            if(result.status !== 200) {
                return [];
            }
            const data = await result.json();
            return data;
        } catch (error) {
            return [];
        }
    }
    public static async addBenchmark(api: RemoteAPI, board: number, left: number|null, right: number|null, userWeight: number, hangWeight: number, activeTime: number, data: any): Promise<any> {
        try {
            const result = await api.addBenchmark(board, left, right, userWeight, hangWeight, activeTime, data);
            if(result.status !== 200) {
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    public static async getInitialData(api: RemoteAPI): Promise<any> {
        try {
            const result = await api.getInitialData();
            if(result.status !== 200) {
                return [];
            }
            const data = await result.json();
            return data;
        } catch (error) {
            return [];
        }
    }
    public static async getCurrentExclusiveBenchmarkAccess(api: RemoteAPI): Promise<any> {
        try {
            const result = await api.getCurrentExclusiveBenchmarkAccess();
            if(result.status === 200) {
                const data = await result.json();
                return data;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    public static async requestExclusiveBenchmarkAccess(api: RemoteAPI): Promise<any> {
        try {
            const result = await api.requestExclusiveBenchmarkAccess();
            if(result.status === 200) {
                const data = await result.json();
                return data;
            }
            return false;
        } catch (error) {
            return false;
        }
    }
    public static async releaseExclusiveBenchmarkAccess(api: RemoteAPI): Promise<any> {
        try {
            const result = await api.requestExclusiveBenchmarkAccess();
            if(result.status === 200) {
                const data = await result.json();
                return data;
            }
            return false;
        } catch (error) {
            return false;
        }
    }    
    public static async forceEndExclusiveBenchmarkAccess(api: RemoteAPI): Promise<any> {
        try {
            const result = await api.forceEndExclusiveBenchmarkAccess();
            if(result.status === 200) {
                const data = await result.json();
                return data;
            }
            return false;
        } catch (error) {
            return false;
        }
    }                       
}

export class LocalSaveUploader {
    //uploadInterval:number = 60;
    constructor (private backend: RemoteAPI) {}
    async uploadLocalSaves() {
        try {
            const entries = GetLocalUploadSaves();
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
        }
    }
}

export function makeSound(source: any, actx: any, loadHandler: any) {
    const o: any = {};
    //Set the default properties.
    o.volumeNode = actx.createGain();
    o.panNode = actx.createPanner();
    o.panNode.panningModel = "equalpower";
    o.soundNode = undefined;
    o.buffer = undefined;
    o.source = undefined;
    o.loop = false;
    o.isPlaying = false;
    //The function that should run when the sound is loaded.
    o.loadHandler = undefined;
    //Values for the `pan` and `volume` getters/setters.
    o.panValue = 0;
    o.volumeValue = 1;
    //Values to help track and set the start and pause times.
    o.startTime = 0;
    o.startOffset = 0;
    //The sound object's methods.
    o.play = function() {
        //Set the start time (it will be `0` when the sound
        //first starts.
        o.startTime = actx.currentTime;
        //Create a sound node.
        o.soundNode = actx.createBufferSource();
        //Set the sound node's buffer property to the loaded sound.
        o.soundNode.buffer = o.buffer;
        //Connect the sound to the pan, connect the pan to the
        //volume, and connect the volume to the destination.
        o.soundNode.connect(o.panNode);
        o.panNode.connect(o.volumeNode);
        o.volumeNode.connect(actx.destination);
        //Will the sound loop? This can be `true` or `false`.
        o.soundNode.loop = o.loop;
        //Finally, use the `start` method to play the sound.
        //The start time will either be `0`,
        //or a later time if the sound was paused.
        o.soundNode.start(
            0, o.startOffset % o.buffer.duration
        );
        //Set `isPlaying` to `true` to help control the
        //`pause` and `restart` methods.
        o.isPlaying = true;
    };
    o.pause = function() {
        //Pause the sound if it's playing, and calculate the
        //`startOffset` to save the current position.
        if (o.isPlaying) {
            o.soundNode.stop(0);
            o.startOffset += actx.currentTime - o.startTime;
            o.isPlaying = false;
        }
    };
    o.restart = function() {
        //Stop the sound if it's playing, reset the start and offset times,
        //then call the `play` method again.
        if (o.isPlaying) {
            o.soundNode.stop(0);
        }
        o.startOffset = 0;
        o.play();
    };
    o.playFrom = function(value: any) {
        if (o.isPlaying) {
            o.soundNode.stop(0);
        }
        o.startOffset = value;
        o.play();
    };
    //Volume and pan getters/setters.
    Object.defineProperties(o, {
        volume: {
            get: function() {

            },
            set: function(value) {
                o.volumeNode.gain.value = value;
                o.volumeValue = value;
            },
            enumerable: true, 
            configurable: true
        },
        pan: {
            get: function() {
            return o.panValue;
            },
            set: function(value) {
                //Panner objects accept x, y and z coordinates for 3D
                //sound. However, because we're only doing 2D left/right
                //panning we're only interested in the x coordinate,
                //the first one. However, for a natural effect, the z
                //value also has to be set proportionately.
                const x = value;
                const y = 0;
                const z = 1 - Math.abs(x);
                o.panNode.setPosition(x, y, z);
                o.panValue = value;
            },
            enumerable: true, 
            configurable: true
        }
    });
    //The `load` method. It will call the `loadHandler` passed
    //that was passed as an argument when the sound has loaded.
    o.load = function() {
        const xhr = new XMLHttpRequest();
        //Use xhr to load the sound file.
        xhr.open("GET", source, true);
        xhr.responseType = "arraybuffer";
        xhr.addEventListener("load", function() {
            //Decode the sound and store a reference to the buffer.
            actx.decodeAudioData(
                xhr.response,
                function(buffer: any) {
                    o.buffer = buffer;
                    o.hasLoaded = true;
                    //This next bit is optional, but important.
                    //If you have a load manager in your game, call it here so that
                    //the sound is registered as having loaded.
                    if (loadHandler) {
                        loadHandler(o);
                    }
                },
                //Throw an error if the sound can't be decoded.
                function(error: any) {
                    throw new Error("Audio could not be decoded: " + error);
                }
            );
        });
        //Send the request to load the file.
        xhr.send();
    };
    //Load the sound.
    o.load();
    //Return the sound object.
    return o;
}

export function getProp(obj: any, key: string) {
    return key.split(".").reduce(function(o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x]; // eslint-disable-line eqeqeq
    }, obj);
}

declare global {
    interface Window {
        // add you custom properties and methods
        cookieManager: {
            clear: () => void;
        };
      }
}

export function clearAllCookies() {
    if(window.cookieManager) {
        window.cookieManager.clear();
    }
}

export function throttle(cb: any, limit: number) {
    let wait = false;
    return () => {
        if (!wait) {
            cb();
            wait = true;
            setTimeout(() => {
                wait = false;
            }, limit);
        }
    }
}

export async function reauth(backend: RemoteAPI) {
    const version = await EasyRemoteApiHelpers.getVersion(backend);
    if(!version) {
      return false;
    }
    if(version && version.versionNumber !== RequiredBackendVersion.versionNumber()) {
        console.log("invalid version while reauth");
        return false;
    }
    const cfg = GetConfigObject();
    const authPromise = await EasyRemoteApiHelpers.authenticate(backend, cfg.secret);
    if(authPromise.result.status === 200) {
        cfg.alias = authPromise.data.alias;
        cfg.email = authPromise.data.email;
        cfg.name = authPromise.data.name;
        SaveConfigObject(cfg);
        console.log(`reauthentication successfull, hello ${cfg.alias} :)`);
        return true;
    } else {
        console.log(`reauthentication failed, userKey:'${cfg.secret}' (this key is PRIVATE, do not share)`);
        return false;
    }
    //return true;
}

export function showToast(msg: string, duration = 2000, pos = "center") {
    console.log(`toast: ${msg}`);
    const wnd = window as any;
    if(wnd.plugins && wnd.plugins.toast) {
        wnd.plugins.toast.show(msg, duration, pos)
    }

}

export type UpdaterCBType<T> = (value: T) => void;

export class UpdateLimiter<T>
{
    stopRequested = false;
    updateComplete = true;
    value: T|null = null;
    runningCallbacks: Map<UpdaterCBType<T>, { value: T; updateComplete: boolean }> = new Map<UpdaterCBType<T>, { value: T; updateComplete: boolean }>();

    setValue(value: T, updateCB: UpdaterCBType<T>) {
        //this.value = value;
        if(!this.runningCallbacks.has(updateCB)) {
            this.runningCallbacks.set(updateCB, { value:value, updateComplete:true })
        }
        const cbInfo = this.runningCallbacks.get(updateCB)!;
        cbInfo.value = value;
        if(!cbInfo.updateComplete) {
            return;
        }
        cbInfo.updateComplete = false;
        const run = () => {
            if(this.stopRequested) {
                return;
            }
            updateCB(cbInfo.value);
            cbInfo.updateComplete = true;

        };
        requestAnimationFrame(run);
    }

    halt() {
        this.stopRequested = true;
    }

}

export function nowSeconds() {
    return performance.now() / 1000;
}

export function getHoldString(holds: SelectedHolds) {
    if(holds.left && holds.right) {
        const lapp = holds.left.defaultHand !== "l" ? "(R)" : "";
        const rapp = holds.right.defaultHand !== "r" ? "(L)" : "";
        return `${holds.left.shortName}${lapp}/${holds.right.shortName}${rapp}`;
    }
    else if(holds.left) {
        const lapp = holds.left.defaultHand !== "l" ? "(R)" : "";
        return `L: ${holds.left.shortName}${lapp}`;
    }
    else if(holds.right) {
        const rapp = holds.right.defaultHand !== "r" ? "(L)" : "";
        return `R: ${holds.right.shortName}${rapp}`;
    }
    return "";
}

export function findNextHighscoreUser(highscore: Array<BenchmarkVisualHighscoreEntry>, time: number) {
    if(highscore.length === 0) {
        return { idx: -1, next: null, prev: null };
    }
    let prev = null;
    for(let i = 0; i < highscore.length; i++){
        if(time > highscore[i].time) {
            prev = highscore[i];
            continue;
        }
        return { idx: i, next: highscore[i], prev: prev };
    }
    return { idx: highscore.length - 1, next: null, prev: prev };
}