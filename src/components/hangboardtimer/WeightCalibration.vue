<template>
    <ProgressBar ref="progress" max="1" :value="progressValue" :initFormat="initFormat" :progressFormat="progressFormat" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { pipe, sum, round, guard, movingAverage, tared } from '@/core/messagetransformer';
import { HangboardConnector } from '../../core/hangboardconnector';
import { ScaleOptions, WeightData, WeightMessage } from '@/core/sensorreader';
import ProgressBar from '@/components/ProgressBar.vue'
import { DataHistory, getAvg, LinearRegressionFromHistoryData } from '@/core/history';
import { TareWeights } from '../typeexports';
import { GlobalConfig } from '../../config';
import { Calibration } from '../../core/calibration';
import { StopWatch } from '../../core/stopwatch';

@Component({
    components: {
        ProgressBar
    }
})
export default class WeightCalibration extends Vue {
    @Prop({default: false}) autorun!: boolean;
    @Prop({default: -1000}) minWeight!: number;
    @Prop({default: 1000}) maxWeight!: number;
    @Prop({default: "hang onto board"}) initFormat!: number;
    @Prop({default: "%d%%"}) progressFormat!: number;
    @Prop({default: () => { return { left: 0, right: 0 } }}) tareWeights!: TareWeights;
    scaleBackend: HangboardConnector;
    calib: Calibration|null = null;
    //progressBar:ProgressBar|null = null;
    progressValue = 0;
    stopBarUpdate = false;
    completedTime = 0;
    stopWatch: StopWatch = new StopWatch(false);

    constructor() {
        super();
        this.scaleBackend = this.$root.$data.scaleBackend;
    }

    mounted() {
        //this.progressBar = this.$refs.progress as ProgressBar;
        if(this.calib === null) {
            this.calib = new Calibration(this.scaleBackend, 
                (weights: TareWeights) => {
                    console.log("done");
                    this.$emit("calibrationDone", new WeightData(weights.left, weights.right, weights.left + weights.right))
                    this.calib = null;
                },
                1, 
                this.minWeight, 
                this.maxWeight, 
                this.tareWeights,
                (duration: number) => {
                    this.completedTime = duration;
                    console.log("start", duration);
                    this.startUpdate();
                },
                (progress: number) => {},
                () => {
                    console.log("reset");
                    this.stopUpdate();
                }
            );
        }
    }

    beforeDestroy() {
        this.stop();
    }

    startUpdate() {
        //this.progressValue = 0;
        this.stopBarUpdate = false;
        this.stopWatch.restart();
        const loop = () => {
            if(this.stopBarUpdate){
                return;
            }
            this.progressValue = this.stopWatch.elapsed() / this.completedTime;
            if(this.progressValue >= 1) {
                return;
            }
            requestAnimationFrame(loop);
        }
        loop();
    }

    stopUpdate() {
        this.stopBarUpdate = true;
        this.progressValue = 0;
    }

    stop() {
        this.stopUpdate();
        if(this.calib) {
            this.calib.stop();
            this.calib = null;
        }
    }
}
</script>

<style lang="scss" scoped>
.margin {
    margin-bottom: 30px;
}
</style>