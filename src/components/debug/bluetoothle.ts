//import { bluetoothle, BluetoothlePlugin } from './index.d';

declare var bluetoothle:any;

declare namespace BluetoothlePlugin {

    export type Status = "scanStarted" | "scanStopped" | "scanResult" | "connected" | "disconnected"
    | "bonding" | "bonded" | "unbonded" | "closed" | "services" | "discovered"
    | "characteristics" | "descriptors" | "read" | "subscribed" | "unsubscribed"
    | "subscribedResult" | "written" | "readDescriptor" | "writeDescriptor"
    | "rssi" | "mtu" | "connectionPriorityRequested" |"enabled" | "disabled"
    | "readRequested" | "writeRequested" | "mtuChanged" | "notifyReady" | "notifySent"
    | "serviceAdded" | "serviceRemoved" | "allServicesRemoved" | "advertisingStarted"
    | "advertisingStopped" | "responded" | "notified" | "notificationSent";

    /** Avaialable connection priorities */
    export type ConnectionPriority = "low" | "balanced" | "high";

    export interface AdapterInfo {
    name:string;
    address:string
    isInitialized:boolean;
    isEnabled:boolean;
    isScanning:boolean;
    isDiscoverable:boolean;
    }

    export interface Params {
    /** The address/identifier provided by the scan's return object */
    address: string,
    /** The service's ID */
    service: string
    }

    export interface InitPeripheralParams {
    /** Should user be prompted to enable Bluetooth */
    request?: boolean,
    /* A unique string to identify your app. Bluetooth Central background mode is required to use this, but background mode doesn't seem to require specifying the restoreKey */
    restoreKey?: string

    }

    export interface InitParams extends InitPeripheralParams {
    /** Should change in Bluetooth status notifications be sent */
    statusReceiver?: boolean,
    }

    export interface ScanParams {
    /* An array of service IDs to filter the scan or empty array / null. This parameter is not supported on Windows platform yet */
    services?: string[],
    /** True/false to allow duplicate advertisement packets, defaults to false (iOS)*/
    allowDuplicates?: boolean,
    /** Defaults to Low Power. Available from API21 / API 23 (Android) */
    scanMode?: BluetoothScanMode,
    /** Defaults to Aggressive. Available from API23 (Android) */
    matchMode?: BluetoothMatchMode,
    /** Defaults to One Advertisement. Available from API23 (Android) */
    matchNum?: BluetoothMatchNum,
    /** Defaults to All Matches. Available from API21 / API 23. (Android) */
    callbackType?: BluetoothCallbackType,
    /** True/false to show only connectable devices, rather than all devices ever seen, defaults to false (Windows)*/
    isConnectable?: boolean
    }

    export interface NotifyParams {
    /** Service's UUID */
    service: string,
    /** Characteristic's UUID */
    characteristic: string,
    /** Base64 encoded string, number or string */
    value: string
    }

    export interface RespondParams {
    /** This integer value will be incremented every read/writeRequested */
    requestId: number,
    /** base64 string */
    value: string,
    /** not documented */
    offset?: number
    }

    export interface CharacteristicParams extends Params {
    /** An array of characteristic IDs to discover or empty array / null */
    characteristics?: string[]
    }

    export interface DescriptorParams extends Params {
    /** The characteristic's ID */
    characteristic: string
    }

    export interface OperationDescriptorParams  extends DescriptorParams {
    /** The descriptor's ID */
    descriptor: string
    }

    export interface WriteCharacteristicParams extends DescriptorParams {
    /* Base64 encoded string */
    value: string,
    /* Set to "noResponse" to enable write without response, all other values will write normally. */
    type?: string
    }

    export interface WriteQCharacteristicParams extends WriteCharacteristicParams {
    /* Define the size of packets. This should be according to MTU value */
    chunkSize?: number
    }

    export interface WriteDescriptorParams extends DescriptorParams {
    /** The descriptor's ID */
    descriptor: string,
    /** Base64 encoded string, number or string */
    value: string
    }

    export type AdvertisingParams = AdvertisingParamsAndroid | AdvertisingParamsIOS;
    export type AdvertiseMode = "balanced" | "lowLatency" | "lowPower";
    export type TxPowerLevel = "high" | "low" | "ultralow" | "medium";

    export interface AdvertisingParamsAndroid {
    /** Service UUID on Android */
    service: string,
    /** not documented */
    mode?: AdvertiseMode,
    /** not documented */
    connectable?: boolean,
    /** not documented */
    timeout?: number,
    /** not documented */
    txPowerLevel?: TxPowerLevel,
    /** not documented */
    manufacturerId?: number,
    /** not documented */
    manufacturerSpecificData?: any,
    /** not documented */
    includeDeviceName: boolean,
    /** not documented */
    includeTxPowerLevel: boolean
    }

    export interface AdvertisingParamsIOS {
    /** Array of service UUIDs on iOS */
    services: string[],
    /** device's name */
    name?: string
    }

    export interface CommonInfo {
    /** The device's display name */
    name: string,
    /** The device's address / identifier for connecting to the object */
    address: string,
    }

    export interface DeviceInfo extends CommonInfo{
    /** Device's status */
    status: Status;
    }

    export interface RSSI extends DeviceInfo {
    /** signal strength */
    rssi: number
    }

    export interface MTU extends DeviceInfo {
    /* mtu value */
    mtu: number
    }

    export interface BondedStatus extends CommonInfo {
    /** Bonded status*/
    isBonded: boolean
    }

    export interface PrevConnectionStatus extends CommonInfo {
    /** Determine whether the device was connected */
    wasConnected: boolean
    }

    export interface CurrConnectionStatus extends CommonInfo {
    /** Determine whether the device is connected */
    isConnected: boolean
    }

    export interface DiscoverStatus extends CommonInfo {
    /** Determine whether the device's characteristics and descriptors have been discovered */
    isDiscovered: boolean
    }

    export interface ScanStatus extends DeviceInfo {
        /** signal strength */
        rssi: number,
        /**
         * advertisement data in encoded string of bytes, use bluetoothle.encodedStringToBytes() (Android)
         * advertisement hash with the keys (iOS)
         * empty (Windows)
         */
        advertisement: {
            /** An array of service UUIDs */
            serviceUuids: string[],
            /** A string representing the name of the manufacturer of the device */
            manufacturerData: string,
            /** A number containing the transmit power of a peripheral */
            txPowerLevel: number,
            /** An array of one or more CBUUID objects, representing CBService UUIDs that were found in the “overflow” area of the advertisement data */
            overflowServiceUuids: string[],
            /** A boolean value that indicates whether the advertising event type is connectable */
            isConnectable: boolean,
            /** An array of one or more CBUUID objects, representing CBService UUIDs */
            solicitedServiceUuids: string[],
            /* A dictionary containing service-specific advertisement data */
            serviceData: any,
            /* A string containing the local name of a peripheral */
            localName: string
        } | string;
    }

    interface Service {
        /** Service's uuid */
        uuid: string,
        /** Array of characteristics */
        characteristics : Characteristic[]
    }

    export interface Characteristic {
        /* Array of descriptors */
        descriptors?: Descriptor[],
        /**  Characteristic's uuid */
        uuid: string,
        /**
         *  Characteristi's properties
         *  If the property is defined as a key, the characteristic has that property
         */
        properties?: {
            write?: boolean,
            broadcast?: boolean,
            extendedProps?: boolean,
            writeWithoutResponse?: boolean,
            writeNoResponse?: boolean,
            signedWrite?: boolean,
            read?: boolean,
            notify?: boolean,
            indicate?: boolean,
            authenticatedSignedWrites?: boolean,
            notifyEncryptionRequired?: boolean,
            indicateEncryptionRequired?: boolean
        },
        /**
         *  If the permission is defined as a key, the character has that permission
         */
        permissions?: {
            read?: boolean,
            readEncrypted?: boolean,
            readEncryptedMITM?: boolean
            write?: boolean,
            writeSigned?: boolean,
            writeSignedMITM?: boolean,
            writeEncryptedMITM?: boolean,
            readEncryptionRequired?: boolean,
            writeEncryptionRequired?: boolean
        }
    }

    export interface Descriptor {
        uuid: string;
    }

    export interface Device extends DeviceInfo {
        /** Device's services */
        services: Service[]
    }

    export interface Services extends DeviceInfo {
        /** Array of service UUIDS */
        services: string[],
    }

    export interface Descriptors extends DeviceInfo {
        /** Characteristic's UUID */
        characteristic: string,
        /** Service's UUID */
        service: string,
        /* Array of descriptor UUIDs */
        descriptors: string[],
    }

    export interface OperationResult extends DeviceInfo {
        /** Characteristic UUID */
        characteristic: string,
        /** Service's UUID */
        service: string,
        /** Base64 encoded string of bytes */
        value: string
    }

    export interface UnsubscribeResult extends DeviceInfo {
        /** Characteristic UUID */
        characteristic: string,
        /** Service's UUID */
        service: string,
    }

    export interface DescriptorResult extends OperationResult {
        descriptor: string
    }

    export interface Characteristics extends DeviceInfo {
        /** Service's id */
        service: string,
        /** Array of characteristic objects*/
        characteristics: Characteristic[],
    }

    export interface  InitializeResult {
        /** Device's status */
        status: Status,
        /** The address/identifier provided by the scan's return object */
        address: string,
        /** Service's UUID */
        service: string,
        /** Characteristic UUID */
        characteristic: string,
        /** This integer value will be incremented every read/writeRequested */
        requestId: number,
        /** Offset value */
        offset: number,
        /** mtu value */
        mtu: number,
        /** Base64 encoded string of bytes */
        value: string
    }

    export enum BluetoothScanMode {
        SCAN_MODE_OPPORTUNISTIC = -1,
        SCAN_MODE_LOW_POWER = 0,
        SCAN_MODE_BALANCED = 1,
        SCAN_MODE_LOW_LATENCY = 2
    }

    export enum BluetoothMatchMode {
        MATCH_MODE_AGRESSIVE = 1,
        MATCH_MODE_STICKY = 2
    }

    export enum BluetoothMatchNum {
        MATCH_NUM_ONE_ADVERTISEMENT = 1,
        MATCH_NUM_FEW_ADVERTISEMENT = 2,
        MATCH_NUM_MAX_ADVERTISEMENT = 3
    }

    export enum BluetoothCallbackType {
        CALLBACK_TYPE_ALL_MATCHES = 1,
        CALLBACK_TYPE_FIRST_MATCH = 2,
        CALLBACK_TYPE_MATCH_LOST = 4
    }

    export interface Error {
        code: number,
        message: string
    }
}

class BluetoothLEHelpers {
    constructor() {}
    static scan() {}
    static initializep = () => new Promise<{ status: 'enabled' | 'disabled' }>((resolve, reject) => {
        const params = { 
            request: true, 
            statusReceiver: false, 
            restoreKey : "bluetoothleplugin" 
        };
        bluetoothle.initialize((result: { status: 'enabled' | 'disabled' }) => { 
            if(result.status === "enabled") {
                resolve();
            } else {
                reject(new Error("unable to init bluetooth"));
            }
        }, params)
    });
    static disconnectp = (address:string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const params = {
            address: address
        };
        bluetoothle.disconnect(
            (result: BluetoothlePlugin.DeviceInfo) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });    
    static enablep = (address:string) => new Promise<{ status: boolean }>((resolve, reject) => {
        const params = {
            address: address
        };
        bluetoothle.enable(
            (result: { status: boolean }) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        );
    });
    static closep = (address:string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const params = {
            address: address
        };
        bluetoothle.close(
            (result: BluetoothlePlugin.DeviceInfo) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static connectp = (address:string, autoConnect:boolean = false) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const params = {
            address: address,
            autoConnect: autoConnect
        };
        bluetoothle.connect(
            (result: BluetoothlePlugin.DeviceInfo) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static discoverp = (address:string) => new Promise<BluetoothlePlugin.Device>((resolve, reject) => {
        const params = {
            address: address,
            clearCache: true
        };
        bluetoothle.discover(
            (result: BluetoothlePlugin.Device) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static mtup = (address:string, mtu:number) => new Promise<BluetoothlePlugin.MTU>((resolve, reject) => {
        const params = {
            address: address,
            mtu: mtu
        };
        bluetoothle.mtu(
            (result: BluetoothlePlugin.MTU) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static subscribep = 
    (address:string, service:string, characteristic:string, cb:(data:string) => {}) => 
    new Promise<BluetoothlePlugin.OperationResult>((resolve, reject) => {
        const params = {
            address: address,
            service: service,
            characteristic: characteristic
        };
        bluetoothle.subscribe(
            (result: BluetoothlePlugin.OperationResult) => {
                if(result.status === "subscribed") {
                    resolve(result);
                } else if(result.status === "subscribedResult") {
                    cb(result.value);
                }
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });     
    static unsubscribep = (address:string, service:string, characteristic:string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const params = {
            address: address,
            service: service,
            characteristic: characteristic
        };
        bluetoothle.unsubscribe(
            (result: BluetoothlePlugin.DeviceInfo) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static getAdapterInfop = () => new Promise<BluetoothlePlugin.AdapterInfo>((resolve, reject) => {
        bluetoothle.getAdapterInfo(
            (result: BluetoothlePlugin.AdapterInfo) => {
                resolve(result);
            }
        );
    });
    static startScanp = (cb: (result:BluetoothlePlugin.ScanStatus) => {}) => new Promise<BluetoothlePlugin.ScanStatus>((resolve, reject) => {
        const params = {
            services: ["181D"], // "180D", "180F", 
            allowDuplicates: false,
            scanMode: BluetoothlePlugin.BluetoothScanMode.SCAN_MODE_LOW_LATENCY,
            matchMode: BluetoothlePlugin.BluetoothMatchMode.MATCH_MODE_AGRESSIVE,
            matchNum: BluetoothlePlugin.BluetoothMatchNum.MATCH_NUM_ONE_ADVERTISEMENT,
            callbackType: BluetoothlePlugin.BluetoothCallbackType.CALLBACK_TYPE_ALL_MATCHES,
            isConnectable: true
        };
        bluetoothle.startScan(
            (result: BluetoothlePlugin.ScanStatus) => {
                if(result.status === "scanStarted") {
                    resolve(result);
                } else if(result.status === "scanResult") {
                    cb(result);
                }
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static stopScanp = () => new Promise<{ status: string }>((resolve, reject) => {
        bluetoothle.stopScan(
            (result: { status: string }) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        );
    });
    static easyScanp = async (duration:number) => new Promise<Array<BluetoothlePlugin.ScanStatus>>((resolve, reject) => {
        const params = {
            services: ["180D", "180F", "181D"], // , 
            allowDuplicates: false,
            scanMode: 2, //BluetoothlePlugin.BluetoothScanMode.SCAN_MODE_LOW_LATENCY,
            matchMode: 1, //BluetoothlePlugin.BluetoothMatchMode.MATCH_MODE_AGRESSIVE,
            matchNum: 1, //BluetoothlePlugin.BluetoothMatchNum.MATCH_NUM_ONE_ADVERTISEMENT,
            callbackType: 1, //BluetoothlePlugin.BluetoothCallbackType.CALLBACK_TYPE_ALL_MATCHES,
            isConnectable: true
        };
        let results:Array<BluetoothlePlugin.ScanStatus> = [];
        bluetoothle.startScan(
            (result: BluetoothlePlugin.ScanStatus) => {
                if(result.status === "scanStarted") {
                    setTimeout(async () => {
                        //bluetoothle.stopScan(() => {}, () => {});
                        let result = await BluetoothLEHelpers.stopScanp() as any;
                        if(result.status !== "scanStopped") {
                            console.log("unable to stop scan, really?");
                        }
                        resolve(results);
                    }, duration * 1000);
                } else if(result.status === "scanResult") {
                    results.push(result);
                }
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    //TODO: bonding?/read/write/isbonded?
    // connect shout timeout with disconnect or close
}

export class BluetoothLEConnector {
    constructor(targetName:string, targetAddres:string) {
        this.run();
    }

    async run() {
        let state = await BluetoothLEHelpers.getAdapterInfop();
        if(state.isScanning) {
            console.log("scan already in progress, stopping");
            let result = await BluetoothLEHelpers.stopScanp();
            console.log("scan stop result: ", result);
        }
        let init = await BluetoothLEHelpers.initializep();
        let scan = await BluetoothLEHelpers.easyScanp(10);
        debugger;
    }

}

// Use // eslint-disable-next-line to ignore the next line.
// Use /* eslint-disable */ to ignore all warnings in a file.