<template>
    <div class="goal-root">
        <div class="canvas-container">
            <div class="info fill-parent">
                <ProgressClockCanvas                     
                    :rep="clockNextNormalized" 
                    :set="clockSelfNormalized" 
                    :overall="clockOverallNormalized"/>
            </div>
            <div class="info fill-parent">
                <HiDpiCanvas cl ref="hidpiCanvas" :drawFunction="onRedraw" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import HiDpiCanvas from '../HiDpiCanvas.vue'
import { DrawContextInfo, BenchmarkVisualHighscoreEntry, BenchmarkVisualModel } from '../typeexports';
import ProgressClockCanvas from '../hangboardtimer/ProgressClockCanvas.vue'
import { clamp } from '../../core/math';
import { UpdateLimiter, findNextHighscoreUser } from '../../core/util';
import cloneDeep from 'lodash/cloneDeep';
import { ConfigFile } from '@/core/localstore';

@Component({
    components: {
        HiDpiCanvas,
        ProgressClockCanvas
    }
})
export default class GoalClock extends Vue {

    hidpiCanvas!:HiDpiCanvas;
    @Prop({default: 0}) currentTime:number = 0;
    @Prop({default: () => ({})}) highscoreData!:BenchmarkVisualModel;
    highscore2:Array<BenchmarkVisualHighscoreEntry>|undefined = undefined;
    clockRemainingTime:string = "";
    clockNextPlace:string = "";
    clockNextName:string = "";
    clockNextNormalized:number = 0;
    clockSelfNormalized:number = 0;
    clockOverallNormalized:number = 0;
    selfBest:number = 0;

    constructor(){
        super();
    }

    mounted() {
        this.hidpiCanvas = this.$refs.hidpiCanvas as HiDpiCanvas;
        let dc = this.hidpiCanvas.getDrawContext()
        this.drawClockInfo(dc);
        this.highscore2 = cloneDeep(this.highscoreData.highscore)
        this.updateDataAndRedraw();
        let cfg = this.$root.$data.cfg as ConfigFile;
        for(let i = this.highscore2!.length; i <= 0; i--) {
            let entry = this.highscore2[i];
            if(entry.id === cfg.id) {
                this.selfBest = entry.time;
            }
        }
    }

    drawClockInfo(dc:DrawContextInfo) {
        if(dc.ctx) {
            let ctx = dc.ctx;
            ctx.clearRect(0, 0, dc.width, dc.height);
            let center = {x: dc.width / 2, y: dc.height / 2 }
            ctx.font = "36px Roboto"
            ctx.fillStyle = "black";
            ctx.textAlign="center"; 
            ctx.textBaseline = "middle";     
            ctx.fillText(`${this.clockRemainingTime}s`, center.x, center.y)
            ctx.font = "18px Roboto"
            ctx.fillText(`Next: ${this.clockNextPlace}`, center.x, center.y - 50)
            ctx.fillText(`Name: ${this.clockNextName}`, center.x, center.y + 50)
        }
    }

    @Watch("currentTime")
    onBarTimeChanged(_old:number, _new:number) {
        this.updateDataAndRedraw();
    }

    updateDataAndRedraw() {
        let pn = findNextHighscoreUser(this.highscore2!, this.currentTime);
        if(!pn.next && !pn.prev) {
            this.clockRemainingTime = "-";
        } else if(pn.next) {
            let remain = pn.next.time - this.currentTime;
            this.clockRemainingTime = remain.toFixed(2);
        }
        else if(pn.prev) {
            let overshot = this.currentTime - pn.prev.time;
            this.clockRemainingTime = `⇪ ${overshot.toFixed(2)}`;
        }
        this.clockNextPlace = pn.next !== null ? `${pn.next.rank}` : "-";
        this.clockNextName = pn.next !== null ? pn.next.name : "-";
        this.clockSelfNormalized = this.selfBest === 0 ? 1 : clamp(this.selfBest / this.currentTime, 0, 1);
        this.clockOverallNormalized = this.highscore2!.length === 0 ? 1 : clamp(this.currentTime / this.highscore2![this.highscore2!.length - 1].time, 0, 1);
        let length = pn.next && pn.prev ? pn.next.time - pn.prev.time : pn.next ? pn.next.time : 1;
        let diff = pn.next ? pn.next.time - this.currentTime : 1;
        this.clockNextNormalized = 1 - (diff / length);
        let dc = this.hidpiCanvas.getDrawContext()
        this.drawClockInfo(dc);
    }

    onRedraw(dc:DrawContextInfo) {
        this.drawClockInfo(dc);
    }
}
</script>

<style lang="scss" scoped>
.goal-root {
    width: 100%;
    height: 100%;    
    .canvas-container {
        position: relative;
        width: 100%;
        height: 100%;
        .info {
            position:absolute;
            left: 0;
            top: 0;
            .next{}
            .time{
                font-size: 2em;
                margin: 10px;
            }
            .name {}
        }
    }
}
</style>