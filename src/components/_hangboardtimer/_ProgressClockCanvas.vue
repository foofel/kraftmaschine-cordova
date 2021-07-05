<template>
    <div class="base" ref="base">
        <canvas id="canvas" width="100px" height="100px" ref="canvas" style="background-color: white;" />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

interface CanvasFixer {
    fix: () => void;
    stop: () => void;
}

interface ClockData {
    c: string;
    p: number;
}

@Component({
    components: {
    }
})
export default class ProgressClockCanvas extends Vue {
    dprFixer!: () => void;
    //offscreenCanvas:OffscreenCanvas;
    @Prop({default: 0.5}) rep!: number;
    @Prop({default: 0.5}) set!: number;
    @Prop({default: 0.5}) overall!: number;
    @Prop({default: "#149BB5"}) repColor!: string;
    clockData: Array<ClockData> = [
        { c: "black", p: 0 },
        { c: "black", p: 0 },
        { c: "black", p: 0 }
    ]
    constructor() {
        super();
        //this.offscreenCanvas = new OffscreenCanvas(0, 0);
    }
    mounted() {
        this.dprFixer = this.getDprFixer();
        this.fixCanvasSize();
        this.updateCanvas();
        window.addEventListener("resize", this.onResize);
    }

    beforeDestroy() {
        window.addEventListener("resize", this.onResize)
    }

    drawNiceClock(ctx: CanvasRenderingContext2D, width: number, height: number) {
        /*let offCtx = this.offscreenCanvas.getContext("2d");
        if(offCtx) {
            let clockDataGray = [ { c: "lightgray", p: 1 }, { c: "lightgray", p: 1 }, { c: "lightgray", p: 1 } ];
            this.drawClock(offCtx, this.offscreenCanvas.width, this.offscreenCanvas.height, clockDataGray);
            let clockDataInit = [ { c: "#149BB5", p: this.rep }, { c: "black", p: this.set }, { c: "black", p: this.overall } ];
            this.drawClock(offCtx, this.offscreenCanvas.width, this.offscreenCanvas.height, clockDataInit);
        }
        this.dprFixer();
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(this.offscreenCanvas, 0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height, 0, 0, width, height);*/
        this.dprFixer();
        ctx.clearRect(0, 0, width, height);
        const clockDataGray = [ { c: "lightgray", p: 1 }, { c: "lightgray", p: 1 }, { c: "lightgray", p: 1 } ];
        this.drawClock(ctx, width, height, clockDataGray);
        const clockDataInit = [ { c: this.repColor, p: this.rep }, { c: "black", p: this.set }, { c: "black", p: this.overall } ];
        this.drawClock(ctx, width, height, clockDataInit);
    }

    drawClock(ctx: CanvasRenderingContext2D/*|OffscreenCanvasRenderingContext2D*/, width: number, height: number, clockData: Array<ClockData>) {
        const center = { x: width/2, y:height/2 };
        this.drawCircle(ctx, clockData[0].c, 4, 0.92, width, height, clockData[0].p);
        this.drawCircle(ctx, clockData[1].c, 1, 0.96, width, height, clockData[1].p);
        this.drawCircle(ctx, clockData[2].c, 1, 1, width, height, clockData[2].p);
    }

    drawCircle(ctx: CanvasRenderingContext2D/*|OffscreenCanvasRenderingContext2D*/, color: string, lineWidth: number, size: number, width: number, height: number, progress: number) {
        const center = { x: width/2, y:height/2 };
        const lineWidthPx = width / 100 * lineWidth;
        const sizePx = (width / 2) * size;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidthPx;
        ctx.arc(Math.round(center.x), Math.round(center.y), Math.round(sizePx - lineWidthPx / 2 - 2), -Math.PI/2, (progress * Math.PI * 2) -Math.PI/2)
        ctx.stroke(); 
    }

    arc(ctx: CanvasRenderingContext2D/*|OffscreenCanvasRenderingContext2D*/, x: number, y: number, radius: number, sa: number, ea: number) {
        const step = 0.01;
        let a = sa + step;
        ctx.moveTo(x + radius * Math.cos(sa), y + radius * Math.sin(sa));
        for(; a < ea; a+=step) {
            ctx.lineTo(x + radius * Math.cos(a), y + radius * Math.sin(a));
        }
    }    

    @Watch("rep")
    updateCanvas() {
        const elems = this.htmlElems()
        if(elems.canvas && elems.ctx) {
            const ctx = elems.ctx;
            const width = elems.canvas.style.width || ""+elems.canvas.width;
            const height = elems.canvas.style.height || ""+elems.canvas.height;
            this.drawNiceClock(ctx, parseFloat(width), parseFloat(height));
        }
    }

    onResize() {
        this.fixCanvasSize();
        this.updateCanvas();
    }    

    getDprFixer() {
        const size = { x:0, y:0 };
        return () => {
            const elems = this.htmlElems();
            if(elems.canvas && elems.ctx) {
                const ratio = this.getDevicePixelRatio();
                if(elems.canvas.width === size.x && elems.canvas.height === size.y) {
                    return;
                }             
                const oldWidth = elems.canvas.width;
                const oldHeight = elems.canvas.height;
                elems.canvas.width = oldWidth * ratio;
                elems.canvas.height = oldHeight * ratio;
                elems.canvas.style.width = oldWidth + "px";
                elems.canvas.style.height = oldHeight + "px";
                elems.ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
                size.x = elems.canvas.width;
                size.y = elems.canvas.height;   
            }
        }
    }

    getDevicePixelRatio() {
        const elems = this.htmlElems()
        if(elems.ctx) {
            const ctx = elems.ctx! as any;
            const dpr = window.devicePixelRatio || 1;
            const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
            return dpr / bsr;
        } else {
            console.log("unable to get device pixel ratio")
            return 1;
        }
    }

    fixCanvasSize() {
        const elems = this.htmlElems()
        if(elems.canvas && elems.base) {
            elems.canvas.width = elems.base.clientWidth;
            elems.canvas.height = elems.base.clientHeight;          
        }
        //var ratio = this.getDevicePixelRatio();
        //this.offscreenCanvas = new OffscreenCanvas(elems.base.clientWidth * 2 * ratio, elems.base.clientHeight * 2 * ratio);
        //this.dprFixer();
    }    

    htmlElems() {
        const base = this.$refs.base as HTMLElement;
        const canvas = this.$refs.canvas as HTMLCanvasElement;
        let ctx = null;
        if(canvas) {
            ctx = canvas.getContext('2d');
        }
        return {
            base: base,
            canvas: canvas,
            ctx: ctx
        }
    }

}
</script>

<style lang="scss" scoped>
.base {
    width: 100%;
    height: 100%;
}
</style>