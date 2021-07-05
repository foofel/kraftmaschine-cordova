<template>
    <div class="w-full h-full">
        <div class="w-full h-14 flex pl-16 pr-4">
            <div class="flex items-center">
                <div>
                    <div class="flex justify-center m-b-fix">SET</div>
                    <div class="border-warmGray-400 b-b-1"></div>
                    <div class="flex justify-center m-t-fix">3/7</div>
                </div>
            </div>
            <div class="flex justify-center items-center flex-1">
                <div>
                    <div class="flex justify-center m-b-fix">REMAINING</div>
                    <div class="b-b-1 border-warmGray-400"></div>
                    <div class="flex justify-center m-t-fix">12:34:45</div>
                </div>                
            </div>
            <div class="flex items-center">
                <div>
                    <div class="flex justify-center m-b-fix">WEIGHT</div>
                    <div class="b-b-1 border-warmGray-400"></div>
                    <div class="flex justify-center m-t-fix">112%</div>
                </div>                  
            </div>
        </div>
        <div class="flex justify-center items-center">
            <div class="clock-size relative">
                <ProgressClockCanvas class="absolute" ref="clock" />
                <div class="absolute w-full h-full flex justify-center items-center flex-col">
                    <div class="text-2xl mb-6">REP 3/7</div>
                    <div class="text-6xl">00:00.0</div>
                    <div class="text-2xl mt-6">READY!</div>
                </div>
            </div>
        </div>
        <div>
            <div class="mt-2 mb-2 pl-4 pr-4">
                <WeightBar ref="weightBar" />
            </div>
        </div>
        <div>
            <div class="h-20 bg-cyan-200">
                <ProgressGraph ref="progressGraph" />
            </div>
            <div>active %</div>
        </div>
        <div>hold view</div>
        <div>env</div>
        <p>the clock</p>
        <!--p>{{attrs}}</p-->
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/core/util/vuenavigation'
import ProgressClockCanvas from '@/components/timer/ProgressClockCanvas.vue'
import WeightBar from '@/components/timer/WeightBar.vue'
import ProgressGraph from '@/components/timer/ProgressGraph.vue'


export const ClockColors = {
    blue: "rgb(54, 162, 235, 1)",
    green: "rgb(75, 192, 192, 1)",
    grey: "rgb(201, 203, 207, 1)",
    orange: "rgb(255, 159, 64, 1)",
    purple: "rgb(153, 102, 255, 1)",
    red: "rgb(255, 99, 132, 1)",
    yellow: "rgb(255, 205, 86, 1)"
};

export default {
    name: "Clock",
    mixins: [VueNavigationMixin],
    components: {
        ProgressClockCanvas,
        WeightBar,
        ProgressGraph
    },
    data() {
        return {
            setupModel: { 
                timer: null,
            },
            clockData: [
                { foreground: "blue", background: "lightgray", fill: 0.5, radius: 1, width: 1 },
                { foreground: "black", background: "lightgray", fill: 0.5, radius: 0.95, width: 1 },
                { foreground: "#36A2EB", background: "lightgray", fill: 0.2, radius: 0.9, width: 4 },
                { foreground: "red", background: "white", fill: 0.5, radius: 0.82, width: 1 }
            ],
            weightData: {
                left: 0,
                right: 0
            },
            progressData: {
                sets: [
                    [
                        { length: 8, active: 4, passive: 2 },
                        { length: 8, active: 4, passive: 2 },
                        { length: 8, active: 4, passive: 2 },
                        { length: 8, active: 4, passive: 2 },                        
                    ],
                    [
                        { length: 8, active: 4, passive: 2 },
                        { length: 8, active: 4, passive: 2 },
                        { length: 8, active: 4, passive: 2 },
                        { length: 8, active: 4, passive: 2 },                        
                    ],
                ]
            }
        };
    },
    mounted() {
        const updater = () => {
            this.clockData[0].fill = (Math.sin(performance.now() / 10000) + 1) / 2;
            this.clockData[1].fill = (Math.sin(performance.now() / 12000) + 1) / 2;
            this.clockData[2].fill = (Math.sin(performance.now() / 14000) + 1) / 2;
            this.clockData[3].fill = (Math.sin(performance.now() / 16000) + 1) / 2;            
            this.$refs.clock.updateData(this.clockData);
            this.weightData.left = (Math.sin(performance.now() / 2000) + 1) / 2 * 50;
            this.weightData.right = (Math.sin(performance.now() / 3000) + 1) / 2 * 50;
            this.$refs.weightBar.updateData(this.weightData);
            this.$refs.progressGraph.updateData(this.progressData);
            requestAnimationFrame(updater);
        }
        requestAnimationFrame(updater);
    },
    beforeDestroy() {},
    methods: {},
	computed: {}
};
</script>

<style lang="scss" scoped>
.m-t-fix {
    margin-top: -3px;
}
.m-b-fix {
    margin-bottom: -3px;
}
.b-b-1 {
    border-bottom-width: 1px;
}
.clock-size {
    width: calc(min(100vw, 100vh) - 2em);
    height: calc(min(100vw, 100vh) - 2em);
}
</style>