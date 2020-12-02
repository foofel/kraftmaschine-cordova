export interface SubscribtionData {}

export interface BluetoothLE {
    scan: (filter:Array<string|number>) => Promise<Array<string|number>>;
    connect: (address:string) => Promise<Boolean>;
    subscribe: (characteristic:string, cb:(data:string) => void) => Promise<Boolean>;
    unsubscribe: (characteristic:string) => Promise<Boolean>;
}