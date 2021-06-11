<template>
    <div class="w-full h-full" ref="plotContainer">
        <div class="w-full h-full" ref="uplot"></div>
    </div>
</template>

<script>
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css'

// intiData: Array<{x: number; c: string}>
function verticalLinesPlugin(initData) {

    let lineData = initData;
    let plot = null;

    function init(uplot, opts, data) {
        plot = uplot;
    }

    function setData(lines) {
        lineData = lines;
        if(plot) {
            //plot.redraw();
        }
    }

    function drawStats(u) {
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
        opts: (self, opts) => {},
        update: setData,
        hooks: {
            init: [init],
            draw: [drawStats]
        }
    };
}

export default {
    name: "UplotGraph",
    data: function() {
        return {
            plot: null,
            verticalLinesPlugin: null
        };
    },
    created() {
        this.verticalLinesPlugin = verticalLinesPlugin([]);
    },
    mounted() {
        window.addEventListener("resize", this.onResize);        
    },
    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    },
    methods: {
        init(opts, data) {
            let selfOpts = {
                ...this.getSize(),
                plugins: [
                    this.verticalLinesPlugin,
                    //hideLegendPlugin()
                ]
            }
            selfOpts = { ...selfOpts, ...opts };
            this.plot = new uPlot(selfOpts, data, this.$refs.uplot);      
        },
        setOpts(opts) {
        },
        setData(data) {
            if(this.plot) {
                this.plot.setData(data, true);
            }
        },
        setLines(lines) {
            if(this.plot) {
                this.verticalLinesPlugin.update(lines);
            }
        },
        onResize() {
            const rz = () => {
                if(this.plot) {
                    this.plot.setSize(this.getSize());
                }
            };
            rz();
        },
        getGraphImage() {
            if(this.plot){
                return this.plot.ctx.canvas.toDataURL();
            }
            return "";
        },
        getSize() {
            if(this.$refs.uplot) {
                return {
                    width: this.$refs.uplot.clientWidth,
                    // 35 is legend size size of the legend, its not included in the size calculation
                    height: this.$refs.uplot.clientHeight
                }
            }
            return { width: 300, height: 300 };
        }        
    },
	computed: {}
};
</script>

<style lang="scss" scoped>
</style>