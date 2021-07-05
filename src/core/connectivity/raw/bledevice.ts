import { DeviceScanResult, ConnectResult, DeviceInterface, DeviceChannel, SubscribableDeviceChannel } from '@/core/connectivity/raw/deviceinterface'
import { write, isLocationEnabled, requestLocation, hasPermission, requestPermission, stopScan, subscribe, unsubscribe,  isInitialized, initialize, isEnabled, enable, close, connect, isBonded, bond, isDiscovered, discover, mtu, read } from '@/core/connectivity/raw/blepromisify'
import { BLEServiceInfo } from '@/config'
import { asyncBarrier } from '@/core/util/util'
import Vue from 'vue'

export const DeviceChannelBLEMapping = {
    "weight": BLEServiceInfo.weightCharacteristicId,
    "env": BLEServiceInfo.envCharacteristicId,
    "light": BLEServiceInfo.lightCharacteristicId,
    "hwVersion": BLEServiceInfo.hwVersionCharacteristicId,
    "deviceId": BLEServiceInfo.deviceIdCharacteristicId,
    "selectOption": BLEServiceInfo.selectOptionId,
    "accessOption": BLEServiceInfo.accessOptionId
}

export class BleDevice implements DeviceInterface {

    connectedEndpoint:ConnectResult|null = null
    startupSuccess = false;
    _isInitializing = false;
    _isConnecting = false;
    _isConnected = false;
    _scanTimeout = 0

    constructor() {}

    async initialize(reinit?:boolean) {
        if(this._isConnecting || this._isInitializing) {
            console.log(`[ble] invalid state for init (c: ${this._isConnecting}, i:${this._isInitializing})`);
        }        
        if(this.startupSuccess && !reinit) {
            return false;
        }
        this._isInitializing = true;
        console.log("[ble] initializing bluetooth");
        console.log("[ble] getting initislized state");
        const isInitialized_r = await isInitialized();
        console.log(`[ble] (isInitialized)`, isInitialized_r);
        if(!isInitialized_r.isInitialized) {
            console.log("[ble] not initialized, trying init");
            const initialize_r = await initialize((result: { status: 'enabled' | 'disabled' }) => {
                console.log(`[ble] #################################### enabled state changed: ${result.status}`);
            });
            console.log(`[ble] (initialize)`, initialize_r);
            if(initialize_r.status !== "enabled") {
                this._isInitializing = false;
                return false;
            }
        } else {
            console.log("[ble] already initialized");
        }
        console.log("[ble] getting enabled state");
        const isEnabled_r = await isEnabled();
        console.log(`[ble] (isEnabled)`, isEnabled_r);            
        if(!isEnabled_r.isEnabled) {
            console.log("[ble] not enabled, trying enable");
            const enable_r = await enable();
            console.log(`[ble] (enable)`, enable_r);
            if(!enable_r.status) {
                this._isInitializing = false;
                return false;
            }
        } else {
            console.log("[ble] already enabled");
        }
        this.startupSuccess = true;
        this._isInitializing = false;
        return true;
    }

    async connect(scanResult:DeviceScanResult): Promise<ConnectResult>
    {
        const noneConObject = { deviceId: "", address: "", hwVersion: "", mtu: 0, success: false, info: { leftCalibration: 1, rightCalibration: 1 } };
        if(this._isConnecting || this._isInitializing) {
            console.log(`[ble] invalid state for connect (c: ${this._isConnecting}, i:${this._isInitializing})`);
            return noneConObject;
        }
        this._isConnecting = true;
        this._isConnected = false;
        if(!this.startupSuccess) {
            console.log("[ble] ble not initialized (wrong entry point?), initializing now");
            const initialize_r = await this.initialize();
            if(!initialize_r) {
                console.log("[ble] could not start ble");
                this._isConnecting = false;
                return noneConObject;
            }
        }
        const prevConnected = this.connectedEndpoint?.address || ""
        this.connectedEndpoint = null;
        console.log("[ble] trying to connect");
        console.log("[ble] getting initislized state");
        const isInitialized_r = await isInitialized();
        console.log(`[ble] (isInitialized)`, isInitialized_r);
        if(!isInitialized_r.isInitialized) {
            console.log("[ble] not initialized, trying init");
            const initialize_r = await initialize((result: { status: 'enabled' | 'disabled' }) => {
                console.log(`[ble] #################################### enabled state changed: ${result.status}`);
            });
            console.log(`[ble] (initialize)`, initialize_r);
            if(initialize_r.status !== "enabled") {
                this._isConnecting = false;
                return noneConObject;
            }
        }
        console.log("[ble] getting enabled state");
        const isEnabled_r = await isEnabled();
        console.log(`[ble] (isEnabled)`, isEnabled_r);            
        if(!isEnabled_r.isEnabled) {
            console.log("[ble] not enabled, trying enable");
            const enable_r = await enable();
            console.log(`[ble] (enable)`, enable_r);
            if(!enable_r.status) {
                this._isConnecting = false;
                return noneConObject;
            }
        }
        // isConnected throws an error if we were never connected to this device...
        /* let isConnected = false;
        try {
            console.log("[ble] getting connection state");
            const isconnectedr = await isConnectedp(address);
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
            console.log(`[ble] close connection (prev: '${prevConnected}')`);
            const close_r = await close(prevConnected);
            console.log(close_r);
            if(close_r.status !== "closed") {
                this._isConnecting = false;
                return noneConObject;
            }
        } catch(e) {}
        try {
            console.log(`[ble] close connection (current: '${scanResult.address}')`);
            const close_r = await close(scanResult.address);
            console.log(close_r);
            if(close_r.status !== "closed") {
                this._isConnecting = false;
                return noneConObject;
            }
        } catch(e) {}            
        //}
        console.log("[ble] trying to connect");
        const barrier = asyncBarrier(5);
        let connectionEstablished = false;
        const connect_r = await connect(scanResult.address, (result:BluetoothlePlugin.DeviceInfo) => {
            console.log(`[ble] connection status change`, result);
            if(result.status == "connected") {
                connectionEstablished = true;
                barrier.resolve();
            }
        });
        await barrier.promise;
        if(!connectionEstablished) {
            this._isConnecting = false;
            return noneConObject;
        }
        console.log(`[ble] (connect)`, connect_r);
        if(connect_r.status !== "connected") {
            this._isConnecting = false;
            return noneConObject;
        }
        console.log("[ble] getting bonding state");
        const isbonded_r = await isBonded(scanResult.address);
        console.log(`[ble] (isBonded)`, isbonded_r);
        if(!isbonded_r.isBonded) {
            console.log("[ble] trying to bond");
            const bond_r = await bond(scanResult.address);
            console.log(`[ble] (bond)`, bond_r); 
            if(bond_r.status !== "bonded") {
                console.log("[ble] unable to bond?! what now? :D");
            }
        }
        console.log("[ble] trying to get service discovered state");
        const isdiscovered_r = await isDiscovered(scanResult.address);
        console.log(`[ble] (isDiscovered)`, isdiscovered_r);
        if(!isdiscovered_r.isDiscovered) {
            console.log("[ble] trying to discover services");
            const discover_r = await discover(scanResult.address);
            console.log(`[ble] (discover)`, discover_r);
        }
        console.log("[ble] trying to set mtu");
        const setMtu = 256;
        const mtu_r = await mtu(scanResult.address, setMtu);
        console.log(`[ble] (mtup)`, mtu_r);
        if(mtu_r.mtu !== setMtu) {
            console.log(`[ble] unable to set mtu tu ${setMtu}, actual value is ${mtu_r.mtu}`);
        }
        console.log("[ble] getting device id");
        const devIdRaw = await read(scanResult.address, BLEServiceInfo.servidceId, BLEServiceInfo.deviceIdCharacteristicId);
        const hwVersionRaw = await read(scanResult.address, BLEServiceInfo.servidceId, BLEServiceInfo.hwVersionCharacteristicId);
        const devId = atob(devIdRaw.value);
        const hwVersion = atob(hwVersionRaw.value);
        console.log("[ble] (read)", devId);
        console.log("[ble] (read)", hwVersion);
        console.log("[ble] connected");
        this._isConnecting = false;
        this._isConnected = true;
        this.connectedEndpoint = {
            deviceId: devId,
            address: scanResult.address,
            hwVersion: hwVersion,
            mtu: mtu_r.mtu,
            success: true,
            info: {
                leftCalibration: 1,
                rightCalibration: 1
            }
        }
        return this.connectedEndpoint;
    }

    async disconnect(): Promise<boolean> {        
        const closer = await close(this.connectedEndpoint?.address || "");
        this.connectedEndpoint = null;      
        if (closer.status == "closed") {
            return true;
        }
        return false;
    }

    async subscribe(channel:SubscribableDeviceChannel, cb:(data:ArrayBuffer) => void): Promise<boolean> {    
        if(!this.connectedEndpoint) {
            console.log("[ble] unable to subscribe, not connected");    
            return false;
        }
        const characteristic = DeviceChannelBLEMapping[channel];
        if(!characteristic) {
            console.log(`[ble] no characteristic for channel ${channel}`);
            return false;
        }        
        console.log("[ble] trying to subscribe");
        const subscriber = await subscribe(this.connectedEndpoint.address, BLEServiceInfo.servidceId, characteristic, (data:string) => {
            if(data) {
                const decoded = atob(data)
                const buf = new ArrayBuffer(decoded.length);
                const bufView = new Uint8Array(buf);
                for (let i = 0, strLen = decoded.length; i < strLen; i++) {
                    const code = decoded.charCodeAt(i);
                    if (code > 255) {
                        console.log(`char '${decoded[i]}'='${code}' outside range [0, 255]`)
                        continue;
                    }
                    bufView[i] = code;
                }
                cb(buf);
            }
        });
        console.log(`[ble] (subscribep)`, subscriber);
        if(subscriber.status == "subscribed") {
            return true;
        }
        return false;
    }

    async unsubscribe(channel:SubscribableDeviceChannel): Promise<boolean> {     
        if(!this.connectedEndpoint) {
            console.log("[ble] unable to unsubscribe, not connected");    
            return false;
        }
        const characteristic = DeviceChannelBLEMapping[channel];
        if(!characteristic) {
            console.log(`[ble] no characteristic for channel ${channel}`);
            return false;
        }
        console.log("[ble] trying to unsubscribe");
        const unsubscriber = await unsubscribe(this.connectedEndpoint.address, BLEServiceInfo.servidceId, characteristic);
        console.log(`[ble] (unsubscribep)`, unsubscriber);
        return true;        
    }

    async scan(duration:number, cb:(scanResult:DeviceScanResult) => void): Promise<void> {
        if(this._isInitializing) {
            console.log(`[ble] invalid state for startScan (i:${this._isInitializing})`);
            return;
        }
        if(!this.startupSuccess) {
            console.log("[ble] ble not initialized (wrong entry point?), initializing now");
            const init_r = await this.initialize();
            if(!init_r) {
                console.log("[ble] could not start ble");
                throw new Error("unable to start bluetooth");
            }
        }
        try {
            if(this._scanTimeout) {
                clearTimeout(this._scanTimeout);
                this._scanTimeout = 0;
            }            
            const stopScan_r = await stopScan();
        } catch(e) {}
        console.log("[ble] checking location enabled");
        const isLocationEnabled_r = await isLocationEnabled();
        console.log(`[ble] location enabled: ${isLocationEnabled_r.isLocationEnabled}`);
        if(!isLocationEnabled_r.isLocationEnabled) {
            console.log(`[ble] trying to enable location: ${isLocationEnabled_r.isLocationEnabled}`);
            const requestLocation_r = await requestLocation();
            console.log(`[ble] enable location result: ${requestLocation_r.requestLocation}`);
            if(!requestLocation_r.requestLocation) {
                console.log(`[ble] unable to enable location`);
                throw new Error("missing location permission");
            }
        }
        console.log("[ble] checking ble permission");
        const hasBlePermission_r = await hasPermission();
        console.log(`[ble] ble permission: ${hasBlePermission_r.hasPermission}`);
        if(!hasBlePermission_r.hasPermission) {
            console.log(`[ble] trying to get ble permission: ${isLocationEnabled_r.isLocationEnabled}`);
            const requestBlePermission_r = await requestPermission()
            console.log(`[ble] request ble permission result: ${requestBlePermission_r.requestPermission}`);
            if(!requestBlePermission_r.requestPermission) {
                console.log(`[ble] unable to get ble permission`);
                throw new Error("BLE permission denied");
            }
        }        
        
        // easy sacan
        const params = {
            services: [BLEServiceInfo.servidceId],
            allowDuplicates: false,
            isConnectable: true
        }
        // TODO: need to implement retrieveConnected for ios
        this._scanTimeout = setTimeout(async () => {
            try {
                this._scanTimeout = 0;
                const stopScan_r = await stopScan();
                cb({ name: "", address: "", done: true });
            } catch(e) {}
        }, duration * 1000);

        bluetoothle.startScan(
            (result:BluetoothlePlugin.ScanStatus) => {
                if(result.status === "scanStarted") {
                } else if(result.status === "scanResult") {
                    try {
                        cb({ name: result.name, address: result.address });
                    } catch(e) {}
                }
            }, 
            (error:BluetoothlePlugin.Error) => {
                try{
                    cb({ name: "", address: "", error: error.message });
                } catch(e) {}
                if(this._scanTimeout) {
                    clearTimeout(this._scanTimeout);
                    this._scanTimeout = 0;
                }
            }, 
            params
        );
    }

    async stopScan(): Promise<void> {
        if(this._scanTimeout) {
            clearTimeout(this._scanTimeout);
            this._scanTimeout = 0;
        }            
        await stopScan();
    }

    async read(channel:DeviceChannel): Promise<string> {
        if(!this.connectedEndpoint) {
            console.log("[ble] unable to read, not connected");    
            return "";
        }
        const characteristic = DeviceChannelBLEMapping[channel];
        if(!characteristic) {
            console.log(`[ble] no characteristic for channel ${channel}`);
            return "";
        }        
        const result = await read(this.connectedEndpoint.address, BLEServiceInfo.servidceId, characteristic);
        return atob(result.value);
    }

    async write(channel:DeviceChannel, buffer:ArrayBuffer): Promise<boolean> {
        if(!this.connectedEndpoint) {
            console.log("[ble] unable to read, not connected");    
            return false;
        }
        const characteristic = DeviceChannelBLEMapping[channel];
        if(!characteristic) {
            console.log(`[ble] no characteristic for channel ${channel}`);
            return false;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        await write(this.connectedEndpoint.address, BLEServiceInfo.servidceId, characteristic, base64Data);
        return true;
    }

    isReady() {
        return !this._isConnecting && !this._isInitializing;
    }

    getConnectionInfo() {
        return this.connectedEndpoint;
    }
}