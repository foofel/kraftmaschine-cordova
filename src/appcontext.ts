import { HangboardConnector } from './core/hangboardconnector'
import { RemoteAPI } from './core/util'
import { StorageInterface } from '@/core/storageinterface';

export interface AppContextInterface {
	hangboardConnector: HangboardConnector,
	backend: RemoteAPI,
	storage: StorageInterface,
}
export const AppContext = ({}) as AppContextInterface

export function gac():AppContextInterface {
	return AppContext;
}