<template>
    <div class="w-full h-full flex flex-col">
        <div class="w-full h-14 flex pl-16 pr-4">
            <div class="flex items-center">
                <div>
                    <div class="flex justify-center m-b-fix">SET</div>
                    <div class="border-warmGray-400 b-b-1"></div>
                    <div class="flex justify-center m-t-fix">
                        {{currentSet}}/{{this.timerData.sets}}
                    </div>
                </div>
            </div>
            <div class="flex justify-center items-center flex-1">
                <div>
                    <div class="flex justify-center m-b-fix">REMAINING</div>
                    <div class="b-b-1 border-warmGray-400"></div>
                    <div class="flex justify-center m-t-fix">
                        {{remainingOverallTime}}
                    </div>
                </div>                
            </div>
            <div class="flex items-center">
                <div>
                    <div class="flex justify-center m-b-fix">WEIGHT</div>
                    <div class="b-b-1 border-warmGray-400"></div>
                    <div class="flex justify-center m-t-fix">
                        {{this.timerData.trainWeightRel.toFixed(0)}}%
                    </div>
                </div>                  
            </div>
        </div>
        <div class="flex justify-center items-center">
            <div class="clock-size relative">
                <ProgressClockCanvas class="absolute" ref="clock" />
                <div class="absolute w-full h-full flex justify-center items-center flex-col">
                    <div class="text-2xl mb-6">
                        REP {{currentRep}}/{{this.timerData.reps}}
                    </div>
                    <div class="text-6xl">
                        {{remainingRepTime}}
                    </div>
                    <div class="text-2xl mt-6">
                        {{this.timerData.stateName}}
                    </div>
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
        <div class="flex flex-col justify-center pt-5" @click="muhclick">
            <div class="pl-8 pr-8 inline-block">
                <BoardSvg1 ref="hangboard" width="100%" />
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
    </div>
</template>

<script>
import { VueNavigationMixin } from '@/core/util/vuenavigation'
import ProgressClockCanvas from '@/components/timer/ProgressClockCanvas.vue'
import WeightBar from '@/components/timer/WeightBar.vue'
import ProgressGraph from '@/components/timer/ProgressGraph.vue'
import BoardSvg1 from '@/assets/boards/board.svg'
import { clampPositive, pipe, taredByObject } from '@/core/connectivity/messagetransformer'
import { TimerExecutor } from '@/core/timer/executor'
import moment from 'moment';


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
            timerData: {
                reps: 7,
                currentRep: 3,
                repRemainingTime: 0,
                sets: 7,
                currentSet: 3,
                overallRemainingTime: 1323.543,
                weight: 87.32,
                bodyWeightRel: 112.1223,
                trainWeightRel: 112.1223,
                stateName: "LolState"
            },
            clockData: [
                { foreground: "black", background: "lightgray", fill: 0.75, radius: 1, width: 1 },
                { foreground: "black", background: "lightgray", fill: 0.75, radius: 0.95, width: 1 },
                { foreground: "#36A2EB", background: "lightgray", fill: 0.75, radius: 0.9, width: 4 },
                { foreground: "red", background: "white", fill: 0.75, radius: 0.82, width: 1 }
            ],
            clockConfig: {
                stateNameLookup: {
                    "INIT": "READY!", 
                    "WARMUP": "WARMUP", 
                    "ACTIVE": "ACTIVE",
                    "PASSIVE": "REST",
                    "PAUSE": "BREAK",
                    "COOLDOWN": "COOLDOWN",
                    "DONE": "FINISHED!"
                },
                stateColorLookup: {
                    "init": "gray",
                    "warmup": "#149BB5",
                    "active": "green",
                    "passive": "#F8BD0F",
                    "pause": "#fc29f0",
                    "cooldown": "#149BB5",
                    "goodwill": "red",
                    "done": "#149BB5"
                }                
            },
            weightData: {
                left: 0,
                right: 0,
                combined: 0
            },
            envData: {
                temp: 0,
                humidity: 0,
                pressure: 0
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
            svgInfo: {
                prevElements: [],
            },
            activationFactor: 0.94,
            msgPipe: null,
            timerExecutor: null
        };
    },
    created() {
        this.setupModel = {
            "timer":{
                "name":"Basic 7s/5s",
                "board":1,
                "timer":{
                    "type":"simple",
                    "timer":{
                        "active":4,
                        "passive":2,
                        "pause":10,
                        "repeats":2,
                        "sets":3,
                        "cooldown":5,
                        "warmup":5
                    },
                    "holdLeft": 9,
                    "holdRight": 12 
                },
            },
            "weights":{
                "tare":{
                    "left":0.18250217166257385,
                    "right":0.18478604789459238,
                    "combined":0.36728821955
                },
                "weight":{
                    "left":1,
                    "right":1,
                    "combined":2
                },
                "weightedWeight":{
                    "left":1,
                    "right":1,
                    "combined":2
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
        this.$ctx.device.subscribe({ tag: "env", cb: this.onEnvSensorMessage });
        this.timerExecutor = new TimerExecutor({
            timerSetup: this.setupModel.timer,
            calibration: this.setupModel.weights,
            activationFactor:this.activationFactor,
            cb: this.onTimerEvent
        });
        this.updateDataFromTimer();
        this.updateHoldsFromTimer();
        // debug movement for the object that are not yet plugged in
        const updater = () => {
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
        //this.timerExecutor.start();
    },
    beforeDestroy() {
        this.$ctx.device.unsubscribe(this.onWeightMessage);
        this.$ctx.device.unsubscribe(this.onTempSensorMessage);
        this.timerExecutor.destroy();
    },
    methods: {
        onWeightMessage(msg) {
            msg = this.msgPipe(msg);
            this.weightData = msg;
            this.$refs.weightBar.updateData(msg);
            this.timerExecutor.injectMessage(msg);
        },
        onEnvSensorMessage(msg) {

        },
        onTimerEvent(event) {
            if(event == "beep") {
                console.log("beep");
            } else if(event == "beep_last") {
                console.log("beep_last");
            } else if(event == "holds_update") {
                this.updateHoldsFromTimer();
            } else if(event == "timer_changed") {
                this.updateDataFromTimer();
                this.updateClockFromTimer();
            }
        },
        muhclick() {
            if(!this.timerExecutor.isRunning()){
                this.timerExecutor.start();
            } else {
                this.timerExecutor.stop();
            }
        },
        updateHoldsFromTimer() {
            this.svgInfo.prevElements.forEach((e) => {
                e.elem.style = e.style;
            });
            this.svgInfo.prevElements = []
            const holds = this.timerExecutor.getNextHolds();
            if(holds) {
                console.log(`hold change @ '${this.timerExecutor.getCurrentState()}' to ${holds}`);
                const holdsSelector = holds.map(e => `#hold-${e}`).join(",");
                const svg = this.$refs.hangboard;
                const svgElements = svg.querySelectorAll(holdsSelector)
                svgElements.forEach ((e) => {
                    this.svgInfo.prevElements.push({
                        elem: e,
                        style: e.style
                    });
                    e.style = "fill:red;"; 
                });
            }            
        },
        updateDataFromTimer() {
            this.timerData.reps = this.timerExecutor.repCount();
            this.timerData.currentRep = this.timerExecutor.repCurrent();
            this.timerData.repRemainingTime = this.timerExecutor.repRemaining();
            this.timerData.sets = this.timerExecutor.setCount();
            this.timerData.currentSet = this.timerExecutor.setCurrent();
            this.timerData.overallRemainingTime = this.timerExecutor.overallRemaining();
            this.timerData.stateName = this.timerExecutor.getCurrentState();          
            this.timerData.bodyWeightRel = this.weightData.combined / this.setupModel.weights.weightedWeight.combined;
            this.timerData.trainWeightRel = this.weightData.combined / this.setupModel.weights.weightedWeight.combined;
        },
        updateClockFromTimer() {
            // update clock (overall, set, rep, goodwill)
            this.clockData[0].fill = this.timerExecutor.overallProgress();
            this.clockData[1].fill = this.timerExecutor.setProgress();
            this.clockData[2].fill = this.timerExecutor.repProgress();
            this.clockData[2].foreground = this.clockConfig.stateColorLookup[this.timerData.stateName];
            if(this.timerExecutor.isGoodwillActive()) {
                const goodwillProgress = this.timerExecutor.goodwillProgress();
                this.clockData[3].fill = goodwillProgress;
            } else {
                this.clockData[3].fill = 0;
            }
            if(this.$refs.clock) {
                this.$refs.clock.updateData(this.clockData);
            }   
        }
    },
	computed: {
        temp() {
            return `${this.envData.temp.toFixed(1)}°C`;
        },
        hum() {
            return `${this.envData.humidity.toFixed(0)}RH%`;
        },
        hpa() {
            return `${this.envData.pressure.toFixed(0)}hPa"`; 
        },
        weightBarMax() {
            return this.setupModel.weights.weightedWeight.combined;
        },
        remainingOverallTime() {
            return moment.utc(this.timerData.overallRemainingTime * 1000).format("HH:mm:ss")
        },
        remainingRepTime() {
            return moment.utc(this.timerData.repRemainingTime * 1000).format("mm:ss.S")
        },
        currentSet() {
            return this.timerData.currentSet + 1;          
        },
        currentRep() {
            if(this.timerData.stateName == "warmup" || this.timerData.stateName == "pause") {
                return 0;
            }
            else {
                return this.timerData.currentRep + 1;
            }
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
    width: calc(min(min(100vw, 100vh), 512px) - 2em);
    height: calc(min(min(100vw, 100vh), 512px) - 2em);
}
</style>