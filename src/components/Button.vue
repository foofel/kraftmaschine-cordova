<template>
    <button 
        class="vue-button" 
        :class="{disabled: disabled}"
        :style="{height: height}"
        @click="onClick($event)"
    >
        <!--div class="vue-button-border" :class="{disabled: disabled}"></div>
        <div class="vue-button-arrow" :class="{disabled: disabled}"></div>
        <div class="content">
            <slot></slot> {{getClickCount()}}
        </div-->
        <div class="content">
            <slot></slot> {{getClickCount()}}
        </div>        
    </button>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
//import { sprintf } from "sprintf-js";

@Component
export default class Button extends Vue {
    @Prop({default: "button"}) text!: string;
    @Prop({default: false}) disabled!: boolean;
    @Prop({default: "30px"}) height!: string;
    @Prop({default: 1}) minClicks!: number;
    @Prop({default: true}) resetClicks!: boolean;
    clicksLeft: number;
    timeout: any = null;
    constructor() {
        super();
        this.clicksLeft = this.minClicks;
    }
    beforeDestroy() {
        if(this.timeout) {
            clearTimeout(this.timeout);
        }
    }
    onClick(event: any) {
        if(this.disabled) {
            return;
        }
        this.clicksLeft--;
        if(this.clicksLeft <= 0) {
            this.$emit("onClick", event);
        } else {
            if(this.timeout) {
                clearTimeout(this.timeout);
            }
            if(this.resetClicks){
                this.timeout = setTimeout(() => {
                    this.clicksLeft = this.minClicks;
                }, 1000);
            }
        }
    }
    getClickCount() {
        return (this.minClicks === 1) ? "" : `(${this.clicksLeft})`;
    }
}
</script>

<style lang="scss" scoped>
.vue-button {
    position: relative;
    min-width: 70px;
    min-height: 30px;
    border: none;
    border-radius: 3px;
    color: white;    
    background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%); // rgb(98, 0, 234);
    font-weight: bold;
    font-family: Roboto, sans-serif;
    font-size: 1em;
    letter-spacing: 1.25px;
    box-sizing: border-box;
    box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px;
}
.vue-button.disabled {
    background-color:  rgba(0, 0, 0, 0.87);
    color: rgba(0, 0, 0, 0.26);
}

/*.vue-button {
    position: relative;
    min-width: 70px;
    padding-right:20px;
    height: 30px;
    background: linear-gradient(to bottom, #4eb5e5 0%,#389ed5 100%);
    border: none;
    border-radius: 5px;
    position: relative;
    color: #fbfbfb;
    font-weight: 600;
    font-family: 'Open Sans', sans-serif;
    text-shadow: 1px 1px 1px rgba(0,0,0,.4);
    font-size: 15px;
    text-align: left;
    text-indent: 5px;
    //box-shadow: 0px 3px 0px 0px rgba(0,0,0,.2);
    cursor: pointer;
    outline: none;
}
.vue-button:active {
    //box-shadow: 0px 1px 0px 0px rgba(0,0,0,.2);
    top: 2px;
}
.vue-button-arrow {
    position: absolute;
    border-radius: 5px;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
    transform: scale(-1, 1);
    background-color: #187dbc;
    opacity: 0.6;
    clip-path: polygon(0 0, 20px 0, 5px 50%, 20px 100%, 0 100%);
}
.vue-button.disabled {
    text-shadow: 0px 0px 0px rgba(0,0,0,.4);
    box-shadow: 0px 0px 0px 0px rgba(0,0,0,.2);
    color: #ffffff;
    background: linear-gradient(to bottom, #e7e7e7 0%,#d6d6d6 100%);
}
.vue-button.disabled:active {
    top: 0px;
}
.vue-button-border.disabled {
    position: absolute;
    box-sizing: border-box;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    border-bottom: 4px solid #b9b9b9;
    border-radius: 5px;
}
.vue-button-arrow.disabled {
    background-color: #b9b9b9;
}*/
.content {
    position: relative;
    white-space: nowrap;
}
</style>