<template>
    <div class="center-in-columns fill-parent">
        <div ref="container" class="fill-parent container">
            <div class="fill-parent elem" ref="uplot"></div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { ChartColors } from '../typeexports';
import { sprintf } from "sprintf-js";
import uPlot from 'uplot';
import { 
    Options as upOptions, 
    Hooks as upHooks,
    AlignedData as upAlignedData
} from 'uplot';
import 'uplot/dist/uPlot.min.css'

type BaseHookType = {
    opts: (self: uPlot, opts: upOptions) => void;
    hooks: upHooks.Arrays;
};
type PeaksPluginType = { update: (data: Array<{x: number; c: string}>) => void } & BaseHookType;
function verticalLinePlugin(initData: Array<{x: number; c: string}>): PeaksPluginType {

    let lineData = initData;
    let plot: uPlot|null = null;

    function init(u: uPlot, opts: upOptions, data: upAlignedData) {
        plot = u;
    }

    function setData(lines: Array<{x: number; c: string}>) {
        lineData = lines;
        if(plot) {
            //plot.redraw();
        }
    }

    function drawStats(u: uPlot): void {
        const { ctx } = u;
        const { left, top, width, height } = u.bbox;

        ctx.save();
        ctx.lineWidth = 1;
        for(const peak of lineData) {
            const xPos = Math.round(u.valToPos(peak.x, "x", true));
            ctx.strokeStyle = peak.c;
            ctx.beginPath();
            ctx.moveTo(xPos, top);
            ctx.lineTo(xPos, top + height);
            ctx.closePath();
            ctx.stroke();
        }
        ctx.restore();
    }

    return {
        opts: (self: uPlot, opts: upOptions) => {},
        update: setData,
        hooks: {
            init: [init],
            draw: [drawStats]
        }
    };
}
function hideLegendPlugin(): BaseHookType {
    function init(u: uPlot, opts: upOptions, data: upAlignedData) {
        const legendEl: HTMLElement|null = u.root.querySelector(".legend");
        if(legendEl) {
            legendEl.style.display = 'none';
        }
    }
    return {
        opts: (self: uPlot, opts: upOptions) => {},
        hooks: {
            init: [init]
        }
    };    
}

@Component({
    components: {
    }
})
export default class BenchmarkGraph extends Vue {
    plot: uPlot|null = null;
    peaksPlugin: PeaksPluginType;
    plotElem: HTMLElement|null = null;
    constructor() {
        super();
        this.peaksPlugin = verticalLinePlugin([]);
    }

    getSize() {
        if(this.plotElem) {
            return {
                width: this.plotElem.clientWidth,
                height: this.plotElem.clientHeight - 25
            }
        }
        return { width: 100, height: 100 };
    }

    mounted() {
            //let container = this.$refs.container as HTMLElement;
            this.plotElem = this.$refs.uplot as HTMLElement;
            const opts: upOptions = {
                //width: this.plotElem.clientWidth,
                //height: this.plotElem.clientHeight - 25,
                ...this.getSize(),
                //title: "Months",
                //tzDate: (ts:any) => uPlot.tzDate(new Date(ts * 1e3), 'Etc/UTC'),
                series: [{
                        label: "Time",
                        value: (u: uPlot, v: number) => v == null ? "-" : v.toFixed(2) + "s"
                    }, {
                        label: "Weig.",
                        stroke: ChartColors.red,
                        width: 1,
                        scale: "weight",
                        value: (u: uPlot, v: number) => v == null ? "-" : v.toFixed(2) + "kg"
                    }, {
                        label: "Grad.",
                        stroke: ChartColors.blue,
                        width: 1,
                        scale: "derivate",
                        value: (u: uPlot, v: number) => v == null ? "-" : v.toFixed(2) + "kg/s"
                    }
                ],
                scales: {
                    x: {
                        min: 0,
                        max: 10,
                        time: false
                    },
                    y: {
                        min: 0,
                        max: 10
                    }
                },
                axes: [
                    {
                        values: (u: uPlot, vals: number[], space: number) => vals.map(v => +v.toFixed(2) + "s")
                    },{
                        scale: "weight",
                        label: "kg",
                        labelSize: 20,
                        values: (u: uPlot, vals: number[], space: number) => vals.map(v => sprintf("%.2f", v))
                    },{
                        side: 1,
                        scale: "derivate",
                        grid: { show: false },
                        label: "kg/s",
                        labelSize: 20,
                        values: (u: uPlot, vals: number[], space: number) => vals.map(v => sprintf("%.2f", v))
                    }
                ],
                plugins: [
                    this.peaksPlugin
                    //hideLegendPlugin()
                ]
            };
            const data: upAlignedData = [[0, 1],[0, 1],[0, 1],[0, 1]];
            this.plot = new uPlot(opts, data, this.plotElem); // eslint-disable-line new-cap
            window.addEventListener("resize", this.onResize);
    }

    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    }

    setData(time: Array<number>, weight: Array<number>, gradient: Array<number>, lines: Array<{x: number; c: string}>) {
        if(this.plot) {
            const data: upAlignedData = [
                time,
                weight,
                gradient
            ];
            this.peaksPlugin.update(lines);
            this.plot.setData(data, true);
        }
    }

    getGraphImage() {
        if(this.plot){
            return this.plot.ctx.canvas.toDataURL();
        }
        return "";
    }

    resizeGraph() {
        if(this.plot) {
            this.plot.setSize(this.getSize())
        }
    }

    onResize = () => {
        this.resizeGraph();
    }
}
</script>

<style lang="scss" scoped>
.container {
    width: 100%;
    height: 100%;
    //padding: 25px;
    //padding-right: 5px;
    //padding-left: 5px;
    padding-bottom: 5px;
}
.elem {
    //border: 1px solid lightgray;
}
</style>