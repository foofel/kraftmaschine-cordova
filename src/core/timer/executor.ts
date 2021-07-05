import { CustomTimer, TimerSetup, TimerSlot, TimerSlotState, TypedTimer } from '@/core/data/applicationstore'
import { WeightData, WeightMessage } from '../connectivity/deviceconnector';
import { clamp, roundDown } from '../util/math';
import { StopWatch } from '../util/stopwatch';
import { timeSeconds } from '../util/util';


export type TimerMetrics = {
    duration: number;
    sets: number;
    setLength: Array<number>;
    setStart: Array<number>;
    reps: number;
    repsInSet: Array<number>;
}

export type ExedcutorTimerSlot = TimerSlot & { 
    startTime: number;
    rep: number;
    repInSet: number;
    set: number;
}

export type ExecutorTimer = {
    slots:Array<ExedcutorTimerSlot>;
    metrics: TimerMetrics;
}

export function BuildExecutorTimer(setup:TimerSetup): ExecutorTimer {
    const addSlot = (a:Array<ExedcutorTimerSlot>, slot:ExedcutorTimerSlot) => {
        a.push(slot);
        return slot.startTime + slot.duration;
    }
    let execTimer:ExecutorTimer = { 
        slots: [], 
        metrics: {
            duration: 0,
            sets: 0,
            setLength: [],
            setStart: [],
            reps: 0,
            repsInSet: []
        }
    }    
    if(setup.timer.type == "custom") {
        const timer = setup.timer.timer;
        let duration = 0;
        let setStart = 0;
        let sets = 0;
        let repcount = 0;
        let repcount_set = 0;
        let prevState:TimerSlotState|"" = "";
        for(let i = 0; i < timer.length; i++) {
            let slot = timer[i];
            // the set counts from the first active slot until the break slot
            // the break slot does not count into the active time but counts
            // to the set
            if(slot.state == "active" && prevState == "") {
                sets++;
                setStart = duration;
                execTimer.metrics.setStart.push(setStart);
            } else if(slot.state == "pause" || slot.state == "cooldown") {
                prevState = "";
                execTimer.metrics.repsInSet.push(repcount_set);
                execTimer.metrics.setLength.push(duration - setStart);
                repcount_set = 0;
            }
            // every active slot counts as rep
            if(slot.state == "active") {
                repcount++;
                repcount_set++;
            }            
            if(slot.state == "cooldown") {
                sets = 0;
                repcount = 0;
            }
            duration = addSlot(execTimer.slots, { 
                ...slot, 
                rep: repcount,
                repInSet: repcount_set,
                set: sets,
                startTime: duration 
            });
        }
        execTimer.metrics.sets = sets;
        execTimer.metrics.duration = duration;
        execTimer.metrics.reps = repcount;
    } else if(setup.timer.type == "simple") {
        const timer = setup.timer.timer;
        const left = setup.timer.holdLeft;
        const right = setup.timer.holdLeft;
        let duration = 0;
        let setStart = 0;
        duration = addSlot(execTimer.slots, { state: "warmup", duration: timer.warmup, holdLeft: left, holdRight: right }, duration);
        for(let i = 0; i < timer.sets; i++) {
            setStart = duration;
            for(let k = 0; k < timer.repeats; k++) {
                duration = addSlot(execTimer.slots, { state: "active", duration: timer.active, holdLeft: left, holdRight: right }, duration);
                if(k != timer.repeats - 1) {
                    duration = addSlot(execTimer.slots, { state: "passive", duration: timer.passive, holdLeft: left, holdRight: right }, duration);
                }
            }
            execTimer.metrics.setLength.push(duration - setStart);
            execTimer.metrics.repsInSet.push(timer.repeats);
            if(i != timer.sets - 1) {
                duration = addSlot(execTimer.slots, { state: "pause", duration: timer.pause, holdLeft: left, holdRight: right }, duration);
            }
        }
        //actions.push({ state: "cooldown", duration: 10, holdLeft: left, holdRight: right });
        duration = addSlot(execTimer.slots, { state: "cooldown", duration: timer.cooldown, holdLeft: left, holdRight: right }, duration);
        execTimer.metrics.duration = duration;
        execTimer.metrics.reps = timer.repeats;
        execTimer.metrics.sets = timer.sets;
    }
    return execTimer;
}


export type TimerState = "init" | TimerSlotState | "goodwill" | "done" | "invalid";

export type TimerSlotInfo = {
    value: number;
    length: number;
    elapsed: number;
}

export type SlotSearchResult = {
    set: TimerSlotInfo;
    rep: TimerSlotInfo;
    state: TimerState;
    slotIndex:number;
}

export function FindCurrentSlot(timer: ExecutorTimer, time: number): SlotSearchResult {
    time = clamp(time, 0, timer.metrics.duration);
    const init:SlotSearchResult = {
        rep: { value: 0, length: 0, elapsed: 0 },
        set: { value: 0, length: 0, elapsed: 0 },
        state: "init",
        slotIndex: -1
    }
    if(time === 0) {
        return init;
    }
    for(let i = 0; i < timer.slots.length; i++) {
        const slot = timer.slots[i];
        if(time >= slot.startTime && time < slot.startTime + slot.duration) {
            const setLength = timer.metrics.setLength[slot.set];
            const setStart = timer.metrics.setStart[slot.set];
            return {
                // rep number and set number
                rep: { value: slot.repInSet, length: slot.duration, elapsed: time - slot.startTime },
                set: { 
                    value: slot.set, 
                    length: setLength,
                    elapsed: time - setStart
                },
                state: slot.state,
                slotIndex: i
            }
        }
    }
    if(time === timer.metrics.duration) {
        return { ...init, state: "done" };
    }
    return init;
}


export type NotifyType = "vibrate" | "vibrate_last" | "beep" | "beep_last";
export type NotifyCallback = (type: NotifyType) => void;

export interface RepActiveTime {
    active: number;
    inactive: number;
}

export type CalibrationResult = {
    tare: WeightData;
    weight: WeightData;
    weightedWeight: WeightData;
}

export type ExecutorTimerSetup = {
    setup: TimerSetup;
    calibration: CalibrationResult;
    activationFactor:number;
}

class BeepHelper {
    beepExecuted:boolean = false;
    timeIndex:number = 0;
    done:boolean = false;
    constructor(private beepTimes:Array<{ time:number, duration: number }>, private offset:number = 0) {
        this.beepTimes = beepTimes.sort((a, b) => a.time - b.time);
    }
    updateTime(time:number) {
        if(!this.done && time < (this.beepTimes[this.timeIndex].time + this.offset)) {
            this.timeIndex = this.beepTimes.findIndex((e) => e.time < time);
            if(this.timeIndex == -1) {
                this.done = true;
            }
            return true;
        }
        return false;
    }
}

export class TimerExecutor
{
    setup:ExecutorTimerSetup;
    timer:ExecutorTimer;
    runnerInterval:number = 0;
    lastWeightMsg:WeightMessage = {
        left: 0,
        right: 0,
        combined: 0,
        id: 0,
        ts: 0,
        passthrough: false
    };
    lastTickTime:number = 0;
    goodwillTime:number = 0.5;
    remainingGoodwillTime:number = 0;
    goodwillUsed:boolean = false;
    wasWaitingForGoodwill:boolean = false
    waitForGoodwill:boolean = false;
    //lastSlot:ExedcutorTimerSlot;
    activeTime:RepActiveTime = { active: 0, inactive: 0 };
    activeTimes:Array<RepActiveTime> = []
    state:TimerState = "init";
    startTime:number = 0;
    totalElapsed:number = 0;
    lastElapsed:number = 0;
    running:boolean = false;
    beeper:BeepHelper;

    constructor(setup:ExecutorTimerSetup) {
        this.setup = setup;
        this.timer = BuildExecutorTimer(setup.setup);
        this.lastTickTime = timeSeconds();
        this.beeper = new BeepHelper([
            { time: 10, duration: 0.1 },
            { time: 3, duration: 0.1 },
            { time: 2, duration: 0.1 },
            { time: 1, duration: 0.1 },
            { time: 0, duration: 0.2 }
        ], 0)
        this.runnerInterval = setInterval(() => {
            const now = timeSeconds();
            const elapsed = now - this.lastTickTime;
            this.lastTickTime = now;
            if(!this.running) {
                return;
            }
            if(this.waitForGoodwill) {
                this.remainingGoodwillTime -= elapsed;
                //TODO: goodwill callback
                if(this.remainingGoodwillTime <= 0) {
                    this.waitForGoodwill = false;
                    this.goodwillUsed = true;
                }
                console.log(`[TR] timer blocked by goodwill ${this.remainingGoodwillTime}`);
                return;
            }            
            if(!this.wasWaitingForGoodwill) {
                this.totalElapsed += elapsed;
                this.lastElapsed = elapsed;                
                this.wasWaitingForGoodwill = false;
                console.log(`[TR] goodwill ended, reusing previous times`);
            }
            const consumedTick = this.executeUpdateTick(this.totalElapsed, this.lastElapsed);
        }, 10);
    }
    executeUpdateTick(total:number, tick:number): boolean {
        const currentSlot = FindCurrentSlot(this.timer, total);
        if(currentSlot.state === "done") {
            clearInterval(this.runnerInterval);
            this.runnerInterval = 0;
            return true;
        }

        // handling the active/inactive time accumulation
        if(currentSlot.state == "active" && this.state !== "active") {
            console.log("[TR] entering active state");
            this.activeTime = { active: 0, inactive: 0 };
            if(!this.isOverActivationWeight() && !this.goodwillUsed) {
                // abort current tick and restart after the goodwill is done
                this.waitForGoodwill = true;
                this.remainingGoodwillTime = this.goodwillTime;
                console.log("[TR] activating goodwill timer");
                return false;
            }
            if(this.isOverActivationWeight()) {
                this.activeTime.active = currentSlot.rep.elapsed;
            } else {
                this.activeTime.inactive = currentSlot.rep.elapsed;
            }
        }
        else if(currentSlot.state === "active" && this.isOverActivationWeight()) {
            this.activeTime.active += tick
        }
        else if(currentSlot.state === "active" && !this.isOverActivationWeight()) {
            this.activeTime.inactive += tick
        }        
        else if(currentSlot.state != "active" && this.state != "active") {
            console.log("[TR] leaving active state");
            if(this.isOverActivationWeight()) {
                this.activeTime.active += tick;
            } else {
                this.activeTime.inactive += tick;
            }
            this.activeTimes.push(this.activeTime);
            this.activeTime = { active: 0, inactive: 0 };
            this.goodwillUsed = false;
        }
        const elapsedRep = total - this.timer.slots[currentSlot.slotIndex].startTime;
        if(this.beeper.updateTime(elapsedRep)) {
            // do beep
        }

        // handling the beeping thingy
        if(this.state == "init" || (this.state !== "active" && currentSlot.state === "active")) {
            this.nextBeep = roundDown(Math.min(this.beepStartTime, timerState.repLength), this.beepIntervall);
            this.nextAdvancedBeep =  this.nextBeep + this.beepTimeOffset > timerState.repLength 
                                    ? this.nextBeep - this.beepIntervall + this.beepTimeOffset
                                    : this.nextBeep + this.beepTimeOffset
        }
        if(this.state == "passive" || currentSlot.state === "pause" || currentSlot.state === "warmup") {
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
        if((this.state === "passive" || this.state === "pause" || this.state === "warmup") && currentSlot.state === "active") {
            if(this.beepTimeOffset === 0) {
                this.beepCallback("BEEP_LAST");
                //console.log("BEEP_LAST");
            }
            this.beepCallback("VIBRATE_LAST");
            //console.log("VIBRATE_LAST");
        }        


        this.state = currentSlot.state;
        return true;
    }

    private onActive() {}
    private onPassive() {}
    private onBreak() {}

    start(): void {
        this.running = true;
    }
    stop(): void {
        this.running = false;
    }
    destroy() {
        clearInterval(this.runnerInterval);
        this.runnerInterval = 0;  
    }
    isStarted(): boolean {
        return this.running;
    }
    injectMessage(msg:WeightMessage): void {
        this.lastWeightMsg = msg;
    }
    isOverActivationWeight(): boolean {
        return this.lastWeightMsg.combined >= this.getActivationWeight();
    }
    getActivationWeight() {
        return this.setup.calibration.weight.combined * this.setup.activationFactor;
    }
    getElapsedTime() {
        return Math.min(this.totalElapsed, this.timer.metrics.duration);
    }
    /*getActiveSlot() {
        return this.lastSlot;
    }*/
    getRemainingGoodwillTime() {
        return this.remainingGoodwillTime
    }
    isGoodwillActive() {
        return this.waitForGoodwill;
    }
}