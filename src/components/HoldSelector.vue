<template>
    <div class="fill-parent center-in-rows">
        <div class="hangboard-name center-in-rows">
            <div class="title">
                <div class="headline">Board</div>
            </div>            
            <select class="board-select" name="exampleselect" @change="onBoardSelectionChanged($event.target.value)">
                <option v-for="(item, index) in getBoards()" 
                    v-bind:key="index"
                    :value="item.id"
                    :selected="item.id === board.id"
                    >{{item.name}}</option>
            </select>
        </div>
        <div v-if="board.id != 0" class="holds center-in-rows">
            <div class="title center-in-rows">
                <div class="headline">Holds</div>
                <div class="desc">Please first select left then right hold</div>
            </div>
            <div class="hold-container" ref="container" :style="getContainerStyle()">
                <div v-for="(hold) in this.board.holds" 
                    v-bind:key="hold.id"
                    class="hold" 
                    :class="{
                        'hold-hovered': hold.id === hoveredHoldId, 
                        'hold-checked-left': isLeftSelection(hold),
                        'hold-checked-right': isRightSelection(hold),
                        'hold-checked-left-right': isDoubleSelection(hold),
                        'disabled': isDisabledInBenchmark(hold)
                    }"
                    :style="getHoldStyle(hold)"
                    ref="holds"
                    @mouseenter="onEnter(hold)"
                    @mouseleave="onLeave(hold)"
                    @click="onSelect(hold)">
                    <div class="hold-text fill-parent center-in-columns">
                        <div v-if="fontSizeFixed" :ref="`hold_text_${hold.id}`" :style="getHoldTextStyle(hold)" class="hold-text fill-parent center-in-columns">{{getHoldText(hold)}}</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="please-select" v-if="board.id == 0">Please select a board</div>
        <div class="buttons">
            <div class="center-in-columns">
                <!--div class="hold-only-one center-in-columns" @click="onHoldSelectionType('left')">Left Only</div>
                <div class="hold-only-one center-in-columns spacing" @click="onHoldSelectionType('right')">Right Only</div-->
                <Button :disabled="!isLeftRightEnabled()" @onClick="onFinishOneSelection('left')">Left Only</Button>
                <Button :disabled="!isLeftRightEnabled()" @onClick="onFinishOneSelection('right')" class="spacing">Right Only</Button>
            </div>            
        </div>        
        <div v-if="state >= 1 && this.selectionMode === 'benchmark'" class="show-expert-mode clickable center-in-rows" @click="onToggleCustomBenchmark()">
            enable custom benchmark
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Hold, Hangboards, Hangboard } from '@/components/typeexports';
import Button from './Button.vue'
import { ConfigFile, SaveConfigObject } from '../core/localstore';

@Component({
    components: {
        Button
    }
})
export default class HoldSelector extends Vue {
    //@Prop({default: () => Hangboards.twinPeaksReference}) board!:Hangboard;
    @Prop({default: "default"}) selectionMode!: string; // default | benchmark
    board!: Hangboard;
    state = 0;
    hoveredHoldId = -1;
    leftHold: Hold|null = null;
    rightHold: Hold|null = null;
    canvas!: HTMLCanvasElement;
    fontSize = "";
    selectionType = "both";
    enableCustomBenchmark = false;
    canvasElementId = "wa05js4ns9";
    cfg: ConfigFile = this.$root.$data.cfg;
    textLookup: Map<number, { size: number; text: string}> = new Map<number, { size: number; text: string}>();
    fontSizeFixed = false;
    waitForObjectCreation = false;
    
    constructor() {
        super();
        const elem = document.getElementById(this.canvasElementId) as HTMLCanvasElement;
        if(!elem) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = this.canvasElementId;
            this.canvas.style.display = "none";
        } else {
            this.canvas = elem;
        }
        const board = this.cfg.options.boardSetups[this.cfg.options.channel];
        if(!board){
            this.board = Hangboards.none;
        } else {
            const boardObject = Hangboards.boardList().get(board);
            if(boardObject){
                this.board = boardObject;
            } else {
                this.board = Hangboards.none;
            }
        }
    }

    mounted() {
        window.addEventListener("resize", this.onResize);
        this.calculateHoldDisplayText();
    }

    beforeDestroy() {
        window.removeEventListener("resize", this.onResize);
    }

    updated() {
        if(this.waitForObjectCreation){
            this.calculateHoldDisplayText();
            this.waitForObjectCreation = false;
        }
    }

    getBoards() {
        const lst = Hangboards.boardList().values();
        return lst;
    }

    onBoardSelectionChanged(selection: string) {
        const boardObject = Hangboards.boardList().get(parseInt(selection));
        if(boardObject){
            this.board = boardObject;
            this.leftHold = null;
            this.rightHold = null;
            this.fontSizeFixed = false;
            this.waitForObjectCreation = true;
            this.textLookup.clear();
        }
        this.cfg.options.boardSetups[this.cfg.options.channel] = parseInt(selection);
        SaveConfigObject(this.cfg);
    }

    onResize() {
        this.fontSizeFixed = false;
        this.waitForObjectCreation = true;        
        this.textLookup.clear();
    }

    onEnter(hold: Hold) {
        const disabled = this.isDisabledInBenchmark(hold);
        if(disabled) {
            return;
        }        
        this.hoveredHoldId = hold.id;
    }

    onLeave(hold: Hold) {
        const disabled = this.isDisabledInBenchmark(hold);
        if(disabled) {
            return;
        }        
        this.hoveredHoldId = -1;
    }

    isDisabledInBenchmark(hold: Hold) {
        if(this.selectionMode === 'default' || this.selectionType !== 'both') {
            return false;
        }
        if(this.enableCustomBenchmark) {
            return hold.id > hold.complementary;
        }
        return hold.id !== this.board.officialBenchmarkHolds.left; 
    }

    isLeftRightEnabled() {
        return (this.leftHold || this.rightHold) && this.state < 2;
    }

    onToggleCustomBenchmark() {
        this.enableCustomBenchmark = !this.enableCustomBenchmark;
    }

    onSelect(hold: Hold) {
        const disabled = this.isDisabledInBenchmark(hold);
        if(disabled) {
            return;
        }
        if(this.state >= 2) {
            return;
        }
        if(this.selectionMode === 'benchmark') {
            if(hold.complementary !== -1) {
                this.leftHold = hold;
                this.rightHold = this.board.holds[hold.complementary - 1]; // hold numbers start with 1
                this.finalizeSelection();
            } else {
                console.log("no idea what to do");
            }
        }
        else {
            if(this.leftHold === null) {
                this.leftHold = hold;
            }
            else if(this.rightHold === null) {
                this.rightHold = hold;
                this.finalizeSelection();
            }
        }
    }

    onFinishOneSelection(type: string) {
        if(!(this.leftHold || this.rightHold)) {
            return;
        }
        if(type === 'left') {
            this.leftHold = this.leftHold || this.rightHold;
            this.rightHold = null;
        }
        else if(type === 'right') {
            this.rightHold = this.leftHold || this.rightHold
            this.leftHold = null;
        }
        this.finalizeSelection();
    }

    finalizeSelection() {
        this.state = 2;
        setTimeout(() => {
            this.$emit("holdSelected", { 
                left: this.leftHold, 
                right: this.rightHold, 
                board: this.board 
            });
        }, 1000);
    }

    calculateHoldDisplayText() {
        const container = this.$refs.container as HTMLElement;
        if(container) {
            container.style.visibility = "visible";
            const arr = this.$refs.holds as HTMLElement[];
            if(arr) {
                for(const idx in arr) {
                    const intIdx = parseInt(idx);
                    const hold = this.board.holds[intIdx];
                    const textAndSize = this.calculateTextAndSize(arr[intIdx], hold);
                    this.textLookup.set(hold.id, { size: textAndSize.size, text: textAndSize.text });
                }
            }
        }
        this.fontSizeFixed = true;
    }

    css(element: HTMLElement, property: string) {
        return window.getComputedStyle(element, null).getPropertyValue(property);
    }

    getHolds(): Array<Hold> {
        return this.board.holds;
    }

    calculateTextAndSize(holdElem: HTMLElement, hold: Hold) {
        const holdWidth = holdElem.clientWidth;
        const holdHeight = holdElem.clientHeight;
        let text = hold.name;
        let textWidth = this.getTextWidth(hold.name, this.fontSize);
        let size = (holdWidth - (holdWidth / 100 * 5)) / textWidth * 10;
        if(size < 10) {
            textWidth = this.getTextWidth(hold.shortName, this.fontSize);
            size = (holdWidth - (holdWidth / 100 * 5)) / textWidth * 10;
            text = hold.shortName;
        }
        // we first matched on the length, now we clamp to the appropriate height
        size = Math.min(size, holdHeight - (holdHeight / 100 * 15));
        return { size: size, text: text };
    }

    getHoldText(hold: Hold) {
        return this.textLookup.get(hold.id)!.text;
    }

    getHoldTextStyle(hold: Hold) {
        return {
            fontSize: this.textLookup.get(hold.id)!.size + "px"
        }
    }

    getHoldStyle(hold: Hold) {
        const posX = hold.pos.x / this.board.width;
        const posY = hold.pos.y / this.board.height;
        const sizeX = hold.size.x / this.board.width;
        const sizeY = hold.size.y / this.board.height;        
        return { 
            //transform: `translate(${Math.round(hold.pos.x)}px,${Math.round(hold.pos.y)}px)`,
            left: posX * 100 + "%",
            bottom: posY * 100 + "%",
            width: sizeX * 100 + "%",
            height: sizeY * 100 + "%"
        };
    }

    getContainerStyle() {
        const scale = this.board.height / this.board.width;
        return { paddingBottom: scale * 100 + "%" }
    }

    getTextWidth(text: string, font: string) {
        // re-use canvas object for better performance
        const context = this.canvas.getContext("2d");
        if(context) {
            context.font = font;   
            const metrics = context.measureText(text);
            return metrics.width;
        }
        return -1;
    }

    isLeftSelection(hold: Hold) {
        return this.leftHold && hold.id === this.leftHold.id;
    }

    isRightSelection(hold: Hold) {
        return this.rightHold && hold.id === this.rightHold.id;
    }

    isDoubleSelection(hold: Hold) {
        return this.leftHold && this.rightHold && this.leftHold.id === hold.id && this.rightHold.id === hold.id;
    }
}
</script>

<style lang="scss" scoped>
.hangboard-name {
    .title {
        .headline {
            font-weight: 400;
            font-size: 1.5em;
        }    
    }    
    .board-select {
        border-radius: 3px;
        margin-top: 5px;
        border: 1px solid gray;
        background-color: white;
        padding: 2px;
        height: 30px;
    }    
}
.holds {
    width:100%;
    margin-top: 40px;
    .title {
        .headline{
            font-weight: 400;
            font-size: 1.5em;
        }
        .desc {
            font-size: 0.8em;
        }
    }
    .hold-container {
        width: 95%;
        position: relative;
        visibility: hidden;
        margin-top: 15px;
        .hold {
            position: absolute;
            font-weight: 300;
            font-size: 0.8em;
            border: 0.75px solid gray;
            //outline: 1px solid gray;
            border-radius: 2px;
            box-sizing: border-box;
            cursor: pointer;
            user-select: none;
        }
        .hold.disabled {
            color:lightgray;
            border: 1px solid lightgray;
            cursor: default;
        }
        .hold-text {
            overflow: hidden;
            text-align: center;
        }
        .hold-hovered {
            //background-color: #44c767;
            background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%);
        }
        .hold-checked-left {
            //background-color: #44c767;
            background: linear-gradient(to bottom, #ed2828 0%,#e81313 100%);
        }
        .hold-checked-right {
            //background-color: #44c767;
            background: linear-gradient(to bottom, #63b916 0%,#57a213 100%);
        }
        .hold-checked-left-right {
            //background-color: #44c767;
            background: linear-gradient(to right, #ed2828 0%, #e8131300 100%),
                        linear-gradient(to left, #63b916 0%,#57a21300 100%);
        }  
    }    
}
.please-select {
    margin-top: 30px;
} 
.buttons {
    margin-top: 40px;
    .hold-only-one {
        font-weight: 400;
        border: 1px solid lightgray;
        border-radius: 5px;
        box-sizing: border-box;
        cursor: pointer;
        user-select: none;
        width: 100px;
        height: 40px;
    }
    .hold-only-one:hover {
        //background-color: #44c767;
        background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%);
    }
    .spacing {
        margin-left: 20px;
    }
    /*.hold-both {
        font-weight: 500;
        border: 1px solid lightgray;
        border-radius: 5px;
        box-sizing: border-box;
        cursor: pointer;
        user-select: none;
        width: 220px;
        height: 50px;
        margin: 10px;
    }
    .hold-both:hover {
        //background-color: #44c767;
        background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%);
    }*/
}
.show-expert-mode {
    position:absolute;
    top: 0;
    width: 100%;
    background-color: lightgray;
    color: gray;
    //border-radius: 5px;
    height: 35px;
}
</style>