import { Hx711CalibrationData, Hx711CalibrationList } from '@/components/typeexports';
import { BLEServiceInfo, GlobalConfig } from '@/config';
import { GlobalStore } from '@/main';
import { runInContext } from 'lodash';
import { BluetoothLE, CordovaBluetoothLE, ScanCallbackInterface, WebBluetoothLE } from './bluetoothle';
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
    connect(address:string):void;
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
    calibrationData:Hx711CalibrationData;
    timeSinceConnected:number = 0;
    bleScanTimeout:any = null;
    watchdogIntervall:any = null;
    lastWatchdogState:"good"|"bad" = "bad";

    constructor() {
        if(window.hasOwnProperty("cordova")) {
            this.bleBackend = new CordovaBluetoothLE();
        } else {
            this.bleBackend = new WebBluetoothLE();
        }
        this.calibrationData = Hx711CalibrationList.getCalibrationValues("");
        const run = async () => {
            if(GlobalStore.cfg.options.channel !== "") {
                await this.connect(GlobalStore.cfg.options.channel);
            }
        };
        run();
    }

    disconnect(): Promise<boolean> {
        this.stopWatchdog();
        return this.bleBackend.disconnect(this.bleBackend.getAddress());
    }

    async connect(address:string) {
        try {
            this.stopWatchdog();
            const connectr = await this.bleBackend.connect(address);
            if(!connectr) {
                console.log("unable to connect");
                return connectr;
            }
            this.startWatchdog();
            const devId = this.bleBackend.getDeviceId();
            this.calibrationData = Hx711CalibrationList.getCalibrationValues(devId);
            await this.bleBackend.subscribe(BLEServiceInfo.weightCharacteristicId, (data:ArrayBuffer) => {
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
            
        });
        } catch(e) {
            console.log("error establishing connection:" , e);
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

/*export class WebsocketSensorReader implements SensorReaderInterface {
    sampleAvgCount = 1;
    msgId = 0;
    weightListener: Array<WeightMessageCallback> = [];
    tempListener: Array<TempSensorCallback> = [];
    channelInfoListener: Array<ChannelInfoCallback> = [];
    maxPPS = 100; // the scale sends with 80 pps + 
    receivedPackages = 0;
    ppsLimitWatch: StopWatch = new StopWatch();
    activeResetWatch: StopWatch = new StopWatch();
    socket: WebSocket|null = null;
    isConnected = false;
    channelActive = false;
    waitForChannelAnswer = true;
    channelCheckAliveIntervall: any = null;
    constructor(private connectionString: string, private channel: string) {
        this.startReader();
    }

    async disconnect(): Promise<boolean> {
        return true;
    }    

    private startReader() {
        this.socket = new WebSocket(this.connectionString);
        this.socket.onopen = (event: Event) => {
            this.isConnected = true;
            console.log("sensor reader websocket connected");
            this.selectChannel(this.channel);
            this.channelCheckAliveIntervall = setInterval(() => {
                if(this.waitForChannelAnswer) {
                    return;
                }
                if(this.activeResetWatch.elapsed() >= 1 && this.channelActive) {
                    this.channelActive = false;
                    console.log(`channel ${this.channel} inactive!`)
                    for(const cb of this.channelInfoListener) {
                        cb(this.channel, false);
                    }
                } else if(this.activeResetWatch.elapsed() < 1 && !this.channelActive) {
                    this.channelActive = true;
                    console.log(`channel ${this.channel} active!`);
                    for(const cb of this.channelInfoListener) {
                        cb(this.channel, true);
                    }
                }
            }, 1000)            
        }
        this.socket.onmessage = (event: MessageEvent) => {
            const data: string = event.data as string;
            if(data.length < 2) {
                console.log(`invalid message: ${data}`);
                return;
            }
            if(this.ppsLimitWatch.elapsed() >= 1) {
                this.receivedPackages = 0;
                this.ppsLimitWatch.restart();
            }
            if(this.receivedPackages > this.maxPPS) {
                return;
            }
            this.receivedPackages++;
            this.activeResetWatch.restart();
            const msgType: string = data[0];
            if(this.waitForChannelAnswer && msgType !== "c") {
                return;
            }
            if(msgType === "w") {
                // packet number, packet time(s), left (kg), right (kg)
                const weightData: Array<string> = data.substr(1).split(" ");
                if(weightData.length < 4) {
                    console.log(`invalid weight message: ${data}`);
                    return;
                }
                const msg: WeightMessageInterface = new WeightMessage(+weightData[2], +weightData[3], (+weightData[2]) + (+weightData[3]), (+weightData[1]), false);
                for(const cb of this.weightListener) {
                    cb(msg);
                }
            } else if(msgType === "t") {
                // packet time(s), temp (°C), humidity (%), preassure (hPA)
                const tempData: Array<string> = data.substr(1).split(" ");
                if(tempData.length < 4) {
                    console.log(`invalid temperature message: ${data}`);
                }
                for(const cb of this.tempListener) {
                    const obj: TempSensorInterface = {
                        //time: +tempData[0],
                        time: new Date(),
                        temp: +tempData[1],
                        humidity: +tempData[2],
                        pressure: +tempData[3]
                    };
                    cb(obj);
                }
            } else if(msgType === "c") {
                const channel = data.substr(1);
                console.log(`selcted channel ${channel}`);
                this.waitForChannelAnswer = false;
            } else {
                console.log(`received invalid message: '${data}'`);
            }
        }
        this.socket.onerror = (event: Event) => {
            console.log("sensor connection error");
            console.log(event);
        }
        this.socket.onclose = (event: CloseEvent) => {
            this.isConnected = false;
            this.channelActive = false;
            if(this.channelCheckAliveIntervall) {
                clearInterval(this.channelCheckAliveIntervall);
            }
            console.log("sensor connection closed");
            console.log(event);
            for(const cb of this.channelInfoListener) {
                cb(this.channel, false);
            }
            setTimeout(() => {
                this.startReader();
            }, 1000);
        }
    }

    connect(address:string) {}
    public selectChannel(channel: string): void {
        if(this.socket) {
            this.channel = channel;
            this.channelActive = false;
            for(const cb of this.channelInfoListener) {
                cb(this.channel, false);
            }              
            this.socket.send(`c${channel}`);
            console.log(`sending channel change request for channel ${channel}`);
            this.waitForChannelAnswer = true;
        }
    }

    public startChannelSearch(cb:(result: ScanCallbackInterface) => void) {}
    public stopChannelSearch() {}

    public isChannelActive(): boolean {
        return this.channelActive;
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
    public registerChannelInfoCallback(cb: ChannelInfoCallback): void {
        this.channelInfoListener.push(cb);
    }
    public removeChannelInfoCallback(cb: ChannelInfoCallback): void {
        this.channelInfoListener = this.channelInfoListener.filter((e) => e !== cb);
    }
}*/