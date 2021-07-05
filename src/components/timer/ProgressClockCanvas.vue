<template>
    <div class="w-full h-full" ref="base">
        <canvas id="canvas" width="100px" height="100px" ref="canvas" style="background-color: white;" />
    </div>
</template>

<script>
export default {
    name: "ProgressClockCanvas",
    mixins: [],
    components: {},
    //props: ['clockData'],
    data() {
        return {
            // radius in outer %
            // width in ...            
            clockData: [
                { foreground: "black", background: "lightgray", fill: 0.5, radius: 1, width: 1 },
                { foreground: "black", background: "lightgray", fill: 0.5, radius: 0.95, width: 1 },
                { foreground: "green", background: "lightgray", fill: 0.2, radius: 0.9, width: 4 },
                { foreground: "red", background: "white", fill: 0.5, radius: 0.82, width: 1 }
            ],
            dprFixer: null
        };
    },
    mounted() {
        this.dprFixer = this.makeDprFixer();
        this.fixCanvasSize(); 
        this.repaint();
        window.addEventListener("resize", this.onResize);
    },
    beforeDestroy() {
        window.addEventListener("resize", this.onResize)
    },    
    methods: {
        fixCanvasSize() {
            const elems = this.htmlElems()
            if(elems.base && elems.canvas) {
                elems.canvas.width = elems.base.clientWidth;
                elems.canvas.height = elems.base.clientHeight;          
            }
        },
        updateData(clockData) {
            this.clockData = clockData;
            this.repaint();
        },
        repaint() {
            const elems = this.htmlElems()
            if(elems.canvas && elems.ctx) {
                const ctx = elems.ctx;
                const width = elems.canvas.style.width || ""+elems.canvas.width;
                const height = elems.canvas.style.height || ""+elems.canvas.height;
                this.drawNiceClock(ctx, parseFloat(width), parseFloat(height));
            }
        },        
        drawNiceClock(ctx, width, height) {
            this.dprFixer();
            ctx.clearRect(0, 0, width, height);
            const drawData = []
            for(let i = 0; i < this.clockData.length; i++){
                const o = this.clockData[i];
                //const u = this.$props.myData[i] || {};
                drawData.push(o);
            }
            this.drawClock(ctx, width, height, drawData);
        },
        drawClock(ctx, width, height, clockData) {
            for(const c of clockData) {
                this.drawCircle(ctx, c.background, c.width, c.radius, width, height, 1);
                this.drawCircle(ctx, c.foreground, c.width, c.radius, width, height, c.fill);
            }
        },
        drawCircle(ctx, color, lineWidth, size, width, height, fill) {
            const center = { 
                x: width / 2, 
                y: height / 2
            };
            const lineWidthPx = width / 100 * lineWidth;
            const sizePx = (width / 2) * size;
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidthPx;
            const radius = Math.round(sizePx - lineWidthPx / 2 - 2);
            const start = -Math.PI/2;
            const end = -Math.PI/2 + (fill * Math.PI * 2);
            ctx.arc(Math.round(center.x), Math.round(center.y), radius, start, end);
            ctx.stroke(); 
        },
        onResize() {
            this.fixCanvasSize();
            this.repaint();
        },
        makeDprFixer() {
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
                    elems.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
                    size.x = elems.canvas.width;
                    size.y = elems.canvas.height;   
                }
            }
        },
        getDevicePixelRatio() {
            const elems = this.htmlElems()
            if(elems.ctx) {
                const ctx = elems.ctx;
                const dpr = window.devicePixelRatio || 1;
                const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
                return dpr / bsr;
            } else {
                console.log("unable to get device pixel ratio")
                return 1;
            }
        },
        htmlElems() {
            const base = this.$refs.base;
            const canvas = this.$refs.canvas;
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
    },
	computed: {},
    watch: {
        /*myData: {
            deep: true,
            handler(newVal, oldVal) {
                this.repaint();
            }
        }*/
    }
};
</script>