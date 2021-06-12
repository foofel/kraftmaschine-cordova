<template>
    <HeadlineView headlineText="Bluetooth">
        <div class="container" style="display: flex; justify-content: center;" ref="container" >
            <div class="stack-box">
                <div class="loader-item relative ">
                    <div v-if="isScanning" class="loader-box">
                        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                    </div>
                    <div class="header-device center-only">
                        <div>
                            <div class="center-only" @click="scanForDevices()">
                                {{ isScanning ? "Searching for devices" : "Found Devices" }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="device-list expand-item">
                    <div v-for="(item, index) in devices" 
                        v-bind:key="index"
                        class="device center-only"
                        @click="deviceSelected(item)">
                        <div class="item-container center-only">
                            {{item.name}}
                        </div>
                        <div v-if="isConnecting" class="loader-box">
                            <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                        </div>                        
                    </div>
                </div>
            </div>
        </div>
    </HeadlineView>
</template>

<script>
import Vue from 'vue'
import HeadlineView from '@/components/HeadlineView2.vue'
import { VueNavigationMixin } from '../../components/vuenavigation';
import { RUNNING_ON_DEV_MACHINE } from '@/config';
import { getStore } from '@/core/teststore';
import { AppContext, gac } from '@/appcontext'

export default {
    components: {
        HeadlineView
    },
    mixins: [VueNavigationMixin],
    data: function() { return {
        devices: [],
        connectSuccess: false,
        isScanning: false,
        isConnecting: false,
        selectedDevice: null
    }},
    created() {
    },
	activated() {
		console.log("ACTIVATED BluetoothConnectionSelector")
	},
    mounted() {
        console.log("MOUNTED BluetoothConnectionSelector");
        this.scanForDevices()
    },
    beforeDestroy() {
        console.log("DESTROYED BluetoothConnectionSelector");
        if(this.isScanning) {
            this.$ctx.device.stopScan();
        }
    },
    methods: { 
        scanForDevices() {
            if(this.isScanning) {
                return;
            }
            console.log("start scan");
            this.devices = [];
            if(RUNNING_ON_DEV_MACHINE()) {
                this.devices.push({ name: "websocket", address: "websocket" });
                return;
            }        
            this.isScanning = true;
            if(this.selectedDevice) {
                this.devices.push(this.selectedDevice);
            }
            this.$ctx.device.scan(5, (result) => {
                if(result.error) {
                    Vue.notify({ title: 'BLE Error', text: 'Missing location permission', type: "error"});
                }
                const idx = this.devices.findIndex((e) => e.address === result.address);
                if(idx !== -1) {
                    return;
                }
                console.log(result);
                if(result.error) {
                    this.isScanning = false;
                    if(this.devices.length == 0) {
                        this.$notify({ title: 'oh noez', text: "no bluetooth devices found :'(", type: "warn" })
                    }
                    return;
                }
                if(!result.done) {
                    this.devices.push({ name: result.name, address: result.address });
                }
            });
        },
        async deviceSelected(dev) {
            if(this.isConnecting){
                return;
            }
            console.log("selected", dev);
            this.isConnecting = true;
            if(this.isScanning) {
                this.$ctx.device.stopScan();
            }
            this.isScanning = false;
            const res = await this.$ctx.device.connect(dev);
            this.isConnecting = false;
            if(res.success){
                this.$store.connection.lastDeviceAddress = res.address;
                const known = {
                    address: res.address,
                    name: dev.name,
                    lastConnected: new Date()
                }
                this.$store.connection.knownDevices.push(known);
                this.$store.connection.current = res;
                this.selectedDevice = dev;
                this.isScanning = false;
            } else {
                console.log("unable to connect to bluetooth device")
                this.$notify({ title: 'no connection', text: "unable to connect to device, please retry", type: "error" })
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.container {
    width: 100%;
    height: 100%;
    .stack-box {
        display: flex;
        flex-flow: column;
        width: 100vw;
        .loader-box {
            width: 32px;
            height: 32px;
            position: absolute;
            top: 50%;
            transform: translate(0, -12px);
            right: 15px;
            .lds-ring {
                display: inline-block;
                position: relative;
                width: 24px;
                height: 24px;
            }
            .lds-ring div {
                box-sizing: border-box;
                display: block;
                position: absolute;
                width: 24px;
                height: 24px;
                margin: 0px;
                border: 2px solid lightgray;
                border-radius: 50%;
                animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
                border-color:lightgray transparent transparent transparent;
            }
            .lds-ring div:nth-child(1) {
                animation-delay: -0.45s;
            }
            .lds-ring div:nth-child(2) {
                animation-delay: -0.3s;
            }
            .lds-ring div:nth-child(3) {
                animation-delay: -0.15s;
            }
            @keyframes lds-ring {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        }           
        .relative {
            position: relative;
        }
        .item {
            flex: 0 1 auto;         
        }
        .loader-item {
            flex: 0 1 auto;             
        }
        .expand-item {
            flex: 1 1 auto;
        }         
        .header-device, .header-board {
            text-align: center;
            height: 60px;
            font-size: 1.25em;
            font-weight: 300;         
        }
        .selected-device {
            text-align: center;
            height: 60px;
            font-weight: 300;
            border-bottom: 1px solid lightgray;
            margin-bottom: 20px;
        }
        .device-list {
            overflow: hidden;
            overflow-y: auto;
            .device {
                font-weight: 400;
                cursor: pointer;
                //background-color: aquamarine;             
                position: relative;
                .item-container {
                    font-size: 16;
                    width: 100%;
                    border-bottom: 1px solid lightgray;
                    min-height: 60px;
                }
                .item:active {
                    background-color: lightskyblue;
                }
            }
            .device:first-child .item-container{
                border-top: 1px solid lightgray;
            }
        }
    }
}
</style>