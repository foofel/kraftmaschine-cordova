<template>
    <HeadlineView headlineText="Bluetooth">
        <div class="container" style="display: flex; justify-content: center;" ref="container" >
            <div class="stack-box">
                <div v-if="state != 'done'" class="loader-item relative ">
                    <div v-if="isScanning" class="loader-box">
                        <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
                    </div>
                    <div class="header-device center-only">
                        <div class="" v-if="state == 'scan'">
                            <div class="center-only" @click="scanForDevices()">
                                {{ isScanning ? "Searching for devices" : "Found Devices" }}
                            </div>
                        </div>
                        <div v-if="state == 'board'">Select Board</div>
                    </div>
                </div>
                <div v-if="state == 'scan' && devices.length > 0" class="device-list expand-item">
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
                <div v-if="state == 'board'" class="device-list expand-item">
                    <div v-for="(item, index) in getBoards()" 
                        v-bind:key="index"
                        class="device center-only"
                        @click="boardSelected(item)">
                        <div class="item-container center-only">
                            {{item.name}}
                        </div>
                    </div>
                </div>
                <div v-if="state == 'done'" class="expand-item center-only">
                    connected :)
                </div>
                <img src="@/assets/sounds/beep-wav.mp3" />
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
import { ConfigFile } from '../../core/storageinterface';
import { Hangboards, Hangboard } from '../typeexports';
import { DeviceInfoCallback } from '../../core/sensorreader';
import { asyncSleep, showToast } from '@/core/util';
import { RUNNING_ON_DEV_MACHINE } from '@/config';

@Component({
    components: {
        HeadlineView
    }
})
export default class BluetoothConnectionSelector extends VueNavigation {
    devices:Array<{name:string, address:string}> = [];
    state:"scan"|"board"|"done" = "scan";
    connectSuccess = true;
    hangboardConnector:HangboardConnector = {} as HangboardConnector;
    isScanning = false;
    isConnecting = false;
    selectedDevice!: { name: string, address: string };
    constructor() {
        super();
    }
    created() {
        this.hangboardConnector = this.$root.$data.hangboardConnector as HangboardConnector;
    }

	activated() {
		console.log("ACTIVATED BluetoothConnectionSelector")
	}    

    mounted() {
        console.log("MOUNTED BluetoothConnectionSelector");
        this.scanForDevices()
    }

    beforeDestroy() {
        console.log("DESTROYED BluetoothConnectionSelector");
        if(this.isScanning) {
            this.hangboardConnector.stopChannelSearch();
        }
    }
    
    async scanForDevices() {
        if(this.isScanning){
            return;
        }
        console.log("start scan");
        this.devices = [];
        if(RUNNING_ON_DEV_MACHINE()) {
            this.devices.push({ name: "webble", address: "webble" });
            return;
        }        
        this.isScanning = true;
        this.hangboardConnector.startChannelSearch((result:ScanCallbackInterface) => {
            const idx = this.devices.findIndex((e) => e.address === result.address);
            if(idx !== -1) {
                return;
            }
            console.log(result);
            if(result.error !== "") {
                this.isScanning = false;
                if(this.devices.length == 0) {
                    showToast(`no bluetooth devices found :'(`, 2000);
                }
                return;
            }
            this.devices.push({ name: result.name, address: result.address});
        });
    }
    async deviceSelected(dev:{ name: string, address: string }) {
        if(this.isConnecting){
            return;
        }
        //TODO: wait until connection is done, then show next screen
        console.log("selected", dev);
        this.isConnecting = true;
        if(this.isScanning) {
            this.hangboardConnector.stopChannelSearch();
        }
        this.isScanning = false;
        const res = await this.hangboardConnector.connect(dev.address, window);
        this.isConnecting = false;
        if(res.success){
            const store = (this as any).$store;
            store.connection.lastDeviceAddress = res.address;
            store.connection.knownDevices.push({
                address: res.address,
                name: res.id,
                lastConnection: new Date()
            });
            this.selectedDevice = dev;
            this.isScanning = false;
            this.state = "board";
        } else {
            console.log("unable to connect to bluetooth device")
            showToast(`unable to connect to device`, 2000);
        }
    }
    boardSelected(board: Hangboard) {
        /*this.cfg.options.deviceBoardMapping[this.selectedDevice.address] = board.id;
        this.state = "done";
        if(this.cfg.options.firstRun) {
            this.$router.replace("scale");
        }*/
    }

    getBoards() {
        const boards = Hangboards.boardList().values();
        return boards;
    }

    onChannelInfo(channel: string, isActive: boolean) {

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
                position: relative;
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