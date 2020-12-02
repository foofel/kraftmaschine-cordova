<template>
    <div class="page">
        <!--textarea class="text" v-model="textString" ref="ta"></textarea-->
        <div class="graph-container">
            <BenchmarkGraph ref="graph" />
        </div>        
    </div>
</template>

<script>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { VueNavigation } from '../vuenavigation';
import BenchmarkGraph from '@/components/benchmark/BenchmarkGraph.vue'
import { WeightMessage } from '@/core/sensorreader';
import { HangboardScale } from '@/core/hangboardscale';
import { pipe, tared, passTrough } from '@/core/messagetransformer';
//import WC from '@/components/hangboardtimer/WeightCalibration.vue'

class Data {
    textData = [];
    timeBuffer = [];
    weightBuffer = [];
    gradientBuffer = [];
    bufferLengthSeconds = 3600;
}

export default {
    name: "DebugViewComponent",
    components: {
        BenchmarkGraph
    },
    dataObject: new Data(),
    data() { return {
        scaleBackend: null,
        interval: null,
        benchmarkGraph: null
    }},    
    created() {
        this.scaleBackend = this.$root.scaleBackend;
        const self = this;
        this.scaleBackend.registerWeightCallback((wm) => { 
            self.$options.onNewData(self, wm);
        }, passTrough);
    },
    mounted() {
        this.benchmarkGraph = this.$refs.graph;
        this.$options.startRedraw(this);
    },
    beforeDestroy() {
        this.scaleBackend.removeWeightCallback(this.$options.onNewData);
        this.stopUpdate = true;
        if(this.interval) {
            clearInterval(this.interval);
        }        
    },
    startRedraw(self) {
        const doRedraw = () => {
            if(self.benchmarkGraph) {
                const data = self.$options.dataObject;
                self.benchmarkGraph.setData(data.timeBuffer, data.weightBuffer, data.gradientBuffer, []);
            }
            if(self.stopUpdate) {
                return;
            }
            setTimeout(() => {
                requestAnimationFrame(doRedraw);
            }, 1000)
        }
        requestAnimationFrame(doRedraw)
    },
    onNewData(self, wm) {
        const data = self.$options.dataObject
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
    }
}

/*@Component({
    components: {
        //WC
        BenchmarkGraph
    }
})
export default class DebugViewComponent extends VueNavigation {
    interval: any = null;
    benchmarkGraph!: BenchmarkGraph;
    stopUpdate = false;
    scaleBackend: HangboardScale;
    dataObject:Data|undefined = undefined;

    constructor() {
        super();
        this.scaleBackend = this.$root.$data.scaleBackend;
    }

    created() {
        this.dataObject = new Data();
        this.dataObject = Object.freeze(this.dataObject);
        debugger;
    }

    get data(): Data {
        return (this as any).dataObject;
    }

    mounted() { 
        this.scaleBackend.registerWeightCallback(this.onWeightMessage, passTrough);
        this.benchmarkGraph = this.$refs.graph as BenchmarkGraph;
        this.startRedraw();
    }

    beforeDestroy() {
        this.scaleBackend.removeWeightCallback(this.onWeightMessage);
        this.stopUpdate = true;
        if(this.interval) {
            clearInterval(this.interval);
        }
    }    

    startRedraw() {
        const doRedraw = () => {
            if(this.benchmarkGraph) {
                this.benchmarkGraph.setData(this.dataObject!.timeBuffer, this.dataObject!.weightBuffer, this.dataObject!.gradientBuffer, []);
            }
            if(this.stopUpdate) {
                return;
            }
            setTimeout(() => {
                requestAnimationFrame(doRedraw);
            }, 1000)
        }
        requestAnimationFrame(doRedraw)
    }

    onWeightMessage(wm:WeightMessage) {
        this.dataObject!.timeBuffer.push(wm.ts / 1000000);
        this.dataObject!.weightBuffer.push(wm.combined);                    
        const endIdx = this.dataObject!.timeBuffer.length - 1;
        if(this.dataObject!.timeBuffer.length === 1) {
            this.dataObject!.gradientBuffer.push(0);
        } else {
            const tDiff = (this.dataObject!.timeBuffer[endIdx] - this.dataObject!.timeBuffer[endIdx - 1]);
            const wGrad = (this.dataObject!.weightBuffer[endIdx] - this.dataObject!.weightBuffer[endIdx - 1]) / tDiff;
            this.dataObject!.gradientBuffer.push(wGrad);
        }
        const bufferDurationSeconds = (this.dataObject!.timeBuffer[this.dataObject!.timeBuffer.length - 1] - this.dataObject!.timeBuffer[0]);
        let count = 0;
        if(bufferDurationSeconds > this.dataObject!.bufferLengthSeconds) {
            const latestTime = this.dataObject!.timeBuffer[this.dataObject!.timeBuffer.length - 1];
            for(; count < this.dataObject!.timeBuffer.length; count++) {
                const sampleAge = latestTime - this.dataObject!.timeBuffer[count];
                if(sampleAge > this.dataObject!.bufferLengthSeconds) {
                    continue;
                }
                break;
            }
        }
        if(count > 0) {
            this.dataObject!.timeBuffer.splice(0, count);
            this.dataObject!.weightBuffer.splice(0, count);
            this.dataObject!.gradientBuffer.splice(0, count);
        }
    }
}*/
</script>

<style lang="scss" scoped>
.page {
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    padding: 20px;
}
.text {
    width: 100%;
    height: 100%;
}
.graph-container {
    width: 100%;
    height: 100%;
}
</style>