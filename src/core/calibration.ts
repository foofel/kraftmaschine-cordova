import { HangboardConnector } from './hangboardconnector';
import { tared, pipe } from './messagetransformer';
import { TareWeights } from '@/components/typeexports';
import { WeightMessage, ScaleOptions, WeightData } from './sensorreader';
import { DataHistory, getAvg, LinearRegressionFromHistoryData } from './history';
import { clamp } from './math';
import { nowSeconds } from './util';

export type CalibrationResetCB = () => void;
export type CalibrationStartCB = (duration: number) => void;
export type CalibrationProgressCB = (progress: number) => void;
export type CalibrationDoneCB = (weights: TareWeights) => void;

export class Calibration {
    updateInterval: any;
    collectionTime = 2;
    sampleSize: number = ScaleOptions.RAW_DATA_RATE * this.collectionTime;
    dataHistory: DataHistory<WeightMessage> = new DataHistory(this.sampleSize);
    startTime = 0;
    startFound = false;
    initialSamples = 20;
    progressStartTime = 0;
    constructor(private scale: HangboardConnector, 
        private onDone: CalibrationDoneCB,
        private smoothness: number = 1, 
        private minWeight: number = -10, 
        private maxWeight: number = 10,  
        private tareWeights: TareWeights = { left: 0, right: 0 },
        private onStart: CalibrationStartCB = (_) => {},
        private onProgress: CalibrationProgressCB = (_) => {}, 
        private onReset: CalibrationResetCB = () => {})
    {
        this.scale.registerWeightCallback(this.onWeightMessage, pipe(
            tared(this.tareWeights.left, this.tareWeights.right)
        ));
    }

    stop() {
        this.scale.removeWeightCallback(this.onWeightMessage);
    }

    onWeightMessage = (msg: WeightMessage) => {
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
        const lrData = this.dataHistory.getData();
        if(lrData.length >= this.initialSamples) {
            const lr = LinearRegressionFromHistoryData(lrData, "combined");
            const w = getAvg(lrData, "combined");
            //console.log(Math.abs(lr.slope).toFixed(5), Math.abs(lr.slope) <= this.smoothness, lrData.length);
            if(w >= this.minWeight && w <= this.maxWeight && Math.abs(lr.slope) <= this.smoothness) {
                if(!this.startFound) {
                    this.startFound = true;
                    this.progressStartTime = nowSeconds();
                    const progressStartDiff = this.progressStartTime - this.startTime;
                    const duration = Math.max(this.collectionTime - progressStartDiff, 0.0001);                    
                    this.onStart(duration);
                }
            } else {
                this.reset();
            }
        }
        if(this.startFound) {
            const now = nowSeconds();
            const progressStartDiff = this.progressStartTime - this.startTime;
            const duration = Math.max(this.collectionTime - progressStartDiff, 0.0001);
            const elapsed = now - this.startTime - progressStartDiff;
            const progress = clamp(elapsed / duration, 0, 1);
            //console.log(progress.toFixed(4));
            this.onProgress(progress);
            if(progress >= 1) {
                const left = getAvg(lrData, "left");
                const right = getAvg(lrData, "right");
                this.onDone({ left: left, right: right });
                this.scale.removeWeightCallback(this.onWeightMessage);
                this.stop();
            }
        }
    }
}