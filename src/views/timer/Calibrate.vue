<template>
    <div class="w-full h-full flex items-center flex-col">
        <table class="w-full text-lg ">
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-white"></div></td></tr>
            <tr class="">
                <td id="r0" class="w-1 default-indicator visible"></td>
                <td colspan="2">
                    <div class="w-full h-40 flex justify-center items-center text-2xl font-light">
                        <table>
                            <tr>
                                <td class="w-24">Timer: </td>
                                <td>Basic 7s/5s</td>
                            </tr>
                            <tr>
                                <td>Board:</td>
                                <td>Kraftmaschine</td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-coolGray-400"></div></td></tr>
            <tr>
                <td id="r1" class="default-indicator visible"></td>
                <td class="w-20 pl-3">Tare</td>
                <td class="pr-4">
                    <div class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200">
                        <WeightCalibrateGraph :opts="opts.tare" @done="tareDone" />
                    </div>
                    <!--div class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200 flex flex-col justify-end">
                        <div class="w-full h-1 border-b border-solid best-red"></div>
                    </div-->
                </td>
            </tr>
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-coolGray-400"></div></td></tr>
            <tr>
                <td id="r2" class="default-indicator visible"></td>
                <td class="pl-3">Weight</td>
                <td class="pr-4">
                    <div v-if="progressState >= 1" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200">
                        <WeightCalibrateGraph :opts="opts.weight" @done="weightDone" />
                    </div>
                    <div v-if="progressState < 1" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200 flex flex-col justify-end">
                        <div class="w-full h-1 border-b border-solid best-red"></div>
                    </div>                    
                </td>
            </tr>
            <tr><td colspan="3" class="p-3"><div class="w-full border-b border-solid border-coolGray-400"></div></td></tr>
            <tr>
                <td id="r3" class="default-indicator visible"></td>
                <td class="pl-3">Weight</td>
                <td class="pr-4">
                    <div v-if="progressState >= 2" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200">
                        <WeightCalibrateGraph :opts="opts.weightedWeight" @done="weightedWeightDone" />
                    </div>
                    <div v-if="progressState < 2" class="p-1 w-full h-20 border-solid rounded-md border-2 border-coolGray-200 flex flex-col justify-end">
                        <div class="w-full h-1 border-b border-solid best-red"></div>
                    </div>                    
                </td>
            </tr>
        </table>
        <div class="mt-4 w-80 h-10 rounded-lg cursor-pointer flex justify-center items-center text-white text-xl font-light skip-button" :class="{disabled: progressState < 1}" @click="skipLast()">
            {{skipText}}
        </div>
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/core/util/vuenavigation';
import WeightCalibrateGraph from '@/components/calibration/WeightCalibrateGraph.vue'

export default {
    name: "Calibrate",
    mixins: [VueNavigationMixin],
    components: {
        WeightCalibrateGraph
    },
    data: function() {
        return {
            progressState: 0,
            skipText: "Skip",
            skipTime: 3,
            nextTimeout: 0,
            nextIntervall: 0,
            opts: {
                tare: {
                    name: 'tare',
                    duration: 2,
                    waitText: "Clear board",
                    progressText: "Wait: %.0f%%",
                    stopAfterDone: true,
                    result: null
                },
                weight: {
                    name: 'raw',
                    duration: 2,
                    waitText: "Hang onto board",
                    progressText: "Keep hanging: %.0f%%",
                    stopAfterDone: true,
                    result: null
                },
                weightedWeight: {
                    name: 'weightend',
                    waitText: "Hang onto board with weight",
                    progressText: "Keep hanging: %.0f%%", 
                    stopAfterDone: true,
                    result: null
                }
            }, 
            results: {
                tare: null,
                weight: null,
                weightedWeight: null
            }
        }
    },
    mounted() {
    },
    beforeDestroy() {
        clearTimeout(this.nextTimeout);
        clearInterval(this.nextIntervall);
    },
    methods: {
        tareDone(weights) {
            this.results.tare = weights;
            console.log("tare done", this.opts.tare.result);
            this.progressState = 1;
        },
        weightDone(weights) {
            this.results.weight = weights;
            console.log("tare done", this.opts.tare.result);
            this.progressState = 2;
        },
        weightedWeightDone(weights) {
            this.results.weightedWeight = weights;
            console.log("tare done", this.opts.tare.result);
            this.progressState = 3;
            this.skipText = `Skip (${this.skipTime}s)`;
            this.nextIntervall = setInterval(() => {
                this.skipTime--;
                this.skipText = `Skip (${this.skipTime}s)`;
            }, 1000);
            this.nextTimeout = setTimeout(() => {
                this.showClock();
            }, this.skipTime * 1000)
        },
        skipLast() {
            this.showClock();
            if(this.progressState > 1) {
            }
        },
        showClock() {
            console.log("show clock")
            this.$attrs.setupModel.weights = this.results
            this.$router.push({name: "timer.clock"});
        }
    }
}
</script>

<style lang="scss" scoped>
.default-indicator {
    background-color: #EB4343;
    opacity: 0;
    transition: 0.1s all ease-in;
    &.visible{
        opacity: 1;
    }
}
.skip-button {
    background: #EB4343;
    background: linear-gradient(115deg, rgba(235,67,67,1) 85%, rgba(247,89,89,1) 85%);
    &.disabled {
        background: rgb(196, 196, 196);
        background: linear-gradient(115deg, rgb(196, 196, 196) 85%, rgb(214, 214, 214) 85%);
        color: #535353;
    }
}
.best-red {
    //background-color: #EB4343;
    border-color: #EB4343;
}
</style>