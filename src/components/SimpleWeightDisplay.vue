<template>
	<div class="root">
		<div class="weight_box" @click="onClick()">
			<div id="cmbtest" class="combined">
				{{getCombined()}} kg
			</div>
			<div class="weight_detail_box" v-bind:class="{visible: !hidden, hidden: hidden}">
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

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { HangboardConnector } from '../core/hangboardconnector';
import { pipe, sum, guard, movingAverage, tared, taredByObject, clampPositive } from '../core/messagetransformer';
import { WeightMessage, ScaleOptions, WeightDataInterface, WeightData, TempSensorInterface } from '@/core/sensorreader';
import { TareWeights, DataModelComponentDataInterface, DataModelComponentModelInterface } from './typeexports';
import { Calibration } from '@/core/calibration';
import { VueNavigation } from './vuenavigation';
import { round } from '../core/math';
import { ConfigFile } from '@/core/storageinterface';

@Component({
	components: {
	}
})
export default class SimpleWeightDisplay extends VueNavigation {
	@Prop({default: 8}) rate!: number;
	weight: WeightDataInterface;
	scaleBackend: HangboardConnector;
	hidden: boolean;
	calib: Calibration|null;
	tareWeights: TareWeights = { left: 0, right: 0 };
	tempInfo: TempSensorInterface;
	intervallId: any = null;
	displayWeights: WeightDataInterface = { left: 0, right: 0, combined: 0 };

	constructor() {
		super();
		this.hidden = true;
		this.weight = new WeightData(0, 0, 0);
		this.calib = null;
		this.scaleBackend = this.$root.$data.scaleBackend as HangboardConnector;
		this.tempInfo = this.scaleBackend.getLastTempSensorData();
	}

    created() {
        console.log("CREATED SimpleWeightDisplay")
	}
	
	activated() {
		console.log("ACTIVATED SimpleWeightDisplay")
	}

	async mounted () {
		console.log("MOUNTED SimpleWeightDisplay")
		this.scaleBackend.registerWeightCallback(this.onWeightMessage, pipe(taredByObject(this.tareWeights), movingAverage(20)));
		this.scaleBackend.registerTempSensorCallback(this.onTempSensorMessage);
		this.onTare();
		this.intervallId = setInterval(() => {
			this.onTare();
		}, 300 * 1000);
	}

	beforeDestroy() {
		console.log("DESTROYED SimpleWeightDisplay")
		this.scaleBackend.removeWeightCallback(this.onWeightMessage);
		this.scaleBackend.removeTempSensorCallback(this.onTempSensorMessage)
		if(this.calib) {
			this.calib.stop();
			this.calib = null;
		}
		if(this.intervallId) {
			clearInterval(this.intervallId);
		}
	}

	onWeightMessage(msg: WeightMessage) {
		this.weight = msg;
	}

	onTempSensorMessage(msg: TempSensorInterface) {
		this.tempInfo = msg;
	}

	getTemp() {
		return this.tempInfo.temp.toFixed(1);
	}

	getHum() {
		return this.tempInfo.humidity.toFixed(0); 
	}

	hetHpa() {
		return this.tempInfo.pressure.toFixed(0); 
	}

	onTare() {
		if(this.calib){
			return;
		}
		console.log("start calibration");
		this.calib = new Calibration(this.scaleBackend, 
			(weights: TareWeights) => {
				console.log(`new tare weights, left: ${weights.left}, right: ${weights.right}`);
				this.tareWeights.left = weights.left;
				this.tareWeights.right = weights.right;
				this.calib = null;
			}
		);
	}

	onClick() {
		//console.log("lol");
		this.hidden = !this.hidden;
	}

	getCombined() {
		return round(this.weight.combined, 0.1).toFixed(2);
	}

	getLeft() {
		return round(this.weight.left, 0.1).toFixed(2);
	}

	getRight() {
		return round(this.weight.right, 0.1).toFixed(2);
	}
}
</script>

<style lang="scss" scoped>
.root {
	width: 100vw;
	height: 100vh;
	user-select: none;
	//font-family: 'Roboto', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
	position: relative;
	.show-props {
		position:absolute;
		bottom: 0;
		left: 0;
		width: 35px;
		height: 35px;
		color: gray;		
	}
}

.weight_box {
	cursor: pointer;
	font-weight: 100;
	position:relative;
	font-size: 10vw;
	z-index: 1;
	-webkit-tap-highlight-color: rgba(0,0,0,0);
	-webkit-tap-highlight-color: transparent;
}

.weight_detail_box {
    padding-top: 5px;
    position:absolute;
    height: 50px;
    width: 100%;
	border-top: 0.01em solid lightgray;
}

.left {
	float: left;
	font-size: 2vw;
	font-weight: 300;
	margin-left: 1vw;
}

.right {
	float: right;
	text-align: right;
	font-weight: 300;
	font-size: 2vw;
	margin-right: 2vw;
}	

.weight_detail_box.visible {
    transition: opacity 0.1s ease-in, bottom 0.1s ease-out;
    bottom: -60px;
    opacity: 1;
}

.weight_detail_box.hidden {
    transition: opacity 0.1s ease-out, bottom 0.1s ease-out;
    bottom: -40px;
    opacity: 0;
}

.temp_detail_box {
	font-size: 2vw;
	padding-top: 5px;
    position:absolute;
    width: 100%;
    //z-index: -1;
	font-weight: 300;
	bottom: 10px;
	//transform: translate(-50%, 0);
	.temp {}
	.hum {
		
		margin-left: 4vw;
	}
	.hpa {
		
		margin-left: 4vw;
	}	
}

@media (max-width:1281px) { 
	.weight_box {
		font-size: 20vw;
	}
	.left {
		font-size: 4vw;
	}
	.right {
		font-size: 4vw;
	}
	.temp_detail_box{
		font-size: 4vw;
	}
 }

</style>
