import { runInContext } from 'lodash';
import { BluetoothLE, CordovaBluetoothLE, WebBluetoothLE } from './bluetoothle';
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
export type ChannelInfoCallback = (channel: string, isActive: boolean) => void;

export interface SensorReaderInterface {
    selectChannel(channel: string): void ;
    isChannelActive(): boolean;
    registerWeightListener(cb: WeightMessageCallback): void;
    removeWeightListener(cb: WeightMessageCallback): void ;
    registerTempSensorCallback(cb: TempSensorCallback): void;
    removeTempSensorCallback(cb: TempSensorCallback): void;
    registerChannelInfoCallback(cb: ChannelInfoCallback): void ;
    removeChannelInfoCallback(cb: ChannelInfoCallback): void;
}

export class BluetoothSensorReader implements SensorReaderInterface 
{
    bleBackend:BluetoothLE;
    weightListener: Array<WeightMessageCallback> = [];
    tempListener: Array<TempSensorCallback> = [];
    channelInfoListener: Array<ChannelInfoCallback> = [];    
    receivedPackages = 0;
    ppsLimitWatch: StopWatch = new StopWatch();
    activeResetWatch: StopWatch = new StopWatch(false);

    constructor() {
        if(window.hasOwnProperty("cordova")) {
            this.bleBackend = new CordovaBluetoothLE("NimBLE", "24:6F:28:7B:A5:BE");
        } else {
            this.bleBackend = new WebBluetoothLE();
        }
        this.run();
    }

    private async run() {
        await this.bleBackend.connect("24:6F:28:7B:A5:BE");
        await this.bleBackend.subscribe("0x2a98", (data:string) => {
            if(this.ppsLimitWatch.elapsed() > 1) {
                this.receivedPackages = 0;
            }
            if(this.receivedPackages > 100) {
                console.log("too many messages/s, ignoring");
                return;
            }
            if(data.length == 0) {
                console.log("empty message, ignoring");
                return;
            }
            const messageType = data[0];
            const payload = data.substr(1);
            if(messageType === 'w') {
                const params = payload.split(" ");
                if(params.length < 4) {
                    return;
                }
                const msg: WeightMessageInterface = new WeightMessage(+params[2], +params[3], (+params[2]) + (+params[3]), (+params[1]) / 1000000, false);
                for(const cb of this.weightListener) {
                    cb(msg);
                }
                this.receivedPackages++;
                this.activeResetWatch.restart();
            } else if (messageType === 't') {
                const params = payload.split(" ");
                if(params.length < 3) {
                    return;
                }
                for(const cb of this.tempListener) {
                    const obj: TempSensorInterface = {
                        //time: +tempData[0],
                        time: new Date(),
                        temp: +params[0],
                        humidity: +params[1],
                        pressure: +params[2]
                    };
                    cb(obj);
                }
                this.receivedPackages++;
                this.activeResetWatch.restart();
            } else {
                console.log("unknown message");
            }
            
        });
    }

    public selectChannel(channel: string): void {

    }

    public isChannelActive(): boolean {
        return this.activeResetWatch.isStarted() &&  this.activeResetWatch.elapsed() < 1;
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
}

export class WebsocketSensorReader implements SensorReaderInterface {
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
}