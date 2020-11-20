<template>
    <div class="flex-container">
        <div class="percentage" :style="barStyle()"></div>
        <div class="center-in-rows fill-parent text">
            <div v-if="hasSlot" class="slot-container"><slot></slot></div>
            <div v-else>{{ progressText() }}</div>
        </div>
        <div class="border-box fill-parent" :style="border"></div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { sprintf } from "sprintf-js";

@Component
export default class ProgressBar extends Vue {
    //@Prop({default: 0.2}) initValue!:number;
    @Prop({default: 0}) value!:number;
    @Prop({default: 1}) max!:number;
    @Prop({default: "%d%%"}) initFormat!:string;
    @Prop({default: "%d%%"}) progressFormat!:string;
    @Prop({default: () => { return [ { to: 1, colora: "#4eb5e5", colorb: "#389ed5" } ] }}) bgColors!:Array<{to: number, colora: string, colorb: string}>;
    @Prop({default: ""}) border!:string;
    timerId:any = null;
    //value:number = 0;
    //max:number = 0;
    hasSlot:boolean = false;
    constructor() {
        super();
        //this.value = this.initValue || 0;
        //this.max = this.initMax || 1;
    }

    mounted() {     
        this.hasSlot = this.$slots.default != null;
    }

    /*setValue(value:number):void {
        this.value = value;
    }*/
    findColor(where:number) {
        let foundTo = Number.MAX_VALUE;
        let idx = 0;
        for(let key in this.bgColors) {
            let to = this.bgColors[key].to;
            if(to >= where && to < foundTo) {
                foundTo = to;
                idx = parseInt(key);
            }
        }
        return this.bgColors[idx];
    }
    barStyle() {
        let progress = Math.min(this.value / this.max, 1);
        let color = this.findColor(progress);
        return {
            width: progress * 100 + "%",
            background: `linear-gradient(to bottom, ${color.colora} 0%, ${color.colorb} 100%)`
        };
    }

    progressText() {
        let progressPercentage = Math.min(this.value / this.max * 100, 100);
        if(progressPercentage === 0) {
            if(this.timerId !== null) {
                return
            }
            return sprintf(this.initFormat, progressPercentage);
        } else {
            if(this.timerId !== null) {
                clearTimeout(this.timerId);
                this.timerId = null;
            }
            return sprintf(this.progressFormat, progressPercentage);
        }
    }
}
</script>

<style lang="scss" scoped>
.flex-container {
    position: relative;
    border-radius: 3px;
    background-color: rgb(243, 243, 243);
    //background-color: rgb(214, 214, 214);
    //background: linear-gradient(to bottom, rgb(214, 214, 214) 0%, rgb(238, 238, 238) 100%);
    //box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.percentage {
    position: absolute;
    border-radius: 3px;
    //background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%);
    height: 100%;
    flex-grow: 1;
    width: 50%;
}
.text {
    position: absolute;
    flex-grow: 1;
}
.slot-container {
    position: relative;
    width: 100%;
    height: 100%;    
}
.border-box {
    position: absolute;
    border: 1px solid lightgray;
    border-radius: 3px;
    box-sizing: border-box;
}
</style>