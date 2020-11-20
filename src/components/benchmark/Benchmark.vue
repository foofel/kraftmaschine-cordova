<template>
    <div class="center-in-rows fill-parent page">
        <!--div class="header-accent"></div-->
        <div class="title-info">
            <div class="item-container center-in-columns">
                <div class="weight-abs item">
                    <div class="center-in-rows">
                        <div>ABS</div>
                        <div>{{getAbsWeight().toFixed(2)}} kg</div>
                    </div>
                </div>
                <div class="weight-rel item">
                    <div class="center-in-rows">
                        <div>REL</div>
                        <div>{{((getRelWeight() * 100).toFixed(2))}} %</div>
                    </div>
                </div>
                <div class="holds item">
                    <div class="center-in-rows">
                        <div>HOLDS</div>
                        <div>{{getHS()}}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="benchmark-info center-in-rows">
            <table>
                <tr>
                    <td class="align-right">Time:</td>
                    <td class="margin-offset">{{getActiveTime().toFixed(2)}} s</td>
                </tr>
                <tr>
                    <td class="top-margin align-right">Place: </td>
                    <td class="top-margin margin-offset place-cell">
                        <div class="place">{{getCurrentPlace()}}</div>
                        <div class="percentile">
                            <div class="divider">/</div>
                            <div class="value">{{state.currentPercentile}}p%</div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
        <div class="goal-container center-in-rows">
            <GoalBar :highscoreData="benchmarkInfoData" :currentTime="this.state.elapsedActiveTime" />
        </div>
        <div class="timeout-container center-in-rows">
            <div class="timeout">
                <GoalClock :highscoreData="benchmarkInfoData" :currentTime="this.state.elapsedActiveTime" />
            </div>
        </div>
        <!--button @click="saveData()">save</button>
        <div class="graph-container center-in-rows grow">
            <BenchmarkGraph ref="graph" />
        </div-->
        <div v-if="state.showResult" class="result-overlay maximize center-only">
            <div class="result">
                <div class="header">Result</div>
                <div class="content-container center-only">
                    <div class="content">
                        <div class="table center-only">
                            <table>
                                <tr class="table-row">
                                    <td>Place:</td>
                                    <td class="table-value">{{getCurrentPlace()}}</td>
                                </tr>
                                <tr class="table-row">
                                    <td>Time:</td>
                                    <td class="table-value">{{getActiveTime().toFixed(2)}} s</td>
                                </tr>
                                <tr class="table-row">
                                    <td>%tile:</td>
                                    <td class="table-value">{{state.currentPercentile}}p%</td>
                                </tr>                                                                    
                            </table>
                        </div>
                        <div>
                            <div class="center-only">
                                <Button class="extra-margin" @onClick="onClickRestartBenchmark()">Done</Button>
                                <Button class="extra-margin" @onClick="onClickTryAgain()">Try Again</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>        
        <div v-if="state.controllerError !== ''" class="center-in-rows fill-parent fixit">
            <div class="error">Error</div>
            <div class="text">{{state.controllerError}}</div>
            <Button @onClick="reset()">Restart</Button>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ProgressBar from '@/components/ProgressBar.vue'
//import UserTimeline from '@/components/benchmark/UserTimeline.vue'
//import MaxWeightGoals from '@/components/benchmark/MaxWeightGoals.vue'
import WeightDisplay from '@/components/benchmark/WeightDisplay.vue'
import BenchmarkGraph from '@/components/benchmark/BenchmarkGraph.vue'
import Button from '@/components/Button.vue'
import moment from 'moment';
import { HangboardScale } from '@/core/hangboardscale';
import { WeightMessage, ScaleOptions, WeightData } from '@/core/sensorreader';
import { sum, round, pipe, guard, movingAverage, tared } from '@/core/messagetransformer';
import { BenchmarkController, ProcessingEvent } from '@/components/benchmark/ts/BenchmarkController'
import { SimpleBenchmarkController } from '@/components/benchmark/ts/SimpleBenchmarkController'
import { DataHistory } from '../../core/history'
import { AddLocalUploadSave, LocalUploadSave } from '../../core/localstore'
import { LocalSaveUploader, getProp, getHoldString, makeid, findNextHighscoreUser } from '../../core/util'
import { Hangboards, LocalBenchmarkSaveData, BenchmarkSetupData, BenchmarkVisualHighscoreEntry, BenchmarkVisualModel, BenchmarkVisualModelMarker, HighscoreEntry } from '../typeexports'
import { GlobalConfig } from '../../config'
import GoalBar from './GoalBar.vue'
import GoalClock from './GoalClock.vue'
import { StopWatch } from '../../core/stopwatch'
import { saveAs } from 'file-saver';
import { avg } from '../../core/math'

/*const genHighscore = (num:number, length:number = 10) => {
    let randnBm = () : number => {
        let u = 0;
        let v = 0;
        while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
        while(v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num / 10.0 + 0.5; // Translate to 0 -> 1
        if (num > 1 || num < 0) {
            return randnBm(); // resample between 0 and 1
        }
        return num;
    }
    
    //let times = Array.from({length: num}, () => randnBm() * length).sort((a, b) => a - b);
    let times = Array.from({length: num}, () => Math.random() * length).sort((a, b) => a - b);
    let names = [];
    let lastIdx = -1;
    let poiSpacingTime = 2; // s            
    for(let i = 0; i < num; i++) {
        let priority = 0;
        let time = times[i];
        //if(lastIdx === -1 || time >= names[lastIdx].time + poiSpacingTime) {
        //    lastIdx = i;
        //    priority = 1;
        //}
        names.push({id: i, name: makeid(Math.ceil(Math.random() * 12)), time: time, place: num - i, priority: priority })
    }
    return names;
}*/

@Component({
    components: {
        ProgressBar,
        //UserTimeline,
        //MaxWeightGoals,
        WeightDisplay,
        BenchmarkGraph,
        Button,
        GoalBar,
        GoalClock
    }
})
export default class Benchmark extends Vue {
    @Prop({default: () => {}}) setupData!:BenchmarkSetupData;
    @Prop({default: () => {}}) highscoreData!:Array<HighscoreEntry>;
    scaleBackend:HangboardScale;
    bc!:SimpleBenchmarkController;
    benchmarkGraph:BenchmarkGraph|null = null;
    //weightGoals:MaxWeightGoals|null = null;
    //timeline:UserTimeline|null = null;
    updateTimeout:any = null;
    state = this.initialState();
    benchmarkInfoData:BenchmarkVisualModel|undefined = undefined;
    currentWeight:WeightData = new WeightData(0, 0, 0);
    startTime:number = 0;
    startIndex:number = 0;
    done:boolean = false;

    constructor() {
        super();
        this.scaleBackend = this.$root.$data.scaleBackend;
        //this.highscore = genNames(30, 30);
    }

    created() {
        this.benchmarkInfoData = this.buildBenchmarkInfoData();
    }

    initialState() {
        return {
            elapsedActiveTime: 0,
            controllerError: "",
            showResult: false,
            graphImage: "",
            weight: 0,
            currentPercentile: "<10"
        }
    }

    mounted() {
        //console.log(JSON.stringify(this.setupData));
        this.scaleBackend.registerWeightCallback(this.onWeightMessage, pipe(tared(this.setupData.tareWeights.left, this.setupData.tareWeights.right), round(0.1)));
        this.benchmarkGraph = this.$refs.graph as BenchmarkGraph;
        //this.weightGoals = this.$refs.weightGoals as MaxWeightGoals;
        //this.timeline = this.$refs.timeline as UserTimeline;
        this.bc = new SimpleBenchmarkController(
            this.onStart,
            this.onUpdate,
            this.onEnd,
            this.onError,
            (evt) => {},//this.onEvent,
            this.setupData.tareWeights
        );
        let lastCount = 0;
        this.updateTimeout = setInterval(() => {
            if(this.benchmarkGraph) {
                let { time, weight, gradient } = this.bc.getBuffers();
                if(time.length === lastCount) {
                    return;
                }
                lastCount = time.length;
                let lines = this.bc.getDebugLines();
                this.benchmarkGraph.setData(time, weight, gradient, lines);
            }
            this.updateTimeout = null;
        }, 30);
    }
    beforeDestroy() {
        this.scaleBackend.removeWeightCallback(this.onWeightMessage);
        this.bc.stop();
    }

    buildBenchmarkInfoData() {
        let highscore = [];
        let hsCount = this.highscoreData.length;
        for(let i = 0; i < hsCount; i++) {
            let hse = this.highscoreData[i];
            highscore.push({ id: hse.id, name: hse.userAlias, time: hse.activeTime, percentile: hse.percentile, rank: hse.rank, priority: 0 });
        }
        let timeMarkers = [
            { time: 0, text: "0s", bgColor: "#fb4b4b", borderColor: "#fb4b4b", priority: 0, drawName: true, draw: true },
            { time: 3, text: "3s", bgColor: "#ffa879", borderColor: "#ffa879", priority: 0 , drawName: true, draw: true },
            { time: 5, text: "5s", bgColor: "#ffc163", borderColor: "#ffc163", priority: 0 , drawName: true, draw: true },
            { time: 7, text: "7s", bgColor: "rgb(255, 228, 72)", borderColor: "rgb(255, 228, 72)", priority: 0 , drawName: true, draw: true },
            { time: 10, text: "10s", bgColor: "#a9d845", borderColor: "#a9d845", priority: 0 , drawName: true, draw: true }
        ];
        for(let i = 15; i <= 300; i += 5) {
            timeMarkers.push({ time: i, text: `${i}s`, bgColor: "#a9d845", borderColor: "#a9d845", priority: 0 , drawName: true, draw: true });
        }
        let percentileMarkers = [];
        if(highscore.length > 1) {
            percentileMarkers.push({ time: 0, text: `<10`, bgColor: "#4eb5e5", borderColor: "#4eb5e5", priority: 0, drawName: false, draw: false  });
            let percentilePOI = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.99, 1];
            let poiIndex = 0;
            for(let i = 0; i < hsCount; i++) {
                let hs = highscore[i];
                if(hs.percentile >= percentilePOI[poiIndex]) {
                    percentileMarkers.push({ time: hs.time, text: `>${(percentilePOI[poiIndex] * 100).toFixed(0)}`, bgColor: "#4eb5e5", borderColor: "#4eb5e5", priority: 0, drawName: false, draw: true  });
                    poiIndex++;
                }
            }
            this.state.currentPercentile = '<10';
        } else {
            percentileMarkers.push({ time: -100, text: '>100 ', bgColor: "#4eb5e5", borderColor: "#4eb5e5", priority: 0, drawName: false, draw: true  });
            this.state.currentPercentile = '100';
        } 
        return {
            highscore: highscore,
            timeMarkers: timeMarkers,
            percentileMarkers: percentileMarkers,
            clockMarkers:[]
        }
    }
    onWeightMessage(msg:WeightMessage) {
        if(this.done){
            return;
        }
        this.currentWeight = msg;
        this.bc.injectWeightMessage(msg);
    }
    getAbsWeight() {
        return this.currentWeight.combined;
    }
    getRelWeight() {
        return this.currentWeight.combined / this.setupData.userWeight;
    }
    getActiveTime() {
        return this.state.elapsedActiveTime;
    }
    getCurrentPlace() {
        let current = findNextHighscoreUser(this.benchmarkInfoData!.highscore, this.state.elapsedActiveTime);
        if(current.next) {
            return current.next.rank + 1;
        }
        return 1;
    }
    saveData() {
        let data = JSON.stringify(this.bc.getBuffers());
        var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "data.txt");
    }
    onStart(time:number, index:number) {
        this.startTime = time;
        this.startIndex = index;
    }
    onEnd(time:number, index:number) {
        let duration = time - this.startTime;
        let data = this.bc.getBuffers();
        let ws = this.setupData.userWeight
        let wh = avg(data.weight.slice(this.startIndex, index + 1));
        let wd = wh / ws * 100;
        console.log(`weight diff: ${(wd).toFixed(2)}%, ws: ${ws.toFixed(2)}, wh: ${wh.toFixed(2)}`)
        console.log(`time diff: ${this.state.elapsedActiveTime - duration}`);
        this.done = true;
        this.state.showResult = true;
        this.saveReport();
    }    
    onUpdate(elapsed:number) {
        const findPMarker = (markers:Array<BenchmarkVisualModelMarker>, time:number) => {
            for(let i = markers.length - 1; i >= 0; i--) {
                let current = markers[i];
                if(time >= current.time) {
                    return current;
                }
            }
            return markers[markers.length - 1];
        }        
        this.state.elapsedActiveTime = elapsed;
        let pn = findNextHighscoreUser(this.benchmarkInfoData!.highscore, this.state.elapsedActiveTime);
        let pm = findPMarker(this.benchmarkInfoData!.percentileMarkers, this.state.elapsedActiveTime);
        let percText = pm.text;
        if(!pn.next) {
            percText = "100"
        }
        this.state.currentPercentile = percText;
    }
    onError(info:string, code:number) {
        let error = `${info} (${code})`;
        console.log(`error: ${error}`);
        this.state.controllerError = info;
    }
    saveReport() {
        let reportData = this.bc.getBuffers();
        let saveData: LocalBenchmarkSaveData = {
            boardId: Hangboards.twinPeaksReference.id,
            leftId: getProp(this.setupData.selectedHolds, "left.id"),
            rightId: getProp(this.setupData.selectedHolds, "right.id"),
            userWeight: this.setupData.userWeight,
            hangWeight: this.state.weight,
            activeTime: this.state.elapsedActiveTime,
            data: {
                date: new Date(),
                time: reportData.time,
                weight: reportData.weight,
                temperatureInfo: this.scaleBackend.getLastTempSensorData()
            }
        }
        let save:LocalUploadSave = {
            type: "save-benchmark",
            params: [],
            date: new Date(),
            compressData: GlobalConfig.compressLocalSaves,
            data: saveData
        };
        AddLocalUploadSave(save);
        let uploader = this.$root.$data.localSaveUploader as LocalSaveUploader;
        uploader.uploadLocalSaves();
    }

    reset() {
        this.bc.reset();
        this.state = this.initialState();
        this.done = false;
        if(this.benchmarkGraph) {
            this.benchmarkGraph.setData([0], [0], [0], []);
        }
    }

    onClickRestartBenchmark() {
        this.$emit("restartBenchmark");
    }

    onClickTryAgain() {
        this.reset();
    }

    //TODO: can we do this differently?
    getPipeline() {
        return pipe(tared(this.setupData.tareWeights.left, this.setupData.tareWeights.right), sum(8), round(0.1));
    }

    /*getgraphImageStyle() {
        return {
            backgroundImage: `url(${this.state.graphImage})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "230px",
            backgroundPosition: "center"
        }
    }

    getGraphImage() {
        return this.state.graphImage;
    }*/

    getHS() {
        return getHoldString(this.setupData.selectedHolds);
    }

    canAskForLeave() {
        return !this.bc.isActive();
    }
}
</script>

<style lang="scss" scoped>

.page {
    .header-accent {
        position:absolute;
        top: 0;
        left: 0;
        width: 100%;
        height : 2px;
        background-color: #FDD835;
    }    
    .title-info {
        width: 100%;
        margin-top: 10px;
        box-sizing: border-box;
        .item-container {
            .weight-abs {
                margin-left: 40px;
            }
            .weight-rel {}
            .item {
                width: 33.33%
            }
        }
    }
    .benchmark-info {
        width: 100%;
        margin-top: 50px;
        font-size: 2em;
        .top-margin{
            vertical-align: bottom;
            height: 35px;
        }
        .align-right {
            text-align: right;
        }
        .margin-offset {
            padding-left: 10px;
        }
        .place-cell{
            .place { 
                display: inline;
            }
            .percentile {
                font-size: 0.5em;
                display: inline;
                margin-left: 5px;
                .divider {
                    display: inline;
                }
                .value {
                    display: inline-block;
                    text-align: right;
                    width: 50px;
                }
            }
        }
    }
    .goal-container {
        margin-top: 5px;
        width: 100%;
        height: 130px;
    }
    .timeout-container {
        position: relative;
        flex-grow: 1;
        width: 100%;
        .timeout {
            width: 80vmin;
            height: 80vmin;
            max-width: 500px;
            max-height: 500px;            
        }
    }
    .graph-container {
        width: 100%;
        height: 150px;
    }
    .grow  {
        flex-grow: 1;
    }
    .fixit {
        background-color: rgba(0, 0, 0, 0.9);
        font-weight: 300;
        color: white;
        position: absolute;
        top: 0;
        left: 0;
        .error {
            font-weight: 400;
            font-size: 2em;
            margin-bottom: 20px;
            color: red;
        }
        .text {
            margin-bottom: 30px;
            max-width: 80%;
        }
    }
    .result-overlay {
        position: absolute;
        .result {
            box-sizing: border-box;
            box-shadow: 0px 0px 10px -3px black;
            border-radius: 10px;
            backdrop-filter: blur(30px);
            height: 250px;
            width: 80%;
            .header {
                width: 100%;
                font-size: 1.5em;
                font-weight: 500;
                text-align: center;
                font-style: italic;
                height: 50px;
                line-height: 50px;
                border-bottom: 1px solid gray;
            }
            .content-container {
                width: 100%;
                height: calc(100% - 50px);            
                .content {
                    .extra-margin {
                        margin: 10px;
                        margin-top: 20px;
                    }
                    .table {
                        font-size: 1.35em;
                        font-weight: 400;
                        .table-row {
                            height: 35px;
                        }
                        .table-label {
                            //width: 120px;
                        }
                        .table-value {
                            padding-left: 25px;
                        }
                    }
                }
            }
        }
    }    
}

</style>
