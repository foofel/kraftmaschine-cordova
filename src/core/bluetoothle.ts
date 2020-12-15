import { Hx711CalibrationData, Hx711CalibrationList } from '@/components/typeexports';
import { BLEServiceInfo } from '@/config';
import { WeightMessage } from './sensorreader';

export interface ScanCallbackInterface {
    name:string;
    address:string;
    error:string;
}

export interface BluetoothLE {
    connect: (address:string) => Promise<boolean>;
    disconnect: (address:string) => Promise<boolean>;
    subscribe: (characteristic:string, cb:(data:ArrayBuffer) => void) => Promise<boolean>;
    unsubscribe: (characteristic:string) => Promise<boolean>;
    getAddress: () => string;
    getDeviceId: () => string;
    startScan: (cb:(result: ScanCallbackInterface) => void, duration:number) => any;
    stopScan: (timerId:any) => void;
}

class BluetoothLEHelpers {
    private static easyScanTimeout:any = null;
    constructor() {}
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
        }, 100);
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
    /*static startScanp = (cb: (result: BluetoothlePlugin.ScanStatus) => void) => new Promise<BluetoothlePlugin.ScanStatus>((resolve, reject) => {
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
    });*/
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
    /*static easyScanp = async (duration: number) => new Promise<Array<BluetoothlePlugin.ScanStatus>>((resolve, reject) => {
        const params = {
            services: ["0x2a98"],
            allowDuplicates: false
            scanMode: BluetoothlePlugin.BluetoothScanMode.SCAN_MODE_LOW_LATENCY,
            matchMode: BluetoothlePlugin.BluetoothMatchMode.MATCH_MODE_AGRESSIVE,
            matchNum: BluetoothlePlugin.BluetoothMatchNum.MATCH_NUM_ONE_ADVERTISEMENT,
            callbackType: BluetoothlePlugin.BluetoothCallbackType.CALLBACK_TYPE_ALL_MATCHES
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
    });*/
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
    static readp = (address:string, service:string, characteristic:string) => new Promise<BluetoothlePlugin.OperationResult>((resolve, reject) => {
        const params = {
            address: address,
            service: service,
            characteristic: characteristic
        }
        bluetoothle.read(
            (result: BluetoothlePlugin.OperationResult) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            },
            params
        );
    });
    static easyScanStart = (cb:(result: ScanCallbackInterface) => void, duration:number) => {
        // we need the location permission to be allowed to scan for (non paired) devices, request if not already granted... howe to check this?
        const params = {
            services: [BLEServiceInfo.servidceId],
            allowDuplicates: false,
            isConnectable: true
        }
        // TODO: need to implement retrieveConnected for ios
        let timeout:any = setTimeout(async () => {
            try {
                BluetoothLEHelpers.easyScanTimeout = null;
                const stopScanr = await BluetoothLEHelpers.stopScanp();
                cb({name: "", address: "", error: "done"});
            } catch(e) {}
        }, duration * 1000);
        bluetoothle.startScan(
            (result:BluetoothlePlugin.ScanStatus) => {
                if(result.status === "scanStarted") {
                } else if(result.status === "scanResult") {
                    cb({name: result.name, address: result.address, error: ""});
                }
            }, 
            (error:BluetoothlePlugin.Error) => {
                cb({name: "", address: "", error: error.message});
                if(timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
            }, 
            params
        );
        return timeout;
    }

    static easyScanStopp = (timoeutId:any) => {
        if(timoeutId) {
            clearTimeout(timoeutId);
            timoeutId = null;
            return BluetoothLEHelpers.stopScanp();
        }
    }
}

const Base64Binary = {
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	
	/* will return a  Uint8Array type */
	decodeArrayBuffer: function(input:string) {
		const bytes = (input.length/4) * 3;
		const ab = new ArrayBuffer(bytes);
		this.decode(input, ab);
		return ab;
	},

	removePaddingChars: function(input:string){
		const lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
		if(lkey == 64){
			return input.substring(0,input.length - 1);
		}
		return input;
	},

	decode: function (input:string, arrayBuffer:ArrayBuffer) {
		//get last chars to see if are valid
		input = this.removePaddingChars(input);
		input = this.removePaddingChars(input);

		const bytes = input.length / 4 * 3;
		
		let uarray;
		let chr1, chr2, chr3;
		let enc1, enc2, enc3, enc4;
		let i = 0;
		let j = 0;
		
		if (arrayBuffer) {
			uarray = new Uint8Array(arrayBuffer);
		} else {
			uarray = new Uint8Array(bytes);
        }
        
		input = input.replace(/[^A-Za-z0-9+/=]/g, "");
		
		for (i=0; i<bytes; i+=3) {	
			//get the 3 octects in 4 ascii chars
			enc1 = this._keyStr.indexOf(input.charAt(j++));
			enc2 = this._keyStr.indexOf(input.charAt(j++));
			enc3 = this._keyStr.indexOf(input.charAt(j++));
			enc4 = this._keyStr.indexOf(input.charAt(j++));
	
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
	
			uarray[i] = chr1;			
			if (enc3 != 64) uarray[i+1] = chr2;
			if (enc4 != 64) uarray[i+2] = chr3;
		}
	
		return uarray;	
	}
}

export class CordovaBluetoothLE implements BluetoothLE {

    connectedAddress:string = "";
    connectedDeviceId:string = "";
    startupSuccess:boolean = false;

    constructor() {
        const start = async () => {
            console.log("[ble] STARTING BLUETOOTH");
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
            this.startupSuccess = true;
        }
        start();
    }

    async connect(address:string): Promise<boolean>
    {
        if(!this.startupSuccess) {
            console.log("[ble] blue startup war not cuccessfull unable to use bluetooth");
            return false;
        }
        const prevConnected = this.connectedAddress
        this.connectedAddress = "";
        this.connectedDeviceId = "";
        try {
            console.log("[ble] trying to connect");
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
           /* let isConnected = false;
            try {
                console.log("[ble] getting connection state");
                const isconnectedr = await BluetoothLEHelpers.isConnectedp(address);
                isConnected = isconnectedr.isConnected;
            } catch(e) {}
            console.log(`[ble] (isConnectedp)`, { isConnected: isConnected });*/
            // trying to solve dead object exception in the bluetooth stack and
            // other things (mts/disvocery) when it thinks it has a good connection

            // if the app reloads it can happen that ble still remembers the previus connection as 
            // "we once connected there" and wans a reconnect not connect, therefore we yust try to close both
            // before we connect somewhere new, this is mostly a dev thing as is should not happen later on but 
            // whatever, doenst hut.            
            //if(isConnected) {
            try {
                console.log("[ble] close connection (prev");
                const closer = await BluetoothLEHelpers.closep(prevConnected);
                console.log(closer);
                if(closer.status !== "closed") {
                    return false;
                }
            } catch(e) {}
            try {
                console.log("[ble] close connection (prev");
                const closer = await BluetoothLEHelpers.closep(address);
                console.log(closer);
                if(closer.status !== "closed") {
                    return false;
                }
            } catch(e) {}            
            //}
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
            // we now use the binary format that uses 12/13 bytes only so no mtu chnage needed anymore
            //console.log("[ble] trying to set mtu");
            //const mtur = await BluetoothLEHelpers.mtup(address, 64);
            //console.log(`[ble] (mtup)`, mtur);
            //if(mtur.mtu !== 64) {
            //    console.log("[ble] unable to set mtu");
            //}
            this.connectedAddress = address;
            console.log("[ble] getting device id");
            const devIdr = await BluetoothLEHelpers.readp(address, BLEServiceInfo.servidceId, BLEServiceInfo.deviceIdCharacteristicId);
            const devId = atob(devIdr.value);
            console.log("[ble] (readp)", devId);
            this.connectedDeviceId = devId;
            console.log("[ble] DONE");
            return true;
        } catch(e) {
            console.log(`[ble] error while connecting`, e);
        }
        return false;
    }

    async disconnect(address:string): Promise<boolean> {
        const closer = await BluetoothLEHelpers.closep(address);
        this.connectedAddress = "";
        this.connectedDeviceId = "";        
        return closer.status == "closed";
    }

    async subscribe(characteristic:string, cb:(data:ArrayBuffer) => void): Promise<boolean>
    {
        try {
            console.log("[ble] trying to subscribe");
            const subscriber = await BluetoothLEHelpers.subscribep(this.connectedAddress, BLEServiceInfo.servidceId, characteristic, (data:string) => {
                if(data) {
                    const ab = Base64Binary.decodeArrayBuffer(data);
                    cb(ab);
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
            const unsubscriber = await BluetoothLEHelpers.unsubscribep(this.connectedAddress, BLEServiceInfo.servidceId, characteristic);
            console.log(`[ble] (unsubscribep)`, unsubscriber);
        } catch(e) {
            console.log(`[ble] error while unsubscribing`, e);
        }
        return false;
    }

    getAddress(): string {
        return this.connectedAddress;
    }

    getDeviceId(): string {
        return this.connectedDeviceId;
    }

    startScan(cb:(result: ScanCallbackInterface) => void, duration:number) {
        return BluetoothLEHelpers.easyScanStart(cb, duration);
    }

    async stopScan(timerId:any) {
        await BluetoothLEHelpers.easyScanStopp(timerId);
    }
}

////////////////////////////////////////////////////////////////////////////

interface ConnectionData {
    device:BluetoothDevice;
    server:BluetoothRemoteGATTServer;
    service:BluetoothRemoteGATTService;
    characteristic:BluetoothRemoteGATTCharacteristic;
    deviceId:string;
}

export class WebBluetoothLE implements BluetoothLE {

    connectionData:ConnectionData|null = null;

    constructor() {}

    async connect(_:string): Promise<boolean>
    {
        return false;
        /*const devices = await navigator.bluetooth.getDevices();
        let device:BluetoothDevice;
        if(devices.length > 0) {
            device = devices[0];
            device.watchAdvertisements();
            await new Promise<void>((resolve, reject) => {
                const cb = (e:Event) => {
                    console.log(`found paired device`, e.currentTarget);
                    device.removeEventListener("advertisementreceived", cb);
                    resolve();
                }
                device.addEventListener("advertisementreceived", cb);
            });
        } else {
            console.log("+++ USER INTERACTION FOR BLUETOOTH NEEDED +++");
            const userInteraction = new Promise<void>((resolve, reject) => {
                const listener = (ev:MouseEvent) => {
                    window.removeEventListener("mousedown", listener);
                    console.log("user event found");
                    ev.preventDefault();
                    resolve();
                }
                window.addEventListener("mousedown", listener)
            });
            const muh = await userInteraction;
            device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: "KraftMaschine" }
                ],
                optionalServices: [BLEServiceInfo.servidceId]
            });
        }
        if(device !== null && device !== undefined) {
            console.log('closing connection');
            device.gatt?.disconnect();
            console.log('connection closed');
            if(device.gatt !== undefined && device.gatt !== null) {
                console.log('Connecting to GATT Server...');
                const server = await device.gatt.connect();
                console.log("connection done, result: ");
                console.log(server);
                console.log('Getting Service...');
                const service = await server.getPrimaryService(BLEServiceInfo.servidceId);
                console.log('Getting Characteristic...');
                const testAllChars = await service.getCharacteristics();
                const characteristic = await service.getCharacteristic(BLEServiceInfo.weightCharacteristicId);
                const devIdC = await service.getCharacteristic(BLEServiceInfo.deviceIdCharacteristicId);
                const devIdBuffer = await devIdC.readValue();
                const devId = new TextDecoder().decode(devIdBuffer.buffer);
                console.log("connected to device", devId);
                this.connectionData = { 
                    device: device,
                    server: server,
                    service: service,
                    characteristic: characteristic,
                    deviceId: devId
                }
                console.log('Connected!');
                return true;
            }
        } else {
            return false;
        }
        return false;*/
    }

    async disconnect(address:string): Promise<boolean> {
        this.connectionData?.server.disconnect();
        return true;
    }

    async subscribe(characteristic:string, cb:(data:ArrayBuffer) => void): Promise<boolean>
    {
        if(this.connectionData !== null) {
            const characteristic = await this.connectionData.characteristic.startNotifications();
            console.log(characteristic)
            console.log('> Notifications started');
            const decoder = new TextDecoder("utf-8");
            characteristic.addEventListener('characteristicvaluechanged', (evt:Event) => {
                if(evt.target) {
                    const internal = (evt.target as BluetoothRemoteGATTCharacteristic);
                    if(internal.value) {
                        cb(internal.value.buffer);
                    }
                }
            });
            return true;
        }
        return false;
    }

    async unsubscribe(characteristic:string): Promise<boolean>
    {
        if(this.connectionData !== null) {
            const characteristic = await this.connectionData.characteristic.stopNotifications();
            return true;
        }
        return false;
    }

    getAddress(): string {
        return "invalid for webble";
    }

    getDeviceId(): string {
        return this.connectionData?.deviceId || "";
    }

    startScan(cb:(result: ScanCallbackInterface) => void, duration:number) {}
    stopScan(timerId:any) {}

}