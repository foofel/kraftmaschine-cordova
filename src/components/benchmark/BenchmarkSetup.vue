<template>
    <div class="center-in-rows fill-parent setup-container">
        <HoldSelector v-if="state === 2" @holdSelected="onHoldSelected" selectionMode="benchmark" />
        <table v-show="state !== 2" class="progress-table">
            <tr>
                <td class="cell-a row-height">Tare:</td>
                <td v-if="state === 1" class="cell-b row-height">
                    <WeightCalibration
                        @calibrationDone="onTareDone"
                        initFormat="release board"
                        autorun=true 
                        minWeight=-10
                        maxWeight=10
                    />
                    </td>
                    <td v-if="state > 1" class="cell-b row-height">Done</td>
            </tr>
            <tr>
                <td class="cell-a row-height">Holds:</td>
                <td v-if="state < 2" class="cell-b row-height">Waiting...</td>
                <td v-if="state === 2" class="cell-b row-height">
                    <!--HoldSelector @holdSelected="onHoldSelected" selectionMode="benchmark" /-->
                </td>
                <td v-if="state > 2" class="cell-b row-height">
                    <span>{{holdNames()}}</span>
                </td>                
            </tr>
            <tr>
                <td class="cell-a row-height">Weight (kg):</td>
                <td v-if="state < 3" class="cell-b row-height">Waiting...</td>
                <td v-if="state === 3" class="cell-b row-height">
                    <WeightCalibration v-if="state >= 1" @calibrationDone="onCalibrationUserDone" :tareWeights="setupData.tareWeights" autorun=true minWeight=10 />
                </td>
                <td v-if="state > 3" class="cell-b row-height">{{setupData.userWeight.toFixed(2)}} kg</td>
            </tr>
            <tr>
                <td v-if="state < 4" class="cell-ab row-height" colspan="2">Waiting...</td>
                <td v-if="state >= 4" class="cell-ab row-height" colspan="2">Done, preparing benchmark {{continueTime}}s</td>
            </tr>
        </table>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import HoldSelector from '@/components/HoldSelector.vue'
import WeightCalibration from '@/components/hangboardtimer/WeightCalibration.vue'
import Button from '@/components/Button.vue'
import { Hangboard, TareWeights, SelectedHolds, BenchmarkSetupData } from '@/components/typeexports';
import { WeightMessageInterface, WeightData } from '../../core/sensorreader';
import { getHoldString } from '@/core/util';

@Component({
    components: {
        HoldSelector,
        WeightCalibration,
        Button
    }
})
export default class BenchmarkSetup extends Vue {
    state:number = 0
    benchmarkCalibrationInProgress:boolean = false;
    continueTime:number = 3;
    continueTimerId:any = 0;
    setupData = {
        tareWeights: {},
        selectedHolds: {},
        userWeight: 0
    }
    constructor(){
        super();
    }
    mounted() {
        this.state = 1;
    }
    onTareDone(data:TareWeights) {
        this.setupData.tareWeights = data;
        //console.log("tare done", data);
        this.state = 2;
    }
    onHoldSelected(holds:SelectedHolds) {
        this.setupData.selectedHolds = holds;
        //console.log("holds selected", holds);
        this.state = 3;
    }
    onCalibrationUserDone(weight:WeightData) {
        this.setupData.userWeight = weight.combined;
        //console.log(weight);
        this.state = 4;
        this.startCountdown();
    }
    startCountdown() {
        this.continueTimerId = setInterval(() => {
            this.continueTime--;
            if(this.continueTime === 0) {
                clearInterval(this.continueTimerId);
                this.continueTimerId = 0;
                this.$emit("setupDone", this.setupData);
            }
        }, 1000);
    }

    holdNames() {
        return getHoldString(this.setupData.selectedHolds as SelectedHolds);
    } 
}
</script>

<style lang="scss" scoped>
.setup-container {
    //width: 80%;
}
.headline {
    font-size: 2em;
    font-weight: bolder;
    margin-bottom: 20px;
}
.progress-table {
    width: 95%;
    //max-width: 99%;
    //min-width: 80%;
    border-collapse: separate;
    border-spacing:0 5px;
    table-layout:fixed;
}
.row-height {
    height: 30px;
    padding: 5px;
}
.cell-a {
    border: 1px solid lightgray;
    border-width: 1px 1px 1px 1px;
    border-radius: 5px 0px 0px 5px;
    //border-radius: 3px 0px 0px 3px;
    padding-left: 10px;
    min-width:20px;
    width: 30%;
    white-space: nowrap;
}
.cell-b {
    border: 1px solid lightgray;
    border-width: 1px 1px 1px 0px;
    border-radius: 0px 5px 5px 0px;
    width: 70%;
    white-space: nowrap;
    min-width:100px;
    padding: 3px;
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
</style>
