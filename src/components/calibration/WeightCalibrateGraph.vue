<template>
    <div class="w-full h-full relative">
        <UplotGraph class="absolute" ref="graph" />
        <div class="absolute w-full h-full flex justify-center items-center">
            <div>{{content}}</div>
        </div>
    </div>
</template>

<script>
import UplotGraph from '@/components/graph/UplotGraph.vue'
import { passTrough } from '@/core/connectivity/messagetransformer';
import { ChartColors } from '../typeexports';
import { Calibration } from '@/core/util/calibration';
import { sprintf } from "sprintf-js";
import { DataHistory } from '@/core/util/datahistory';

export default {
    name: "WeightCalibrateGraph",
    components: {
        UplotGraph,
    },
    props: ['opts'],
    nonReactiveData: {
        timeBuffer: [], //Array.from({length: 240}, (_, i) => i * 0.0125),
        weightBuffer: [], //Array(240).fill(0),
        history: null
    },
    created() {
        const opts = {
            duration: 2,
            graphOnly: false,
            waitText: "",
            progressText: "",
            stopAfterDone: true
        }
    },
    data() { 
        return {
            bufferLengthSeconds: this.$props.opts?.duration || 2,
            colorText: "0 0 0",
            cb: null,
            calibrator: null,
            tareProgress: 0
        }
    },
    mounted() {
        //console.log(this.$props);
        this.$options.nonReactiveData.history = new DataHistory(this.bufferLengthSeconds);
        const opts = {
            series: [
                {
                    label: "Time",
                }, {
                    label: "Weight",
                    stroke: ChartColors.red,
                    width: 1,
                }
            ],
            axes: [
                { show: false },
                { show: false },
            ],
            scales: {
                x: { min: 0, max: this.bufferLengthSeconds, time: false },
                y: { 
                    range: (u, min, max) => {
                        return [0, Math.max(1, max)]
                    }
                }
            },
            legend: {
                show: false
            },
            cursor: {
                show: false
            }
        };
        const data = [ [0], [0] ];
        this.$refs.graph.init(opts, data);
        this.$options.startRedraw(this);
        const self = this;
        this.cb = (wm) => { 
            self.$options.onNewData(self, wm);
        }
        this.$ctx.device.subscribe({ tag: "weight", cb: this.cb });
        if(!(this.$props.opts?.graphOnly || false)) {
            this.calibrator = new Calibration(this.$ctx.device, this.tareCallback, this.$props.opts?.duration || 2, 0.2);
        }
    },
    beforeDestroy() {
        this.$ctx.device.unsubscribe(this.cb);
        this.stopUpdate = true;
        if(this.calibrator) {
            this.calibrator.destroy();
        }
    },
    methods: {
        stop(a) {
            if(this.$props.opts?.stopAfterDone == true){
                this.$ctx.device.unsubscribe(this.cb);
                this.stopUpdate = true;
                if(this.calibrator) {
                    this.calibrator.destroy();
                }
            }
        },
        tareCallback(validDuration, progress, weights) {
            console.log(progress, weights);
            this.tareProgress = progress;
            if(progress >= 1) {
                this.calibrator.destroy();
                this.calibrator = null;
                this.$emit("done", weights);
                this.stop();
            }
        }
    },
    computed: {
        content() {
            return this.tareProgress == 0 ? this.$props.opts?.waitText || "" : sprintf(this.$props.opts?.progressText, Math.min(this.tareProgress*100, 100)) || "";
        }
    },
    startRedraw(self) {
        const doRedraw = () => {
            if(self.stopUpdate) {
                return;
            }
            if(self.$refs.graph) {
                const data = self.$options.nonReactiveData;
                //TODO: this adds reactivity?!?!
                //FIXME: see above
                self.$refs.graph.setData([ data.timeBuffer, data.weightBuffer ]);
            }
            requestAnimationFrame(doRedraw);
        }
        doRedraw();
    },
    onNewData(self, msg) {
        const data = self.$options.nonReactiveData
        data.history.push({
            left: msg.left,
            right: msg.right,
            combined: msg.combined,
            time: msg.ts
        });
        data.timeBuffer = data.history.get().map(a => a.time);
        data.weightBuffer = data.history.get().map(a => a.combined);
        /*wm = passTrough(wm);
        const data = self.$options.nonReactiveData
        data.timeBuffer.push(wm.ts);
        data.weightBuffer.push(wm.combined);                    
        const endIdx = data.timeBuffer.length - 1;
        if(data.timeBuffer.length >= 1) {
            const tDiff = (data.timeBuffer[endIdx] - data.timeBuffer[endIdx - 1]);
        }
        const bufferDurationSeconds = (data.timeBuffer[data.timeBuffer.length - 1] - data.timeBuffer[0]);
        let count = 0;
        if(bufferDurationSeconds > data.bufferLengthSeconds) {
            const latestTime = data.timeBuffer[data.timeBuffer.length - 1];
            for(; count < data.timeBuffer.length; count++) {
                const sampleAge = latestTime - data.timeBuffer[count];
                if(sampleAge > data.bufferLengthSeconds) {
                    continue;
                }
                break;
            }
        }
        if(count > 0) {
            data.timeBuffer.splice(0, count);
            data.weightBuffer.splice(0, count);
        }*/
    }
}
</script>

<style lang="scss" scoped>
</style>