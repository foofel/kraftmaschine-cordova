import { BenchmarkController, SignalProcessorEvents, ProcessingEvent } from './BenchmarkController';
import { HangboardScale } from '@/core/hangboardscale';
import { TareWeights } from '@/components/typeexports';
import { WeightMessage } from '@/core/sensorreader';
import { StopWatch } from '@/core/stopwatch';

/*export interface ProgressInfo {
    start:WeightMessage;
    current:WeightMessage;
    end:WeightMessage | null;
    duration:number;
    startInfo:LinRegType;
}

export interface BenchmarkData {
    time: Array<number>;
    weight: Array<number>,
    gradient: Array<number>,
    peaks: PeakData;
    avgWeight:number;
}

export interface Peak {
    x:number;
    y:number;
    c:string;
}

export interface PeakData {
    start: Peak|null;
    end: Peak|null;
    all: Array<Peak>;
    startEnd: Array<Peak>
}
export const makeDefaultDataset = () : BenchmarkData => {
    return { 
        time: [0], 
        weight: [0], 
        gradient: [0], 
        peaks: { 
            start:null, 
            end:null,
            all: [],
            startEnd: []
        },
        avgWeight: 0
    }
};
*/

export type BenchmarkInfoCB = (time:number, index:number) => void;
export type BenchmarkEventCB = (event:ProcessingEvent) => void;
export type BenchmarkUpdateCB = (elapsed:number) => void;
export type ErroCB = (info:string, code:number) => void;

export interface BenchmarkDebugLine {
    x:number;
    c:string;
};

export class SimpleBenchmarkController {
    bc:BenchmarkController;
    stopUpdateLoop:boolean = false;
    loopRunning:boolean = false;
    startEvent:ProcessingEvent|null = null;
    endEvent:ProcessingEvent|null = null;
    startSend:boolean = false;
    endSend = false;
    currentTime:number = 0;
    delay:number = 0.5;
    startTimeOvershot:number = 0;
    sw:StopWatch = new StopWatch();
    debugLines:Array<BenchmarkDebugLine> = [];
    debugColorMapping = {
        [SignalProcessorEvents.STARTED]: "black",
        [SignalProcessorEvents.RISE]: "orange",
        [SignalProcessorEvents.RISE_END]: "transparent",
        [SignalProcessorEvents.WEIGHT_DROP]: "cyan",
        [SignalProcessorEvents.WEIGHT_INCREASE]: "yellow",
        [SignalProcessorEvents.TOP]: "green",
        [SignalProcessorEvents.TOP_END]: "blue",
        [SignalProcessorEvents.ERROR_NON_ZERO_SCALE]: "red",
        [SignalProcessorEvents.ERROR_START_TIMEOUT]: "red"
    }

    constructor(private onStart:BenchmarkInfoCB, private onUpdate:BenchmarkUpdateCB, private onEnd:BenchmarkInfoCB, private onError:ErroCB, private _onEvent:BenchmarkEventCB, tareWeights:TareWeights) {
        this.bc = new BenchmarkController(this.onEvent, tareWeights);
        this.startUpdateLoop();
    }

    stop() {
        this.stopUpdateLoop = true;
    }

    reset() {
        this.debugLines = [];
        this.startEvent = null;
        this.endEvent = null;
        this.startSend = false;
        this.endSend = false;
        this.bc.reset();
        this.startUpdateLoop();
    }

    injectWeightMessage(msg:WeightMessage) {
        this.currentTime = msg.ts;
        this.bc.injectWeightMessage(msg);
        /*if(!this.startEvent) {
            this.startEvent = { type: 0, index: 0, time: this.currentTime };
            this.endEvent = { type: 0, index: 1, time: this.currentTime + 15 };            
        }*/
    }

    getBuffers() {
        return this.bc.getBuffers();
    }

    getDebugLines() {
        return this.debugLines;
    }

    isActive() {
        return this.startSend && !this.endSend;
    }

    startUpdateLoop() {
        if(this.loopRunning) {
            return;
        }
        this.stopUpdateLoop = false;
        this.loopRunning = true;
        let loop = () => {
            if(this.stopUpdateLoop) {
                this.loopRunning = false;
                return;
            }
            if(this.startEvent && !this.startSend && this.currentTime >= (this.startEvent.time + this.delay)) {
                this.onStart(this.startEvent.time, this.startEvent.index);
                this.startSend = true;
                this.startTimeOvershot = this.currentTime - (this.startEvent.time + this.delay);
                this.sw.restart();
            }
            /*if(this.endEvent && !this.endSend && this.startSend) {
                this.onEnd(this.endEvent.time, this.endEvent.index);
                this.endSend = true;
                this.stopUpdateLoop = true;
            }*/
            if(this.startSend && !this.endSend) {
                if(!this.endEvent) {
                    let elapsed = this.sw.elapsed();
                    this.onUpdate(elapsed);
                } else if(this.endEvent) {
                    let elapsed = this.sw.elapsed();
                    let duration = this.endEvent.time - this.startEvent!.time;
                    elapsed = Math.min(this.sw.elapsed(), duration);
                    this.onUpdate(elapsed);
                    console.log(`nachlauf @ ${duration - elapsed}`)
                    if(elapsed === duration) {
                        this.onEnd(this.endEvent.time, this.endEvent.index);
                        this.stopUpdateLoop = true;
                    }
                    //let elapsed = Math.min(this.sw.elapsed(), duration);
                }
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    onEvent = (type:SignalProcessorEvents, index:number, time:number) => {
        this._onEvent({type:type, index:index, time:time});
        let color = (this.debugColorMapping as any)[type];
        this.debugLines.push({x: time, c: color});
        if(type === SignalProcessorEvents.TOP) {
            this.startEvent = {type:type, index:index, time:time};
        }
        else if(type === SignalProcessorEvents.TOP_END) {
            this.endEvent = {type:type, index:index, time:time};
        }        
        if(type === SignalProcessorEvents.ERROR_NON_ZERO_SCALE) {
            this.onError("scale is not at zero, please remove all weight or tare again", 0);
            this.stopUpdateLoop = true;
        }
        else if(type === SignalProcessorEvents.ERROR_START_TIMEOUT) {
            this.onError("inactive for 60s, please restart the benchmark", 0);
            this.stopUpdateLoop = true;
        }
    }
}