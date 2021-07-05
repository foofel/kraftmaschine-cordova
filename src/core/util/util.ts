export function timeSeconds() {
    return performance.now() / 1000;
}

export function clearAllCookies() {
    if((window as any).cookieManager) {
        window.cookieManager.clear();
    }
}

export function uuidv4(): string {
    const str = ""+[1e7]+-1e3+-4e3+-8e3+-1e11;
    return str.replace(/[018]/g, (c: any) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

export function niceID(length: number) {
    let result           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function asyncSleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

export function asyncBarrier(seconds: number): { promise: Promise<void>, resolve: () => void } {
    let r = () => {};
    const p = new Promise<void>((resolve, _) => {
        r = resolve;
        setTimeout(() => {
            resolve();
        }, seconds * 1000)
    });
    return { promise: p, resolve: r };
}