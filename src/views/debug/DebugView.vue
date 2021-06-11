<template>
    <HeadlineView headlineText="Debug">
        <div class="w-full h-1/2">
            <UplotGraph ref="graph" />
        </div>
        <input v-model="colorText" type="text" />
        <button @click="sendColor">send color</button>
    </HeadlineView>
</template>

<script>
import UplotGraph from '@/components/graph/UplotGraph.vue'
import HeadlineView from '@/components/HeadlineView2'
import { VueNavigationMixin } from '@/components/vuenavigation'
import { passTrough } from '@/core/messagetransformer';
import { ChartColors } from '../../components/typeexports';
import { sprintf } from "sprintf-js";

export default {
    name: "DebugView",
    mixins: [VueNavigationMixin],
    components: {
        UplotGraph,
        HeadlineView
    },
    nonReactiveData: {
        timeBuffer: [0, 1, 2, 3, 4, 5],
        weightBuffer: [0, 1, 2, 3, 4, 5],
        gradientBuffer: [5, 4, 3, 2, 1, 0],
        bufferLengthSeconds: 10,
    },
    data() { return {
        interval: null,
        colorText: "0 0 0",
        cb: null
    }},    
    created() {
        const self = this;
        this.cb = (wm) => { 
            self.$options.onNewData(self, wm);
        }
        this.$root.hangboardConnector.registerWeightCallback(this.cb, passTrough);
    },
    mounted() {
        const opts = {
            series: [{
                    label: "Time",
                    value: (u, v) => v == null ? "-" : v.toFixed(2) + "s"
                }, {
                    label: "Weig.",
                    stroke: ChartColors.red,
                    width: 1,
                    scale: "weight",
                    value: (u, v) => v == null ? "-" : v.toFixed(2) + "kg"
                }, {
                    label: "Grad.",
                    stroke: ChartColors.blue,
                    width: 1,
                    scale: "gradient",
                    value: (u, v) => v == null ? "-" : v.toFixed(2) + "kg/s"
                }
            ],
            scales: {
                x: { min: 0, max: 10, time: false },
                y: { min: 0, max: 10 }
            },
            axes: [
                { values: (u, vals, space) => vals.map(v => +v.toFixed(2) + "s") },
                { scale: "weight", label: "kg", labelSize: 20, values: (u, vals, space) => vals.map(v => sprintf("%.2f", v)) },
                { side: 1, scale: "gradient", grid: { show: false }, label: "kg/s", labelSize: 20, values: (u, vals, space) => vals.map(v => sprintf("%.2f", v)) }
            ]
        };
        /*const opts = {
            series: [
                {
                    label: "Time",
                }, {
                    label: "Weig.",
                    stroke: ChartColors.red,
                }, {
                    label: "Grad.",
                    stroke: ChartColors.blue,
                }
            ],
            axes: [
                { show: false },
                { show: false },
            ],
            legend: {
                show: false
            }
        };*/
        const nr = this.$options.nonReactiveData;
        const data = [ [0], [0], [0] ];
        this.$refs.graph.init(opts, data);
        this.$options.startRedraw(this);
    },
    beforeDestroy() {
        this.$root.hangboardConnector.removeWeightCallback(this.cb);
        this.stopUpdate = true;
        if(this.interval) {
            clearInterval(this.interval);
        }        
    },
    startRedraw(self) {
        const doRedraw = () => {
            if(self.$refs.graph) {
                const data = self.$options.nonReactiveData;
                self.$refs.graph.setData([ data.timeBuffer, data.weightBuffer, data.gradientBuffer ]);
                self.$refs.graph.setLines([]);
            }
            if(self.stopUpdate) {
                return;
            }
            //setTimeout(() => {
                requestAnimationFrame(doRedraw);
            //}, 1000)
        }
        requestAnimationFrame(doRedraw)
    },
    onNewData(self, wm) {
        const data = self.$options.nonReactiveData
        data.timeBuffer.push(wm.ts);
        data.weightBuffer.push(wm.combined);                    
        const endIdx = data.timeBuffer.length - 1;
        if(data.timeBuffer.length === 1) {
            data.gradientBuffer.push(0);
        } else {
            const tDiff = (data.timeBuffer[endIdx] - data.timeBuffer[endIdx - 1]);
            const wGrad = (data.weightBuffer[endIdx] - data.weightBuffer[endIdx - 1]) / tDiff;
            data.gradientBuffer.push(wGrad);
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
            data.gradientBuffer.splice(0, count);
        }
    },
    methods: {
        sendColor() {
            const [r, g, b] = this.colorText.split(" ").map(x => parseInt(x));
            console.log(r, g, b);
            this.$root.hangboardConnector.setLightColor(r, g, b);
        }
    }
}
</script>

<style lang="scss" scoped>
</style>