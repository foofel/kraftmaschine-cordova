import { ConnectResult } from '@/core/connectivity/raw/deviceinterface'

export interface SimpleTimer {
    sets:number;
    pause: number;
    active:number;
    warmup:number;
    passive:number;
    repeats:number;
    cooldown:number;
}

export type TimerSlotState = "warmup"|"active"|"passive"|"pause"|"cooldown";

export interface TimerSlot {
    state: TimerSlotState;
    duration: number;
    holdLeft: number|null;
    holdRight: number|null;
}
export type CustomTimer = Array<TimerSlot>;

export type TypedTimer = {
    type: "simple";
    timer: SimpleTimer;
    holdLeft: number;
    holdRight: number;
}|{
    type: "custom",
    timer: CustomTimer
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
        debugOverlay: {
            show: boolean;
            state: "normal"|"minimized";
        }
    },
    connection: {
        lastDeviceAddress: string;
        autoReconnect: boolean;
        knownDevices: Array<{ address: string, name: string, lastConnected: Date }>;
        current: ConnectResult
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
            debugOverlay: {
                show: true,
                state: "minimized"
            }
        },
        connection: {
            lastDeviceAddress: "",
            autoReconnect: false,
            knownDevices: [],
            current: { deviceId: "", address: "", hwVersion: "", mtu: 0, success: false, info: { leftCalibration: 0, rightCalibration: 0 } }
        },        
        trainings: {
            list: []
        },
        benchmarks: {
            list: []
        },
        timers:  {
            timer: [
                { 
                    name: "Basic 7s/5s", 
                    board: 0, 
                    timer: { 
                        type: "simple", 
                        timer: { 
                            active:7, 
                            passive:5, 
                            pause: 180, 
                            repeats:5, 
                            sets: 6, 
                            cooldown:10, 
                            warmup: 10 
                        }, 
                        holdLeft: 9, 
                        holdRight: 12 
                    } 
                },
                { name: "Basic 6s/4s", board: 0, timer: { type: "simple", timer: { active:6, passive:4, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 }, holdLeft: 9, holdRight: 12 } },
                { name: "Basic 7s/3s", board: 0, timer: { type: "simple", timer: { active:7, passive:3, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 }, holdLeft: 9, holdRight: 12 } },
                { name: "Max 10s", board: 0, timer: { type: "simple", timer: { active:7, passive:5, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 }, holdLeft: 9, holdRight: 12 } },
                { name: "Max 3s Alt", board: 0, timer: { type: "custom", timer: [
                    { state: "warmup", duration: 10, holdLeft: 0, holdRight: 0 },
                    { state: "active", duration: 3, holdLeft: 9, holdRight: 12 },
                    { state: "pause", duration: 180, holdLeft: 0, holdRight: 0 },
                    { state: "cooldown", duration: 10, holdLeft: 0, holdRight: 0 },
                ]}},
                { name: "Max 5s Alt", board: 0, timer: { type: "simple", timer: { active:7, passive:5, pause: 180, repeats:6, sets: 6, cooldown:10, warmup: 10 }, holdLeft: 9, holdRight: 12 } },
            ],
        }
    }
}

export function updateFrom(dst:ApplicationStoreInterface, src:ApplicationStoreInterface) {
    dst.user = { ...dst.user, ...src.user }
    dst.appOptions = { ...dst.appOptions, ...src.appOptions }
    dst.timers = { ...dst.timers, ...src.timers }
    return dst;
}