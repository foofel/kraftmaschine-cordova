<template>
    <div class="container">
        <div class="top-text">
            <div v-if="showImbalance" class="diff">Imbalance: {{weightDiff()}}</div>
            <div class="activation" :style="styleActivation()">{{this.graphData.activationWeight.toFixed(2)}} kg</div>
        </div>
        <div class="bar">
            <HiDpiCanvas ref="hidpiCanvas" :drawFunction="drawBars" />
        </div>
        <div class="bottom-text">
            <div class="current">Weight: {{combinedWeight()}}</div>
            <div class="user" :style="styleTrain()">
                <div class="positoner">{{this.graphData.trainWeight.toFixed(2)}} kg</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { map, RGBtoHSV, lerp, HSVtoRGB, clamp, HexToRGB, round } from '../../core/math';
import { UpdateLimiter } from '../../core/util';
import HiDpiCanvas from '@/components/HiDpiCanvas.vue'
import { HangTimerGraphData, DrawContextInfo } from '../typeexports';

@Component({
    components: {
        HiDpiCanvas
    }
})
export default class LoadInfoDisplay extends Vue {
    @Prop({}) graphData!: HangTimerGraphData;
    @Prop({ default: true }) showImbalance!: boolean;
    maxWeight: number;
    colorMaxDiff = 0.1;
    ul: UpdateLimiter<number> = new UpdateLimiter<number>();
    hidpiCanvas!: HiDpiCanvas;

    constructor() {
        super();
        this.maxWeight = 1;
    }

    mounted() {
        this.adjustMax();
        this.hidpiCanvas = this.$refs.hidpiCanvas as HiDpiCanvas;
        this.updateCombined(0);
    }

    adjustMax() {
        const max = Math.max(
            this.graphData.leftWeight, 
            this.graphData.rightWeight, 
            this.graphData.currentWeight, 
            this.graphData.trainWeight, 
            this.graphData.activationWeight
        );
        if(max >= this.maxWeight) {
            this.maxWeight = max * 1.05;
        }
    }    
    
    @Watch("graphData.currentWeight")
    onCombined() {
        this.ul.setValue(this.graphData.currentWeight, this.updateCombined);
    }     

    updateCombined(val: number) {
        const dc = this.hidpiCanvas.getDrawContext()
        this.drawBars(dc);
    }

    drawBars(dc: DrawContextInfo) {
        if(dc.ctx) {
            const ctx = dc.ctx;
            ctx.clearRect(0, 0, dc.width, dc.height);
            ctx.fillStyle = "lightgray"
            ctx.fillRect(0, 0, dc.width, dc.height)
            ctx.fillStyle = "#63b916"
            const combinedWidth = dc.width * clamp(this.graphData.currentWeight / this.maxWeight, 0, 1);
            ctx.fillRect(0, 0, Math.round(combinedWidth), dc.height);
            if(this.showImbalance) {
                const weightDiffColor = this.weightDiffOverlayColor();
                ctx.fillStyle = weightDiffColor;
                const leftWidth = dc.width * clamp(this.graphData.leftWeight / this.maxWeight, 0, 1);
                const rightWidth = dc.width * clamp(this.graphData.rightWeight / this.maxWeight, 0, 1);
                ctx.fillRect(0, 0, Math.round(leftWidth), Math.round(dc.height / 2));
                ctx.fillRect(0, Math.round(dc.height / 2), Math.round(rightWidth), Math.round(dc.height));
            }
        }
    }

    leftRightDiff() {
        if(this.graphData.currentWeight === 0) {
            return 0;
        }
        const left = round(this.graphData.leftWeight, 0.1);
        const right = round(this.graphData.rightWeight, 0.1);
        const combined = (left + right + 0.000001);
        const diff = Math.abs(left - right);
        const diffPer = clamp(diff / combined, 0, 1);
        return diffPer;
    }

    weightDiffOverlayColor() {
        const diffPer = clamp(this.leftRightDiff() * (1 / this.colorMaxDiff), 0, 1);
        return HexToRGB("#F44336", diffPer);
    }

    weightDiff() {
        const diff = this.leftRightDiff() * 100;
        //diff = lerp(, 0, 100)
        return `${diff.toFixed(2)}%`;
    }

    combinedWeight() {
        return `${round(this.graphData.currentWeight, 0.1).toFixed(2)} kg`;
    }

    styleTrain() {
        //this.adjustMax();
        const value = clamp(this.graphData.trainWeight / this.maxWeight, 0, 1);
        return `width: ${100 * value}%;`;
    }
    styleActivation() {
        //this.adjustMax();
        const value = clamp(this.graphData.activationWeight / this.maxWeight, 0, 1);
        return `width: ${100 * value}%;`;
    }
}
</script>

<style lang="scss" scoped>
.container {
    width: 95%;
    height: 100%;
    font-size: 0.8em;
    .top-text {
        width: 100%;
        height: 17px; 
        position: relative;
        z-index: 1;
        .diff {
            position: absolute;
            left: 0;
            top: 0;
        }
        .activation {
            position: absolute;
            left: 0;
            top: 0;
            text-align: right;
            border-right: 1px solid gray;
            box-sizing: border-box;
            height: 42px;
            padding-right: 3px;
        }
    }
    .bar {
        position: relative;
        width: 100%;
        height: 25px;
        .bg {
            position: absolute;
            background-color: lightgray;
            width: 100%;
            height: 100%;
        }
        .active-combined {
            position: absolute;
            background-color: #63b916;
            width: 70%;
            height: 100%;
        }
        .active-left {
            position: absolute;
            background-color: #ed2828;
            width: 50%;
            height: 50%;
            top: 0;
            left: 0;
        }
        .active-right {
            position: absolute;
            background-color: #ed2828;
            width: 50%;
            height: 50%;
            top: 50%;
            left: 0;
        }
    }
    .bottom-text {
        width: 100%;
        height: 17px; 
        position: relative;
        z-index: 1;
        .current {
            position: absolute;
            left: 0;
            bottom: 0;         
        }
        .user {
            position: absolute;
            left: 0;
            top: 0;
            text-align: right;
            border-right: 1px solid gray;
            box-sizing: border-box;
            height: 43px;
            margin-top: -25px;
            .positoner {
                position: absolute;
                bottom: 0;
                right: 3px;
            }
        }        
    }
}
</style>