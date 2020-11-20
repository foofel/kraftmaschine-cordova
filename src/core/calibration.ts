import { HangboardScale } from './hangboardscale';
import { tared, pipe } from './messagetransformer';
import { TareWeights } from '@/components/typeexports';
import { WeightMessage, ScaleOptions, WeightData } from './sensorreader';
import { DataHistory, getAvg, LinearRegressionFromHistoryData } from './history';
import { clamp } from './math';
import { nowSeconds } from './util';

export type CalibrationResetCB = () => void;
export type CalibrationStartCB = (duration:number) => void;
export type CalibrationProgressCB = (progress:number) => void;
export type CalibrationDoneCB = (weights:TareWeights) => void;

export class Calibration {
    updateInterval:any;
    collectionTime:number = 2;
    sampleSize:number = ScaleOptions.RAW_DATA_RATE * this.collectionTime;
    dataHistory:DataHistory<WeightMessage> = new DataHistory(this.sampleSize);
    startTime:number = 0;
    startFound:boolean = false;
    initialSamples:number = 20;
    progressStartTime:number = 0;
    constructor(private scale:HangboardScale, 
        private onDone:CalibrationDoneCB,
        private smoothness:number = 1, 
        private minWeight:number = -10, 
        private maxWeight:number = 10,  
        private tareWeights:TareWeights = { left: 0, right: 0 },
        private onStart:CalibrationStartCB = (_) => {},
        private onProgress:CalibrationProgressCB = (_) => {}, 
        private onReset:CalibrationResetCB = () => {})
    {
        this.scale.registerWeightCallback(this.onWeightMessage, pipe(
            tared(this.tareWeights.left, this.tareWeights.right)
        ));
    }

    stop() {
        this.scale.removeWeightCallback(this.onWeightMessage);
    }

    onWeightMessage = (msg:WeightMessage) => {
        if(this.dataHistory.length === 0) {
            this.startTime = nowSeconds();
        }
        this.dataHistory.push(msg);
        this.step();
    }

    reset() {
        if(this.startFound) {
            this.onReset();
        }
        this.startFound = false;
        this.dataHistory.clear();
    }

    step() {
        let lrData = this.dataHistory.getData();
        if(lrData.length >= this.initialSamples) {
            let lr = LinearRegressionFromHistoryData(lrData, "combined");
            let w = getAvg(lrData, "combined");
            //console.log(Math.abs(lr.slope).toFixed(5), Math.abs(lr.slope) <= this.smoothness, lrData.length);
            if(w >= this.minWeight && w <= this.maxWeight && Math.abs(lr.slope) <= this.smoothness) {
                if(!this.startFound) {
                    this.startFound = true;
                    this.progressStartTime = nowSeconds();
                    let progressStartDiff = this.progressStartTime - this.startTime;
                    let duration = Math.max(this.collectionTime - progressStartDiff, 0.0001);                    
                    this.onStart(duration);
                }
            } else {
                this.reset();
            }
        }
        if(this.startFound) {
            let now = nowSeconds();
            let progressStartDiff = this.progressStartTime - this.startTime;
            let duration = Math.max(this.collectionTime - progressStartDiff, 0.0001);
            let elapsed = now - this.startTime - progressStartDiff;
            let progress = clamp(elapsed / duration, 0, 1);
            //console.log(progress.toFixed(4));
            this.onProgress(progress);
            if(progress >= 1) {
                let left = getAvg(lrData, "left");
                let right = getAvg(lrData, "right");
                this.onDone({ left: left, right: right });
                this.scale.removeWeightCallback(this.onWeightMessage);
                this.stop();
            }
        }
    }
}