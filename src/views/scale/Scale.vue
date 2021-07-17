<template>
<div class="root">
    <div class="weight-box" @click="toggleLeftRightView()">
        <div id="cmbtest" class="combined">
            {{getCombined()}} kg
        </div>
        <div class="weight-detail-box" v-bind:class="{visible: showSeperate}">
            <div class="left">{{getLeft()}} kg</div>
            <div class="right">{{getRight()}} kg</div>
        </div>
    </div>
    <div class="temp-detail-box center-in-columns clickable" @click="onTare()">
        <div class="temp">{{getTemp()}}°C</div>
        <div class="hum">{{getHum()}}%</div>
        <div class="hpa">{{hetHpa()}} hPa</div>
    </div>
    <div class="tare-box">
        <div v-if="showTareBox" class="bar" :style="{ width: (tareProgress * 100) + '%' }"></div>
    </div>
</div>
</template>

<script>
import { VueNavigationMixin } from '@/core/util/vuenavigation'
import { pipe, movingAverage, taredByObject } from '@/core/connectivity/messagetransformer';
import { round } from '@/core/util/math';
import { Calibration } from '@/core/util/calibration';

export default {
    name: "Scale",
    mixins: [VueNavigationMixin],
    components: {},
    created() {
        console.log("scale created");
    },
    data: function() {
        return {
            showSeperate: false,
            tempInfo: { temp: 0, humidity: 0, pressure: 0 },
            weightInfo: { left: 0, right: 0 },
            zeroWeights: { left: 0, right: 0 },
            pipeline: pipe(movingAverage(20)),
            calibrator: null,
            tareProgress: 0
        };
    },
    mounted: function() {
		console.log("MOUNTED Scale");
		this.$ctx.device.subscribe({ tag: "weight", cb: this.onWeightMessage });
		this.$ctx.device.subscribe({ tag: "env", cb: this.onTempSensorMessage });
    },
    beforeDestroy() {
        console.log("DESTROYED Scale");
		this.$ctx.device.unsubscribe(this.onWeightMessage);
		this.$ctx.device.unsubscribe(this.onTempSensorMessage);
        if(this.calibrator) {
            this.calibrator.destroy();
        }
    }, 
    methods: {
        tareCallback(validDuration, progress, weights) {
            //console.log(validDuration, progress, weights);
            this.tareProgress = progress;
            if(progress >= 1) {
                this.calibrator.destroy();
                this.calibrator = null;
                this.zeroWeights = weights;
                this.pipeline = pipe(taredByObject(this.zeroWeights), movingAverage(20));
            }
        },
        onTare() {
            if(!this.calibrator){
                this.calibrator = new Calibration(this.$ctx.device, this.tareCallback);  
            }
        },
        onWeightMessage(msg) {
            msg = this.pipeline(msg);
            this.weightInfo = msg;
        },
        onTempSensorMessage(msg) {
            this.tempInfo = msg;
        },           
        getTemp() {
            return this.tempInfo.temp.toFixed(0); 
        },
        getHum() {
            return this.tempInfo.humidity.toFixed(0); 
        },
        hetHpa() {
            return this.tempInfo.pressure.toFixed(0); 
        },
        getCombined() {
            return (round(this.weightInfo.left, 0.1) + round(this.weightInfo.right, 0.1)).toFixed(2);
        },
        getLeft() {
            return round(this.weightInfo.left, 0.1).toFixed(2);
        },
        getRight() {
            return round(this.weightInfo.right, 0.1).toFixed(2);
        },
        toggleLeftRightView() {
            this.showSeperate = !this.showSeperate
        }
    },
	computed: {
        showTareBox() {
            return this.tareProgress >= 0 && this.tareProgress < 1;
        }
    }
};
</script>

<style lang="scss" scoped>
.root {
    width: 100%;
    height: 100%;
	user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
	position: relative;

    .weight-box {
        cursor: pointer;
        font-weight: 100;
        position:relative;
        font-size: 20vw;
        //z-index: 1;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-tap-highlight-color: transparent;

        .weight-detail-box {
            padding-top: 5px;
            position:absolute;
            height: 50px;
            width: 100%;
            border-top: 0.01em solid lightgray;
            transition: opacity 0.1s ease-out, bottom 0.1s ease-out;
            bottom: -40px;
            opacity: 0;
            font-size: 5vw;
            .left {
                float: left;
                font-weight: 300;
                margin-left: 1vw;
            }

            .right {
                float: right;
                text-align: right;
                font-weight: 300;
                margin-right: 2vw;
            }     

        }

        .weight-detail-box.visible {
            transition: opacity 0.1s ease-in, bottom 0.1s ease-out;
            bottom: -50px;
            opacity: 1;
        }
        @media (orientation: landscape) {
            .weight-detail-box {
                bottom: -30px;
                font-size: 4vw;
            }
            .weight-detail-box.visible {
                bottom: -40px;
            }            
        }         
    }

    .temp-detail-box {
        font-size: 3vw;
        padding-top: 5px;
        position:absolute;
        width: 100%;
        font-size: 4vw;
        font-weight: 300;
        bottom: 20px;
        .temp {}
        .hum {
            margin-left: 4vw;
        }
        .hpa {
            margin-left: 4vw;
        }	
    }

    .tare-box {
        position:absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3px;
        .bar {
            height: 100%;
            background-color: #EB4343;
        }
    }
    @media (orientation: landscape) {
        .temp-detail-box {
            font-size: 3vw;
        }
    }    
}
</style>