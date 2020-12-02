<template>
    <div class="center-in-rows fill-parent">
        <div class="max-weight-progress-title"><!--Max Weight Goals--></div>
        <div class="max-weight-progress">
            <ProgressBar ref="maxProgress" 
                :max="1" 
                :value="goalProgress"
                :initFormat="''"
                :progressFormat="''"
                border="border: 1px solid gray"
                :bgColors="[ 
                    { to: 0.3, colora: '#ff0000', colorb: '#aa0000' },
                    { to: 0.5, colora: '#FFA500', colorb: 'rgb(200, 129, 0)' },
                    { to: 0.7, colora: '#eeee00', colorb: '#cccc00' },
                    { to: 0.99999, colora: '#aeee00', colorb: '#88b900' },
                    { to: 1, colora: '#00ff00', colorb: '#00aa00' }
                ]"/>
        </div>
        <div class="max-weight-marker-container">
            <div class="max-weight-marker">0s</div>
            <div class="max-weight-marker max-marker-3">
                <div class="text-bottom">3s</div>
            </div>
            <div class="max-weight-marker max-marker-5">
                <div class="text-bottom">5s</div>
            </div>
            <div class="max-weight-marker max-marker-7">
                <div class="text-bottom">7s</div>
            </div>
            <div class="max-weight-marker max-marker-10">10s</div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ProgressBar from '@/components/ProgressBar.vue'

@Component({
    components: {
        ProgressBar
    }
})
export default class MaxWeightGoals extends Vue {
    @Prop({default: 0}) elapsedTime!: number;
    constructor(){
        super();
    }
    mounted() {
        
    }

    get goalProgress() {
        return this.elapsedTime / 10;
    }
}
</script>

<style lang="scss" scoped>
.max-weight-container {
    width: 80%;
    //margin: 10px;
    flex-grow: 1;
    background-color: blanchedalmond; 
    color: #aeee00;
    color: #88b900;
}
.max-weight-progress-title {
    width: 100%;
    text-align: center;
    margin: 5px;
    font-size: 1.5em;
    font-weight: 300;
}
.max-weight-progress {
    width: 100%;
    height: 30px;
}
.max-weight-marker-container {
    position: relative;
    width: 100%;
    height: 20px;
}
.max-weight-marker {
    position: absolute;
    top: 0;
}
.max-marker-3 {
    border-left: 1px solid gray;
    padding-left: 3px;
    left: 30%;
    height: 50px;
    margin-top: -30px;
}
.max-marker-5 {
    border-left: 1px solid gray;
    padding-left: 3px;    
    left: 50%;
    height: 50px;
    margin-top: -30px;    
}
.max-marker-7 {
    border-left: 1px solid gray;
    padding-left: 3px;    
    left: 70%;
    height: 50px;
    margin-top: -30px;    
}
.max-marker-10 {
    right: 0;
}
.text-bottom {
    position: absolute;
    bottom: 0;
}
</style>