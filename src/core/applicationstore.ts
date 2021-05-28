export interface SimpleTimer {
    sets:number;
    pause: number;
    active:number;
    warmup:number;
    passive:number;
    repeats:number;
    cooldown:number;
}

export type TimerSlotState = "warmup"|"active"|"passive"|"cooldown";

export interface TimerSlot {
    state: TimerSlotState;
    holdLeft: number|null;
    holdRight: number|null;
}

export type CustomTimer = Array<TimerSlot>;

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
        simple: Array<SimpleTimer>;
        custom: Array<CustomTimer>;
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
            simple: [],
            custom: []
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

/*export class ApplicationStore implements ApplicationStoreInterface {
    user = {
		id: 0,
		userName: "",
		email: "",
		displayName: "",
		password: "",
	};
	appOptions = {
		runCount: 0,
		firstRun: true,
		skipSplash: false,
		enableBeep: true,
		beepTimeOffset: 0.3,
		forceMaxVolumeBeep: true,
		enableVibrate: true,
		deviceId: "",
		deviceAddress: "",
		gbDrawTimeMarkers: true,
		gbDrawPercentileMarkers: true,
	};
	timers = {
        simple: Array<SimpleTimer>(),
        custom: Array<CustomTimer>()
    }
}*/

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