import { BluetoothLE, SubscribtionData } from './bluetoothle';
//import { BluetoothRemoteGATTCharacteristic } from 'web-bluetooth';

interface ConnectionData {
    device:BluetoothDevice;
    server:BluetoothRemoteGATTServer;
    service:BluetoothRemoteGATTService;
    characteristic:BluetoothRemoteGATTCharacteristic;
}

export class WebBluetoothLE implements BluetoothLE {

    myService:number = 0x181D;        // fill in a service you're looking for here
    myCharacteristic:number = 0x2A98;   // fill in a characteristic from the service here
    connectionData:ConnectionData|null = null;

    constructor() {
    }

    async scan(filter:Array<string|number>): Promise<Array<string|number>>
    {
        return new Promise<Array<string|number>>(() => {});
    }

    async connect(_:string): Promise<boolean>
    {
        const devices = await navigator.bluetooth.getDevices();
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
            device = await navigator.bluetooth.requestDevice({
                //filters: [{ services: [this.myService] }]       // you can't use filters and acceptAllDevices together
                //optionalServices: [this.myService],
                //acceptAllDevices: true,
                filters: [
                    { name: 'NimBLE test' }
                ],
                optionalServices: [0x181D]
            });
        }
        if(device !== null && device !== undefined) {
            console.log('Connecting to GATT Server...');
            if(device.gatt !== undefined) {
                const server = await device.gatt.connect();
                console.log("connection result: ", server);
                console.log('Getting Service...');
                const service = await server.getPrimaryService(this.myService);
                console.log('Getting Characteristic...');
                const testAllChars = await service.getCharacteristics();
                const characteristic = await service.getCharacteristic(this.myCharacteristic);
                //BluetoothPermissionStorage
                this.connectionData = { 
                    device: device,
                    server: server,
                    service: service,
                    characteristic: characteristic
                }
                console.log('Connected!');
                return true;
            }
        } else {
            return false;
        }
        return false;
    }

    async subscribe(characteristic:string, cb:(data:string) => void): Promise<boolean>
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
                        const buffer = internal.value.buffer;
                        const decoded = decoder.decode(buffer)
                        cb(decoded);
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

}