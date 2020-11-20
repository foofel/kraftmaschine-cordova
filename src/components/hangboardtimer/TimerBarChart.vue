<template>
    <div class="barstyles fill-parent">
        <!--BarChartTemplate :data="chartData" :options="chartOptions" :styles="graphStyle" /-->
        <CustomBarChart :data="chartData" :options="chartOptions" />
    </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { pipe, sum, round, guard, movingAverage, passTrough } from '../../core/messagetransformer';
import { HangboardScale } from '../../core/hangboardscale';
import { WeightMessage, ScaleOptions } from '@/core/sensorreader';
import { DataHistory } from '../../core/history';
import { ChartColors, TimerBarChartData } from '@/components/typeexports';
import CustomBarChart from './CustomBarChart.vue'

@Component({
    components: {
        CustomBarChart
    }
})
export default class TimerBarChart extends Vue {
    @Prop() progressGraphData!:TimerBarChartData;
    chartData:any = {};
    chartOptions:any = {};
    constructor() {
        super();
        this.chartData.labels = this.progressGraphData.labels;
        this.chartData.datasets = [
            this.progressGraphData.active,
            this.progressGraphData.inactive,
            this.progressGraphData.passive
        ]
        this.chartOptions.max = this.progressGraphData.maxValue;
    }

    mounted() {}
    beforeDestroy() {}

    @Watch("progressGraphData.labels", { deep: true })
    onDataChange(value: any, oldValue: any) {
        this.chartData.datasets[0] = this.progressGraphData.active;
        this.chartData.datasets[1] = this.progressGraphData.inactive;
        this.chartData.datasets[2] = this.progressGraphData.passive;
        this.chartData.labels = this.progressGraphData.labels;
    }    

    get graphStyle() {
        return {
            height: "100%",
            width: "100%"
        }
    }
}
</script>

<style lang="scss" scoped>
.barstyles {}
</style>