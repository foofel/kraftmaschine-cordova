//
// stuff for controlling the device
//
import { DeviceChannel, DeviceScanResult, ConnectResult, DeviceInterface, SubscribableDeviceChannel } from '@/core/connectivity/raw/deviceinterface'
import { BleDevice } from '@/core/connectivity/raw/bledevice'
import { WebsocketDevice } from '@/core/connectivity/raw/websocketdevice'
import { RUNNING_ON_DEV_MACHINE } from '@/config'
import { StopWatch } from '@/core/stopwatch';


export interface WeightData {
    readonly left: number;
    readonly right: number;
    readonly combined: number; 
}

export interface WeightMessage extends WeightData {
    readonly id: number;
    readonly ts: number;   
    readonly passthrough: boolean;
}

export interface EnvironmentMessage {
    readonly time: Date;
    readonly temp: number;
    readonly humidity: number;
    readonly pressure: number;
}

export interface LightMessage {
    readonly r: number;
    readonly g: number;
    readonly b: number;
}

export interface DeviceStatusMessage {
    isAlive:boolean;
}

export type WeightSensorCallback = (data:WeightMessage) => void;
export type EnvironmentSensorCallback = (data:EnvironmentMessage) => void;
export type LightChangedCallback = (data:LightMessage) => void;
export type DeviceInfoCallback = (data:DeviceStatusMessage) => void;

type Weight = {
    tag: "weight";
    cb: WeightSensorCallback;
}
type Environment = {
    tag: "env";
    cb: EnvironmentSensorCallback;
}
type Light = {
    tag: "light";
    cb: LightChangedCallback;
}
type Info = {
    tag: "info",
    cb: DeviceInfoCallback
}

enum MessageType {
    WEIGHT = 0,
    ENV = 1,
    LIGHT = 2
}

export type CallbackType = WeightSensorCallback|EnvironmentSensorCallback|LightChangedCallback|DeviceInfoCallback;
export type TypedDeviceChannel = Weight|Environment|Light|Info;

export class DeviceConnector {

    device:DeviceInterface = RUNNING_ON_DEV_MACHINE() ? new WebsocketDevice() : new BleDevice();
    watchdogIntervall:number = 0;
    lastWatchdogState:"good"|"bad" = "good";
    activeResetWatch:StopWatch = new StopWatch(false);
    ppsLimitWatch: StopWatch = new StopWatch();
    receivedPackagesInLastSecond:number = 0;
    timeSinceConnected:number = 0;
    lastEnvMessage:EnvironmentMessage = { time: new Date(), temp: 0, humidity: 0, pressure: 0 };
    calibrationFactors: { left: number, right: number } = { left: 1, right: 1 }
    listener: {
        weight: Array<WeightSensorCallback>,
        env: Array<EnvironmentSensorCallback>,
        light: Array<LightChangedCallback>,
        info: Array<DeviceInfoCallback>
    } = { weight: [], env: [], light: [], info: [] }

    async initialize(reinit?:boolean): Promise<boolean> {
        return this.device.initialize(reinit);
    }
    async scan(duration:number, cb:(scanResult:DeviceScanResult) => void): Promise<void> {
        return this.device.scan(duration, cb);
    }
    async stopScan(): Promise<void> {
        return this.device.stopScan();
    }
    async connect(scanResult:DeviceScanResult): Promise<ConnectResult> {
        // still connected
        if(this.device.getConnectionInfo()){
            return {
                deviceId: "", 
                address: "", 
                hwVersion: "", 
                mtu: 0, 
                success: false, 
                info: { leftCalibration: 0, rightCalibration: 0 }
            };
        }
        this.stopWatchdog();
        this.resetData();
        this.receivedPackagesInLastSecond = 0;
        this.timeSinceConnected = 0;
        const connectResult = await this.device.connect(scanResult);
        if(connectResult.success) {
            await this.device.subscribe("weight", (data:ArrayBuffer) => { this.onMessageData(data, MessageType.WEIGHT) });
            await this.device.subscribe("env", (data:ArrayBuffer) => { this.onEnvMessageData(data, MessageType.ENV) });
            await this.device.subscribe("light", (data:ArrayBuffer) => { this.onLightMessageData(data, MessageType.LIGHT) });
        }
        this.calibrationFactors = { 
            left: connectResult.info.leftCalibration, 
            right: connectResult.info.rightCalibration 
        }
        this.startWatchdog();
        return connectResult;
    }
    async disconnect(): Promise<boolean> {
        return this.device.disconnect();
    }
    async subscribe(channel:TypedDeviceChannel): Promise<boolean> {
        // makes ts happy
        if(channel.tag == "weight") {
            this.listener.weight.push(channel.cb);
        } else if (channel.tag == "env") {
            this.listener.env.push(channel.cb);
            channel.cb(this.lastEnvMessage);
        } else if(channel.tag == "light") {
            this.listener.light.push(channel.cb);
        } else if (channel.tag == "info") {
            this.listener.info.push(channel.cb);
        }
        return true;
    }
    async unsubscribe(cb:CallbackType): Promise<boolean> {
        this.listener.weight = this.listener.weight.filter((e) => e !== cb);
        this.listener.env = this.listener.env.filter((e) => e !== cb);
        this.listener.light = this.listener.light.filter((e) => e !== cb);
        this.listener.info = this.listener.info.filter((e) => e !== cb);
        return true;
    }
    async read(channel:DeviceChannel): Promise<string> {
        return this.device.read(channel);
    }
    async write(channel:DeviceChannel, data:ArrayBuffer): Promise<boolean> {
        return this.device.write(channel, data);
    }
    getConnectionInfo(): ConnectResult|null {
        return this.device.getConnectionInfo();
    }
    isReady(): boolean {
        return this.device.isReady();
    }
    stopWatchdog() {
        if(this.watchdogIntervall) {
            clearInterval(this.watchdogIntervall);
            this.watchdogIntervall = 0;
        }
    }
    startWatchdog() {
        this.lastWatchdogState = "good";
        const nofifyAll = (state:boolean) => {
            for(const cb of this.listener["info"]) {
                cb({ isAlive: true });
            }
        }
        nofifyAll(true);
        this.watchdogIntervall = setInterval(() => {
            if(this.activeResetWatch.elapsed() > 1 && this.lastWatchdogState == "good") {
                console.log("watchdog lost sensor connection");
                nofifyAll(false);
                //this.resetData();
                this.lastWatchdogState = "bad";
            } else if(this.activeResetWatch.elapsed() <= 0.1 && this.lastWatchdogState == "bad") {
                console.log("watchdog found sensor connection");
                nofifyAll(true);
                this.lastWatchdogState = "good";
            }
        }, 500);
    }
    onMessageData(data:ArrayBuffer, type:MessageType ) {
        if(this.ppsLimitWatch.elapsed() > 1) {
            this.receivedPackagesInLastSecond = 0;
            this.ppsLimitWatch.restart();
        }
        if(this.receivedPackagesInLastSecond > 160) {
            console.log("too many messages/s, ignoring");
            return;
        }
        switch(type) {
            case MessageType.WEIGHT:
                this.onWeightMessageData(data);
                break;
            case MessageType.ENV:
                this.onEnvMessageData(data);
                break;
            case MessageType.LIGHT:
                this.onLightMessageData(data);
                break;
        }
    }
    onWeightMessageData(data:ArrayBuffer) {
        const dataView = new DataView(data);
        const packetId = dataView.getUint8(0);
        const timeDelta = dataView.getUint16(1, true) / 1000000;
        const left = dataView.getInt32(3, true) * this.calibrationFactors.left;
        const right = dataView.getInt32(7, true) * this.calibrationFactors.right;
        this.timeSinceConnected += timeDelta;
        const msg: WeightMessage = {
            left: left,
            right: right,
            combined: left + right,
            ts: this.timeSinceConnected,
            id: packetId,
            passthrough: false
        }
        this.onWeightMessage(msg);
        this.receivedPackagesInLastSecond++;
        this.activeResetWatch.restart();
    }
    onWeightMessage(msg: WeightMessage) {
        for(const cb of this.listener.weight) {
            cb(msg);
        }
    }
    onEnvMessageData(data:ArrayBuffer) {
        const dataView = new DataView(data);
        const temp = dataView.getInt16(0, true) / 100;
        const hum = dataView.getInt16(2, true) / 100;
        const press = dataView.getInt16(4, true) / 10;
        const msg: EnvironmentMessage = {
            time: new Date(),
            temp: temp,
            humidity: hum,
            pressure: press
        };
        this.onEnvMessage(msg);
        this.receivedPackagesInLastSecond++;
        this.activeResetWatch.restart();
    }
    onEnvMessage(msg:EnvironmentMessage) {
        for(const cb of this.listener.env) {
            cb(msg);
        }
        this.lastEnvMessage = msg;
    }
    onLightMessageData(data:ArrayBuffer) {
        console.log("light msg not yet supported");
    }
    resetData() {
        const weightReset = { left: 0, right: 0, combined: 0, ts: 0, id: -1, passthrough: true }
        const tempReset = { time: new Date(), temp: 0, humidity: 0, pressure: 0 }
        this.onWeightMessage(weightReset);
        this.onEnvMessage(tempReset);
    }
}