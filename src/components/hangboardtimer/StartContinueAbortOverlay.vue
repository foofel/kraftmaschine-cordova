<template>
    <div class="fill-parent container clickable">
        <div class="center-in-rows fill-parent one" v-if="internalState === 'INIT'" @click.stop="(event) => onOverlayClick('start')">
            START
        </div>
        <div class="fill-parent" v-if="internalState === 'INTERRUPTED'">
            <div class="two center-in-rows splitborder good" @click.stop="(event) => onOverlayClick('continue')">
                <div>CONTINUE</div>
                <div class="timeout">get ready in {{remainingContinueTime.toFixed(1)}}s...</div>
            </div>
            <div class="two center-in-rows bad" @click.stop="(event) => onOverlayClick('abort')">
                <div>ABORT{{abortCountString}}</div>
            </div>
        </div>
        <div class="fill-parent" v-if="internalState === 'DONE'">
            <div class="two center-in-rows splitborder good">
                <div class="save">SAVE</div>
                <div class="stars">
                    <span class="star" @click.stop="(event) => onOverlayClick('save', 1)">
                        <i :class="{'far': this.selectedStars < 1, 'fas': this.selectedStars >= 1}" class="fa-star"></i>
                        </span>
                    <span class="star" @click.stop="(event) => onOverlayClick('save', 2)">
                        <i :class="{'far': this.selectedStars < 2, 'fas': this.selectedStars >= 2}" class="fa-star"></i>
                    </span>
                    <span class="star" @click.stop="(event) => onOverlayClick('save', 3)">
                        <i :class="{'far': this.selectedStars < 3, 'fas': this.selectedStars >= 3}" class="fa-star"></i>
                    </span>
                    <span class="star" @click.stop="(event) => onOverlayClick('save', 4)">
                        <i :class="{'far': this.selectedStars < 4, 'fas': this.selectedStars >= 4}" class="fa-star"></i>
                    </span>
                    <span class="star" @click.stop="(event) => onOverlayClick('save', 5)">
                        <i :class="{'far': this.selectedStars < 5, 'fas': this.selectedStars >= 5}" class="fa-star"></i>
                    </span>
                </div>
                <div class="difficulty">personal rating</div>
                <div class="difficulty">(bad 1, good 5)</div>
            </div>
            <div class="two center-in-rows bad" @click.stop="(event) => onOverlayClick('discard')">
                DISCARD{{abortCountString}}
            </div>
        </div>
    </div>
</template>
-
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { StopWatch } from '../../core/stopwatch';
import { TimerState } from './ts/timerrunner';

@Component({})
export default class StartContinueAbortOverlay extends Vue {
    @Prop({default: "INIT"}) timerState!:TimerState;
    @Prop({default: true}) timerRunning!:boolean;
    internalState:string;
    //firstSelection:string = "";
    timerId:any = null;
    stopWatch:StopWatch = new StopWatch(false);
    continueTimeout:number = 3;
    badClickCount:number = 2;
    remainingContinueTime:number;
    remainingBadClickCount:number = 0;
    selectedStars:number = 0;

    constructor() {
        super();
        this.remainingContinueTime = this.continueTimeout;
        this.remainingBadClickCount = this.badClickCount;
        this.internalState = "INIT";
    }

    mounted() {
        this.remainingContinueTime = this.continueTimeout;
        this.remainingBadClickCount = this.badClickCount;
        this.internalState = "INIT";
        this.selectedStars = 0;        
    }

    beforeDestroy() {
        if(this.timerId !== null) {
            clearInterval(this.timerId);
        }
    }    

    onOverlayClick(selection:string, star:number) {
        if(this.selectedStars > 0) {
            return;
        }
        if(selection === "start") 
        {
            //this.firstSelection = selection;
            this.$emit("overlayClicked", selection);
        }
        else if (selection === "abort") 
        {
            if(this.timerId !== null) {
                return;
            }
            this.remainingBadClickCount--;
            if(this.remainingBadClickCount <= 0) {
                this.remainingBadClickCount = this.badClickCount;
                this.internalState = "DONE";
            }
        }
        else if(selection === "continue") 
        {
            this.remainingBadClickCount = this.badClickCount;
            //this.firstSelection = "continue";
            if(this.timerId === null) {
                this.startTimeout();
            }
            else {
                this.remainingContinueTime = this.continueTimeout;
                this.resetTimeout();
            }
        }
        else if(selection === "save") 
        {
            this.selectedStars = star;
            setTimeout(() => {
                this.internalState = "INIT";
                this.$emit("overlayClicked", selection, this.selectedStars);
                this.selectedStars = 0;
            }, 1000);
        }
        else if(selection === "discard") 
        {
            this.remainingBadClickCount--;
            if(this.remainingBadClickCount <= 0) {
                this.internalState = "INIT";
                this.$emit("overlayClicked", selection);
            }
        }        
    }

    @Watch("timerState")
    onTimerStateCHanged(value:string) {
        this.onParamsChange();
    }

    @Watch("timerRunning")
    onTimerRunningCHanged(value:boolean) {
        this.onParamsChange();
    }

    onParamsChange() {
        if(this.timerRunning === false || this.timerState === "DONE") {
            this.remainingBadClickCount = this.badClickCount;
            this.remainingContinueTime = this.continueTimeout;
            if(this.timerState === "INIT" || this.timerState === "DONE") {
                this.internalState = this.timerState;
            } else {
                this.internalState = "INTERRUPTED";
            }
        } else {
            this.internalState = "HIDDEN";
        }
    }

    startTimeout() {
        this.stopWatch.start();
        this.timerId = setInterval(() => {
            if(this.timerId === null) {
                console.log("empty id");
                return;
            }
            this.remainingContinueTime = this.continueTimeout - this.stopWatch.elapsed();
            let elapsed = this.stopWatch.elapsed();
            if(elapsed >= this.continueTimeout) {
                this.resetTimeout();
                this.timerId = null;
                this.$emit("overlayClicked", "continue");
            }        
        }, 100);
    }
    resetTimeout() {
        this.stopWatch.reset();
        if(this.timerId !== null) {
            clearInterval(this.timerId);
        }
        this.timerId = null;
        this.remainingContinueTime = this.continueTimeout;
    }
    get abortCountString() {
        /*if(this.remainingBadClickCount === this.badClickCount) {
            return "";
        }*/
        return `(${this.remainingBadClickCount})`
    }
}
</script>

<style lang="scss" scoped>
.container {  
    color: white;
    .one {
        background:  rgba(0,0,0,0.85);
        border-radius: 50px;
        font-size: 5em;
        font-weight: 300;
    }
    .two {
        width: 100%;
        height: 50%;
        font-size: 2em;
    }
    .splitborder {
        border-bottom: 1px solid white;
    }    
    .good {
        background: #55a014ee;
        border-radius: 50px 50px 0px 0px;
        .timeout {
            font-size: 0.5em;
        }
        .save {
            font-size: 1em;
        }
        .difficulty{
            font-size: 0.5em;
        }
        .stars {
            //margin-top: 5px;
            .star {
                font-size: 1.5em;
            }
        }
    }
    .bad {
        background: #da2525ee;
        border-radius: 0px 0px 50px 50px;
    }    
}

</style>