export type LinRegType = { slope: number; intercept: number; r2: number };
export function linearRegression(x: ReadonlyArray<number>, y: ReadonlyArray<number>) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    for (let i = 0; i < y.length; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += (x[i] * y[i]);
        sumXX += (x[i] * x[i]);
        sumYY += (y[i] * y[i]);
    }
    const lr: LinRegType = { slope: 0, intercept: 0, r2:0 };
    const n = y.length;
    lr.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    lr.intercept = (sumY - lr.slope * sumX) / n;
    lr.r2 = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);
    return lr;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
}

export function map(value: number, fromA: number, fromB: number, toA: number, toB: number) {
    return (value - fromA) / (fromB-fromA) * (toB-toA) + toA
}

export function lerp(t: number, from: number, to: number) {
    return (1 - t) * from + t * to;
}

export function round(value: number, base: number): number {
    return base * Math.round(value / base)
}

export function roundDown(value: number, base=1): number {
    return base * Math.floor(value / base);
}

export function roundUp(value: number, base=1): number {
    return Math.ceil(value * base) / base;
}

export function HSVtoRGB(h: number, s: number, v: number) {
    let r = 0;
    let g = 0;
    let b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: 
            r = v;
            g = t;
            b = p; 
            break;
        case 1: 
            r = q;
            g = v;
            b = p; 
            break;
        case 2: 
            r = p;
            g = v;
            b = t; 
            break;
        case 3: 
            r = p;
            g = q;
            b = v; 
            break;
        case 4: 
            r = t;
            g = p;
            b = v; 
            break;
        case 5: 
            r = v;
            g = p;
            b = q; 
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

export function RGBtoHSV(r: number, g: number, b: number) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = (max === 0 ? 0 : d / max);
    const v = max / 255;

    switch (max) {
        case min: 
            h = 0; 
            break;
        case r: 
            h = (g - b) + d * (g < b ? 6: 0); 
            h /= 6 * d; 
            break;
        case g: 
            h = (b - r) + d * 2; 
            h /= 6 * d; 
            break;
        case b: 
            h = (r - g) + d * 4; 
            h /= 6 * d; 
            break;
    }

    return {
        h: h,
        s: s,
        v: v
    };
}

export function HexToRGB(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

export function sum(arr: Array<number>) {
    return arr.reduce((p, c) => p + c, 0);
}

export function avg(arr: Array<number>) {
    return sum(arr) / arr.length;
}