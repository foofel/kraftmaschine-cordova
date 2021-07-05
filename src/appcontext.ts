//import { HangboardConnector } from './core/hangboardconnector'
import { DeviceConnector } from './core/connectivity/deviceconnector'
//import { RemoteAPI } from './core/util'
import { StorageInterface } from '@/core/data/storage';

export interface AppContextInterface {
	device: DeviceConnector,
	//backend: RemoteAPI,
	storage: StorageInterface,
}
export const AppContext = ({}) as AppContextInterface

export function gac():AppContextInterface {
	return AppContext;
}