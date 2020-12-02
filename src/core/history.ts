import { linearRegression, LinRegType } from './math'

export class DataHistory<T> {
    data: Array<T> = [];
    sizeLimit: number;
    constructor(sizeLimit = -1) {
        this.sizeLimit = sizeLimit;
    }

    push(value: T): void {
        this.data.push(value);
        if(this.sizeLimit !== -1 && this.data.length > this.sizeLimit) {
            this.data.shift();
        }
    }

    getData(itemCount = 0): ReadonlyArray<T> {
        if(this.data.length === 0) {
            return [];
        }
        if(itemCount === 0) {
            return this.data;
        } else if(itemCount > 0) {
            return this.data.slice(0, itemCount);
        } else {
            return this.data.slice(Math.max(this.data.length - Math.abs(itemCount), 0));
        }
    }

    clear() {
        this.data = [];
    }

    get length() {
        return this.data.length;
    }
}

/*export type HistoryTransformer<T, U> = { calculate(input:DataHistory<T>):U };
export class TransformedHistory<T, U> {
    original:DataHistory<T>;
    transformed:DataHistory<U>;
    transformer:HistoryTransformer<T, U>;
    constructor(size:number, transformer:HistoryTransformer<T, U>) {
        this.original = new DataHistory(size);
        this.transformed = new DataHistory(size);
        this.transformer = transformer;
    }

    push(value:T): void {
        this.original.push(value);
        let converted = this.transformer.calculate(this.original);
        this.transformed.push(converted);
    }

    getData(itemCount:number = -1): ReadonlyArray<U> {
        if(itemCount === -1) {
            return this.transformed.data;
        } else {
            return this.transformed.data.slice(itemCount);
        }
    }
}*/

export function LinearRegressionFromData(x: ReadonlyArray<number>, y: ReadonlyArray<number>): LinRegType {
    //let x = Array.from(Array(data.length), (_, index) => index);
    return linearRegression(x, y);
}

type LRInfo<T> =  T & { ts: number }
export function LinearRegressionFromHistoryData<T, K extends keyof T>(data: ReadonlyArray<LRInfo<T>>, key: K): LinRegType {
    //let x = Array.from(Array(data.length), (_, index) => index);
    const xData = data.map(a => a.ts);
    const yData = data.map(a => (a as any)[key]);
    return linearRegression(xData, yData);
}

/*export function calculateLR<T, K extends keyof T>(data:DataHistory<LRInfo<T>>, key:K, itemCount:number = 0):LinRegType {
    //let xData = Array.from(Array(data.length), (_, index) => index);
    let xData = data.getData(itemCount).map(a => a.ts);
    let yData = data.getData(itemCount).map(a => (a as any)[key]);
    return linearRegression(xData, yData);
}*/

type NonMethodKeys<T> = { [P in keyof T]: T[P] extends Function ? never : P }[keyof T];
function getFields<T>(fields: { [P in NonMethodKeys<T>]: true }) {
    return Object.keys(fields)
}

export type MinMaxResult = { min: number; max: number };
export function getMinMax<T, K extends keyof T>(data: DataHistory<T>, key: K): MinMaxResult {
    const minVal: number = Math.min(...data.getData().map(a => (a as any)[key]));
    const maxVal: number = Math.max(...data.getData().map(a => (a as any)[key]));
    return { 
        min: minVal,
        max: maxVal 
    }
}

export function getAvg<T, K extends keyof T>(data: ReadonlyArray<LRInfo<T>>, key: K): number {
    if(data.length === 0) {
        return 0;
    }
    const sum = data.reduce((accu, value) => accu + (value as any)[key], 0);
    return sum / data.length;
}

/*class DataHolder<T> {
    data:Array<T> = [];
}

function consume(data:Array<number>) {}

function calculateLR2<T, K extends keyof T>(data:DataHolder<T>, key:K):void {
    let yData = data.data.map(a => (a as any)[key]);
    consume(yData);
}

function callit() {
    let dh2:DataHolder<{a:number}> = new DataHolder();
    let muh:Array<{a:number}> = [{a: 1}, {a: 2}, {a: 3}, {a: 4}, {a: 5}];
    calculateLR2(dh2, "a");
}*/