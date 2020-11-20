<template>
    <div class="chart-container fill-parent">
        <svg class="grid">
            <text line v-for="(line, index) in drawData.svgLines" v-bind:key="'t'+index" class="xlabels"
                :x="line.x1 - 17" 
                :y="line.y1 + 3">
                {{line.value.toFixed(1)}}
            </text>
            <line v-for="(line, index) in drawData.svgLines" v-bind:key="'l'+index" class="gridline"
            :x1="line.x1" 
            :y1="line.y1"
            :x2="line.x2"
            :y2="line.y2"
             />
        </svg>
        <div class="xtimelabel">Time (s)</div>
        <div class="ylabels">
            <div class="ylabel center-in-rows" v-for="(_, index) in globalRepBars" v-bind:key="index" :style="getDynamicBarStyle(index)">
                {{index + 1}}
            </div>
            <div class="yrep">Rep</div>
        </div>
        <div class="bar-container"  ref="container">
            <div class="fullbar" v-for="(_, index) in globalRepBars" v-bind:key="index" :style="getDynamicBarStyle(index)">
                <div class="barpart-passive" :style="getDynamicBarPartStyle(index, 'passive')"></div>
                <div class="barpart-inactive" :style="getDynamicBarPartStyle(index, 'inactive')"></div>
                <div class="barpart-active" :style="getDynamicBarPartStyle(index, 'active')"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
//import { ChartOptions, ChartData } from 'chart.js';

interface DrawDataInterface {
    labels:Array<string>;
    data:Array<BarDataInterface>;
    styles:Array<BarStylesInterface>;
    svgLines:Array<SvgGridLine>;
    maxTime:number;
    barWidth:0,
    spacing:0
}

interface BarDataInterface {
    active:number;
    inactive:number;
    passive:number;
}

interface BarStylesInterface {
    posx:number;
    posy:number;
    width:number;
    height:string;
    color:string;
}

interface SvgGridLine {
    value:number;
    x1:number;
    y1:number;
    x2:number;
    y2:number;
    style:string;
}

@Component({})
export default class CustomBarChart extends Vue {
    @Prop({}) data!:any;
    @Prop({}) options!:any;
    barSpaceFactor:number = 0.65;
    startEndMargin:number = 0;
    drawData:DrawDataInterface;
    barContainerBB:DOMRect = new DOMRect();
    globalRepBars:Array<number> = [];
    constructor() {
        super();
        this.drawData = {
            labels:[],
            data: [],
            styles: [],
            svgLines: [],
            maxTime:0,
            barWidth:0,
            spacing:0
        }
    }

    mounted() {
        this.updateBB();
        this.updateBars();
        this.rebuildBars();
        window.addEventListener('resize', this.onResize)
    }

    rebuildBars() {
        // avoid layout shit the whole bars if the data changes
        // if we bind directly to the bar data that changes if the props change we will always
        // relayout the bars but they always stay the same        
        this.globalRepBars = Array.from({length: this.drawData.data.length}, (_, k) => k); 
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }

    updateBB() {
        let elem = this.$refs.container as HTMLElement;
        this.barContainerBB = elem.getBoundingClientRect() as DOMRect;
    }

    onResize() {
        this.updateBB();
        this.updateBars();
        this.rebuildBars();
    }

    updateBars() {
        let barCount = this.data.labels!.length;
        let data:Array<BarDataInterface> = [];
        for (let i = 0; i < this.data.labels!.length; i++) {
            data[i] = {
                active: this.data.datasets[0][i] as number,
                inactive: this.data.datasets[1][i] as number,
                passive: this.data.datasets[2][i] as number
            }
        }
        let maxTime = this.options.max;
        let styles:Array<BarStylesInterface> = [];
        /*let colors = ["rgba(0, 255, 0, 0.7)", "rgba(255, 0, 0, 0.7)", "rgba(200, 200, 200, 0.7)"];
        let keyLookup = ["active", "inactive", "passive"];
        let fullBarWidth = this.barContainerBB.width / data.length;
        let barWidth = this.barContainerBB.width / data.length * this.barSpaceFactor
        let spacingCorrection = (fullBarWidth - barWidth) / data.length;        
        for (let i = 0; i < data.length; i++) {
            let posx = (this.barContainerBB.width / data.length + spacingCorrection) * i;
            let startY = 0;
            for(let k = 0; k < 3; k++) {
                let key = keyLookup[k];
                let height = (data[i] as any)[key] / maxTime;
                styles[i] = {
                    posx: posx,
                    width: barWidth,
                    posy: startY,
                    height: `${height*80}%`,
                    color: colors[k]
                }
                startY += height;
            }
        }*/
        let svgLines:Array<SvgGridLine> = [];
        let lines = Math.ceil(this.barContainerBB.height / 20);
        let lineStep = this.barContainerBB.height / lines;
        let timeStep = maxTime / lines;
        for(let i = 0; i <= lines; i++) {
            let y = lineStep * i;
            //y = Math.round(y * 2) / 2;
            svgLines[i] = {
                value: maxTime - timeStep * i,
                x1: 35,
                y1: y,
                x2: this.barContainerBB.width + 45,
                y2: y,
                style: "stroke:rgb(255,0,0)"
            }
        }
        this.drawData = {
            labels: this.data.labels as string[],
            data: data,
            styles: styles,
            maxTime: maxTime,
            svgLines: svgLines,
            barWidth:0,
            spacing:0
        }
    }

    getDynamicBarPartStyle<BarDataInterface, K extends keyof BarDataInterface>(index:number, partKey:K) {
        let height = (this.drawData.data[index] as any)[partKey] / this.drawData.maxTime;
        return {
            height: `${height * 100}%`
        }
    }

    getDynamicBarStyle(index:number) {
        let fullBarWidth = this.barContainerBB.width / this.drawData.data.length;
        let barWidth = this.barContainerBB.width / this.drawData.data.length * this.barSpaceFactor
        let spacingCorrection = (fullBarWidth - barWidth) / this.drawData.data.length;
        let offset = (this.barContainerBB.width / this.drawData.data.length + spacingCorrection) * index;
        return {
            width: `${barWidth}px`,
            left: `${offset}px`
        }
    }    

    @Watch("data.labels", {"deep": true}) 
    onDataUpdate() {
        this.updateBars();
    }
}
</script>

<style lang="scss" scoped>

.chart-container {
    position: relative;
}
.grid {
    position: absolute;
    height: calc(100% - 30px);
    width: 100%;
    box-sizing: border-box;
    overflow: visible;
}
.gridline {
    stroke: rgb(200, 200, 200);
    stroke-width: 1px;
}
.bar-container {
    position: absolute;
    right: 0px;
    width: calc(100% - 40px);
    height: calc(100% - 30px);
}
.xtimelabel {
    position: absolute;
    top: calc(50% - 30px);
    left: 0px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 0.7em;
    color: rgb(90, 90, 90);
}
.xlabels {
    font-size: 0.65em;
    fill: rgb(90, 90, 90);
}
.ylabels {
    //border: 1px solid blue;
    position: absolute;
    right: 0px;
    bottom: 0px;
    width: calc(100% - 40px);
    height: 25px;
    color: rgb(90, 90, 90);
}
.ylabel {
    //border: 1px solid green;
    position: absolute;
    top: 0px;
    left: 0px;
    font-size: 0.65em;
    writing-mode: vertical-rl;
    vertical-align: middle;
    transform: rotate(180deg);
}
.yrep {
    position: absolute;
    left: 50%;
    bottom: 0px;
    font-size: 0.7em;
}
.fullbar
 {
    position: absolute;
    bottom: 0px;
    left: 0px;
    height: 100%;
}
.barpart-active {
    width: 100%;
    background-color: #63b916;
    box-sizing: border-box;
}
.barpart-inactive {
    width: 100%;
    background-color: #F44336;
}
.barpart-passive {
    width: 100%;
    background-color: rgb(220, 220, 220);
}
</style>