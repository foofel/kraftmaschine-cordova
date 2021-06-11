
import { ApplicationStoreInterface, defaultApplicationStoreObject } from '@/core/applicationstore'
import { IndexedDBStorageImpl, writeConfigObject } from '@/core/persistentstore'
import { Observable } from '@/js/object-observer'

let myStore:ApplicationStoreInterface|null = null

async function init() {
    const storage = new IndexedDBStorageImpl();
    const store = await storage.getApplicationStore();
    myStore = Observable.from(store);
}
init();

function getStore():ApplicationStoreInterface|null {
    return myStore;
}

export { getStore }