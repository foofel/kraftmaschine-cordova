<template>
    <div class="fill-parent">
        <HeadlineView v-if="navState.current() === 'setup'" headlineText="Timer Selection">
            <div class="fill-parent center-in-rows">
                <TimerSelector v-if="preperationProgress === 0" @timerSelected="onTimerSelected"/>
                <HoldSelector v-if="preperationProgress === 1" @holdSelected="onHoldSelected" />
                <table v-if="preperationProgress !== 0 && preperationProgress !== 1" class="progress-table">
                    <tr class="row-height">
                        <td class="cell-a row-height">Selected timer:</td>
                        <td v-if="preperationProgress <= 0" class="cell-b row-height">Waiting...</td>
                        <td v-if="preperationProgress > 0" class="cell-b row-height">
                            <div class="timer-info" v-if="preperationProgress != 0">
                                <div class="timer-info-elem-a">{{setupData.timer.name}}</div>
                                <div class="timer-info-elem-b">({{setupData.timer.data.active}}/{{setupData.timer.data.passive}}/{{setupData.timer.data.repeats}}/{{setupData.timer.data.sets}})</div>
                            </div>
                        </td>
                    </tr>
                    <tr class="row-height">
                        <td class="cell-a row-height">Selected hold:</td>
                        <td v-if="preperationProgress < 1" class="cell-b row-height">Waiting...</td>
                        <td v-if="preperationProgress > 1" class="cell-b row-height">
                            <span>{{holdNames()}}</span>
                        </td>
                    </tr>
                    <tr class="row-height">
                        <td class="cell-a row-height">Tare:</td>
                        <td v-if="preperationProgress < 2" class="cell-b row-height">Waiting...</td>
                        <td v-if="preperationProgress === 2" class="cell-b row-height"><WeightCalibration @calibrationDone="onTareDone" initFormat="release board" autorun=true minWeight=-10 maxWeight=10 /></td>
                        <td v-if="preperationProgress > 2" class="cell-b row-height">Done</td>
                    </tr>
                    <tr class="row-height">
                        <td class="cell-a row-height">Weight (kg):</td>
                        <td v-if="preperationProgress < 3" class="cell-b row-height">Waiting...</td>
                        <td v-if="preperationProgress === 3" class="cell-b row-height"><WeightCalibration @calibrationDone="onCalibrationUserDone" :tareWeights="setupData.tareWeights" autorun=true minWeight=10 /></td>
                        <td v-if="preperationProgress > 3" class="cell-b row-height">{{setupData.userWeight.toFixed(2)}} kg</td>
                    </tr>
                    <tr class="row-height">
                        <td class="cell-a row-height">T-Weight (kg):</td>
                        <td v-if="preperationProgress < 4" class="cell-b row-height">Waiting...</td>
                        <td v-if="preperationProgress === 4" class="cell-b row-height button-row-height">
                            <Button class="calib-2" @onClick="onStartTrainCalibration">Calibrate</Button>
                            <Button class="calib-2-skip" @onClick="onSkipCalibrateTrain">Skip</Button>
                        </td>
                        <td v-if="preperationProgress === 5" class="cell-b row-height">
                            <WeightCalibration v-if="preperationProgress === 5" @calibrationDone="onCalibrationTrainDone" :tareWeights="setupData.tareWeights" autorun=true minWeight=10 />
                        </td>
                        <td v-if="preperationProgress > 5" class="cell-b row-height">{{setupData.trainWeight.toFixed(2)}} kg</td>
                    </tr>
                    <tr class="row-height">
                        <td v-if="preperationProgress < 6" class="cell-ab row-height" colspan="2">Waiting...</td>
                        <td v-if="preperationProgress >= 6" class="cell-ab row-height" colspan="2">Done, preparing timer {{continueTime}}s</td>
                    </tr>
                </table>
            </div>
        </HeadlineView>
        <div class="fill-parent center-in-rows" v-if="navState.current() === 'timer'">
            <HangTimer :setupData="setupData" ref="hangtimer" />
        </div>
    </div>

</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Route } from 'vue-router';
import { pipe, sum, round, guard, movingAverage } from '../../core/messagetransformer';
import { HangboardConnector } from '../../core/hangboardconnector';
import { VueNavigation } from '@/components/vuenavigation';
import { WeightMessage, ScaleOptions, WeightData } from '@/core/sensorreader';
//import TimerTare from './TimerTare.vue'
import WeightCalibration from './WeightCalibration.vue'
//import DetailWeightGraph from './DetailWeightGraph.vue'
import TimerSelector from './TimerSelector.vue'
import HoldSelector from '../HoldSelector.vue'
//import ProgressClockSVG from './ProgressClockSVG.vue'
import HangTimer from './HangTimer.vue'
import { TimerEntry, TimerSelectorEntry, PredefinedTimers, HangTimerSetupData, Hold, Hangboard, Hangboards, SelectedHolds, NavigationComponent } from '@/components/typeexports';
import Button from '@/components/Button.vue'
import HeadlineView from '@/components/HeadlineView.vue'
import { getHoldString } from '@/core/util';

class NavigationState {
    stateIndex = 0;
    constructor(readonly states: string[]) {}
    advance() {
        this.stateIndex++;
    }
    current() {
        return this.states[this.stateIndex];
    }
}

@Component({
    components: {
        //DetailWeightGraph,
        WeightCalibration,
        HoldSelector,
        TimerSelector,
        //ProgressClockSVG,
        HangTimer,
        Button,
        HeadlineView
    }/*,
    beforeRouteLeave (to:Route, from:Route, next:Function) {
        let self = this as VueNavigation;
        if(self.canLeaveComponent() !== "ok") {
            self.onBeforeShowDialog();
            let leave = window.confirm("Timer in Progress, leave page?");
            if(leave) {
                next();
            }
        } else {
            next();
        }
    }*/
})
export default class TimerMain extends VueNavigation {
    scaleBackend: HangboardConnector;
    navState: NavigationState = new NavigationState(['setup', 'timer']);
    preperationProgress = 0;
    continueTime = 3;
    continueTimerId: any = null;
    initialState = {
        continueTime: this.continueTime,
        preperationProgress: this.preperationProgress
    }
    setupData = { timer: PredefinedTimers.default, tareWeights: {}, selectedHolds: {}, userWeight: 0, trainWeight: 0 }
    //setupData:any = JSON.parse('{"timer":{"id":"tDFdYjuTRT","name":"Test/Debug 39","desc":"10s hang with max weight on one hand, 5s break to switch hands then 3m break","data":{"warmup":2,"active":2,"passive":2,"repeats":2,"pause":2,"sets":2,"cooldown":2}},"tareWeights":{"left":0,"right":0,"combined":0},"selectedHolds":{"left":{"id":3,"complementary":6,"name":"45° Sloper","type":"sloper","depth":50,"fingers":5,"pos":{"x":250,"y":130},"size":{"x":125,"y":50}},"right":{"id":6,"complementary":3,"name":"45° Sloper","type":"sloper","depth":50,"fingers":5,"pos":{"x":625,"y":130},"size":{"x":125,"y":50}},"board":{"id":1,"name":"Twinpeaks Reference","width":750,"height":180,"holds":[{"id":1,"complementary":4,"name":"Jug","type":"jug","depth":50,"fingers":5,"pos":{"x":0,"y":160},"size":{"x":125,"y":20}},{"id":2,"complementary":5,"name":"40° Sloper","type":"sloper","depth":50,"fingers":5,"pos":{"x":125,"y":138},"size":{"x":125,"y":42}},{"id":3,"complementary":6,"name":"45° Sloper","type":"sloper","depth":50,"fingers":5,"pos":{"x":250,"y":130},"size":{"x":125,"y":50}},{"id":4,"complementary":1,"name":"Jug","type":"jug","depth":50,"fingers":5,"pos":{"x":375,"y":160},"size":{"x":125,"y":20}},{"id":5,"complementary":2,"name":"40° Sloper","type":"sloper","depth":50,"fingers":5,"pos":{"x":500,"y":138},"size":{"x":125,"y":42}},{"id":6,"complementary":3,"name":"45° Sloper","type":"sloper","depth":50,"fingers":5,"pos":{"x":625,"y":130},"size":{"x":125,"y":50}},{"id":7,"complementary":8,"name":"Pocket","type":"pocket","depth":20,"fingers":3,"pos":{"x":27.5,"y":130},"size":{"x":70,"y":25}},{"id":8,"complementary":7,"name":"Pocket","type":"pocket","depth":20,"fingers":3,"pos":{"x":402.5,"y":130},"size":{"x":70,"y":25}},{"id":9,"complementary":12,"name":"Edge 20","type":"edge","depth":20,"fingers":4,"pos":{"x":12.5,"y":90},"size":{"x":100,"y":25}},{"id":10,"complementary":13,"name":"Edge 25","type":"edge","depth":25,"fingers":4,"pos":{"x":137.5,"y":90},"size":{"x":100,"y":25}},{"id":11,"complementary":14,"name":"Edge 30","type":"edge","depth":30,"fingers":4,"pos":{"x":262.5,"y":90},"size":{"x":100,"y":25}},{"id":12,"complementary":9,"name":"Edge 20","type":"edge","depth":20,"fingers":4,"pos":{"x":387.5,"y":90},"size":{"x":100,"y":25}},{"id":13,"complementary":10,"name":"Edge 25","type":"edge","depth":25,"fingers":4,"pos":{"x":512.5,"y":90},"size":{"x":100,"y":25}},{"id":14,"complementary":11,"name":"Edge 30","type":"edge","depth":30,"fingers":4,"pos":{"x":637.5,"y":90},"size":{"x":100,"y":25}},{"id":15,"complementary":18,"name":"Edge 10","type":"edge","depth":10,"fingers":4,"pos":{"x":12.5,"y":50},"size":{"x":100,"y":25}},{"id":16,"complementary":19,"name":"Edge 12","type":"edge","depth":12,"fingers":4,"pos":{"x":137.5,"y":50},"size":{"x":100,"y":25}},{"id":17,"complementary":20,"name":"Edge 15","type":"edge","depth":15,"fingers":4,"pos":{"x":262.5,"y":50},"size":{"x":100,"y":25}},{"id":18,"complementary":15,"name":"Edge 10","type":"edge","depth":10,"fingers":4,"pos":{"x":387.5,"y":50},"size":{"x":100,"y":25}},{"id":19,"complementary":16,"name":"Edge 12","type":"edge","depth":12,"fingers":4,"pos":{"x":512.5,"y":50},"size":{"x":100,"y":25}},{"id":20,"complementary":17,"name":"Edge 15","type":"edge","depth":15,"fingers":4,"pos":{"x":637.5,"y":50},"size":{"x":100,"y":25}},{"id":21,"complementary":24,"name":"Crimp 4","type":"crimp","depth":4,"fingers":4,"pos":{"x":12.5,"y":10},"size":{"x":100,"y":25}},{"id":22,"complementary":25,"name":"Crimp 6","type":"crimp","depth":6,"fingers":4,"pos":{"x":137.5,"y":10},"size":{"x":100,"y":25}},{"id":23,"complementary":26,"name":"Crimp 8","type":"crimp","depth":8,"fingers":4,"pos":{"x":262.5,"y":10},"size":{"x":100,"y":25}},{"id":24,"complementary":21,"name":"Crimp 4","type":"crimp","depth":4,"fingers":4,"pos":{"x":387.5,"y":10},"size":{"x":100,"y":25}},{"id":25,"complementary":22,"name":"Crimp 6","type":"crimp","depth":6,"fingers":4,"pos":{"x":512.5,"y":10},"size":{"x":100,"y":25}},{"id":26,"complementary":23,"name":"Crimp 8","type":"crimp","depth":8,"fingers":4,"pos":{"x":637.5,"y":10},"size":{"x":100,"y":25}}],"officialBenchmarkHolds":{"left":9,"right":12}}},"userWeight":74.75,"trainWeight":74.75}');

    constructor() {
        super();
        this.scaleBackend = this.$root.$data.scaleBackend;
    }

    mounted() {
        //this.navState.advance();
    }

    beforeDestroy() {
        if(this.continueTimerId) {
            clearTimeout(this.continueTimerId);
            this.continueTimerId = null;
        }
    }

    resetAll() {
        this.navState = new NavigationState(['setup', 'timer']);
        this.preperationProgress = this.initialState.preperationProgress;
        this.continueTime = this.initialState.continueTime;
    }

    onTimerSelected(timer: TimerSelectorEntry) {
        console.log("timer selected", timer);
        this.setupData.timer = timer;
        this.preperationProgress++;
    }

    onHoldSelected(holds: SelectedHolds) {
        console.log("selected board", holds);
        this.setupData.selectedHolds = holds;
        this.preperationProgress++;
    }

    onTareDone(msg: WeightData) {
        console.log("tare done", msg);
        this.setupData.tareWeights = msg;
        this.preperationProgress++;
    }

    onCalibrationUserDone(msg: WeightData) {
        console.log("calibration (u) done", msg);
        this.setupData.userWeight = msg.combined;
        this.setupData.trainWeight = msg.combined
        this.preperationProgress++;
    }

    onStartTrainCalibration() {
        this.preperationProgress++;
    }

    onCalibrationTrainDone(msg: WeightData) {
        console.log("calibration (t) done", msg);
        this.setupData.trainWeight = msg.combined;
        this.preperationProgress++;
        this.startTimeout();
    }

    startTimeout() {
        this.continueTimerId = setInterval(() => {
            this.continueTime--;
            if(this.continueTime <= 0) {
                clearInterval(this.continueTimerId);
                this.continueTimerId = null;
                this.navState.advance();
            }
        }, 1000);
    }

    onSkipCalibrateTrain() {
        this.preperationProgress = 6;
        this.startTimeout();
    }

    startTimerProcedure() {
        this.navState.advance()
    }

    holdNames() {
        return getHoldString(this.setupData.selectedHolds as SelectedHolds);
    }

    pauseTimer() {
        const ht = this.$refs.hangtimer as HangTimer;
        if(ht) {
            ht.onPauseTimer();
        } 
    }

    canLeaveComponent() {
        if(this.navState.current() === "setup") {
            return "ok";
        }
        const ht = this.$refs.hangtimer as HangTimer;
        if(ht) {
            if(ht.timerState === "INIT") {
                return "ok";
            }
        }
        return "ask";
    }

    onBeforeShowDialog() {
        this.pauseTimer();
    }
}
</script>

<style lang="scss" scoped>
.graph-box {
    position: absolute;
    width: 100vw;
    height: 25vh;
    min-height: 200px;
    border-top: 1px gray dashed;
    bottom: 0px;
    cursor: pointer;
    background-color: white;
}
.setup-headline, .headline {
    font-weight: 300;
    font-size: 2em;
    margin-bottom: 15px;
}
.details {
    position: absolute;
    bottom: 5px;
    left: 10px;
    cursor: pointer;
}
.reset-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
}
.progress-table {
    width: 90%;
    max-width: 99%;
    min-width: 80%;
    border-collapse: separate;
    border-spacing:0 5px;
    table-layout:fixed;
}
.row-height {
    height: 30px;
    padding: 5px;
}
.button-row-height {
    padding: 2px;
}
.cell-a {
    border: 1px solid lightgray;
    border-width: 1px 1px 1px 1px;
    border-radius: 5px 0px 0px 5px;
    padding-left: 10px;
    width: 38%;
    white-space: nowrap;
}
.cell-b {
    border: 1px solid lightgray;
    border-width: 1px 1px 1px 0px;
    border-radius: 0px 5px 5px 0px;
    width: 62%;
    white-space: nowrap;
    min-width:210px;
    text-align: center;
}
.cell-ab {
    vertical-align: center;
    border: 1px solid lightgray;
    border-width: 1px 1px 1px 1px;
    border-radius: 5px 5px 5px 5px;
    padding-left: 10px;
    white-space: nowrap;
}
.calib-2 {
    float: left;
    margin: 2px;
}
.calib-2-skip {
    float: right;
    margin: 2px;
}
.timer-info {
    overflow: auto;
}
.timer-info-elem-a {
}
.timer-info-elem-b {
    color: gray;
    font-size: calc(80%)
}
.continue-text {
    float:left;
    height: 100%;
}
</style>