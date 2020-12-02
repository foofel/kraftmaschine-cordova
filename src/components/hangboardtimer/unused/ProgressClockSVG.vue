<template>
    <div class="circle-container">
        <div class="circle rep">
            <CircleProgress 
                :progress="graphData.repNormalized" 
                width="100%" 
                height="100%" 
                :foreground="graphData.innerTimerColor" 
                lineWidth="8%"
            />
        </div>
        <div class="circle set">
            <CircleProgress :progress="graphData.setNormalized" width="100%" height="100%" foreground="black" lineWidth="2%" />
        </div>
        <div class="circle overall">
            <CircleProgress :progress="graphData.overallNormalized" width="100%" height="100%" foreground="black" lineWidth="2%" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import CircleProgress from './CircleProgress.vue'
import { HangTimerGraphData } from '@/components/typeexports';

@Component({
    components: {
        CircleProgress
    }
})
export default class ProgressClockSVG extends Vue {
    @Prop({}) graphData!: HangTimerGraphData;
    constructor() {
        super();
    }
}
</script>

<style lang="scss" scoped>
.circle-container {
    position: relative;
    width: 100%;
    height: 100%;    
}
/*@media (orientation:landscape) {
    .circle-container {
        width: 50vmin;
        height: 50vmin;
    }
}
@media (orientation:portrait) {
    .circle-container {
        width: 50vw;
        height: 50vw;              
    }
}*/
.circle {
    position:absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}
.overall {
    width: 100%;
    height: 100%;
}
.set {
    width: 96%;
    height: 96%;
}
.rep {
    width: 92%;
    height: 92%;
}
</style>