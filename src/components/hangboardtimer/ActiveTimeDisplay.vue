<template>
    <div class="fill-parent">
        <div class="container center-in-rows">
            <div class="barcontainer">
                <VerticalBar :value="graphData.activeTimeNormalized"/>
            </div>        
            <div class="info">
                Active: 
                {{graphData.activeTimeProgress.toFixed(1)}}s / 
                {{graphData.activeTimeDuration.toFixed(1)}}s
                ({{(graphData.activeTimeNormalized * 100).toFixed(1)}}%)
            </div>  
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import VerticalBar from './VerticalBar.vue'
import { HangTimerGraphData } from '@/components/typeexports'

@Component({
    components: {
        VerticalBar
    }
})
export default class ActiveTimeDisplay extends Vue {
    @Prop({}) graphData!: HangTimerGraphData;
}
</script>

<style lang="scss" scoped>
.container {
    .barcontainer {
        width: 100%;
        height: 100%;
        height: 10px;
    }
    .info {
        margin-top: 2px;
        white-space: nowrap;
        text-align: center;
        font-size: 0.8em;
    }
}

</style>