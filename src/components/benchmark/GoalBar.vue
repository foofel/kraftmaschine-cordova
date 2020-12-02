    <template>
    <div class="bar-root">
        <div class="canvas-container">
            <HiDpiCanvas ref="hidpiCanvas" :drawFunction="onRedraw" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import HiDpiCanvas from '../HiDpiCanvas.vue'
import { DrawContextInfo, BenchmarkVisualHighscoreEntry, BenchmarkVisualModel, BenchmarkVisualModelMarker } from '../typeexports';
import { clamp, map } from '../../core/math';
import cloneDeep from 'lodash/cloneDeep';
import { UpdateLimiter, findNextHighscoreUser } from '../../core/util';

interface PlateConfiguration {
    borderColor: string;
    bgColor: string;
    lineColor: string;
}

interface BarNameEntry extends BenchmarkVisualHighscoreEntry {
    displayName: string;
}

/*interface Marker {
    time: number;
    text:string;
    bgColor: string;
    borderColor: string;
    priority: number;
    drawName:boolean;
    draw:boolean;
}*/

@Component({
    components: {
        HiDpiCanvas
    }
})
export default class GoalBar extends Vue {

    hidpiCanvas!: HiDpiCanvas;
    @Prop({default: 0}) currentTime = 0;
    @Prop({default: () => ({})}) highscoreData!: BenchmarkVisualModel;
    names: Array<BarNameEntry>|undefined = undefined;

    barTimeLength = 10;
    barTimeZero = 0.5;
    counter = 0;
    markerYOffset = 5;
    borderPadding = 20;
    indicatorLineWidth = 1;
    namePlateHeight = 20;
    namePlateMaxWidth = 50;
    namePlateYOffset: number = this.markerYOffset + this.namePlateHeight + 5;    
    barYOffset: number = this.namePlateYOffset + this.namePlateHeight + 5;
    barHeight = 25;
    timesYOffset: number = this.barYOffset + this.barHeight + 5;
    timesPadding = 5;
    youYOffset: number = this.barYOffset + this.barHeight + 5;
    //updateLimiter:UpdateLimiter<number> = new UpdateLimiter();

    constructor(){
        super();
        this.names = [];
    }

    mounted() {
        this.hidpiCanvas = this.$refs.hidpiCanvas as HiDpiCanvas;
        this.names = cloneDeep(this.highscoreData.highscore).map(obj => ({ ...obj, displayName: '' }));
        const dc = this.hidpiCanvas.getDrawContext()
        this.fixNames(dc.ctx!, this.names, this.namePlateMaxWidth);
        this.drawGoalBar(dc);
    }

    drawGoalBar(dc: DrawContextInfo) {
        if(dc.ctx) {
            /*let names = [
                {name: "xXxHunterKILLAxXx", time: 3.7, place: 32, displayName: "" },
                {name: "hax0r@mp3", time: 4.9, place: 15, displayName: "" },
                {name: "MothaLoader1337", time: 7.2, place: 7, displayName: "" },
                {name: "sexyBoi19823", time: 9, place: 1 , displayName: ""},
                {name: "evil_knivel_hakka", time: 10, place: 32, displayName: "" }                
            ];
            let timeMarkers = [
                { time: 0, text: "0s", bgColor: "#fb4b4b", borderColor: "#fb4b4b", priority: 0, drawName: true, draw: true },
                { time: 3, text: "3s", bgColor: "#ffa879", borderColor: "#ffa879", priority: 0 , drawName: true, draw: true },
                { time: 5, text: "5s", bgColor: "#ffc163", borderColor: "#ffc163", priority: 0 , drawName: true, draw: true },
                { time: 7, text: "7s", bgColor: "rgb(255, 228, 72)", borderColor: "rgb(255, 228, 72)", priority: 0 , drawName: true, draw: true },
                { time: 10, text: "10s", bgColor: "#a9d845", borderColor: "#a9d845", priority: 0 , drawName: true, draw: true }
            ];
            let percentileMarkers = [];
            if(this.names && this.names.length > 10) {
                percentileMarkers.push({ time: 0, text: `<10%p`, bgColor: "#4eb5e5", borderColor: "#4eb5e5", priority: 0, drawName: false, draw: false  });
                let percentilePOI = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.99];
                //let lastTime = this.names[this.names.length - 1].time;
                for(let i = 0; i < percentilePOI.length; i++) {
                    let pidx = percentilePOI[i] * this.names.length;
                    pidx = Math.floor(pidx);
                    let time = this.names[pidx].time;
                    percentileMarkers.push({ time: time, text: `${(percentilePOI[i] * 100).toFixed(0)}p%`, bgColor: "#4eb5e5", borderColor: "#4eb5e5", priority: 0, drawName: false, draw: true  });
                }
            }*/
            const markers = [...this.highscoreData.timeMarkers, ...this.highscoreData.percentileMarkers]
            const ctx = dc.ctx;
            ctx.strokeStyle = "red";
            ctx.clearRect(0, 0, dc.width, dc.height);
            //ctx.strokeRect(0, 0, dc.width, dc.height);
            this.drawBar(dc, "#f2f2f2", "#bbbaba", 1);
            this.drawHighscoreEntries(dc, this.names!);
            this.drawMarkers(dc, markers)
            this.drawYou(dc, this.highscoreData.timeMarkers, this.highscoreData.percentileMarkers);
            this.drawBarTimes(dc);
        }
    }

    drawYou(dc: DrawContextInfo, staticMarkers: Array<BenchmarkVisualModelMarker>, percentileMarkers: Array<BenchmarkVisualModelMarker>) {
        //let pos = this.currentTime / this.maxVisbleTime * dc.width;
        const findSMarker = (markers: Array<BenchmarkVisualModelMarker>, time: number) => {
            for(let i = markers.length - 1; i >= 0; i--) {
                const current = markers[i];
                if(time >= current.time) {
                    return current;
                }
            }
            return markers[markers.length - 1];
        }
        const sm = findSMarker(staticMarkers, this.currentTime);
        const drawStyle = { borderColor:sm.borderColor, bgColor:sm.bgColor, lineColor:sm.bgColor };
        //this.drawPlate(dc, this.normalizedToBarPos(dc, this.barTimeZero), this.youYOffset + 18, 50, this.namePlateHeight, `${this.barTime.toFixed(2)}s / ${percText}`, 0, drawStyle);
        this.drawPlate(dc, this.normalizedToBarPos(dc, this.barTimeZero), this.youYOffset, 50, this.namePlateHeight, `you / ${this.currentTime.toFixed(2)}s`, -35, drawStyle);
    }    

    drawBarTimes(dc: DrawContextInfo) {
        const { start, end } = this.getBarStartEndTimes();
        this.drawTime(dc, this.borderPadding, this.timesYOffset, `${start.toFixed(1)}s`, "center", this.timesPadding);
        this.drawTime(dc, dc.width - this.borderPadding, this.timesYOffset, `${end.toFixed(1)}s`, "center", -this.timesPadding);
    }

    drawTime(dc: DrawContextInfo, x: number, y: number, text: string, align: "left"|"right"|"center", xoffset = 0) {
        const ctx = dc.ctx!;
        ctx.fillStyle = "black";
        ctx.font = "16px Roboto"; 
        ctx.textAlign=align; 
        ctx.textBaseline = "top";
        ctx.fillText(text, x + xoffset, y);
        ctx.lineWidth = this.indicatorLineWidth;
        ctx.fillStyle = "darkgray";
        /*let tm = ctx.measureText(text);
        let height = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x, y - 20);
        ctx.stroke();*/
    }

    drawMarkers(dc: DrawContextInfo, markers: Array<BenchmarkVisualModelMarker>) {
        const ctx = dc.ctx!;
        const  { start, end } = this.getBarStartEndTimes();
        markers = markers.sort((a, b) => a.priority - b.priority);
        markers = markers.sort((a, b) => {
            const ad = Math.abs(a.time - this.currentTime);
            const bd = Math.abs(b.time - this.currentTime);
            if(ad < bd) return 1;
            if(ad > bd) return -1;
            return 0;
        });
        for(const val of markers) {
            if(!val.draw) {
                continue;
            }
            let posNormalized = map(val.time, start, end, 0, 1);
            posNormalized = this.normalizedToBarPos(dc, posNormalized);
            const alpha = this.getPlateAlpha(val.time);
            ctx.save();
            ctx.globalAlpha = alpha;
            const drawStyle = { borderColor:val.borderColor, bgColor:val.borderColor, lineColor:val.bgColor };
            if(val.drawName) {
                this.drawPlate(dc, posNormalized, this.markerYOffset, this.namePlateMaxWidth, this.namePlateHeight, val.text, 55, drawStyle);
            } else {
                this.drawLine(dc, posNormalized, this.barYOffset, this.barHeight, drawStyle);
            }            
            ctx.restore();
        }
    }

    drawHighscoreEntries(dc: DrawContextInfo, names: Array<BarNameEntry>) {
        const ctx = dc.ctx!;
        const  { start, end } = this.getBarStartEndTimes();
        for(const name in names) {
            const time = names[name].time;
            //let priority = names[name].priority;
            const alpha = this.getPlateAlpha(time);
            if(alpha < 0.1) {
                continue;
            }
            const posOnBar = map(time, start, end, 0, 1);
            const distFromBarStart = this.normalizedToBarPos(dc, posOnBar);
            ctx.save();
            ctx.globalAlpha = alpha;
            /*if(priority > 0) {
                this.drawPlate(dc, distFromBarStart, this.namePlateYOffset, this.namePlateMaxWidth, this.namePlateHeight, ""+names[name].displayName, 30);
            } else {*/
                this.drawLine(dc, distFromBarStart, this.barYOffset, this.barHeight);
            //}
            ctx.restore();
        }
    }

    getPlateAlpha(time: number) {
        const  { start, end } = this.getBarStartEndTimes();
        const posOnBar = map(time, start, end, 0, 1);
        const a = map(posOnBar, 0.97, 1.0, 1, 0);
        const b = map(posOnBar, 0.03, 0, 1, 0);
        const alpha = clamp(Math.min(a, b), 0, 1);
        return alpha;
    }

    drawLine(dc: DrawContextInfo, x: number, y: number, height: number, config: PlateConfiguration = { borderColor:"#bbbaba", bgColor:"#f2f2f2", lineColor:"#bbbaba" }) {
        const ctx = dc.ctx!;
        ctx.strokeStyle = config.lineColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + height);
        ctx.stroke();
        ctx.fill();
    }

    drawPlate(dc: DrawContextInfo, 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        text: string, 
        lineHeight=35, 
        config: PlateConfiguration = { borderColor:"#bbbaba", bgColor:"#f2f2f2", lineColor:"#bbbaba" }) 
    {
        const ctx = dc.ctx!;
        ctx.font = "16px Roboto";
        ctx.fillStyle = config.bgColor;
        ctx.strokeStyle = config.borderColor;
        const tm = ctx.measureText(text);
        width = Math.max(tm.width + 10, width);
        const rectx = x - width / 2;
        //rectx = clamp(rectx, this.borderPadding, dc.width - width - this.borderPadding);
        ctx.fillRect(rectx, y, width, height);
        if(config.borderColor !== config.bgColor) {
            ctx.strokeRect(rectx, y, width, height);
        }
        //this.roundRect(ctx, rectx, y, width, height, 2, true, true);
        ctx.fillStyle = "black";      
        this.centerText(dc, rectx, y + 2, width, height, text);
        ctx.lineWidth = this.indicatorLineWidth;
        //x = clamp(x, this.borderPadding + width / 2, dc.width - width/2 - this.borderPadding);
        ctx.strokeStyle = config.lineColor;
        ctx.beginPath();
        if(lineHeight > 0) {
            ctx.moveTo(x, y + height);
            ctx.lineTo(x, y + height + lineHeight);
        }
        else if(lineHeight < 0) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + lineHeight);
        }
        ctx.stroke(); 
    }

    drawBar(dc: DrawContextInfo, bgColor: string, borderColor: string, lineWidth: number) {
        const ctx = dc.ctx!;
        const x = this.borderPadding;
        const y = this.barYOffset;
        const width = dc.width - this.borderPadding * 2;
        const height = this.barHeight;
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = lineWidth;
        this.roundRect(ctx, x, y, width, height, 3, true, true);
    }    

    normalizedToBarPos(dc: DrawContextInfo, value: number) {
        return this.borderPadding + value * (dc.width - this.borderPadding * 2);
    }

    getBarStartEndTimes() {
        const left = this.currentTime - (this.barTimeLength * this.barTimeZero);
        const right = this.currentTime + (this.barTimeLength * (1 - this.barTimeZero));
        return { start: left, end: right };
    }    

    centerText(dc: DrawContextInfo, x: number, y: number, width: number, height: number, text: string) {
        const ctx = dc.ctx!;
        //let tm = ctx.measureText(text);
        ctx.textAlign="center"; 
        ctx.textBaseline = "middle";        
        ctx.fillText(
            text, 
            (x + width / 2), 
            Math.ceil(y + height / 2)
        );
    }

    roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number|any, fill = true, stroke = false) {
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            const defaultRadius: any = {tl: 0, tr: 0, br: 0, bl: 0};
            for (const side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }

    fixNames(ctx: CanvasRenderingContext2D, names: Array<BarNameEntry>, maxLength: number) {
        for(const name in names) {
            names[name].displayName = this.fittingString(ctx, names[name].name, maxLength);
        }
    }

    fittingString(c: CanvasRenderingContext2D, str: string, maxWidth: number) {
        let width = c.measureText(str).width;
        const ellipsis = '…';
        const ellipsisWidth = c.measureText(ellipsis).width;
        if (width<=maxWidth || width<=ellipsisWidth) {
            return str;
        } else {
            let len = str.length;
            while (width>=maxWidth-ellipsisWidth && len-->0) {
                str = str.substring(0, len);
                width = c.measureText(str).width;
            }
            return str+ellipsis;
        }
    }

    @Watch("currentTime")
    onBarTimeChanged(_old: number, _new: number) {
        //this.updateLimiter.setValue(_new, this.onReadyForRedraw);
        const dc = this.hidpiCanvas.getDrawContext()
        this.drawGoalBar(dc);         
    }

    /*onReadyForRedraw() {
        let dc = this.hidpiCanvas.getDrawContext()
        this.drawGoalBar(dc); 
    }*/

    onRedraw(dc: DrawContextInfo) {
        this.drawGoalBar(dc);
    }
}
</script>

<style lang="scss" scoped>
.bar-root {
    width: 100%;
    height: 100%;
    //color: #a9d845
    .canvas-container {
        width: 100%;
        height: 100%;
    }
}
</style>