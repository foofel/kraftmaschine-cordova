<template>
    <div class="make-inline">{{weightText}}</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { sum, round, pipe, guard, movingAverage, passTrough } from '@/core/messagetransformer';
import { HangboardScale } from '../../core/hangboardscale';
import { WeightMessage } from '../../core/sensorreader';
import { sprintf } from "sprintf-js";

@Component({
    components: {
    }
})
export default class WeightDisplay extends Vue {
    scaleBackend: HangboardScale;
    currentWeight = 0;
    @Prop({default: "%s"}) format!: string;
    @Prop({default: () => pipe(passTrough)}) pipeline!: any;
    constructor(){
        super();
        this.scaleBackend = this.$root.$data.scaleBackend
    }
    mounted() {
        this.scaleBackend.registerWeightCallback(this.onWeightMessage,
            this.pipeline
        );
    }
    
    beforeDestroy() {
        this.scaleBackend.removeWeightCallback(this.onWeightMessage);
    }

    onWeightMessage(wm: WeightMessage) {
        this.currentWeight = wm.combined;
    }

    get weightText()  {
        return sprintf(this.format, this.currentWeight);
    }
}
</script>

<style lang="scss" scoped>
.make-inline {
    display: inline-block;
}
</style>