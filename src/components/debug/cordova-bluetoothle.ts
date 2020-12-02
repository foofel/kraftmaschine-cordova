import { add, reject } from 'lodash';
import { BluetoothLE } from './bluetoothle'

class BluetoothLEHelpers {
    constructor() {}
    static scan() {}
    static initializep = (cb: (result: { status: 'enabled' | 'disabled' }) => void) => new Promise<{ status: 'enabled' | 'disabled' }>((resolve, reject) => {
        const params = { 
            request: true, 
            statusReceiver: false, 
            restoreKey : "bluetoothleplugin" 
        };
        bluetoothle.initialize((result: { status: 'enabled' | 'disabled' }) => { 
            if(result.status === "enabled") {
                resolve(result);
            } else {
                reject(new Error("unable to init bluetooth"));
            }
            cb(result);
        }, params);
    });
    static disconnectp = (address: string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
    static enablep = () => new Promise<{ status: boolean }>((resolve, reject) => {
        bluetoothle.enable(
            (result: { status: boolean }) => {
                // this is never used, fuck you
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        );
        setTimeout(() => {
            resolve({ status: true });
        }, 20);
    });
    static closep = (address: string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
    static connectp = (address: string, cb: (result:BluetoothlePlugin.DeviceInfo) => void, autoConnect = false) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const params = {
            address: address,
            autoConnect: autoConnect
        };
        bluetoothle.connect(
            (result: BluetoothlePlugin.DeviceInfo) => {
                cb(result);
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });
    static reconnectp = (address: string, autoConnect = false) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const params = {
            address: address,
            autoConnect: autoConnect
        };
        bluetoothle.reconnect(
            (result: BluetoothlePlugin.DeviceInfo) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });    
    static discoverp = (address: string) => new Promise<BluetoothlePlugin.Device>((resolve, reject) => {
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
    static isDiscovered = (address: string) => new Promise<BluetoothlePlugin.DiscoverStatus>((resolve, reject) => {
        const params = {
            address: address,
            clearCache: true
        };
        bluetoothle.isDiscovered(
            (result: BluetoothlePlugin.DiscoverStatus) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        , params);
    });    
    static mtup = (address: string, mtu: number) => new Promise<BluetoothlePlugin.MTU>((resolve, reject) => {
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
    (address: string, service: string, characteristic: string, cb: (data: string) => void) => 
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
    static unsubscribep = (address: string, service: string, characteristic: string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
    static getAdapterInfop = () => new Promise<BluetoothlePlugin.AdapterInfo>((resolve, _) => {
        bluetoothle.getAdapterInfo(
            (result: BluetoothlePlugin.AdapterInfo) => {
                resolve(result);
            }
        );
    });
    static startScanp = (cb: (result: BluetoothlePlugin.ScanStatus) => void) => new Promise<BluetoothlePlugin.ScanStatus>((resolve, reject) => {
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
    static easyScanp = async (duration: number) => new Promise<Array<BluetoothlePlugin.ScanStatus>>((resolve, reject) => {
        const params = {
            services: ["181D"],
            allowDuplicates: false,
            scanMode: 2, //BluetoothlePlugin.BluetoothScanMode.SCAN_MODE_LOW_LATENCY,
            matchMode: 1, //BluetoothlePlugin.BluetoothMatchMode.MATCH_MODE_AGRESSIVE,
            matchNum: 1, //BluetoothlePlugin.BluetoothMatchNum.MATCH_NUM_ONE_ADVERTISEMENT,
            callbackType: 1, //BluetoothlePlugin.BluetoothCallbackType.CALLBACK_TYPE_ALL_MATCHES,
            isConnectable: true
        };
        const results: Array<BluetoothlePlugin.ScanStatus> = [];
        bluetoothle.startScan(
            (result: BluetoothlePlugin.ScanStatus) => {
                if(result.status === "scanStarted") {
                    setTimeout(async () => {
                        //bluetoothle.stopScan(() => {}, () => {});
                        const result = await BluetoothLEHelpers.stopScanp() as any;
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
    static isConnectedp = (address:string) => new Promise<BluetoothlePlugin.CurrConnectionStatus>((resolve, reject) => {
        const parama = {
            address: address
        }
        bluetoothle.isConnected(
            (result: BluetoothlePlugin.CurrConnectionStatus) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            },
            parama
        );
    });
    static wasConnectedp = (address:string) => new Promise<BluetoothlePlugin.PrevConnectionStatus>((resolve, reject) => {
        const parama = {
            address: address
        }
        bluetoothle.wasConnected(
            (result: BluetoothlePlugin.PrevConnectionStatus) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            },
            parama
        );
    });
    static bondp = (address:string) => new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
        const parama = {
            address: address
        }
        bluetoothle.bond(
            (result: BluetoothlePlugin.DeviceInfo) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            },
            parama
        );
    });
    static isBondedp = (address:string) => new Promise<BluetoothlePlugin.BondedStatus>((resolve, reject) => {
        const parama = {
            address: address
        }
        bluetoothle.isBonded(
            (result: BluetoothlePlugin.BondedStatus) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            },
            parama
        );
    });
    static isInitializedp = () => new Promise<{ isInitialized: boolean }>((resolve, reject) => {
        bluetoothle.isInitialized(
            (result: { isInitialized: boolean }) => {
                resolve(result);
            }
        );
    });
    static isEnabledp = () => new Promise<{ isEnabled: boolean }>((resolve, reject) => {
        bluetoothle.isEnabled(
            (result: { isEnabled: boolean }) => {
                resolve(result);
            }
        );
    });
}

export class CordovaBluetoothLE implements BluetoothLE {

    connectedAddress:string = "";
    myService:string = "181D";
    myCharacteristic:string = "2A98";

    constructor(targetName: string, targetAddres: string) {}

    async scan(filter:Array<string|number>): Promise<Array<string|number>>
    {
        return [];
    }

    defer() {
        const deferred:any = {
            promise: null,
            resolve: null,
            reject: null
        };
        deferred.promise = new Promise((resolve, reject) => {
            deferred.resolve = resolve;
            deferred.reject = reject;
        });
        return deferred;
    }    

    async connect(address:string): Promise<boolean>
    {
        this.connectedAddress = "";
        try {
            console.log("[ble] STARTING");
            console.log("[ble] getting initislized state");
            const isInitializedr = await BluetoothLEHelpers.isInitializedp();
            console.log(`[ble] (isInitializedp)`, isInitializedr);
            if(!isInitializedr.isInitialized) {
                console.log("[ble] not initialized, trying init");
                const initr = await BluetoothLEHelpers.initializep((result: { status: 'enabled' | 'disabled' }) => {
                    console.log(`[ble] #################################### enabled state changed: ${result.status}`);
                });
                console.log(`[ble] (initializep)`, initr);
                if(initr.status !== "enabled") {
                    return false;
                }
            }
            console.log("[ble] getting enabled state");
            const isEnabledr = await BluetoothLEHelpers.isEnabledp();
            console.log(`[ble] (isEnabledp)`, isEnabledr);            
            if(!isEnabledr.isEnabled) {
                console.log("[ble] not enabled, trying enable");
                const enabler = await BluetoothLEHelpers.enablep();
                console.log(`[ble] (enablep)`, enabler);
                if(!enabler.status) {
                    return false;
                }
            }
            // isConnected throws an error if we were never connected to this device...
            let isConnected = false;
            try {
                console.log("[ble] getting connection state");
                const isconnectedr = await BluetoothLEHelpers.isConnectedp(address);
                isConnected = isconnectedr.isConnected;
            } catch(e) {}
            console.log(`[ble] (isConnectedp)`, { isConnected: isConnected });
            // trying to solve dead object exception in the bluetooth stack and
            // other things (mts/disvocery) when it thinks it has a good connection
            if(isConnected) {
                console.log("[ble] close connection");
                const closer = await BluetoothLEHelpers.closep(address);
                console.log(closer);
                if(closer.status !== "closed") {
                    return false;
                }
            }
            console.log("[ble] trying to connect");
            const connectr = await BluetoothLEHelpers.connectp(address, (result:BluetoothlePlugin.DeviceInfo) => {
                console.log(`[ble] connection status change`, result);
            });
            console.log(`[ble] (connectp)`, connectr);
            if(connectr.status !== "connected") {
                return false;
            }
            console.log("[ble] getting bonding state");
            const isbondedr = await BluetoothLEHelpers.isBondedp(address);
            console.log(`[ble] (isBondedp)`, isbondedr);
            if(!isbondedr.isBonded) {
                console.log("[ble] trying to bond");
                const bondr = await BluetoothLEHelpers.bondp(address);
                console.log(`[ble] (bondp)`, bondr); 
                if(bondr.status !== "bonded") {
                    console.log("[ble] unable to bond?! what now? :D");
                }
            }
            console.log("[ble] trying to get service discovered state");
            const isdiscoveredr = await BluetoothLEHelpers.isDiscovered(address);
            console.log(`[ble] (isDiscovered)`, isdiscoveredr);
            if(!isdiscoveredr.isDiscovered) {
                console.log("[ble] trying to discover services");
                const discoverr = await BluetoothLEHelpers.discoverp(address);
                console.log(`[ble] (discoverp)`, discoverr);
            }
            // TODO: check if we offer the right services/characteristics
            console.log("[ble] trying to set mtu");
            const mtur = await BluetoothLEHelpers.mtup(address, 64);
            console.log(`[ble] (mtup)`, mtur);
            if(mtur.mtu !== 64) {
                console.log("[ble] unable to set mtu");
            }
            this.connectedAddress = address;
            console.log("[ble] DONE");
            return true;
        } catch(e) {
            console.log(`[ble] error while connecting`, e);
        }
        return false;
    }

    async subscribe(characteristic:string, cb:(data:string) => void): Promise<boolean>
    {
        try {
            console.log("[ble] trying to subscribe");
            const subscriber = await BluetoothLEHelpers.subscribep(this.connectedAddress, this.myService, this.myCharacteristic, (data:string) => {
                if(data) {
                    const str = atob(data);
                    cb(str);
                }
            });
            console.log(`[ble] (subscribep)`, subscriber);
            return true;
        } catch(e) {
            console.log(`[ble] error while subscribing`, e);
        }
        return false;
    }

    async unsubscribe(characteristic:string): Promise<boolean>
    {
        try {
            console.log("[ble] trying to unsubscribe");
            const unsubscriber = await BluetoothLEHelpers.unsubscribep(this.connectedAddress, this.myService, this.myCharacteristic);
            console.log(`[ble] (unsubscribep)`, unsubscriber);
        } catch(e) {
            console.log(`[ble] error while unsubscribing`, e);
        }
        return false;
    }    

}

// Use // eslint-disable-next-line to ignore the next line.
// Use /* eslint-disable */ to ignore all warnings in a file.