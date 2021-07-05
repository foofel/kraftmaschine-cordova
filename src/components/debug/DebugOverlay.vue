<template>
    <div v-if="isVisible" @click="toggleSize" :class="{ minimized: isMinimized }" class="debug-overlay cursor-pointer">
        <div v-if="!isMinimized" class="w-full h-full text-white p-1">
            <div>device: {device}</div>
            <div>mps: {{mps}}</div>
            <div>loss: {{loss1s}} / {{loss10s}} / {{lossTotal}}</div>
            <div>listeners: {{this.listeners}}</div>
            <div>left: {{left.toFixed(2)}} right: {{right.toFixed(2)}}</div>
            <div class="w-full h-20">
                <WeightCalibrateGraph :opts="graphOpts" />
            </div>
        </div>
    </div>
</template>

<script>
import { StopWatch } from '@/core/util/stopwatch'
import { passTrough } from '@/core/connectivity/messagetransformer'
import WeightCalibrateGraph from '@/components/calibration/WeightCalibrateGraph.vue'

export default {
    name: "DebugOverlay",
    components: {
        WeightCalibrateGraph
    },
    data: function() {
        return {
            device: "",
            mps: 0,
            loss1s: 0,
            loss10s: 0,
            lossTotal: 0,
            losses: [],
            listeners: [],
            intervall: 0,
            packages: 0,
            left: 0,
            right: 0,
            lastPackageId: -1,
            stopwatchMps: new StopWatch(),
            stopwatchLoss: new StopWatch(),
            cb: null,
            graphOpts: {
                duration: 10,
                graphOnly: true
            },
            overlayState: this.$store.appOptions.debugOverlay
        };
    },
    mounted() {
        const self = this;
        /*this.cb = (wm) => { 
            this.onNewData(self, wm);
        }*/
        this.$ctx.device.subscribe({ tag: "weight", cb: this.onNewData });
        this.intervall = setInterval(() => {
            this.listeners = [
                this.$ctx.device.listener.weight.length
            ]
            if(!this.$ctx.device.getConnectionInfo()) {
                this.lastPackageId = -1;
            }
            if (this.stopwatchMps.elapsed() > 1) {
                this.mps = this.packages;
                this.packages = 0;
                this.stopwatchMps.restart();
            }        
            const now = new Date();
            this.losses = this.losses.filter((e) => (now - e.time) < 10000);
            const lastSecLosses = this.losses.filter((e) => (now - e.time) < 1000);
            const lossReducer = (acc, current) => {  
                return acc + current.amount
            } 
            this.loss1s = lastSecLosses.reduce(lossReducer, 0);
            this.loss10s = this.losses.reduce(lossReducer, 0);
        }, 250);
    },
    beforeDestroy() {
        this.$ctx.device.unsubscribe(this.onNewData);
        clearInterval(this.intervall);
    },
    methods: {
        toggleSize() {
            if(this.overlayState.state == "minimized") {
                this.overlayState.state = "normal";
            } else {
                this.overlayState.state = "minimized";
            }
            this.$store.appOptions.debugOverlay.state = this.overlayState.state;
        },
        onNewData(wm) {
            wm = passTrough(wm);
            this.packages++;
            const packetId = wm.id;
            if(this.lastPackageId == -1) {
                this.lastPackageId = packetId;
            }
            if(packetId < this.lastPackageId) {
                this.lastPackageId -= 255;
            }
            const pkgDist = Math.abs(packetId - this.lastPackageId)
            const loss = pkgDist - 1;
            if(loss > 0) {
                //console.log(`missed package(s): ${loss}`);
                this.lossTotal += loss;
                this.losses.push({ amount: loss, time: new Date()});
            }
            this.lastPackageId = packetId
            this.left = wm.left;
            this.right = wm.right;
        }
    },
	computed: {
        isVisible() {
            return this.overlayState.show;
        },
        isMinimized() {
            return this.overlayState.state == "minimized";
        }
    }
};
</script>

<style lang="scss" scoped>
.debug-overlay {
    position: fixed;
    top: 0;
    right: 0;
    width: 256px;
    //height: 256px;
    background-color: #000000cc;
    &.minimized {
        width: 32px;
        height: 32px;
        background-color: #00000055;
    }
    .hidden {
        display: none;
    }
}
</style>