<template>
    <div class="w-full h-full">
        <UplotGraph ref="graph" />
    </div>
</template>

<script>
import UplotGraph from '@/components/graph/UplotGraph.vue'
import { passTrough } from '@/core/messagetransformer';
import { ChartColors } from '../typeexports';

export default {
    name: "WeightCalibrateGraph",
    components: {
        UplotGraph,
    },
    props: ['checker'],
    nonReactiveData: {
        timeBuffer: Array.from({length: 240}, (_, i) => i * 0.0125),
        weightBuffer: Array(240).fill(0),
        bufferLengthSeconds: 3,
    },
    data() { return {
        colorText: "0 0 0",
        cb: null
    }},    
    created() {},
    mounted() {       
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
                x: { min: 0, max: 3, time: false },
                y: { 
                    range: (u, min, max) => {
                        return [min, Math.max(1, max)]
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
    },
    beforeDestroy() {
        this.$ctx.device.unsubscribe(this.cb);
        this.stopUpdate = true;
    },    
    startRedraw(self) {
        const doRedraw = () => {
            if(self.stopUpdate) {
                return;
            }
            if(self.$refs.graph) {
                const data = self.$options.nonReactiveData;
                self.$refs.graph.setData([ data.timeBuffer, data.weightBuffer ]);
            }
            requestAnimationFrame(doRedraw);
        }
        doRedraw();
    },
    onNewData(self, wm) {
        wm = passTrough(wm);
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
        }
    }
}
</script>

<style lang="scss" scoped>
</style>