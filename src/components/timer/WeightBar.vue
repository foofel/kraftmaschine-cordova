<template>
    <div class="w-full h-8 border relative overflow-hidden">
        <div class="combined bg-lightBlue-400" :style="{width: combinedFill + '%'}"></div>
        <div class="left bg-lightBlue-200" :style="{width: leftFill + '%'}"></div>
        <div class="right bg-lightBlue-300" :style="{width: rightFill + '%'}"></div>
        <div class="active-indicator"></div>
        <div class="weight font-medium text-sm">0.0 kg</div>
    </div>
</template>

<script>
export default {
    name: "WeightBar",
    data() {
        return {
            weight: {
                left: 0, 
                right: 0
            }
        }
    },
    methods: {
        updateData(weight) {
            this.weight = weight;
        }
    },
    computed: {
        leftFill() {
            return this.weight.left;
        },
        rightFill() {
            return this.weight.right;
        },
        combinedFill() {
            return this.weight.left + this.weight.right;
        }
    }
}
</script>

<style lang="scss" scoped>
.border {
    border: 1px solid #A8A8A8;
    border-radius: 10px;
    box-sizing: border-box;
    background-color: #F3F3F3;
}
.active-indicator {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 94%;
    border-right: 1px solid #A8A8A8;
}
.left {
    position: absolute;
    left: 0;
    top: 0;    
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
    left: 0;
    top: 0;    
    height: 100%;
}
.weight {
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
    left: 7px;
}
</style>