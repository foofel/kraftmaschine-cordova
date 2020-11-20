import { StopWatch } from './stopwatch';

export const ScaleOptions = {
    RAW_DATA_RATE: 80
}

export interface WeightMessageInterface extends WeightDataInterface {
    readonly ts:number;
    readonly passthrough:boolean;
}

export interface WeightDataInterface {
    readonly left:number;
    readonly right:number;
    readonly combined:number;
}

export class WeightMessage implements WeightMessageInterface {
    constructor(public readonly left:number, 
        public readonly right:number, 
        public readonly combined:number, 
        public readonly ts:number,
        public readonly passthrough:boolean) 
    {}
}

export class WeightData implements WeightDataInterface {
    constructor(public readonly left:number, public readonly right:number, public readonly combined:number) {}
}

export interface TempSensorInterface {
    readonly time:Date;
    readonly temp:number;
    readonly humidity:number;
    readonly pressure:number;
}

export type WeightMessageCallback = (data: WeightMessageInterface) => void;
export type TempSensorCallback = (data: TempSensorInterface) => void;
export type ChannelInfoCallback = (channel:string, isActive:boolean) => void;

export class SensorReader {
    sampleAvgCount:number = 1;
    msgId:number = 0;
    weightListener:Array<WeightMessageCallback> = [];
    tempListener:Array<TempSensorCallback> = [];
    channelInfoListener:Array<ChannelInfoCallback> = [];
    maxPPS:number = 100; // the scale sends with 80 pps + 
    receivedPackages:number = 0;
    ppsLimitWatch:StopWatch = new StopWatch();
    activeResetWatch:StopWatch = new StopWatch();
    socket:WebSocket|null = null;
    isConnected:boolean = false;
    channelActive:boolean = false;
    waitForChannelAnswer:boolean = true;
    channelCheckAliveIntervall:any = null;
    constructor(private connectionString:string, private channel:string) {
        this.startReader();
    }

    private startReader() {
        this.socket = new WebSocket(this.connectionString);
        this.socket.onopen = (event:Event) => {
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
                    for(let cb of this.channelInfoListener) {
                        cb(this.channel, false);
                    }
                } else if(this.activeResetWatch.elapsed() < 1 && !this.channelActive) {
                    this.channelActive = true;
                    console.log(`channel ${this.channel} active!`);
                    for(let cb of this.channelInfoListener) {
                        cb(this.channel, true);
                    }
                }
            }, 1000)            
        }
        this.socket.onmessage = (event:MessageEvent) => {
            let data:string = event.data as string;
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
            let msgType:string = data[0];
            if(this.waitForChannelAnswer && msgType !== "c") {
                return;
            }
            if(msgType === "w") {
                // packet number, packet time(s), left (kg), right (kg)
                const weightData:Array<string> = data.substr(1).split(" ");
                if(weightData.length < 4) {
                    console.log(`invalid weight message: ${data}`);
                    return;
                }
                let msg:WeightMessageInterface = new WeightMessage(+weightData[2], +weightData[3], (+weightData[2]) + (+weightData[3]), (+weightData[1]), false);
                for(let cb of this.weightListener) {
                    cb(msg);
                }
            } else if(msgType === "t") {
                // packet time(s), temp (°C), humidity (%), preassure (hPA)
                const tempData:Array<string> = data.substr(1).split(" ");
                if(tempData.length < 4) {
                    console.log(`invalid temperature message: ${data}`);
                }
                for(let cb of this.tempListener) {
                    let obj:TempSensorInterface = {
                        //time: +tempData[0],
                        time: new Date(),
                        temp: +tempData[1],
                        humidity: +tempData[2],
                        pressure: +tempData[3]
                    };
                    cb(obj);
                }
            } else if(msgType === "c") {
                let channel = data.substr(1);
                console.log(`selcted channel ${channel}`);
                this.waitForChannelAnswer = false;
            } else {
                console.log(`received invalid message: '${data}'`);
            }
        }
        this.socket.onerror = (event:Event) => {
            console.log("sensor connection error");
            console.log(event);
        }
        this.socket.onclose = (event:CloseEvent) => {
            this.isConnected = false;
            this.channelActive = false;
            if(this.channelCheckAliveIntervall) {
                clearInterval(this.channelCheckAliveIntervall);
            }
            console.log("sensor connection closed");
            console.log(event);
            for(let cb of this.channelInfoListener) {
                cb(this.channel, false);
            }            
            setTimeout(() => {
                this.startReader();
            }, 1000);
        }
    }

    public selectChannel(channel:string): void {
        if(this.socket) {
            this.channel = channel;
            this.channelActive = false;
            for(let cb of this.channelInfoListener) {
                cb(this.channel, false);
            }              
            this.socket.send(`c${channel}`);
            console.log(`sending channel change request for channel ${channel}`);
            this.waitForChannelAnswer = true;
        }
    }

    public isChannelActive():boolean {
        return this.channelActive;
    }

    public registerWeightListener(cb:WeightMessageCallback):void {
        this.weightListener.push(cb);
    }
    public removeWeightListener(cb:WeightMessageCallback):void {
        this.weightListener = this.weightListener.filter((e) => e !== cb);
    }
    public registerTempSensorCallback(cb:TempSensorCallback):void {
        this.tempListener.push(cb);
    }
    public removeTempSensorCallback(cb:TempSensorCallback):void {
        this.tempListener = this.tempListener.filter((e) => e !== cb);
    }
    public registerChannelInfoCallback(cb:ChannelInfoCallback):void {
        this.channelInfoListener.push(cb);
    }
    public removeChannelInfoCallback(cb:ChannelInfoCallback):void {
        this.channelInfoListener = this.channelInfoListener.filter((e) => e !== cb);
    }
}