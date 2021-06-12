
export function initialize(cb: (result: { status: 'enabled' | 'disabled' }) => void) {
    return new Promise<{ status: 'enabled' | 'disabled' }>((resolve, reject) => {
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
}
export function disconnect(address: string) {
    return new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
}
export function enable() {
    return new Promise<{ status: boolean }>((resolve, reject) => {
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
}
export function close(address: string) { 
    return new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
}
export function connect(address: string, cb: (result:BluetoothlePlugin.DeviceInfo) => void, autoConnect = false) {
    return new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
}
export function reconnect(address: string, autoConnect = false) { 
    return new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
}
export function discover(address: string) { 
    return new Promise<BluetoothlePlugin.Device>((resolve, reject) => {
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
}
export function isDiscovered(address: string) { 
    return new Promise<BluetoothlePlugin.DiscoverStatus>((resolve, reject) => {
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
}
export function mtu(address: string, mtu: number) {
    return new Promise<BluetoothlePlugin.MTU>((resolve, reject) => {
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
}
export function subscribe(address: string, service: string, characteristic: string, cb: (data: string) => void) {
    return new Promise<BluetoothlePlugin.OperationResult>((resolve, reject) => {
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
}
export function unsubscribe(address: string, service: string, characteristic: string) {
    return new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
}
export function getAdapterInfo() {
    new Promise<BluetoothlePlugin.AdapterInfo>((resolve, _) => {
        bluetoothle.getAdapterInfo(
            (result: BluetoothlePlugin.AdapterInfo) => {
                resolve(result);
            }
        );
    });
}
export function stopScan() {
    return new Promise<{ status: string }>((resolve, reject) => {
        bluetoothle.stopScan(
            (result: { status: string }) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            }
        );
    });
}
export function isConnected(address:string) {
    new Promise<BluetoothlePlugin.CurrConnectionStatus>((resolve, reject) => {
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
}
export function wasConnected(address:string) {
    return new Promise<BluetoothlePlugin.PrevConnectionStatus>((resolve, reject) => {
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
}
export function bond(address:string) {
    return new Promise<BluetoothlePlugin.DeviceInfo>((resolve, reject) => {
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
}
export function isBonded(address:string) {
    return new Promise<BluetoothlePlugin.BondedStatus>((resolve, reject) => {
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
}
export function isInitialized() {
    return new Promise<{ isInitialized: boolean }>((resolve, reject) => {
        bluetoothle.isInitialized(
            (result: { isInitialized: boolean }) => {
                resolve(result);
            }
        );
    });
}
export function isEnabled() {
    return new Promise<{ isEnabled: boolean }>((resolve, reject) => {
        bluetoothle.isEnabled(
            (result: { isEnabled: boolean }) => {
                resolve(result);
            }
        );
    });
}
export function read(address:string, service:string, characteristic:string) {
    return new Promise<BluetoothlePlugin.OperationResult>((resolve, reject) => {
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
}
export function write(address:string, service:string, characteristic:string, data:string) {
    return new Promise<BluetoothlePlugin.OperationResult>((resolve, reject) => {
        const params = {
            value: data,
            type: "noResponse",
            address: address,
            service: service,
            characteristic: characteristic
        }
        bluetoothle.write(
            (result: BluetoothlePlugin.OperationResult) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error);
            },
            params
        );
    });
}


export function hasPermission() {
    return new Promise<{ hasPermission: boolean }>((resolve, reject) => {
        bluetoothle.hasPermission(
            (result: { hasPermission: boolean }) => {
                resolve(result);
            }
        );
    });
}

export function isLocationEnabled() { 
    return new Promise<{ isLocationEnabled: boolean }>((resolve, reject) => {
        bluetoothle.isLocationEnabled(
            (result: { isLocationEnabled: boolean }) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error)
            }
        );
    });
}

export function requestPermission() { 
    return new Promise<{ requestPermission: boolean }>((resolve, reject) => {
        bluetoothle.requestPermission(
            (result: { requestPermission: boolean }) => {
                resolve(result);
            }
        );
    });
}

export function requestLocation() { 
    return new Promise<{ requestLocation: boolean }>((resolve, reject) => {
        bluetoothle.requestLocation(
            (result: { requestLocation: boolean }) => {
                resolve(result);
            },
            (error: BluetoothlePlugin.Error) => {
                reject(error)
            }
        );
    });
}