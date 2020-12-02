import { MessageTransformerIntrerface, pipe, sum } from "./messagetransformer";
import { SensorReaderInterface, WebsocketSensorReader, WeightMessageCallback, TempSensorCallback, WeightMessageInterface, TempSensorInterface, ChannelInfoCallback } from "./sensorreader";
import { BackendServers } from '../config';

export type ScaleCallbackEntry = { cb: WeightMessageCallback; transformer: MessageTransformerIntrerface };

export type GlobalEventCB = (type: string) => void;

export class HangboardScale {
    
    dataReader: SensorReaderInterface;
    weightListener: Array<ScaleCallbackEntry> = [];
    tempListener: Array<TempSensorCallback> = [];
    globalEventListener: Array<GlobalEventCB> = [];
    channelInfoListener: Array<ChannelInfoCallback> = [];
    lastTempMessage: TempSensorInterface;

    constructor(private initialChannel: string) {
        console.log("starting core");
        this.dataReader = new WebsocketSensorReader(BackendServers.webscaleServer(), initialChannel);
        this.dataReader.registerWeightListener((msg) => this.onWeightMessage(msg));
        this.dataReader.registerTempSensorCallback((msg) => this.onTempMessage(msg));
        this.dataReader.registerChannelInfoCallback((channel, state) => this.onChannelInfoMessage(channel, state));
        this.lastTempMessage = {
            time: new Date(0),
            temp: 0,
            humidity: 0,
            pressure: 0
        }
    }

    public selectChannel(channel: string) {
        this.dataReader.selectChannel(channel);
        this.resetData();
    }

    private resetData() {
        this.lastTempMessage = {
            time: new Date(0),
            temp: 0,
            humidity: 0,
            pressure: 0            
        }
        this.onWeightMessage({ left: 0, right: 0, combined: 0, ts: 0, passthrough: true });
        this.onTempMessage(this.lastTempMessage);
    }    

    private onWeightMessage(msg: WeightMessageInterface): void {
        for(const entry of this.weightListener) {
            const value = entry.transformer(msg);
            if(value) {
                entry.cb(value);
            }
        }
    }

    private onTempMessage(msg: TempSensorInterface): void {
        this.lastTempMessage = msg;
        for(const cb of this.tempListener) {
            cb(msg);
        }
    }

    private onChannelInfoMessage(channel: string, isActive: boolean): void {
        for(const cb of this.channelInfoListener) {
            cb(channel, isActive);
        }
        if(!isActive) {
            this.resetData();            
        }
    }    

    public onGlobalMessage(msg: string) {
        for(const cb of this.globalEventListener) {
            cb(msg);
        }
    }

    getLastTempSensorData() {
        return this.lastTempMessage;
    }

    public registerWeightCallback(cb: WeightMessageCallback, transformer: MessageTransformerIntrerface): void {
        this.weightListener.push({ cb: cb, transformer: transformer });
    }

    public removeWeightCallback(cb: WeightMessageCallback): void {
        this.weightListener = this.weightListener.filter((e) => e.cb !== cb);
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

    public registerGlobalCallback(cb: GlobalEventCB): void {
        this.globalEventListener.push(cb);
    }

    public removeGlobalCallback(cb: GlobalEventCB): void {
        this.globalEventListener = this.globalEventListener.filter((e) => e !== cb);
    }
}