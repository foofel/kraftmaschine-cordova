<template>
    <div class="base" ref="base">
        <canvas id="canvas" width="100px" height="100px" ref="canvas" />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { DrawContextInfo } from './typeexports';

type DrawFunctionType = (ctx:DrawContextInfo) => void;

@Component({
    components: {
    }
})
export default class HiDpiCanvas extends Vue {
    dprFixer!:Function;
    cachedWidth:number = 0;
    cachedHeight:number = 0;
    @Prop({default: null}) drawFunction!:DrawFunctionType|null;

    constructor() {
        super();
    }
    mounted() {
        const makeDpxFixer = () => {
            let size = { x:0, y:0 };
            let lastRatio = 1;
            return () => {
                let elems = this.getCanvasElements();
                if(elems.ctx) {
                    var ratio = this.getDevicePixelRatio();
                    if(elems.canvas.width === size.x && elems.canvas.height === size.y && ratio === lastRatio) {
                        return;
                    }             
                    let oldWidth = elems.canvas.width;
                    let oldHeight = elems.canvas.height;
                    elems.canvas.width = oldWidth * ratio;
                    elems.canvas.height = oldHeight * ratio;
                    elems.canvas.style.width = oldWidth + "px";
                    elems.canvas.style.height = oldHeight + "px";
                    elems.ctx!.setTransform(ratio, 0, 0, ratio, 0, 0);
                    size.x = elems.canvas.width;
                    size.y = elems.canvas.height;
                    lastRatio = ratio
                }
            }
        }        
        this.dprFixer = makeDpxFixer();
        this.adjustCanvasToBaseElemSize();
        window.addEventListener("resize", this.onResize);
    }

    beforeDestroy() {
        window.addEventListener("resize", this.onResize)
    }

    onResize() {
        this.adjustCanvasToBaseElemSize();
        if(this.drawFunction) {
            let dc = this.getDrawContext();
            if(dc.ctx) {
                dc.ctx.save();
                this.drawFunction(dc);
                dc.ctx.restore();
            }
        }
    }    

    getDevicePixelRatio() {
        let elems = this.getCanvasElements()
        if(elems.ctx) {
            let ctx = elems.ctx as any;
            let dpr = window.devicePixelRatio || 1;
            let bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
            return dpr / bsr;
        } else {
            console.log("unable to get device pixel ratio")
            return 1;
        }
    };

    adjustCanvasToBaseElemSize() {
        let elems = this.getCanvasElements()
        if(elems.canvas && elems.base) {
            elems.canvas.width = elems.base.clientWidth;
            elems.canvas.height = elems.base.clientHeight;
            this.dprFixer();   
            let width = elems.canvas.style.width || ""+elems.canvas.width;
            let height = elems.canvas.style.height || ""+elems.canvas.height;
            this.cachedWidth = parseFloat(width)
            this.cachedHeight = parseFloat(height);
        }
    }    

    getCanvasElements() {
        let base = this.$refs.base as HTMLElement;
        let canvas = this.$refs.canvas as HTMLCanvasElement;
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

    getDrawContext() {
        let elems = this.getCanvasElements()
        return {
            base: elems.base,
            canvas: elems.canvas,
            ctx: elems.ctx,
            width: this.cachedWidth,
            height: this.cachedHeight
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