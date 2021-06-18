import { pipe, MessageTransformerIntrerface, taredByObject } from '@/core/messagetransformer';
import { DataHistory } from '@/core/history';
import { linearRegression } from '@/core/math'
import { DeviceConnector, WeightData, WeightMessage } from '@/core/connectivity/deviceconnector';

export type CalibrationCallback = (validDuration:number, progress:number, weights: WeightData) => void;

export class Calibration {

    initialTime = 0.25;
    wobbleLimit = 0.05;
    dataHistory: DataHistory;
    pipeline:MessageTransformerIntrerface;

    constructor(private scale: DeviceConnector, 
        private eventCb: CalibrationCallback,
        private collectionTime:number = 2,
        private minWeight: number = -Number.MAX_VALUE,
        private maxWeight: number = Number.MAX_VALUE,  
        private zeroCorrectrion: WeightData = { left: 0, right: 0, combined: 0 },
    ){
        this.dataHistory = new DataHistory(this.collectionTime);
        this.scale.subscribe({ tag: "weight", cb: this.onWeightMessage });
        this.pipeline = pipe(taredByObject(zeroCorrectrion));
    }

    destroy() {
        this.scale.unsubscribe(this.onWeightMessage);
    }

    onWeightMessage = (msg: WeightMessage) => {
        this.dataHistory.push({
            left: msg.left,
            right: msg.right,
            combined: msg.combined,
            time: msg.ts
        });
        this.recalculate();
    }

    recalculate() {
        const sampleDataDuration = this.dataHistory.getDuration()
        if (sampleDataDuration > this.initialTime) {
            const samples = this.dataHistory.get();
            const reverseData = [...samples].reverse();
            const startWeight = reverseData[0].combined;
            if (startWeight < this.minWeight || startWeight > this.maxWeight) {
                this.eventCb(0, 0, { left: 0, right: 0, combined: 0 });
                return;
            }
            /*const x = samples.map(e => e.time - samples[0].time);
            const y = samples.map(e => e.combined);
            const regressionResult = linearRegression(x, y);
            console.log(regressionResult.slope);*/
            const limit = Math.max(startWeight * this.wobbleLimit, 0.1);
            const elementIndex = reverseData.findIndex((e) => Math.abs(startWeight - e.combined) > limit);
            const lastValidIndex = elementIndex == -1 ? reverseData.length - 1  : elementIndex;
            const validElementCount = lastValidIndex + 1;
            const validDuration = reverseData[0].time  - reverseData[lastValidIndex].time;
            const leftCalib = reverseData.slice(0, validElementCount).reduce((a, e) => a + e.left, 0) / validElementCount;
            const rightCalib = reverseData.slice(0, validElementCount).reduce((a, e) => a + e.right, 0) / validElementCount;
            this.eventCb(validDuration, validDuration / this.collectionTime, { left: leftCalib, right: rightCalib, combined: 0});
        }
    }
}