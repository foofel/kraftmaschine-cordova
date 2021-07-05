<template>
    <svg ref="svg" :width="width" :height="height">
        <!-- we use a clipping mask as an animated path object is kinda wobbly for the quadrant that is currently
        upddating, therefore we draw the whole thing not as path but as ellipse and mask if off -->
        <mask :id="progressMaskId">
            <rect x="0" y="0" width="100%" height="100%" fill="black" />
            <path 
                :d="completedPath" 
                stroke="white"
                :stroke-width="computedMaskWidth"
                fill="transparent"
            />            
        </mask>
        <!-- if we dont mask the background we get "more than nessesarry" blurry borders as the 
        transparent parts of both circles overlap -->
        <mask :id="bgMaskId">
            <rect x="0" y="0" width="100%" height="100%" fill="black" />
            <path 
                :d="remainingPath" 
                stroke="white"
                :stroke-width="computedMaskWidth"
                fill="transparent"
            />   
        </mask>
        <!-- the clip path allows to have an "inside" stroke and notz a mitter one that allows us to use percentage
        positioning and still have the whole stroke visible and not cut off at the borders -->
        <clipPath :id="clipId">
            <ellipse
                cx="50%" 
                cy="50%" 
                rx="50%" 
                ry="50%" 
                fill="transparent"
                :stroke="foreground"
                :stroke-width="computedLineWidth" 
            />
        </clipPath>
        <ellipse 
            cx="50%" 
            cy="50%" 
            rx="50%" 
            ry="50%" 
            fill="transparent" 
            :stroke="background" 
            :stroke-width="computedLineWidth"
            :clip-path="'url(#' + clipId + ')'"
            :mask="'url(#' + bgMaskId + ')'"
        />           
        <ellipse 
            cx="50%" 
            cy="50%" 
            rx="50%" 
            ry="50%" 
            fill="transparent" 
            :stroke="foreground" 
            :stroke-width="computedLineWidth"
            :clip-path="'url(#' + clipId + ')'"
            :mask="'url(#' + progressMaskId + ')'"
        />
    </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { makeid } from '@/core/util';

@Component({})
export default class CircleProgress extends Vue {
    @Prop({default: 0.8}) progress!: number;
    @Prop({default: "green"}) foreground!: number;
    @Prop({default: "lightgray"}) background!: number;
    @Prop({default: "2%"}) lineWidth!: string;
    @Prop({default: "300px"}) width!: number;
    @Prop({default: "300px"}) height!: number;
    completedPath = "";
    remainingPath = "";
    progressMaskId: string = makeid(8);
    bgMaskId: string = makeid(8);
    clipId: string= makeid(8);
    bb: DOMRect = new DOMRect(); //{ width: 0, height: 0, x: 0, y: 0 };
    constructor() {
        super();
    }

    mounted() {
        this.updateBB();
        this.updatePath(this.progress);
        window.addEventListener('resize', this.onResize)
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }

    onResize() {
        this.updateBB();
        this.updatePath(this.progress);
    }

    updateBB() {
        const svg = this.$refs.svg as SVGElement
        this.bb = svg.getBoundingClientRect() as DOMRect;
    }

    polarToCartesian(centerX: number, centerY: number, rx: number, ry: number, angleInDegrees: number) {
        const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
        return {
            x: centerX + (rx * Math.cos(angleInRadians)),
            y: centerY + (ry * Math.sin(angleInRadians))
        };
    }

    describeArc(x: number, y: number, rx: number, ry: number, startAngle: number, endAngle: number){
        const start = this.polarToCartesian(x, y, rx, ry, endAngle);
        const end = this.polarToCartesian(x, y, rx, ry, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        let d = [
            "M", start.x, start.y, 
            "A", rx, ry, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
        if(endAngle >= 359.99) {
            d += " Z";
        }
        return d;       
    }

    updatePath(progress: number) {
        progress = Math.max(Math.min(progress, 1), 0);
        const limit = 359.99;
        const arc = progress * limit;
        /*let svg = this.$refs.svg as SVGElement
        let bbox = svg.getBoundingClientRect();
        let width = bbox.right - bbox.left;
        let height = bbox.bottom - bbox.top;*/
        const x = this.bb.width / 2;
        const y = this.bb.height / 2;
        const rx = this.bb.width / 2;
        const ry = this.bb.height / 2;
        this.completedPath = this.describeArc(x, y, rx, ry, 0, arc);
        this.remainingPath = this.describeArc(x, y, rx, ry, arc, limit);
    }

    buildLineWidth(width: string, maskScale=0) {
        const match = width.match("(\\d+)(.*)");
        if(match && match.length === 1) {
            return parseInt(match[0]) * 2;
        } else if(match && match.length === 2) {
            const value = parseInt(match[0]);
            return `${value * 2 + value * maskScale}${match[1]}`;
        }
        return width;
    }

    get computedLineWidth() {
        return this.buildLineWidth(this.lineWidth, 0);
    }

    get computedMaskWidth() {
        return this.buildLineWidth(this.lineWidth, 0.05);
    }

    @Watch("progress")
    progressChanged(value: number, oldValue: number) {
        this.updatePath(value);
    }
}
</script>

<style lang="scss" scoped>
</style>