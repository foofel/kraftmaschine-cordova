import { DeviceScanResult, ConnectResult, DeviceInterface, DeviceChannel, SubscribableDeviceChannel } from '@/core/connectivity/raw/deviceinterface'
import { BLEServiceInfo, BackendConfig } from '@/config'
import { asyncBarrier } from '@/core/util'
import Vue from 'vue'

export const DeviceChannelBLEMapping = {
    "weight": BLEServiceInfo.weightCharacteristicId,
    "env": BLEServiceInfo.envCharacteristicId,
    "light": BLEServiceInfo.lightCharacteristicId,
    "hwVersion": BLEServiceInfo.hwVersionCharacteristicId,
    "deviceId": BLEServiceInfo.deviceIdCharacteristicId,
    "selectOption": BLEServiceInfo.selectOptionId,
    "accessOption": BLEServiceInfo.accessOptionId
}

export class WebsocketDevice implements DeviceInterface {

    socket:WebSocket|null = null;
    connectedEndpoint:ConnectResult|null = null;
    subscriptions:Array<{channel:SubscribableDeviceChannel, cb:(data:ArrayBuffer) => void}> = []

    constructor() {}

    async initialize(reinit?:boolean) {
        return true;
    }

    async connect(device:DeviceScanResult): Promise<ConnectResult> {
        if(!this.connectedEndpoint){
            this.socket = new WebSocket(BackendConfig.debugWebsocket);
            this.socket.binaryType = 'arraybuffer';
            this.socket.onopen = (event:Event) => {
                console.log("sensor reader websocket connected");           
            }
            this.socket.onmessage = (event:MessageEvent) => {
                const dv = new DataView(event.data);
                const tag = dv.getInt8(0);
                for(const sub of this.subscriptions) {
                    if(sub.channel == "weight" && tag == 0) {
                        sub.cb(event.data.slice(1))
                    } else if (sub.channel == "env" && tag == 1) {
                        sub.cb(event.data.slice(1))
                    }
                }
            }
            this.socket.onerror = (event:Event) => {
                console.log("sensor connection error");
                this.disconnect();
            }
            this.socket.onclose = (event:CloseEvent) => {
                console.log("sensor connection closed");
                this.disconnect();
            }
            this.connectedEndpoint = {
                deviceId: "00000", 
                address: BackendConfig.debugWebsocket, 
                hwVersion: "99.9.9", 
                mtu: 65535, 
                success: true, 
                info: { 
                    leftCalibration: 0.00003521584442541458, 
                    rightCalibration: 0.00003562402048972537 
                }
            }
            return this.connectedEndpoint;
        } else {
            console.log("alread connected");
            return this.connectedEndpoint;
        }
    }

    async disconnect(): Promise<boolean> {
        if(this.socket) {
            this.socket.close()
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onerror = null;
            this.socket.onclose = null;
            this.socket = null;
            this.connectedEndpoint = null;
            this.subscriptions = [];
            return true;
        }
        return false;
    }

    async subscribe(channel:SubscribableDeviceChannel, cb:(data:ArrayBuffer) => void): Promise<boolean> {
        this.subscriptions.push({ channel: channel, cb: cb });
        return true;
    }

    async unsubscribe(channel:SubscribableDeviceChannel): Promise<boolean> {
        return true;
    }

    async scan(duration:number, cb:(device:DeviceScanResult) => void): Promise<void> {
        cb({ name: "Kraftmaschine(00000)", address: BackendConfig.debugWebsocket });
        cb({ name: "", address: "", done: true });
    }

    async stopScan(): Promise<void> {
    }

    async read(channel:DeviceChannel): Promise<string> {
        return "";
    }

    async write(channel:DeviceChannel, buffer:ArrayBuffer): Promise<boolean> {
        return true;
    }

    isReady() {
        return this.connectedEndpoint != null;
    }

    getConnectionInfo() {
        return this.connectedEndpoint;
    }
}