import { CustomTimer, TimerSetup, TimerSlot, TimerSlotState, TypedTimer } from '@/core/data/applicationstore'
import { WeightData, WeightMessage } from '../connectivity/deviceconnector';
import { clamp, roundDown } from '../util/math';
import { StopWatch } from '../util/stopwatch';
import { timeSeconds } from '../util/util';


export type TimerMetrics = {
    duration: number;
    sets: number;
    reps: number;
    setLength: Array<number>;
    setStart: Array<number>;
    repsInSet: Array<number>;
}

export type ExedcutorTimerSlot = TimerSlot & { 
    startTime: number;
    rep: number;
    repInSet: number;
    set: number;
}

export type ExecutableTimer = {
    slots:Array<ExedcutorTimerSlot>;
    metrics: TimerMetrics;
}

export function BuildExecutorTimer(setup:TimerSetup): ExecutableTimer {
    const execTimer:ExecutableTimer = { 
        slots: [], 
        metrics: {
            duration: 0,
            sets: 0,
            reps: 0,
            setLength: [],
            setStart: [],
            repsInSet: []
        }
    }
    const addSlot = (a:Array<ExedcutorTimerSlot>, slot:ExedcutorTimerSlot) => {
        a.push(slot);
        return slot.startTime + slot.duration;
    }    
    if(setup.timer.type == "custom") {
        const timer = setup.timer.timer;
        let duration = 0;
        let setStart = 0;
        let setcount = 0;
        let repcount = 0;
        let repcount_set = 0;
        let prevState:TimerSlotState|"" = "";
        for(let i = 0; i < timer.length; i++) {
            const slot = timer[i];
            // the set counts from the first active slot until the break slot
            // the break slot does not count into the active time but counts
            // to the set
            if(slot.state == "active" && prevState == "") {
                setcount++;
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
                //setcount = 0;
                //repcount = 0;
            }
            duration = addSlot(execTimer.slots, { 
                ...slot, 
                rep: repcount,
                repInSet: repcount_set,
                set: setcount,
                startTime: duration,
            });
        }
        execTimer.metrics.sets = setcount;
        execTimer.metrics.duration = duration;
        execTimer.metrics.reps = repcount;
    } else if(setup.timer.type == "simple") {
        const timer = setup.timer.timer;
        const left = setup.timer.holdLeft;
        const right = setup.timer.holdRight;
        let repcount = 0;
        let duration = 0;
        let setStart = 0;
        let repcount_set = 0;
        duration = addSlot(execTimer.slots, { 
            state: "warmup", 
            duration: timer.warmup, 
            holdLeft: left, 
            holdRight: right, 
            startTime: duration, 
            rep: 0,
            repInSet: 0, 
            set: 0
        });
        for(let i = 0; i < timer.sets; i++) {
            setStart = duration;
            execTimer.metrics.setStart.push(setStart);
            for(let k = 0; k < timer.repeats; k++) {
                duration = addSlot(execTimer.slots, { 
                    state: "active", 
                    duration: timer.active, 
                    holdLeft: left, 
                    holdRight: right, 
                    startTime: duration, 
                    rep: repcount,
                    repInSet: repcount_set, 
                    set: i
                });          
                if(k != timer.repeats - 1) {
                    duration = addSlot(execTimer.slots, { 
                        state: "passive", 
                        duration: timer.passive, 
                        holdLeft: left, 
                        holdRight: right, 
                        startTime: duration, 
                        rep: repcount,
                        repInSet: repcount_set, 
                        set: i 
                    });
                }
                repcount++;
                repcount_set++;                
            }
            execTimer.metrics.setLength.push(duration - setStart);
            execTimer.metrics.repsInSet.push(timer.repeats);
            if(i != timer.sets - 1) {
                duration = addSlot(execTimer.slots, { 
                    state: "pause", 
                    duration: timer.pause, 
                    holdLeft: left, 
                    holdRight: right, 
                    startTime: duration, 
                    rep: 0,
                    repInSet: 0,
                    set: i
                });
            }
            repcount_set = 0;
        }
        duration = addSlot(execTimer.slots, { 
            state: "cooldown", 
            duration: timer.cooldown, 
            holdLeft: left, 
            holdRight: right, 
            startTime: duration, 
            rep: 0,
            repInSet: 0, 
            set: 0
        });
        execTimer.metrics.duration = duration;
        execTimer.metrics.reps = repcount;
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

export function FindCurrentSlot(timer: ExecutableTimer, time: number): SlotSearchResult {
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
            let setLength = 0;
            let setStart = 0;
            if(slot.state === 'warmup' || slot.state === "cooldown") {
                setLength = slot.duration;
                setStart = slot.startTime;
            } else {
                setLength = timer.metrics.setLength[slot.set];
                setStart = timer.metrics.setStart[slot.set];
            }
            return {
                // rep number and set number
                rep: { 
                    value: slot.repInSet, 
                    length: slot.duration, 
                    elapsed: time - slot.startTime 
                },
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


export type NotifyType = "vibrate" | "vibrate_last" | "beep" | "beep_last" | "timer_changed" | "holds_update";
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
    timerSetup: TimerSetup;
    calibration: CalibrationResult;
    activationFactor:number;
    cb:NotifyCallback;
}

class BeepHelper {
    done:boolean = false;
    beepTimes:Array<{ time:number, duration: number, executed: boolean }> = [];
    constructor(beepTimes:Array<{ time:number, duration: number}>) {
        for(let i = 0; i < beepTimes.length; i++) {
            this.beepTimes.push({ ...beepTimes[i], executed: false });
        }
        this.beepTimes = this.beepTimes.sort((a, b) => a.time - b.time);
    }
    reset() {
        this.done = false;
        for(let i = 0; i < this.beepTimes.length; i++) {
            this.beepTimes[i].executed = false;
        }
    }
    isDone() {
        return this.done;
    }
    checkForBeep(time:number):number {
        const beepIndex = this.beepTimes.findIndex((e) => e.time > time);
        const beep = this.beepTimes[beepIndex];
        if(!beep.executed) {
            if(beepIndex == 0) {
                this.done = true;
            }
            beep.executed = true;
            console.log(`[BEEP] index: ${beepIndex} => ${beep.time} @ ${time}`);
            return this.beepTimes[beepIndex].duration;
        } else {
            return 0;
        }
    }
}

export class TimerExecutor
{
    setup:ExecutorTimerSetup;
    timer:ExecutableTimer;
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
    lastTickSlot:SlotSearchResult;
    activeTime:RepActiveTime = { active: 0, inactive: 0 };
    activeTimes:Array<RepActiveTime> = []
    state:TimerState = "init";
    startTime:number = 0;
    totalElapsed:number = 0;
    lastElapsed:number = 0;
    elapsedInState:number = 0;
    running:boolean = false;
    beeper:BeepHelper;

    constructor(setup:ExecutorTimerSetup) {
        this.setup = setup;
        this.timer = BuildExecutorTimer(setup.timerSetup);
        this.lastTickTime = timeSeconds();
        this.beeper = new BeepHelper([
            { time: 10, duration: 0.1 },
            { time: 3, duration: 0.1 },
            { time: 2, duration: 0.1 },
            { time: 1, duration: 0.1 },
            { time: 0, duration: 0.2 }
        ]);
        this.lastTickSlot = FindCurrentSlot(this.timer, 0);
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
                if(this.remainingGoodwillTime <= 0 || this.isOverActivationWeight()) {
                    this.waitForGoodwill = false;
                    this.goodwillUsed = true;
                }
                //console.log(`[TR] timer blocked by goodwill ${this.remainingGoodwillTime}`);
                this.setup.cb("timer_changed");
                return;
            }            
            if(!this.wasWaitingForGoodwill) {
                this.totalElapsed += elapsed;
                this.lastElapsed = elapsed;                
                this.wasWaitingForGoodwill = false;
                //console.log(`[TR] goodwill ended, reusing previous times`);
            }
            const consumedTick = this.executeUpdateTick(this.totalElapsed, this.lastElapsed);
        }, 10);
    }
    executeUpdateTick(total:number, tick:number): boolean {
        const currentSlot = FindCurrentSlot(this.timer, total);
        if(currentSlot.state === "done") {
            clearInterval(this.runnerInterval);
            this.runnerInterval = 0;
            this.state = currentSlot.state;
            this.lastTickSlot = currentSlot;
            this.setup.cb("timer_changed");
            return true;
        }  

        // handling the active/inactive time accumulation
        if(currentSlot.state === "active" && this.state !== "active") {
            console.log("[TR] entering active state");
            this.activeTime = { active: 0, inactive: 0 };
            if(!this.isOverActivationWeight() && !this.goodwillUsed && !this.waitForGoodwill) {
                // abort current tick and restart after the goodwill is done
                // or the activation weight is reached
                this.waitForGoodwill = true;
                this.remainingGoodwillTime = this.goodwillTime;
                // - do last beep on goodwill start and not state enter
                // - the last beep happens on the state change (if we have a beep on 0) as we will
                //   never actually meet the last time perfectly. to make it more robust we check if,
                //   against all odds, the last beep was actually executed               
                if(!this.beeper.isDone()) {
                    this.setup.cb("beep_last");
                    this.setup.cb("vibrate_last");
                }                
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
        else if(currentSlot.state !== "active" && this.state === "active") {
            console.log("[TR] leaving active state");
            if(this.isOverActivationWeight()) {
                this.activeTime.active += tick;
            } else {
                this.activeTime.inactive += tick;
            }
            const timeCap = this.lastTickSlot.rep.length;
            const overshot = currentSlot.rep.elapsed;
            const active = this.activeTime.active - (this.isOverActivationWeight() ? overshot : 0);
            const inactive = this.activeTime.inactive - (!this.isOverActivationWeight() ? overshot : 0);
            this.activeTimes.push({
                active: clamp(active , 0, timeCap),
                inactive: clamp(inactive , 0, timeCap)
            });
            this.activeTime = { active: 0, inactive: 0 };
            this.goodwillUsed = false;
            this.beeper.reset();
            this.setup.cb("holds_update");
        }

        // this is the beep/vibrate stuff
        const remainingInState = currentSlot.rep.length - currentSlot.rep.elapsed;
        const nextState = this.timer.slots[currentSlot.slotIndex + 1];
        if(nextState && nextState.state == "active") {
            const beepDuration = this.beeper.checkForBeep(remainingInState)
            if(beepDuration > 0) {
                this.setup.cb("beep");
                this.setup.cb("vibrate");
            }
        }  

        this.state = currentSlot.state;
        this.lastTickSlot = currentSlot;
        this.setup.cb("timer_changed");
        return true;
    }

    start(): void {
        this.lastTickTime = timeSeconds();
        this.running = true;
    }
    stop(): void {
        this.running = false;
    }
    destroy() {
        this.stop();
        clearInterval(this.runnerInterval);
        this.runnerInterval = 0;  
    }
    isRunning(): boolean {
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
    overallElapsed() {
        return clamp(this.totalElapsed, 0, this.timer.metrics.duration);
    }
    overallRemaining() {
        return clamp(this.timer.metrics.duration - this.overallElapsed(), 0, this.timer.metrics.duration);
    }    
    overallProgress() {
        return clamp(this.overallElapsed() / this.timer.metrics.duration, 0, this.timer.metrics.duration);
    }
    setElapsed() {
        if(this.lastTickSlot){
            return this.lastTickSlot.set.elapsed;
        }
        return 0;
    }
    setProgress() {
        if(this.lastTickSlot){
            return clamp(this.lastTickSlot.set.elapsed / this.lastTickSlot.set.length, 0, 1);
        }
        return 0;
    }
    setCurrent() {
        if(this.lastTickSlot){
            return this.lastTickSlot.set.value;
        }
        return 0;
    }
    setCount() {
        return this.timer.metrics.sets;
        return 0;
    }    
    repElapsed() {
        if(this.lastTickSlot){
            return this.lastTickSlot.rep.elapsed;
        }
        return 0;
    }
    repRemaining() {
        if(this.lastTickSlot){
            return clamp(this.lastTickSlot.rep.length - this.lastTickSlot.rep.elapsed, 0, this.lastTickSlot.rep.length);
        }
        return 0;
    }
    repProgress() {
        if(this.lastTickSlot) {
            // if we change to the next active state the elapsed for the previus tick may not fill the 
            // current rep to 100%, as we now block with the goodwill this would leed to a non 100%
            // filled rep circle, so if the goodwill is active and the rep progres is requested we just
            // say its at 100%
            if(this.isGoodwillActive()){
                return 1;
            }
            return clamp(this.lastTickSlot.rep.elapsed / this.lastTickSlot.rep.length, 0, 1);
        }
        return 0;
    }
    repCurrent() {
        if(this.lastTickSlot){
            return this.lastTickSlot.rep.value;
        }
        return 0;
    }
    repCount() {
        if(this.lastTickSlot){
            return this.timer.metrics.repsInSet[this.lastTickSlot.set.value];
        }
        return 0;
    }
    getNextHolds() {
        // either return the current needed holds if we are in an active set or the holds
        // for the next active set. if no current slot exists check the first to states for 
        // active or warmup
        if(this.lastTickSlot) {
            if(this.lastTickSlot.state == "active") {
                const currentSlot = this.timer.slots[this.lastTickSlot.rep.value];
                return [currentSlot.holdLeft, currentSlot.holdRight];
            } else {
                const rep = this.lastTickSlot.rep.value;
                const nextSlot = this.timer.slots[Math.min(rep+1, this.timer.slots.length)];
                return [nextSlot.holdLeft, nextSlot.holdRight];
            }
        } else {
            if(this.timer.slots[0].state == "active") {
                const currentSlot = this.timer.slots[0];
                return [currentSlot.holdLeft, currentSlot.holdRight];
            } else {
                const nextSlot = this.timer.slots[Math.min(1, this.timer.slots.length)];
                return [nextSlot.holdLeft, nextSlot.holdRight];
            }
        }
    }
    getCurrentState() {
        return this.state;
    }
    getCurrentSlot() {
        return this.lastTickSlot;
    }
    goodwillElapsed() {
        return this.goodwillTime - this.remainingGoodwillTime;
    }
    goodwillProgress() {
        return (this.goodwillTime - this.remainingGoodwillTime) / this.goodwillTime * 1.001;
    }
    isGoodwillActive() {
        return this.waitForGoodwill;
    }
}