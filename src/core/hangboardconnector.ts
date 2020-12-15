import { MessageTransformerIntrerface, pipe, sum } from "./messagetransformer";
import { SensorReaderInterface,  WeightMessageCallback, TempSensorCallback, WeightMessageInterface, TempSensorInterface, DeviceInfoCallback, BluetoothSensorReader } from "./sensorreader";
import { BackendServers } from '../config';
import { BLEConnectionResult, ScanCallbackInterface } from './bluetoothle';

export type WeightCallbackEntry = { cb: WeightMessageCallback; transformer: MessageTransformerIntrerface };

export type GlobalEventCB = (type: string) => void;

export class HangboardConnector {
    
    dataReader: SensorReaderInterface;
    weightListener: Array<WeightCallbackEntry> = [];
    tempListener: Array<TempSensorCallback> = [];
    globalEventListener: Array<GlobalEventCB> = [];
    channelInfoListener: Array<DeviceInfoCallback> = [];
    lastTempMessage: TempSensorInterface;

    constructor() {
        this.dataReader = new BluetoothSensorReader();
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

    init(): Promise<boolean> {
        return this.dataReader.init();
    }

    public async disconnect() {
        const res = await this.dataReader.disconnect();
        console.log("[ble] disconnected, result:", res);
    }

    public connect(address: string): Promise<BLEConnectionResult> {
        this.resetData();
        return this.dataReader.connect(address);
    }

    public startChannelSearch(cb:(result: ScanCallbackInterface) => void) {
        return this.dataReader.startDeviceSearch(cb);
    }

    public stopChannelSearch() {
        this.dataReader.stopDeviceSearch();
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

    public registerChannelInfoCallback(cb: DeviceInfoCallback): void {
        this.channelInfoListener.push(cb);
    }
    public removeChannelInfoCallback(cb: DeviceInfoCallback): void {
        this.channelInfoListener = this.channelInfoListener.filter((e) => e !== cb);
    }    

    public registerGlobalCallback(cb: GlobalEventCB): void {
        this.globalEventListener.push(cb);
    }

    public removeGlobalCallback(cb: GlobalEventCB): void {
        this.globalEventListener = this.globalEventListener.filter((e) => e !== cb);
    }
}