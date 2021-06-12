<template>
<div class="root">
    <div class="weight_box" @click="toggleLeftRightView()">
        <div id="cmbtest" class="combined">
            {{getCombined()}} kg
        </div>
        <div class="weight_detail_box" v-bind:class="{visible: showSeperate}">
            <div class="left">{{getLeft()}} kg</div>
            <div class="right">{{getRight()}} kg</div>
        </div>
    </div>
    <div class="temp_detail_box center-in-columns clickable" @click="onTare()">
        <div class="temp">{{getTemp()}}°C</div>
        <div class="hum">{{getHum()}}%</div>
        <div class="hpa">{{hetHpa()}} hPa</div>
    </div>
</div>
</template>

<script>
import { VueNavigationMixin } from '@/components/vuenavigation'
import { pipe, movingAverage, taredByObject } from '../../core/messagetransformer';
import { round } from '@/core/math';
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
            calibrator: null
        };
    },
    mounted: function() {
		console.log("MOUNTED Scale");
		this.$ctx.device.subscribe({ tag: "weight", cb: this.onWeightMessage });
		this.$ctx.device.subscribe({ tag: "env", cb: this.onTempSensorMessage });
		this.calibrator = new Calibration(this.$ctx.device, this.tareCallback, { left: 0, right: 0, combined: 0 });
    },
    beforeDestroy() {
        console.log("DESTROYED Scale");
		this.$ctx.device.unsubscribe(this.onWeightMessage);
		this.$ctx.device.unsubscribe(this.onTempSensorMessage)
    }, 
    methods: {
        tareCallback(validDuration, progress, weights) {
            console.log(validDuration, progress, weights);
            if(progress >= 1) {
                this.calibrator.destroy();
                this.calibrator = null;
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
	computed: { }
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
	position: relative;

    .weight_box {
        cursor: pointer;
        font-weight: 100;
        position:relative;
        font-size: 20vw;
        //z-index: 1;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-tap-highlight-color: transparent;

        .weight_detail_box {
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

        .weight_detail_box.visible {
            transition: opacity 0.1s ease-in, bottom 0.1s ease-out;
            bottom: -50px;
            opacity: 1;
        }
        @media (orientation: landscape) {
            .weight_detail_box {
                bottom: -30px;
                font-size: 4vw;
            }
            .weight_detail_box.visible {
                bottom: -40px;
            }            
        }         
    }

    .temp_detail_box {
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
    @media (orientation: landscape) {
        .temp_detail_box {
            font-size: 3vw;
        }
    }    
}
</style>