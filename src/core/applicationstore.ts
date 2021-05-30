export interface SimpleTimer {
    sets:number;
    pause: number;
    active:number;
    warmup:number;
    passive:number;
    repeats:number;
    cooldown:number;
}


export type TimerSlotState = "warmup"|"active"|"passive"|"break"|"cooldown";
export interface TimerSlot {
    state: TimerSlotState;
    duration: number;
    holdLeft: number|null;
    holdRight: number|null;
}
export type CustomTimer = Array<TimerSlot>;


export type TypedTimer = {
    type: "simple"|"custom";
    timer:SimpleTimer|CustomTimer;
}
export type TimerSetup = {
    name: string;
    board: number;
    timer: TypedTimer;
}

export interface ApplicationStoreInterface {
    user: {
        id: number;
        userName: string;
        email: string;
        displayName: string;
        password: string;
    },
    appOptions: {
        runCount: number;
        firstRun: boolean;
        skipSplash: boolean;
        enableBeep: boolean;
        beepTimeOffset: number;
        forceMaxVolumeBeep: boolean;
        enableVibrate: boolean;
        gbDrawTimeMarkers: boolean;
        gbDrawPercentileMarkers: boolean;        
    },
    connection: {
        lastDeviceAddress: string;
        autoReconnect: boolean;
        knownDevices: Array<{ address: string, name: string, lastConnection: Date }>;
    }
    trainings: {
        list: Array<number>
    },
    benchmarks: {
        list: Array<number>
    }    
    timers: {
        timer: Array<TimerSetup>;
    }
}

export function defaultApplicationStoreObject(): ApplicationStoreInterface {
    return {
        user: {
            id: 0,
            userName: "",
            email: "",
            displayName: "",
            password: "",
        },
        appOptions: {
            runCount: 0,
            firstRun: true,
            skipSplash: false,
            enableBeep: true,
            beepTimeOffset: 0.3,
            forceMaxVolumeBeep: true,
            enableVibrate: true,
            gbDrawTimeMarkers: true,
            gbDrawPercentileMarkers: true,
        },
        connection: {
            lastDeviceAddress: "",
            autoReconnect: false,
            knownDevices: []
        },        
        trainings: {
            list: []
        },
        benchmarks: {
            list: []
        },
        timers:  {
            timer: [
                { name: "Basic 7s/5s", board: 0, timer: { type: "simple", timer: { active:7, passive:5, pause: 180, repeats:5, sets: 6, cooldown:10, warmup: 10 } } },
                { name: "Basic 6s/4s", board: 0, timer: { type: "simple", timer: { active:6, passive:4, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 } } },
                { name: "Basic 7s/3s", board: 0, timer: { type: "simple", timer: { active:7, passive:3, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 } } },
                { name: "Max 10s", board: 0, timer: { type: "simple", timer: { active:7, passive:5, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 } } },
                { name: "Max 3s Alt", board: 0, timer: { type: "custom", timer: [
                    { state: "warmup", duration: 10, holdLeft: 9, holdRight: 12 },
                    { state: "active", duration: 3, holdLeft: 9, holdRight: 12 },
                    { state: "break", duration: 180, holdLeft: null, holdRight: null },
                    { state: "cooldown", duration: 10, holdLeft: null, holdRight: null },
                ]}},
                { name: "Max 5s Alt", board: 0, timer: { type: "custom", timer: { active:7, passive:5, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 } } },
            ],
        }
    }
}

function createOnChangeProxy(onChange:(path:string, value:any) => void, target:any, path:string = ""):any {
    return new Proxy(target, {
        get(target, property) {
            const item = target[property]
            if (item && typeof item === 'object') {
                return createOnChangeProxy(onChange, item, `${path}/${String(property)}`)
            }
            return item
        },
        set(target, property, newValue) {
            target[property] = newValue
            onChange(`${path}/${String(property)}`, newValue)
            return true
        },
    })
}

export function proxylize(store:ApplicationStoreInterface) : ApplicationStoreInterface {
    const proxy = createOnChangeProxy((path:string, value:any) => {
        console.log(`changed: ${path} to: ${value}`);
    }, store, "");
    return proxy;
}

export function updateFrom(dst:ApplicationStoreInterface, src:ApplicationStoreInterface) {
    dst.user = { ...dst.user, ...src.user }
    dst.appOptions = { ...dst.appOptions, ...src.appOptions }
    dst.timers = { ...dst.timers, ...src.timers }
    return dst;
}