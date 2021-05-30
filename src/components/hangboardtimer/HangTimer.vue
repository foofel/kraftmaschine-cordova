<template>
    <div class="base fill-parent center-in-rows">
        <!--div class="header-accent"></div-->
        <div class="title-info">
            <div class="item-container center-in-columns">
                <div class="sets item">
                    <div class="center-in-rows">
                        <div>SET</div>
                        <div>{{graphData.set}}/{{hangTimerData.timer.data.sets}}</div>
                    </div>
                </div>
                <div class="remain item">
                    <div class="center-in-rows">
                        <div>REMAIN</div>
                        <div>{{overallReminingComputed}}</div>
                    </div>
                </div>
                <div class="holds item">
                    <div class="center-in-rows">
                        <div>HOLDS</div>
                        <div>{{/*hangTimerData.timer.name @ */holdNames()}}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="clock-container">
            <div class="clock-sizer clickable" @click="onPauseTimer">
                <!--ProgressClockSVG :graphData="graphData"/-->
                <ProgressClockCanvas 
                    :rep="graphData.repNormalized" 
                    :set="graphData.setNormalized" 
                    :overall="graphData.overallNormalized" 
                    :repColor="graphData.innerTimerColor"
                />
                <div class="centerize">
                    <div class="rep">
                        REP {{graphData.rep}}/{{hangTimerData.timer.data.repeats}}
                    </div>
                </div>
                <div class="centerize">
                    <div class="time">
                        {{repRemainingoComputed}}
                    </div>
                </div>
                <div class="centerize">
                    <div class="state">
                        {{currentStateName}}
                    </div>
                </div>
                <div class="clickoverlay">
                    <StartContinueAbortOverlay 
                        :timerState="timerState" 
                        :timerRunning="this.activeTrackingTimer.isStarted()" 
                        @overlayClicked="(action, stars) => onTimerOverlayClicked(action, stars)"
                        ref="startStopOverlay"
                    />
                </div>                   
            </div>         
        </div>
        <div class="activation-container center-in-columns">
            <LoadInfoDisplay class="noselect" :graphData="graphData" :showImbalance="isUsingBothHolds()" />
        </div>
        <div class="graph-container center-in-rows">
            <div class="graph-sizer">
                <TimerBarChart :progressGraphData="progressGraphData" />
            </div>
            <div class="active-bar-sizer">
                <ActiveTimeDisplay class="noselect" :graphData="graphData" />
            </div>
        </div>
        <div class="temp-container center-in-columns">
			<div class="temp">{{getTemp()}}°C</div>
			<div class="hum">{{getHum()}}%</div>
			<div class="hpa">{{hetHpa()}} hPa</div>
        </div>
    </div>
</template>

<script lang="ts">
///// <reference types="../../types/cordova-plugin-media" />
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { pipe, sum, round, guard, movingAverage, passTrough, taredByObject, clampPositive, virtualMidpoint } from '../../core/messagetransformer';
import { HangboardConnector } from '../../core/hangboardconnector';
import { WeightMessage, ScaleOptions, TempSensorInterface } from '@/core/sensorreader';
import { GlobalConfig } from '../../config'
import { HangTimerData, HangTimerSetupData, HangTimerGraphData, TimerBarChartData, LocalTrainingSaveData, Hangboards, TareWeights, SelectedHolds, Hold } from '@/components/typeexports'
import { TimerEntryPointInTime, TimerWithActiveTracking, TimerState, CalculateTimerLength, GetOverallReps, BeepType } from './ts/timerrunner'
import { ConfigFile } from '../../core/storageinterface'
import { uuidv4, makeSound, getProp, getHoldString } from  '../../core/util'
//import Media from '../../types/cordova-plugin-media'
import { HANGTIMER_FINISHED } from  '../../messages'
import moment from 'moment';
//import ProgressClockSVG from './ProgressClockSVG.vue'
import ProgressClockCanvas from './ProgressClockCanvas.vue'
import LoadInfoDisplay from './LoadInfoDisplay.vue'
import ActiveTimeDisplay from './ActiveTimeDisplay.vue'
import StartContinueAbortOverlay from './StartContinueAbortOverlay.vue'
import TimerBarChart from './TimerBarChart.vue'
import { UpdateScheduler } from './ts/updatescheduler'
import { Calibration } from '../../core/calibration';

const SCHEDULER_GROUPS = {
    TIMERPROGRESS_GRAPH: "TIMERPROGRESS_GRAPH",
    ACTIVE_TIME: "ACTIVE_TIME",
    OVERALL_PROGRESS: "OVERALL_PROGRESS",
    REP_TIME_PROGRESS: "REP_TIME_PROGRESS"
}

@Component({
    components: {
        //ProgressClockSVG,
        ProgressClockCanvas,
        ActiveTimeDisplay,
        LoadInfoDisplay,
        StartContinueAbortOverlay,
        TimerBarChart
    }
})
export default class HangTimer extends Vue {
    @Prop() setupData!: HangTimerSetupData;
    activeTrackingTimer: TimerWithActiveTracking;
    hangboardConnector: HangboardConnector;
    hangTimerData: HangTimerData;
    activationWeightFactor: number;
    graphData: HangTimerGraphData;
    updateScheduler: UpdateScheduler;
    wakeLock: any;
    normalBeepSound: any;
    lastBeepSound: any;
    frameDone: boolean;
    activeTimeTemps: Array<TempSensorInterface> = [];
    tareWeights: TareWeights;
    timerState: TimerState = "INIT";
    stateNameLookup: any = {
        "INIT": "READY!", 
        "WARMUP": "WARMUP", 
        "ACTIVE": "ACTIVE",
        "PASSIVE": "REST",
        "PAUSE": "BREAK",
        "COOLDOWN": "COOLDOWN",
        "DONE": "FINISHED!"
    }
    stateColorLookup: any = {
        "INIT": "gray",
        "WARMUP": "#149BB5",
        "ACTIVE": "green",
        "PASSIVE": "#F8BD0F",
        "PAUSE": "#fc29f0",
        "COOLDOWN": "#149BB5",
        "DONE": "#149BB5"
    }
    progressGraphData: TimerBarChartData;
    tempInfo: TempSensorInterface;
    canTare: boolean;
    calib: Calibration|null;
    enableBeep: boolean;
    enableVibrate: boolean;
    //cfg: ConfigFile;

    constructor() {
        super();
        //this.cfg = this.$root.$data.cfg;
        this.hangboardConnector = this.$root.$data.hangboardConnector;
        this.activationWeightFactor = 0.95;
        this.hangTimerData = { 
            ...this.setupData, 
            activationWeight: this.setupData.trainWeight * this.activationWeightFactor 
        }
        this.graphData = { 
            innerTimerColor: "#149BB5",
            set: 0,
            rep: 0,
            repProgress: 1,
            repDuration: 1,
            repNormalized: 0.5,
            setProgress: 1,
            setDuration: 1,
            setNormalized: 0.5,
            overallProgress: 1,
            overallDuration: 1,
            overallNormalized: 0.5,
            activeTimeProgress: 0,
            activeTimeDuration: 0,
            activeTimeNormalized: 0,
            currentWeight: 0,
            userWeight: this.hangTimerData.userWeight,
            activationWeight: this.hangTimerData.activationWeight,
            trainWeight: this.hangTimerData.trainWeight,
            leftWeight: 0,
            rightWeight: 0,
            trainData: this.hangTimerData
        };
        const overallReps = GetOverallReps(this.hangTimerData.timer.data);
        this.progressGraphData = {
            active: Array(overallReps).fill(0),
            inactive: Array(overallReps).fill(0),
            passive: Array(overallReps).fill(this.hangTimerData.timer.data.active),
            labels: Array.from({length: overallReps}, (_, i) => i + 1).map((v) => ""+v),
            maxValue: this.hangTimerData.timer.data.active
        }
        this.activeTrackingTimer = new TimerWithActiveTracking(
            this.hangTimerData,
            this.hangboardConnector,
            (pit, weight, activeTime) => this.onTimerStep(pit, weight, activeTime),
            (pit, weight, activeTime) => this.onLastStep(pit, weight, activeTime),
            (beepType) => this.beep(beepType)
        );
        this.updateScheduler = new UpdateScheduler();
        this.updateScheduler.registerTimeout(SCHEDULER_GROUPS.REP_TIME_PROGRESS, 100);
        this.updateScheduler.registerTimeout(SCHEDULER_GROUPS.ACTIVE_TIME, 100);
        this.updateScheduler.registerTimeout(SCHEDULER_GROUPS.OVERALL_PROGRESS, 200);
        this.updateScheduler.registerTimeout(SCHEDULER_GROUPS.TIMERPROGRESS_GRAPH, 100);
        this.normalBeepSound = null
        this.lastBeepSound = null
        this.frameDone = true;
        this.tempInfo = this.hangboardConnector.getLastTempSensorData();
        this.canTare = true;
        this.tareWeights = this.setupData.tareWeights;
        this.calib = null;
        this.enableBeep = true; //this.cfg.options.enableBeep;
        this.enableVibrate = true; //this.cfg.options.enableVibrate;
        this.normalBeepSound = null;
        this.lastBeepSound = null;
    } 
    mounted() {
        //console.log(JSON.stringify(this.setupData));
        this.buildProgressTimerGraphData();
        this.hangboardConnector.registerTempSensorCallback(this.onTempSensorMessage);
        //let board = { id: 2, name: "Beastmaker 1000", width: 580, height: 150, holds: [], officialBenchmarkHolds: { left: 17, right: 22 } };
        //let left = { pos: { x: 15.0, y: 58.0  }, size: { x: 85.0, y: 22.0 }, id:  6, complementary:  3, name: "", shortName: "", type: "", defaultHand: "", depth: 0, fingers: 5 };
        //let right = { pos: { x: 115.0, y: 58.0  }, size: { x: 40.0, y: 22.0 }, id:  6, complementary:  3, name: "", shortName: "", type: "", defaultHand: "", depth: 0, fingers: 5 };
        let p = null;
        if(this.setupData.selectedHolds.left && this.setupData.selectedHolds.right) {
            p = virtualMidpoint(this.setupData.selectedHolds.board, this.setupData.selectedHolds.left, this.setupData.selectedHolds.right);
        } else {
            p = passTrough
        }
        this.hangboardConnector.registerWeightCallback(
            this.onWeightMessage, 
            pipe(taredByObject(this.tareWeights), p, clampPositive)
        );
    }
    beforeDestroy() {
        this.activeTrackingTimer.destroy();
        this.releaseWakeLock();
        this.hangboardConnector.removeTempSensorCallback(this.onTempSensorMessage)
        this.hangboardConnector.removeWeightCallback(this.onWeightMessage);
    }
	onTempSensorMessage(msg: TempSensorInterface) {
		this.tempInfo = msg;
    }
    onWeightMessage(msg: WeightMessage) {
        this.activeTrackingTimer.onWeightMessage(msg);
        this.graphData.leftWeight = msg.left;
        this.graphData.rightWeight = msg.right;
        this.graphData.currentWeight = msg.combined;
    }
    buildBeepSound() {
        if(this.normalBeepSound === null) {
            const ctx = new AudioContext();
            /*makeSound(`${CORDOVA_BASE_PATH()}/sounds/beep-wav.mp3`, ctx, (o: any) => {
                console.log(o);
                console.log("beep loaded");
                this.normalBeepSound = o;
                this.lastBeepSound = this.normalBeepSound;
            });*/
        }
    }
    /*buildSaveData(stars: number): LocalUploadSave {
        return {
            type: "save-training",
            date: new Date(),
            compressData: GlobalConfig.compressLocalSaves,
            data: {
                date: new Date(),
                timerParams: this.hangTimerData.timer,
                timerDuration: this.activeTrackingTimer.getTimerLength(),
                timerElapsed: this.activeTrackingTimer.elapsedTime(),
                activeTime: this.graphData.activeTimeProgress,
                maxActiveTime: this.graphData.activeTimeDuration,
                humidity: -1,
                activeTimeData: [...this.activeTrackingTimer.getActiveTimes()],
                rawData: [],
                hangboard: Hangboards.twinPeaksReference.id,
                holdLeft: getProp(this.hangTimerData.selectedHolds, "left.id"),
                holdRight: getProp(this.hangTimerData.selectedHolds, "right.id"),
                userWeight: this.hangTimerData.userWeight,
                trainWeight: this.hangTimerData.trainWeight,
                temperatureInfo: this.activeTimeTemps,
                subjectiveDifficulty: stars

            },
            params: []
        }
    }*/
    takeWakeLock() {
        if((window as any).plugins) {
            (window as any).plugins.insomnia.keepAwake();
        }
    }
    releaseWakeLock() {
        if((window as any).plugins) {
            (window as any).plugins.insomnia.allowSleepAgain();
        }
    }
    beep(type: BeepType) {
        if(type === 'VIBRATE' && this.enableVibrate) {
            if((window as any).plugins) {
                navigator.vibrate(50);
            }
        }
        else if(type === 'VIBRATE_LAST' && this.enableVibrate)  {
            if((window as any).plugins) {
                navigator.vibrate(300);
            }
        }
        else if(type === 'BEEP' && this.normalBeepSound && this.enableBeep) {
            this.normalBeepSound.play();
        } else if(type === 'BEEP_LAST' && this.lastBeepSound && this.enableBeep) {
            this.lastBeepSound.play();
        }
    }
    onPauseTimer() {
        this.activeTrackingTimer.stop();
        const sso = this.$refs.startStopOverlay as StartContinueAbortOverlay;
        if(sso) {
                sso.resetTimeout();
        }
        this.releaseWakeLock();
    }
    onTimerStep(pit: TimerEntryPointInTime, weight: WeightMessage, activeTime: number) {
        if(this.updateScheduler.checkTimeout(SCHEDULER_GROUPS.REP_TIME_PROGRESS)) {
            this.graphData.repProgress = pit.repElapsed;
            this.graphData.repDuration = pit.repLength;
            this.graphData.setProgress = pit.setElapsed;
            this.graphData.setDuration = pit.setLength;
        }
        if(this.updateScheduler.checkTimeout(SCHEDULER_GROUPS.OVERALL_PROGRESS)) {
            this.graphData.overallProgress = pit.overallElapsed;
            this.graphData.overallDuration = pit.overallLength;
        }
        if(this.updateScheduler.checkTimeout(SCHEDULER_GROUPS.ACTIVE_TIME)) {
            this.graphData.activeTimeProgress = this.activeTrackingTimer.getActiveTimeSum();
            this.graphData.activeTimeDuration = this.activeTrackingTimer.getPossibleActiveTimeSum();
            if(this.graphData.activeTimeDuration === 0) {
                this.graphData.activeTimeNormalized = 0;
            } else {
                this.graphData.activeTimeNormalized = this.graphData.activeTimeProgress / this.graphData.activeTimeDuration;
            }
        }
        if(this.updateScheduler.checkTimeout(SCHEDULER_GROUPS.TIMERPROGRESS_GRAPH)) {       
            this.buildProgressTimerGraphData();
        }
        if(this.timerState !== "ACTIVE" && pit.state === "ACTIVE") {
            this.activeTimeTemps.push(this.hangboardConnector.getLastTempSensorData());
        }
        if(this.calib === null && this.canTare && this.timerState === "PAUSE" && pit.repLength - pit.repElapsed <= 30) {
            this.canTare = false;
            this.calib = new Calibration(this.hangboardConnector, 
			(weights: TareWeights) => {
				console.log(`new tare weights, left: ${weights.left}, right: ${weights.right}`);
				this.tareWeights.left = weights.left;
				this.tareWeights.right = weights.right;
				this.calib = null;
            }
		);
        }
        if(this.timerState === "PAUSE" && pit.state !== "PAUSE") {
            this.canTare = true;
        }
        // every frame, stuff that should not be throtteld
        if(this.frameDone) {
            this.frameDone = false;
            requestAnimationFrame(() => {
                this.frameDone = true;
                // if we already processed the "done" tick, skip this
                if(this.timerState === "DONE") {
                    return;
                }
                this.graphData.repNormalized = pit.repElapsed / pit.repLength;
                this.graphData.setNormalized = pit.setElapsed / pit.setLength;
                this.graphData.overallNormalized = pit.overallElapsed / pit.overallLength;
                this.graphData.innerTimerColor = this.stateColorLookup[pit.state];
                this.graphData.rep = pit.rep;
                this.graphData.set = pit.set;
                this.timerState = pit.state;
            });
        }
    }
    onLastStep(pit: TimerEntryPointInTime, weight: WeightMessage, activeTime: number) {
        // as we schedule with different speeds it can happen that the last tick get "swallowed", therefore
        // we unconditionally rebuild uppon the last tick
        this.graphData.repProgress = pit.repElapsed;
        this.graphData.repDuration = pit.repLength;
        this.graphData.overallProgress = pit.overallElapsed;
        this.graphData.overallDuration = pit.overallLength;
        this.graphData.overallNormalized = pit.overallElapsed / pit.overallLength;
        this.graphData.activeTimeProgress = this.activeTrackingTimer.getActiveTimeSum();
        this.graphData.activeTimeDuration = this.activeTrackingTimer.getPossibleActiveTimeSum();
        this.graphData.activeTimeNormalized = this.graphData.activeTimeProgress / this.graphData.activeTimeDuration;
        this.graphData.repNormalized = pit.repElapsed / pit.repLength;
        this.graphData.setProgress = pit.setElapsed;
        this.graphData.setDuration = pit.setLength;
        this.graphData.setNormalized = pit.setElapsed / pit.setLength;
        this.graphData.innerTimerColor = this.stateColorLookup[pit.state];
        this.graphData.rep = pit.rep;
        this.graphData.set = pit.set;
        this.timerState = pit.state;
        this.buildProgressTimerGraphData();                                
    }
    onTimerOverlayClicked(action: string, stars: number) {
        console.log(action);
        if(action === "start") {
            this.graphData.repNormalized = 0;
            this.graphData.setNormalized = 0;
            this.graphData.overallNormalized = 0;
            this.buildBeepSound()
            this.activeTrackingTimer.start();
            this.takeWakeLock();
        } else if(action === "continue") {
            this.activeTrackingTimer.start();
            this.takeWakeLock();
        } else if(action === "discard") {
            this.resetTimer();
        } else if(action === "save") {
            this.saveRunData(stars)
            this.resetTimer();
        }
    }
    resetTimer() {
        this.activeTrackingTimer.destroy();
        this.timerState = "INIT";
        this.graphData = { 
            innerTimerColor: "#149BB5",
            set: 0,
            rep: 0,
            repProgress: 1,
            repDuration: 1,
            repNormalized: 0.5,
            setProgress: 1,
            setDuration: 1,
            setNormalized: 0.5,
            overallProgress: 1,
            overallDuration: 1,
            overallNormalized: 0.5,
            activeTimeProgress: 0,
            activeTimeDuration: 0,
            activeTimeNormalized: 0,
            currentWeight: this.graphData.currentWeight,
            userWeight: this.hangTimerData.userWeight,
            activationWeight: this.hangTimerData.activationWeight,
            trainWeight: this.hangTimerData.trainWeight,
            leftWeight: this.graphData.leftWeight,
            rightWeight: this.graphData.rightWeight,
            trainData: this.hangTimerData
        };        
        this.activeTrackingTimer = new TimerWithActiveTracking(
            this.hangTimerData,
            this.hangboardConnector,
            (pit, weight, activeTime) => this.onTimerStep(pit, weight, activeTime),
            (pit, weight, activeTime) => this.onLastStep(pit, weight, activeTime),
            (beepType) => this.beep(beepType)
        );
        this.activeTimeTemps = [];
        this.buildProgressTimerGraphData();
    }
    saveRunData(stars: number) {      
        //TODO: fix
        //const data = this.buildSaveData(stars);
        //AddLocalUploadSave(data);
        //const uploader = this.$root.$data.localSaveUploader as LocalSaveUploader;
        //uploader.uploadLocalSaves();
        //this.$root.$emit(HANGTIMER_FINISHED, data);
    }
    get repRemainingoComputed() {
         return moment.utc((this.graphData.repDuration - this.graphData.repProgress) * 1000).format("mm:ss.S");
    }
    get overallReminingComputed() {
        if(this.timerState === "INIT") {
            //return this.currentRepRemaining(CalculateTimerLength(this.hangTimerData.timer.data));
            const length = CalculateTimerLength(this.hangTimerData.timer.data);
             return moment.utc(length * 1000).format("HH:mm:ss");
        } else {
            //return this.currentRepRemaining(this.graphData.overallDuration - this.graphData.overallProgress);
            return moment.utc((this.graphData.overallDuration - this.graphData.overallProgress) * 1000).format("HH:mm:ss");
        }
    }
    get currentStateName(): string {
        return this.stateNameLookup[this.timerState];
    }
    buildProgressTimerGraphData() {
        //console.log(SCHEDULER_GROUPS.TIMERPROGRESS_GRAPH);
        const overallReps = GetOverallReps(this.hangTimerData.timer.data);
        const labelValues = Array.from({length: overallReps}, (_, i) => i + 1).map((v) => ""+v);
        this.progressGraphData.labels = labelValues;
        const activeTimes = this.activeTrackingTimer.getActiveTimes();
        this.progressGraphData.active = Array(overallReps).fill(0);
        this.progressGraphData.inactive = Array(overallReps).fill(0);
        this.progressGraphData.passive = Array(overallReps).fill(this.progressGraphData.maxValue);
        for(const i in activeTimes) {
            const active = activeTimes[i];
            const inactive = this.progressGraphData.maxValue - active;
            this.progressGraphData.active[i] = active;
            this.progressGraphData.inactive[i] = inactive;
            this.progressGraphData.passive[i] = this.progressGraphData.maxValue - (active + inactive);
        }        
        if(this.timerState === "ACTIVE") {
            const activeIdx = this.activeTrackingTimer.currentActiveIndex;
            const current = this.activeTrackingTimer.getCurrentActiveTime();
            this.progressGraphData.active[activeIdx] = current.active;
            this.progressGraphData.inactive[activeIdx] = current.inactive;
            this.progressGraphData.passive[activeIdx] = this.progressGraphData.maxValue - (current.active + current.inactive);
        }
    }
    holdNames() {
        return getHoldString(this.setupData.selectedHolds);
    }

    isUsingBothHolds() {
        return this.setupData.selectedHolds.left && this.setupData.selectedHolds.right;
    }

	getTemp() {
		return this.tempInfo.temp.toFixed(1);
	}

	getHum() {
		return this.tempInfo.humidity.toFixed(0); 
	}
	hetHpa() {
		return this.tempInfo.pressure.toFixed(0); 
    }
    
}
</script>

<style lang="scss" scoped>
.base {
    .header-accent {
        position:absolute;
        top: 0;
        left: 0;
        width: 100%;
        height : 2px;
        background-color: #FDD835;
    }    
    .title-info {
        width: 90%;
        margin-top: 10px;
        box-sizing: border-box;
        .item-container {
            .item {
                width: 33.3333%
            }
        }
    }
    .clock-container {
        position:relative;
        //flex-grow: 1;
        margin-top: 10px;
        .clock-sizer {
            position:relative;
            width: 90vmin;
            height: 90vmin;
            max-width: 500px;
            max-height: 500px;
            .centerize {
                position:absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                .rep {
                    font-size: 1.25em;
                    margin-bottom: 140px;
                }
                .time {
                    font-size: 3em;
                    font-weight: 400;
                }
                .state {
                    font-size: 1.25em;
                    margin-top: 140px;
                    white-space: nowrap;
                }                      
            }      
            .clickoverlay {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
            }
        }
    }
    .activation-container {
        width: 100%;
        height: 60px;
        margin-top: 5px;
        //flex-grow: 1;
    }
    .graph-container {
        width: 100%;
        //height: 25vh;
        flex-grow: 1;
        min-height: 100px;
        .graph-sizer {
            box-sizing:border-box;
            padding: 10px;
            width: 100%;
            flex-grow: 1;
        }
        .active-bar-sizer{
            width: 96vw;
            //min-height: 10px;
            flex-grow: 0;
        }      
    }
    .temp-container {
        width: 100%;
        font-size: 1em;
        font-weight: 300;
        margin: 5px;
        .temp {}
        .hum {
            margin-left: 16px;
        }
        .hpa {   
            margin-left: 16px;
        }        
    }
}
</style>