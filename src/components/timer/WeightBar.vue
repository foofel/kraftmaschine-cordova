<template>
    <div class="bar-container">
        <div class="combined bg-lightBlue-400" :style="{width: combinedFill + '%', backgroundColor: combinedBg }"></div>
        <div class="left bg-lightBlue-200" :style="{width: leftFill + '%', backgroundColor: leftBg }"></div>
        <div class="right bg-lightBlue-300" :style="{width: rightFill + '%', backgroundColor: rightBg }"></div>
        <div class="active-indicator"></div>
        <div class="weight font-medium text-sm">{{combinedWeight.toFixed(1)}} kg</div>
    </div>
</template>

<script>
import { clamp, map, round } from '@/core/util/math';

export default {
    name: "WeightBar",
    props: [
        'activationFactor',
        'maxWeight'
    ],
    data() {
        return {
            weight: {
                left: 0, 
                right: 0
            },
            diffMaxFactor: 0.1
        }
    },
    methods: {
        updateData(weight) {
            this.weight = weight;
        },
        getBalanceAlpha() {
            const left = round(this.weight.left, 0.01);
            const right = round(this.weight.right, 0.01);            
            const combined = left + right;
            const absDiff = Math.abs(left - right);
            const relDiff = absDiff / this.maxWeight;
            const clampedDiff = clamp(relDiff, 0.02, 0.1);
            const colorizeStrength = map(clampedDiff, 0.02, 0.1, 0, 1);
            return colorizeStrength;
        }        
    },
    computed: {
        leftFill() {
            return (this.weight.left / this.$props.maxWeight) * 100;
        },
        leftBg() {
            const alpha = this.getBalanceAlpha();
            return `rgba(235,67,67, ${alpha})`;
        },
        rightFill() {
            return (this.weight.right / this.$props.maxWeight) * 100;
        },
        rightBg() {
            const alpha = this.getBalanceAlpha();
            return `rgba(235,67,67, ${alpha})`;
        },
        combinedFill() {
            return ((this.weight.left + this.weight.right) / this.$props.maxWeight) * 100;
        },
        combinedBg() {
            const isActive = this.weight.left + this.weight.right > this.$props.maxWeight * this.$props.activationFactor;
            return isActive ? "#88E93B" : "#FFD700"
        },
        combinedWeight() {
            return this.weight.left + this.weight.right
        }
    }
}
</script>

<style lang="scss" scoped>
.bar-container {
    border: 1.5px solid #A8A8A899;
    //box-sizing: border-box;
    border-radius: 10px;
    background-color: red;
    background-color: #F3F3F3;
    height: 2rem;
    overflow: hidden;
    position: relative;

    .active-indicator {
        position: absolute;
        left: 94%;
        top: 0;
        height: 100%;
        width: 1.5px;
        background-color: #7e7e7e;
    }
    .left {
        position: absolute;
        left: 0px;
        top: 0px;    
        height: 50%;
    }
    .right {
        position: absolute;
        left: 0;
        bottom: 0;    
        height: 50%;
    }
    .combined {
        position: absolute;
        left: 0px;
        top: -1px;    
        height: 2rem;
    }
    .weight {
        position: absolute;
        transform: translate(0, -50%);
        top: 50%;
        left: 7px;
    }
}
</style>