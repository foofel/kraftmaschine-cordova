import { StopWatch } from '@/core/stopwatch';
import { HangboardConnector } from '@/core/hangboardconnector';
import { WeightMessage } from '@/core/sensorreader';
import { HangTimerData, TimerEntry } from '../../typeexports';
import { clamp, round, roundDown } from '@/core/math';
import { nowSeconds } from '@/core/util';
import { GlobalStore } from '@/main';

export type TimerState = "INIT" | "WARMUP" | "ACTIVE" | "PASSIVE" | "PAUSE" | "COOLDOWN" | "DONE" | "INVALID";

export interface TimerEntryPointInTime {
    rep: number;
    set: number;
    setElapsed: number;
    setLength: number;
    repElapsed: number;
    repLength: number;
    overallElapsed: number;
    overallLength: number;
    state: TimerState;
}
export type BeepType = "VIBRATE" | "VIBRATE_LAST" | "BEEP" | "BEEP_LAST";

/*export interface TimerWeightInfo {
    combinedWeight:number;
    userWeight:number;
    activationWeight:number;
    trainWeight:number;
    leftWeight:number;
    rightWeight:number;
}*/

export function CalculateSetLength(timer: TimerEntry) {
    return (timer.active + timer.passive) * timer.repeats - timer.passive;
}

export function GetOverallReps(timer: TimerEntry) {
    return timer.repeats * timer.sets;
}

export function CalculateTimerLength(timer: TimerEntry) {
    const setLength = CalculateSetLength(timer);
    return timer.warmup + timer.cooldown + 
    setLength * timer.sets + 
    timer.pause * timer.sets - 
    timer.pause;
}

export function TimerGetPointInTime(timer: TimerEntry, timePoint: number): TimerEntryPointInTime {
    const length = CalculateTimerLength(timer);
    const setLength = CalculateSetLength(timer);
    const baseState: TimerEntryPointInTime = {
        rep:0,
        set:0,
        setElapsed:0,
        setLength:1,
        repElapsed:0,
        repLength:1,
        overallElapsed: clamp(timePoint, 0, length),
        overallLength: length,
        state: "INIT"
    }
    if(timePoint === 0) {
        return baseState;
    }
    if(timePoint < timer.warmup) {
        return { 
            ...baseState,
            setElapsed: timePoint,
            setLength: timer.warmup, 
            repElapsed: timePoint,
            repLength: timer.warmup, 
            state:"WARMUP" 
        };
    }
    let time = timer.warmup;
    let setStart = 0
    for(let set = 0; set < timer.sets; set++) {
        setStart = time;
        for(let rep = 0; rep < timer.repeats; rep++) {
            const withNext = time + timer.active;
            if(timePoint < withNext && timePoint >= time) {
                return { 
                    ...baseState,
                    rep:rep + 1,
                    set:set + 1,
                    setElapsed: clamp(timePoint - setStart, 0, setLength),
                    setLength:setLength,                
                    repElapsed: timePoint - time,
                    repLength: timer.active,
                    state:"ACTIVE" 
                };
            }
            time = withNext;
            if(rep !== timer.repeats - 1) {
                const withNext = time + timer.passive;
                if(timePoint < withNext && timePoint >= time) {
                    return { 
                        ...baseState,
                        rep:rep + 1,
                        set:set + 1,
                        setElapsed: clamp(timePoint - setStart, 0, setLength),
                        setLength:setLength,                
                        repElapsed: timePoint - time,
                        repLength: timer.passive,
                        state:"PASSIVE" 
                    };
                }
                time = withNext;
            }
        }
        if(set !== timer.sets - 1) {
            const withNext = time + timer.pause;
            if(timePoint < withNext && timePoint >= time) {
                return { 
                    ...baseState,
                    rep:0,
                    set:set + 1,
                    setElapsed:1,
                    setLength:1,                
                    repElapsed: timePoint - time,
                    repLength: timer.pause,
                    state:"PAUSE" 
                };
            }
            time = withNext;
        }
    }
    if(timePoint < length) {
        return { 
            ...baseState,
            rep:timer.repeats,
            set:timer.sets,            
            setElapsed: timePoint - time,
            setLength: timer.cooldown,             
            repElapsed: timePoint - time,
            repLength: timer.cooldown,
            state:"COOLDOWN" 
        };
    } 
    else {
        return { 
            ...baseState, 
            rep:timer.repeats,
            set:timer.sets,            
            setElapsed: 1,
            setLength: 1,             
            repElapsed: 1,
            repLength: 1,            
            state:"DONE" 
        };
    }
}

export type TimerRunnerrCallback = (pit: TimerEntryPointInTime) => void;
export type ActiveTrackingTimerCallback = (pit: TimerEntryPointInTime, weight: WeightMessage, activeTime: number) => void;
export type BeepCallback = (type: BeepType) => void;

export interface CurrentActiveRepTimes {
    active: number;
    inactive: number;
}

export class TimerWithActiveTracking {
    stopWatch: StopWatch = new StopWatch(false);
    breakTimer: StopWatch = new StopWatch(false);
    currentActiveTimes: CurrentActiveRepTimes = { active: 0, inactive: 0 };
    lastWeight: WeightMessage = new WeightMessage(0, 0, 0, 0, false);
    lastState: TimerState = "INIT";
    lastTickTime = 0;
    activeTimeHistory: Array<number> = []
    currentActiveIndex = 0;
    beepStartTime = 3;
    beepIntervall = 1;
    beepTimeOffset: number; // android has a huge delay between an aodio play event and the audio actually playing
    nextBeep = 0;
    nextAdvancedBeep = 0;
    updateIntervall: any;
    constructor(
        private hangTimerData: HangTimerData,
        private scaleBackend: HangboardConnector, 
        private timerProgressCallback: ActiveTrackingTimerCallback,
        private timerDoneCallback: ActiveTrackingTimerCallback,
        private beepCallback: BeepCallback) 
    {
        const cfg = GlobalStore.cfg
        this.beepTimeOffset = cfg.options.beepTimeOffset;
        this.updateIntervall = setInterval(() => {
            this.executeUpdateTick();
        }, 10);
    }
    destroy(): void {
        if(this.updateIntervall) {
            clearInterval(this.updateIntervall);
            this.updateIntervall = null;
        }
        this.stopWatch.stop();
    }
    start(): void {
        this.stopWatch.start();
        this.breakTimer.stop();
    }
    stop(): void {
        this.stopWatch.stop();
        this.breakTimer.start();
    }
    isStarted(): boolean {
        return this.stopWatch.isStarted();
    }    
    executeUpdateTick(): void {
        if(!this.stopWatch.isStarted()) {
            return;
        }
        const timerState = TimerGetPointInTime(this.hangTimerData.timer.data, this.stopWatch.elapsed());
        if(timerState.state === "DONE") {
            if(this.updateIntervall) {
                clearInterval(this.updateIntervall);
                this.updateIntervall = null;
            }
        }
        const now = nowSeconds();
        const elapsed = (now - this.lastTickTime) - this.breakTimer.elapsed();
        this.breakTimer.reset();
        if(this.lastState !== "ACTIVE" && timerState.state === "ACTIVE") {
            this.currentActiveTimes.active = 0;
            this.currentActiveTimes.inactive = 0;
            if(this.isScaleActive()) {
                this.currentActiveTimes.active = timerState.repElapsed;
            } else {
                this.currentActiveTimes.inactive = timerState.repElapsed;
            }
        }
        else if(timerState.state === "ACTIVE" && this.isScaleActive()) {
            this.currentActiveTimes.active += elapsed;
        }
        else if(timerState.state === "ACTIVE" && !this.isScaleActive()) {
            this.currentActiveTimes.inactive += elapsed;
        }        
        else if(this.lastState === "ACTIVE" && timerState.state !== "ACTIVE") {
            if(this.isScaleActive()) {
                this.currentActiveTimes.active += elapsed;
            } else {
                this.currentActiveTimes.inactive += elapsed;
            }
            this.currentActiveTimes.active = clamp(this.currentActiveTimes.active, 0, this.hangTimerData.timer.data.active);
            this.currentActiveTimes.inactive = clamp(this.currentActiveTimes.inactive, 0, this.hangTimerData.timer.data.passive);
            this.activeTimeHistory[this.currentActiveIndex] = this.currentActiveTimes.active;
            this.currentActiveTimes.active = 0;
            this.currentActiveTimes.inactive = 0;
            this.currentActiveIndex++;
        }
        
        if(this.lastState === "INIT" || (this.lastState !== "ACTIVE" && timerState.state === "ACTIVE")) {
            this.nextBeep = roundDown(Math.min(this.beepStartTime, timerState.repLength), this.beepIntervall);
            this.nextAdvancedBeep =  this.nextBeep + this.beepTimeOffset > timerState.repLength 
                                    ? this.nextBeep - this.beepIntervall + this.beepTimeOffset
                                    : this.nextBeep + this.beepTimeOffset
        }
        if(timerState.state === "PASSIVE" || timerState.state === "PAUSE" || timerState.state === "WARMUP") {
            const remainingTime = timerState.repLength - timerState.repElapsed
            if(remainingTime < this.beepStartTime + this.beepTimeOffset) {
                // the last beep/vibrate logic is seperate
                if(this.nextAdvancedBeep > 0) {
                    const transitionAdvanced = this.nextAdvancedBeep;
                    if(remainingTime < transitionAdvanced) {
                        this.nextAdvancedBeep -= this.beepIntervall; //round(remainingTime, this.beepIntervall) - this.beepIntervall + this.beepTimeOffset;
                        if(this.nextAdvancedBeep > 0) {
                            this.beepCallback("BEEP");
                            //console.log("BEEP", remainingTime, this.nextAdvancedBeep);
                        } else {
                            this.beepCallback("BEEP_LAST");
                            //console.log("BEEP_LAST", remainingTime, this.nextAdvancedBeep);
                        }
                    }
                }                
                if(this.nextBeep > 0) {
                    const transitionNormal = this.nextBeep;
                    //console.log(remainingTime, transitionNormal);
                    if(remainingTime < transitionNormal) {
                        this.beepCallback("VIBRATE");
                        this.nextBeep -= this.beepIntervall;// round(remainingTime, this.beepIntervall) - this.beepIntervall;
                        //console.log("VIBRATE", remainingTime, this.nextBeep);
                    }
                }
            }
            //console.log(this.nextBeep, this.nextAdvancedBeep);
        }
        if((this.lastState === "PASSIVE" || this.lastState === "PAUSE" || this.lastState === "WARMUP") && timerState.state === "ACTIVE") {
            if(this.beepTimeOffset === 0) {
                this.beepCallback("BEEP_LAST");
                //console.log("BEEP_LAST");
            }
            this.beepCallback("VIBRATE_LAST");
            //console.log("VIBRATE_LAST");
        }

        this.timerProgressCallback(timerState, this.lastWeight, this.currentActiveTimes.active);
        if(this.lastState !== "DONE" && timerState.state === "DONE") {
            console.log("LAST TIMER STEP");
            this.timerDoneCallback(timerState, this.lastWeight, this.currentActiveTimes.active);
        }
        this.lastState = timerState.state;
        this.lastTickTime = now;
    }
    onWeightMessage = (weightMsg: WeightMessage) => {
        this.lastWeight = weightMsg;
    }
    isScaleActive(): boolean {
        return this.lastWeight.combined >= this.hangTimerData.activationWeight;
    }
    getActiveTimes(): ReadonlyArray<number> {
        return this.activeTimeHistory;
    }
    getCurrentTimerState(): TimerState {
        return this.lastState;
    }
    getCurrentActiveTime(): CurrentActiveRepTimes {
        return this.currentActiveTimes;
    }
    getActiveTimeSum(): number {
        const sum = this.activeTimeHistory.reduce((pv, cv) => pv + cv, 0);
        return sum + this.currentActiveTimes.active;
    }
    getPossibleActiveTimeSum(): number {
        return this.currentActiveIndex * this.hangTimerData.timer.data.active + (this.currentActiveTimes.active + this.currentActiveTimes.inactive);
    }
    elapsedTime() {
        const timerLength = CalculateTimerLength(this.hangTimerData.timer.data);
        return Math.min(this.stopWatch.elapsed(), timerLength);
    }
    getTimerLength() {
        const timerLength = CalculateTimerLength(this.hangTimerData.timer.data);
        return timerLength;
    }
}