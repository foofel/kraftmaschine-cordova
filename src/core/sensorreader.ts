import { Hx711CalibrationData, Hx711CalibrationList } from '@/components/typeexports';
import { BLEServiceInfo, GlobalConfig, RUNNING_ON_DEV_MACHINE } from '@/config';
import { GlobalStore } from '@/main';
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
    connect(address:string):Promise<BLEConnectionResult>;
    disconnect(): Promise<boolean>;
    isDeviceSending(): boolean;
    registerWeightListener(cb: WeightMessageCallback): void;
    removeWeightListener(cb: WeightMessageCallback): void ;
    registerTempSensorCallback(cb: TempSensorCallback): void;
    removeTempSensorCallback(cb: TempSensorCallback): void;
    registerChannelInfoCallback(cb: DeviceInfoCallback): void ;
    removeChannelInfoCallback(cb: DeviceInfoCallback): void;
    startDeviceSearch(cb:(result: ScanCallbackInterface) => void): void;
    stopDeviceSearch(): void;
}

export class BluetoothSensorReader implements SensorReaderInterface 
{
    bleBackend:BluetoothLE;
    weightListener: Array<WeightMessageCallback> = [];
    tempListener: Array<TempSensorCallback> = [];
    deviceInfoListener: Array<DeviceInfoCallback> = [];    
    receivedPackagesInLastSecond = 0;
    ppsLimitWatch: StopWatch = new StopWatch();
    activeResetWatch: StopWatch = new StopWatch(false);
    lastPackageId: number = 0;
    calibrationData:Hx711CalibrationData = Hx711CalibrationList.getIdentityCalibration();;
    timeSinceConnected:number = 0;
    bleScanTimeout:any = null;
    watchdogIntervall:any = null;
    lastWatchdogState:"good"|"bad" = "bad";

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
        this.stopWatchdog();
        return this.bleBackend.disconnect(this.bleBackend.getAddress());
    }

    async connect(address:string): Promise<BLEConnectionResult> {
        this.stopWatchdog();
        const connectr = await this.bleBackend.connect(address);
        if(!connectr.success) {
            console.log("unable to connect");
            return connectr;
        }
        this.startWatchdog();
        const devId = this.bleBackend.getDeviceId();
        this.calibrationData = Hx711CalibrationList.getCalibrationValues(devId);
        await this.bleBackend.subscribe(BLEServiceInfo.weightCharacteristicId, (data:ArrayBuffer) => this.handleMsg(data) );
        return connectr;
    }

    handleMsg(data:ArrayBuffer) {
        if(this.ppsLimitWatch.elapsed() > 1) {
            this.receivedPackagesInLastSecond = 0;
        }
        if(this.receivedPackagesInLastSecond > 100) {
            console.log("too many messages/s, ignoring");
            return;
        }
        
        if(data.byteLength < 12) {
            console.log("invalid message length");
            return;
        }
        //console.log(data);
        const dataView = new DataView(data);
        const messageType = String.fromCharCode(dataView.getUint8(0));
        if(messageType === 'w') {
            const pkg = dataView.getUint8(1);
            const timed = dataView.getUint16(2, true) / 1000000;
            const left = dataView.getInt32(4, true) * this.calibrationData.left;
            const right = dataView.getInt32(8, true) * this.calibrationData.right;
            this.timeSinceConnected += timed;
            const msg: WeightMessageInterface = new WeightMessage(
                left,
                right,
                left + right,
                this.timeSinceConnected,
                false
            );
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
        } else if (messageType === 't') {
            const temp = dataView.getInt16(1, true) / 100;
            const hum = dataView.getInt16(3, true) / 100;
            const press = dataView.getInt16(5, true) / 10;
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
            this.watchdogIntervall = null;
        }
    }

    startWatchdog() {
        this.watchdogIntervall = setInterval(() => {
            if(this.activeResetWatch.elapsed() > 1 && this.lastWatchdogState == "good") {
                for(const cb of this.deviceInfoListener) {
                    cb(this.bleBackend.getAddress(), false);
                }
                this.lastWatchdogState = "bad";
            } else if(this.activeResetWatch.elapsed() <= 0.1 && this.lastWatchdogState == "bad") {
                this.lastWatchdogState = "good";
            }
        }, 100);
    }

    public selectDevice(address: string): void {
        for(const cb of this.deviceInfoListener) {
            cb(address, false);
        }
    }

    public startDeviceSearch(cb:(result: ScanCallbackInterface) => void) {
        this.bleScanTimeout = this.bleBackend.startScan(cb, 5);
    }

    public stopDeviceSearch() {
        this.bleBackend.stopScan(this.bleScanTimeout);
    }

    public isDeviceSending(): boolean {
        return this.activeResetWatch.isStarted() &&  this.lastWatchdogState == "good";
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
}