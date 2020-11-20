<template>
<div id="root" class="fill-parent">
    <HeadlineView headlineText="Trainings">
        <div class="table-container">
            <table class="progress-table">
                <tbody>
                    <tr class="header-row">
                        <th class="header-cell a first">Timer</th>
                        <th class="header-cell b">Completed</th>
                        <th class="header-cell c">Progress</th>
                        <th class="header-cell d">Weight</th>
                        <th class="header-cell e last">Date</th>
                    </tr>
                </tbody>
                <tbody v-for="(entry, index) in saveEntries" v-bind:key="index">
                    <tr class="entry-row clickable" @click="(event) => toggleRow(entry)">
                        <td class="entry-cell a first">
                            <div class="container">
                                <div>{{entry.data.timerParams.name}}</div>
                                <div class="sub-info">{{entry.data.timerParams.data.active}}/{{entry.data.timerParams.data.passive}}/{{entry.data.timerParams.data.repeats}}/{{entry.data.timerParams.data.sets}}</div>                            
                            </div>
                        </td>
                        <td class="entry-cell b">
                            <div class="container">
                                <div>{{(entry.data.activeTime / entry.data.maxActiveTime * 100).toFixed(2)}}%</div>
                                <div class="sub-info">{{entry.data.activeTime.toFixed(0)}}s/{{entry.data.maxActiveTime.toFixed(0)}}s</div>
                            </div>                            
                        </td>
                        <td class="entry-cell c">
                            <div class="container">
                                <div>{{(entry.data.timerElapsed / entry.data.timerDuration * 100).toFixed(2)}}%</div>
                                <div class="sub-info">{{formatLength(entry.data.timerElapsed)}}</div>
                            </div>
                        </td>
                        <td class="entry-cell d">
                           <div class="container">
                               <!-- weight was added later and not every entry has a weight -->
                                <div v-if="entry.data.userWeight">
                                    <div>{{(entry.data.trainWeight / entry.data.userWeight * 100).toFixed(2)}}%</div>
                                    <div class="sub-info">{{entry.data.trainWeight.toFixed(2)}}kg</div>
                                </div>
                                <div v-else>
                                    -
                                </div>
                            </div>
                        </td>
                        <td class="entry-cell e last">{{formatTime(entry.data.date)}}</td>
                    </tr>
                    <tr v-if="entry.showDetails" class="detail-row">
                        <td colspan="5" class="detail-cell">
                            <div class="detail-view">
                                <div class="graph-container">
                                    <CustomBarChart :data="getChartData(entry)" :options="getChartOptions(entry)" />
                                </div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </HeadlineView>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { LocalTrainingSaveData } from '@/components/typeexports'
import { RemoteAPI, EasyRemoteApiHelpers, LocalSaveUploader } from '../../core/util';
import { LocalStorage, GetLocalUploadSaves } from '../../core/localstore';
import moment from 'moment';
import { HANGTIMER_FINISHED } from '../../messages';
import { StopWatch } from '../../core/stopwatch';
import CustomBarChart from '../hangboardtimer/CustomBarChart.vue';
import HeadlineView from '@/components/HeadlineView.vue';
import { VueNavigation } from '../vuenavigation';

interface DisplaySaveDataEntry {
    data: LocalTrainingSaveData;
    showDetails:boolean;
}

@Component({
    components: {
        CustomBarChart,
        HeadlineView
    }
})
export default class SessionHistory extends VueNavigation {
    saveEntries:Array<DisplaySaveDataEntry> = [];
    timerId:any = 0;
    //storage:LocalStorage<LocalTrainingSaveData> = new LocalStorage<LocalTrainingSaveData>();
    backend:RemoteAPI;
    constructor() {
        super();
        this.backend = this.$root.$data.backend;
        this.$root.$on(HANGTIMER_FINISHED, (run:LocalTrainingSaveData) => {
            this.buildRows();
        });
    }
    mounted() {
        this.buildRows();
    }
    beforeDestroy() {
        if(this.timerId !== 0) {
            clearInterval(this.timerId);
        }
    }
    formatLength(time:number) {
        return moment.utc(time * 1000).format('HH:mm:ss');
    }
    formatTime(time:string) {
        return moment(time).format('DD.MM.YYYY');
    }
    toggleRow(entry:DisplaySaveDataEntry) {
        entry.showDetails = !entry.showDetails;
    }

    async buildRows() {
        if(!this.backend.isAuthenticated()) {
            console.log("no backend yet");
            return;
        }
        let newEntries = [];
        this.saveEntries = [];
        let remoteTrainings = await EasyRemoteApiHelpers.getTrainings(this.backend);
        console.log("trainings:", remoteTrainings);
        for(let rt of remoteTrainings) {
            newEntries.push({
                data: rt.data,
                showDetails: false,
                sync: true
            });
        }
        let localTrainings = GetLocalUploadSaves("save-training");
        for(let lt of localTrainings) {
            let [key, save] = lt;
            newEntries.push({
                data: save.data,
                showDetails: false,
                sync: false
            });
        }
        this.saveEntries = newEntries.sort((a:DisplaySaveDataEntry, b:DisplaySaveDataEntry) => +new Date(b.data.date) - +new Date(a.data.date));
        console.log("history reloaded");
    }

    async reloadHistory() {
        await (this.$root.$data.localSaveUploader as LocalSaveUploader).uploadLocalSaves();
        this.buildRows();
    }

    getChartOptions(entry:DisplaySaveDataEntry){
        return {
            max: entry.data.timerParams.data.active
        }
    }
    getChartData(entry:DisplaySaveDataEntry) {
        return{
            labels: Array.from({length: entry.data.activeTimeData.length}, (_, i) => i + 1).map((v) => ""+v),
            datasets: [
                entry.data.activeTimeData,
                Array.from({length: entry.data.activeTimeData.length}, (_, i) => entry.data.timerParams.data.active - entry.data.activeTimeData[i]),
                Array.from({length: entry.data.activeTimeData.length}, (_, i) => 0)
            ]
        };
    }
}
</script>

<style scoped lang="scss">
#root {}
.scrollable {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    .headline {
        font-size: 2em;
        font-weight: 600;
        margin: 10px;
    }    
}
.table-container {
    .progress-table {
        table-layout: fixed;
        border-collapse: collapse;
        width: 100%;
        .header-row {
            height: 40px;
            .header-cell {
                white-space: nowrap;
                border-bottom: 1px solid lightgray;
            }
            .a { width: 25%; }
            .b { width: 18%; }
            .c { width: 18%; }
            .d { width: 18%; }
            .e {   }
            //.f {  }
        }
        .entry-row {
            height: 40px;
            .entry-cell {
                border-bottom: 1px solid lightgray;
                border-top: 1px solid lightgray;
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .container {
                text-align: left;
                display: inline-block;
            }
            .sub-info {
                font-size: 0.75em;
                color: gray;
            }
            .a { }
            .b { }
            .c { }
            .d { }
            .e { }
        }
    }
    .detail-row { 
        .detail-cell {
            color: black;
        }
    }
    .detail-view {
        box-sizing: border-box;
        border: 1px solid lightgray;
        border-radius: 5px;
        margin: 5px;
        .graph-container {
            height: 100px;
            margin: 15px;
            margin-bottom: 5px;
            margin-left: 5px;
        }
    }
}

@media (max-width:600px) { 
    .table-container {
        font-size: 0.75em;
    }
}
</style>
