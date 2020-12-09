<template>
    <HeadlineView headlineText="Bluetooth">
        <div class="container" style="display: flex; justify-content: center;" ref="container" >
            <div class="stack-box">
                <div class="item">
                    <div class="header-device center-only">
                        <div v-if="state == 0">
                            <div class="center-only" @click="scanForDevices()">
                                Searching for devices...
                                <div v-if="isScanning" class="loader-box">
                                    <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                                </div>
                            </div>
                        </div>
                        <div v-if="state == 1">Selected: KraftMaschine (12345)</div>
                    </div>
                </div>
                <!--div v-if="state == 1" class="item">
                    <div class="header-board center-only"></div>
                </div>
                <div v-if="state == 1" class="item">
                    <div class="selected-device center-only"></div>
                </div-->
                <div v-if="devices.length > 0" class="device-list expand-item">
                    <div v-for="(item, index) in getItemList()" 
                        v-bind:key="index"
                        class="device center-only"
                        @click="deviceSelected(item)">
                        <div class="item-container center-only">
                            {{item.name}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </HeadlineView>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import HeadlineView from '@/components/HeadlineView.vue'
import { HangboardConnector } from '../../core/hangboardconnector';
import { VueNavigation } from '../vuenavigation';
import { ScanCallbackInterface } from '../../core/bluetoothle';

@Component({
    components: {
        HeadlineView
    }
})
export default class BluetoothConnectionSelector extends VueNavigation {
    devices:Array<{name:string, address:string}> = [
        { name: "dbg", address: "12345" }
    ];
    boards = [
        { name: "Beastmaker 1000" },
        { name: "Beastmaker 2000" },
        { name: "Kraftmaschine II" }
    ]
    state = 0;
    connectSuccess = true;
    scaleBackend:HangboardConnector = {} as HangboardConnector;
    isScanning = false;
    constructor() {
        super();
    }
    created() {
        this.scaleBackend = this.$root.$data.scaleBackend as HangboardConnector;
    }
    mounted() {}
    beforeDestroy() {
        this.isScanning = false;
        this.scaleBackend.stopChannelSearch();
    }    
    async scanForDevices() {
        this.devices = [];
        this.isScanning = true;
        this.scaleBackend.startChannelSearch((result:ScanCallbackInterface) => {
            const idx = this.devices.findIndex((e) => e.address === result.address);
            if(idx !== -1) {
                return;
            }
            console.log(result);
            if(result.error !== "") {
                this.isScanning = false;
                return;
            }
            this.devices.push({ name: result.name, address: result.address});
        });
    }

    deviceSelected(dev:{ name: string, address: string }) {
        console.log("start scan");
        console.log("selected", dev);
    }
    boardSelected() {
        this.state = (this.state + 1) % 2;
    }

    tryConnect() {

    }

    getItemList() {
        if(this.state === 0) {
            return this.devices;
        } else if (this.state === 1) {
            return this.boards;
        }
    }
}
</script>

<style lang="scss" scoped>
.container {
    .loader-box {
        width: 32px;
        height: 32px;
        position: relative;
        //overflow:hidden;
        display:inline-block;
        margin-left: 15px;
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
    width: 100%;
    height: 100%;
    .stack-box {
        display: flex;
        flex-flow: column;
        width: 100vw;
        .item {
            flex: 0 1 auto;
        }
        .expand-item {
            flex: 1 1 auto;
        }
        .header-device, .header-board {
            text-align: center;
            height: 60px;
            font-size: 1.0em;
            font-weight: 400;
        }
        .selected-device {
            text-align: center;
            height: 50px;
            font-weight: 300;
            border-bottom: 1px solid lightgray;
            margin-bottom: 20px;
        }
        .device-list {
            overflow: hidden;
            overflow-y: auto;
            .device {
                font-weight: 300;
                cursor: pointer;
                //background-color: aquamarine;             
                .item-container {
                    font-size: 16;
                    width: 100%;
                    border-bottom: 1px solid lightgray;
                    min-height: 50px;
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