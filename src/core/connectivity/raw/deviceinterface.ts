import { BLEServiceInfo } from '@/config'
//
// stuff for creating the connection
// 
export interface DeviceScanResult {
    name: string;
    address: string;
    error?: string;
    done?:boolean;
}

export interface DeviceInfo {
    leftCalibration:number;
    rightCalibration:number;
}

export interface ConnectResult {
    deviceId: string;
    hwVersion: string;
    address: string;
    success: boolean;
    mtu:number;
    info:DeviceInfo;
}

export type SubscribableDeviceChannel = "weight"|"env"|"light";
export type DeviceChannel = SubscribableDeviceChannel & "hwVersion"|"deviceId"|"selectOption"|"accessOption";
export type ChannelCallback = (data:ArrayBuffer) => void;

export interface DeviceInterface {
    initialize: (reinit?:boolean) => Promise<boolean>
    scan: (duration:number, cb:(scanResult:DeviceScanResult) => void) => Promise<void>;
    stopScan: () => Promise<void>;
    connect: (scanResult:DeviceScanResult) => Promise<ConnectResult>;
    disconnect: () => Promise<boolean>;
    subscribe: (channel:SubscribableDeviceChannel, cb: ChannelCallback) => Promise<boolean>;
    unsubscribe: (channel:SubscribableDeviceChannel) => Promise<boolean>;
    read: (channel:DeviceChannel) => Promise<string>;
    write: (channel:DeviceChannel, data:ArrayBuffer) => Promise<boolean>;
    getConnectionInfo: () => ConnectResult|null;
    isReady: () => boolean;    
}