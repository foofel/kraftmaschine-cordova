<template>
    <div class="w-full h-full flex flex-col">
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
            <div class="mt-6 mb-6 pl-4 pr-4">
                <WeightBar :activationFactor="activationFactor" :maxWeight="weightBarMax" ref="weightBar" />
            </div>
        </div>
        <div class="flex-1">
            <div class="h-full w-full flex flex-col">
                <div class="flex-1 pl-2 pr-5" style="min-height: 50px;">
                    <ProgressGraph ref="progressGraph" />
                </div>
                <div class="font-medium text-sm flex justify-end">
                    <div class="mr-5">
                        Active: 97.4% (172.5s)
                    </div>
                </div>
            </div>
        </div>
        <div class="flex flex-col justify-center pt-5">
            <div class="pl-8 pr-8">
                <!--img class="w-full" src="@/assets/boards/board.svg" ref="hangboard"-->
                <BoardSvg1 ref="hangboard" width="100%" preserveAspectRatio="xMidYMid meet" />
                <div class="flex justify-between mt-3 font-medium text-sm">
                    <div>Left: 25mm</div>
                    <div>Right: 25mm</div>
                </div>
            </div>
        </div>
        <div class="flex justify-center pt-2 pb-2">
            <div class="flex font-light text-sm">
                <div>{{temp}}</div>
                <div class="ml-5">{{hum}}</div>
                <div class="ml-5">{{hpa}}</div>
            </div>
        </div>
        <!--p>{{attrs}}</p-->
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/core/util/vuenavigation'
import ProgressClockCanvas from '@/components/timer/ProgressClockCanvas.vue'
import WeightBar from '@/components/timer/WeightBar.vue'
import ProgressGraph from '@/components/timer/ProgressGraph.vue'
import BoardSvg1 from '@/assets/boards/board.svg'
import { clampPositive, passTrough, pipe, taredByObject } from '@/core/connectivity/messagetransformer'


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
        ProgressGraph,
        BoardSvg1
    },
    data() {
        return {
            setupModel: { 
                timer: null,
                weights: null
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
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },    
                        { length: 7, active: 4, passive: 2 },                                          
                    ],
                    [
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 0, passive: 7 },   
                        { length: 7, active: 7, passive: 0 },                                        
                    ],
                    [
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 2, passive: 2 },
                        { length: 7, active: 6, passive: 0 },
                        { length: 7, active: 7, passive: 0 }, 
                        { length: 7, active: 0, passive: 4 },                                              
                    ],
                    [
                        { length: 7, active: 0, passive: 7 },
                        { length: 7, active: 0, passive: 0 },
                        { length: 7, active: 4, passive: 0 },
                        { length: 7, active: 4, passive: 2 }, 
                        { length: 7, active: 4, passive: 2 },                                               
                    ],       
                    [
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 }, 
                        { length: 7, active: 4, passive: 2 },                                             
                    ],  
                    [
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 },
                        { length: 7, active: 4, passive: 2 }, 
                        { length: 7, active: 4, passive: 2 },                                             
                    ],                                                                           
                ]
            },
            activationFactor: 0.94,
            msgPipe: null,
        };
    },
    created() {
        this.setupModel = {
            "timer":{
                "name":"Basic 7s/5s",
                "board":0,
                "timer":{
                    "type":"simple",
                    "timer":{
                        "active":7,
                        "passive":5,
                        "pause":180,
                        "repeats":5,
                        "sets":6,
                        "cooldown":10,
                        "warmup":10
                    }
                }
            },
            "weights":{
                "tare":{
                    "left":0.18250217166257385,
                    "right":0.18478604789459238,
                    "combined":0
                },
                "weight":{
                    "left":5,
                    "right":5,
                    "combined":0
                },
                "weightedWeight":{
                    "left":5,
                    "right":5,
                    "combined":0
                }
            }
        }
        // if we direclty loaded the clock without the caliobrate/setup use the debug data
        if(this.$attrs.setupModel.timer) {
            this.setupModel = this.$attrs.setupModel;
        }
    },
    mounted() {
        this.msgPipe = pipe(taredByObject(this.setupModel.weights.tare), clampPositive);
        this.$ctx.device.subscribe({ tag: "weight", cb: this.onWeightMessage });
        
        // debug movement for the object that are not yet plugged in
        const updater = () => {
            this.clockData[0].fill = (Math.sin(performance.now() / 10000) + 1) / 2;
            this.clockData[1].fill = (Math.sin(performance.now() / 12000) + 1) / 2;
            this.clockData[2].fill = (Math.sin(performance.now() / 14000) + 1) / 2;
            this.clockData[3].fill = (Math.sin(performance.now() / 16000) + 1) / 2;
            if(this.$refs.clock) {
                this.$refs.clock.updateData(this.clockData);
            }
            //this.weightData.left = (Math.sin(performance.now() / 21000) + 1) / 2 * 50;
            //this.weightData.right = (Math.sin(performance.now() / 22000) + 1) / 2 * 50;
            //this.$refs.weightBar.updateData(this.weightData);
            const repCount = 36; // magic knowledge
            let count = 0;
            const time = performance.now() / 2000;
            for(let i = 0; i < this.progressData.sets.length; i++) {
                const set = this.progressData.sets[i];
                for(let k = 0; k < set.length; k++) {
                    const rep = set[k];
                    const val = (Math.sin(count / repCount * Math.PI * 2 + time) + 1) / 2;
                    rep.active = val * (rep.length - 1)
                    rep.passive = (rep.length - 1) - rep.active;
                    count++;
                }
            }
            this.$refs.progressGraph.updateData(this.progressData);
            requestAnimationFrame(updater);
        }
        requestAnimationFrame(updater);

        // example on how to colorize the svg data
        const svg = this.$refs.hangboard;
        svg.querySelectorAll("#hold-1, #hold-5").forEach ((e) => {
            e.style = "fill:red;"; 
        });        
    },
    beforeDestroy() {
        this.$ctx.device.unsubscribe(this.onWeightMessage);
    },
    methods: {
        onWeightMessage(msg) {
            msg = this.msgPipe(msg);
            this.weightData = msg;
            this.$refs.weightBar.updateData(msg);
        }
    },
	computed: {
        temp() {
            return "0.0°C";
        },
        hum() {
            return "0RH%";
        },
        hpa() {
            return "0hPa";
        },
        weightBarMax() {
            return this.setupModel.weights.weightedWeight.left + this.setupModel.weights.weightedWeight.right;
        }
    }
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