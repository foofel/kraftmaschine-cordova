import { Hx711CalibrationData, Hx711CalibrationList } from '@/components/typeexports';
import { BLEServiceInfo, GlobalConfig, RUNNING_ON_DEV_MACHINE } from '@/config';
import { AppContext } from '@/main';
import { runInContext } from 'lodash';
import { BLEConnectionResult, BluetoothLE, CordovaBluetoothLE, ScanCallbackInterface, WebBluetoothLE } from './bluetoothle';
import { StopWatch } from './stopwatch';

export const ScaleOptions = {
    RAW_DATA_RATE: 80
}

export interface WeightMessageInterface extends WeightDataInterface {
    readonly ts: number;
    readonly passthrough: boolean;
}

export interface WeightDataInterface {
    readonly left: number;
    readonly right: number;
    readonly combined: number;
}

export class WeightMessage implements WeightMessageInterface {
    constructor(public readonly left: number, 
        public readonly right: number, 
        public readonly combined: number, 
        public readonly ts: number,
        public readonly passthrough: boolean) 
    {}
}

export class WeightData implements WeightDataInterface {
    constructor(public readonly left: number, public readonly right: number, public readonly combined: number) {}
}

export interface TempSensorInterface {
    readonly time: Date;
    readonly temp: number;
    readonly humidity: number;
    readonly pressure: number;
}

export type WeightMessageCallback = (data: WeightMessageInterface) => void;
export type TempSensorCallback = (data: TempSensorInterface) => void;
export type DeviceInfoCallback = (channel: string, isActive: boolean) => void;

export interface SensorReaderInterface {
    init(): Promise<boolean>;
    connect(address:string, domElement?:any):Promise<BLEConnectionResult>;
    disconnect(): Promise<boolean>;
    isDeviceAlive(): boolean;
    registerWeightListener(cb: WeightMessageCallback): void;
    removeWeightListener(cb: WeightMessageCallback): void ;
    registerTempSensorCallback(cb: TempSensorCallback): void;
    removeTempSensorCallback(cb: TempSensorCallback): void;
    registerChannelInfoCallback(cb: DeviceInfoCallback): void ;
    removeChannelInfoCallback(cb: DeviceInfoCallback): void;
    startDeviceSearch(cb:(result: ScanCallbackInterface) => void): void;
    stopDeviceSearch(): void;
    getBackend(): BluetoothLE;
    setLightColor(r:number, g:number, b:number): void;
}

export class BluetoothSensorReader implements SensorReaderInterface 
{
    bleBackend:BluetoothLE;
    weightListener: Array<WeightMessageCallback> = [];
    tempListener: Array<TempSensorCallback> = [];
    deviceInfoListener: Array<DeviceInfoCallback> = [];    
    ppsLimitWatch: StopWatch = new StopWatch();
    activeResetWatch: StopWatch = new StopWatch(false);
    calibrationData:Hx711CalibrationData = Hx711CalibrationList.getIdentityCalibration();
    receivedPackagesInLastSecond = 0;
    lastPackageId: number = -1;
    timeSinceConnected:number = 0;
    bleScanTimeout:number = 0;
    watchdogIntervall:number = 0;
    lastWatchdogState:"good"|"bad" = "good";

    constructor() {
        if(RUNNING_ON_DEV_MACHINE()) {
            this.bleBackend = new WebBluetoothLE();
        } else {
            this.bleBackend = new CordovaBluetoothLE();
        }
    }

    init(): Promise<boolean> {
        return this.bleBackend.init();
    }

    disconnect(): Promise<boolean> {
        return this.bleBackend.disconnect(this.bleBackend.getAddress());
    }

    public setLightColor(r:number, g:number, b:number) {
        const buffer = new ArrayBuffer(3);
        const view = new DataView(buffer);
        view.setInt8(0, r);
        view.setInt8(1, g);
        view.setInt8(2, b);
        //const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        this.bleBackend.write(BLEServiceInfo.lightCharacteristicId, buffer);
    }

    async connect(address:string, domElement?:any): Promise<BLEConnectionResult> {
        this.stopWatchdog();
        this.lastPackageId = -1;
        this.receivedPackagesInLastSecond = 0;
        this.timeSinceConnected = 0;
        const connector = await this.bleBackend.connect(address, domElement);
        if(!connector.success) {
            console.log("unable to connect");
            return connector;
        }
        const devId = this.bleBackend.getDeviceId();
        this.calibrationData = Hx711CalibrationList.getCalibrationValues(devId);
        await this.bleBackend.subscribe(BLEServiceInfo.weightCharacteristicId, (data:ArrayBuffer) => this.handleMsg(data, "weight") );
        await this.bleBackend.subscribe(BLEServiceInfo.envCharacteristicId, (data:ArrayBuffer) => this.handleMsg(data, "env") );
        this.startWatchdog();
        return connector;
    }

    handleMsg(data:ArrayBuffer, messageType:string) {
        if(this.ppsLimitWatch.elapsed() > 1) {
            this.receivedPackagesInLastSecond = 0;
        }
        if(this.receivedPackagesInLastSecond > 100) {
            console.log("too many messages/s, ignoring");
            return;
        }
        if( !( (messageType == "weight" && data.byteLength) == 11 || (messageType == "env" && data.byteLength) == 6) ) {
            console.log(`invalid sensor msg, length: ${data.byteLength}, type: '${messageType}'`);
            return;
        }
        //console.log(data);
        const dataView = new DataView(data);
        if(messageType === 'weight') {
            const pkg = dataView.getUint8(0);
            const timed = dataView.getUint16(1, true) / 1000000;
            const left = dataView.getInt32(3, true) * this.calibrationData.left;
            const right = dataView.getInt32(7, true) * this.calibrationData.right;
            this.timeSinceConnected += timed;
            const msg: WeightMessageInterface = new WeightMessage(
                left,
                right,
                left + right,
                this.timeSinceConnected,
                false
            );
            if(this.lastPackageId == -1) {
                this.lastPackageId = pkg;
            }
            if(pkg < this.lastPackageId) {
                this.lastPackageId -= 255;
            }
            if(Math.abs(pkg - this.lastPackageId) > 1) {
                console.log(`missed package(s): ${pkg - this.lastPackageId}`);
            }
            this.lastPackageId = pkg;
            for(const cb of this.weightListener) {
                cb(msg);
            }
            this.receivedPackagesInLastSecond++;
            this.activeResetWatch.restart();
        } else if (messageType === 'env') {
            const temp = dataView.getInt16(0, true) / 100;
            const hum = dataView.getInt16(2, true) / 100;
            const press = dataView.getInt16(4, true) / 10;
            for(const cb of this.tempListener) {
                const obj: TempSensorInterface = {
                    time: new Date(),
                    temp: temp,
                    humidity: hum,
                    pressure: press
                };
                cb(obj);
            }
            this.receivedPackagesInLastSecond++;
            this.activeResetWatch.restart();
        } else {
            console.log("unknown message");
        }
    }

    stopWatchdog() {
        if(this.watchdogIntervall) {
            clearInterval(this.watchdogIntervall);
            this.watchdogIntervall = 0;
        }
    }

    startWatchdog() {
        this.lastWatchdogState = "good";
        for(const cb of this.deviceInfoListener) {
            cb(this.bleBackend.getAddress(), true);
        }
        this.watchdogIntervall = setInterval(() => {
            if(this.activeResetWatch.elapsed() > 1 && this.lastWatchdogState == "good") {
                console.log("watchdog lost sensor connection");
                for(const cb of this.deviceInfoListener) {
                    cb(this.bleBackend.getAddress(), false);
                }
                this.lastWatchdogState = "bad";
            } else if(this.activeResetWatch.elapsed() <= 0.1 && this.lastWatchdogState == "bad") {
                console.log("watchdog found sensor connection");
                for(const cb of this.deviceInfoListener) {
                    cb(this.bleBackend.getAddress(), true);
                }
                this.lastWatchdogState = "good";
            }
        }, 100);
    }

    public startDeviceSearch(cb:(result: ScanCallbackInterface) => void) {
        this.bleScanTimeout = this.bleBackend.startScan(cb, 5);
    }

    public stopDeviceSearch() {
        this.bleBackend.stopScan(this.bleScanTimeout);
    }

    public isDeviceAlive(): boolean {
        return this.bleBackend.isConnected() && this.lastWatchdogState == "good";
    }

    public registerWeightListener(cb: WeightMessageCallback): void {
        this.weightListener.push(cb);
    }
    public removeWeightListener(cb: WeightMessageCallback): void {
        this.weightListener = this.weightListener.filter((e) => e !== cb);
    }
    public registerTempSensorCallback(cb: TempSensorCallback): void {
        this.tempListener.push(cb);
    }
    public removeTempSensorCallback(cb: TempSensorCallback): void {
        this.tempListener = this.tempListener.filter((e) => e !== cb);
    }
    public registerChannelInfoCallback(cb: DeviceInfoCallback): void {
        this.deviceInfoListener.push(cb);
    }
    public removeChannelInfoCallback(cb: DeviceInfoCallback): void {
        this.deviceInfoListener = this.deviceInfoListener.filter((e) => e !== cb);
    }
    public getBackend() {
        return this.bleBackend;
    }
}