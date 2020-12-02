import { WeightMessageInterface, WeightMessage } from './sensorreader';
import { TareWeights, Hold, Hangboard } from '@/components/typeexports';
import { map } from './math';

export type MessageTransformerIntrerface = (input: WeightMessageInterface | undefined) => WeightMessageInterface | undefined;

export const pipe = <T extends any[], R>(
    fn1: (...args: T) => R,
    ...fns: Array<(a: R) => R>
  ) => {
    const piped = fns.reduce(
      (prevFn, nextFn) => (value: R) => { 
          if(!value) {
              fns.splice(1);
              return value;
          }
          return nextFn(prevFn(value)) 
        }, value => value
    );
    return (...args: T) => piped(fn1(...args));
  };
  
export const compose = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
    fns.reduce((prevFn, nextFn) => value => prevFn(nextFn(value)), fn1);

export function passTrough(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
    return input;
}

export function clampPositive(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
    if(!input) { return; }
    if(input.passthrough) { return input; }
    return new WeightMessage(
        Math.max(input.left, 0),
        Math.max(input.right, 0),
        Math.max(input.combined, 0),
        input.ts,
        false);
}

export function gramsToKiloGrams(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
    if(!input) { return; }
    if(input.passthrough) { return input; }
    const left = input.left / 1000;
    const right = input.right / 1000;
    return new WeightMessage(left, right, left + right, input.ts, false);
}

export function sum(amount: number): MessageTransformerIntrerface {
    //let values:Array<WeightMessageInterface> = [];
    let current: WeightMessageInterface = new WeightMessage(0, 0, 0, 0,  false);
    let collected = 0
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        current = new WeightMessage(
            current.left + input.left, 
            current.right + input.right,
            current.combined + input.combined,
            0,
            false
        );
        collected++;
        if(collected >= amount) {
            const out = new WeightMessage( 
                current.left / collected, 
                current.right / collected, 
                current.combined / collected,
                input.ts,
                false
            );
            collected = 0;
            current = new WeightMessage(0, 0, 0, 0, false);
            return out;
        }
        return undefined;
    }
}

export function movingAverage(sampleCount: number): MessageTransformerIntrerface {
    const values: Array<WeightMessageInterface> = [];
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        values.push(input);
        if(values.length > sampleCount) {
            values.shift();
        }        
        let out = values.reduce((prev, current) => { 
            return new WeightMessage(
                prev.left + current.left, 
                prev.right + current.right,
                prev.combined + current.combined,
                0,
                false
            ) 
        });
        out = new WeightMessage(
            out.left / values.length, 
            out.right / values.length, 
            out.combined / values.length,
            input.ts,
            false
        );
        return out;
    }
}

export function exponentialMovingAverage(factor: number): MessageTransformerIntrerface {
    let current: WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        current = new WeightMessage(
            input.left * factor + (1 - factor) * current.left,
            input.right * factor + (1 - factor) * current.right,
            input.combined * factor + (1 - factor) * current.combined,
            input.ts,
            false
        );
        return current;
    }
}

export function deadband(deadbandSize: number, target: string): MessageTransformerIntrerface {
    let current: WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const diff: number = Math.abs(current.combined - input.combined);
        if(diff > deadbandSize) {
            current = input;
        }
        return current;
    }
}

export function deadbandGuarded(deadbandSize: number, continuousSamples: number): MessageTransformerIntrerface {
    let current: WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    let contCount = -1;
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const diff: number = Math.abs(current.combined - input.combined);
        if(diff > deadbandSize) {
            contCount += 1;
            if(contCount >= continuousSamples || contCount === -1) {
                current = input;
                contCount = 0;
            }
        } else {
            contCount = 0;
        }
        return current;
    }
}

export function round(bucketSize: number): MessageTransformerIntrerface {
    const myRound = (x: number, base=1) => {
        return base * Math.round(x / base)
    }
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const left = myRound(input.left, bucketSize);
        const right = myRound(input.right, bucketSize);
        const combined = myRound(input.left + input.right, bucketSize);
        return new WeightMessage(
            left,
            right,
            combined,
            input.ts,
            false
        );
    }
}

export function roundHysteresis(bucketSize: number, hyst: number): MessageTransformerIntrerface {
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        // TODO: add a round with hysteresis to avoid jumping too much
        return undefined;
    }
}

export function roundGuarded(bucketSize: number, continuousSamples: number): MessageTransformerIntrerface {
    const myRound = (x: number, base=1) => {
        return base * Math.round(x / base)
    }
    let current: WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    let contCount = -1;
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const left = myRound(input.left, bucketSize);
        const right = myRound(input.right, bucketSize);
        const combined = myRound(input.left + input.right, bucketSize);
        const next = new WeightMessage(
            left,
            right,
            combined,
            input.ts,
            false
        );
        if(next.combined !== current.combined) {
            if(contCount >= continuousSamples || contCount === -1) {
                current = next;
                contCount = 0;
            }
            contCount += 1;
        } else {
            contCount = 0;
        }
        return current;
    }
}

export function guard(continuousSamples: number): MessageTransformerIntrerface {
    let current: WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    let contCount = -1;
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        if(input.combined !== current.combined) {
            if(contCount >= continuousSamples || contCount === -1) {
                current = input;
                contCount = 0;
            }
            contCount += 1;
        } else {
            contCount = 0;
        }
        return current;
    }
}

export function tared(left: number, right: number): MessageTransformerIntrerface {
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const l = input.left - left;
        const r = input.right - right;
        return new WeightMessage(l, r, l + r, input.ts, false);
    }
}

export function taredByObject(tareWeights: TareWeights): MessageTransformerIntrerface {
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const l = input.left - tareWeights.left;
        const r = input.right - tareWeights.right;
        return new WeightMessage(l, r, l + r, input.ts, false);
    }
}

export function virtualMidpoint(board: Hangboard, holdA: Hold, holdB: Hold): MessageTransformerIntrerface {
    const backplaneWidth = 800; // size in mm
    //let halfWidth = backplaneWidth/2;0
    const boardOffset = (backplaneWidth - board.width) / 2;
    const holdACenterPos = boardOffset + holdA.pos.x + holdA.size.x / 2;
    const holdANormalizedOffset = map(holdACenterPos, 0, 800, 0, 1);
    const holdALeftSensorInfluence = 1 - holdANormalizedOffset;
    const holdARightSensorInfluence = holdANormalizedOffset;
    const holdBCenterPos = boardOffset + holdB.pos.x + holdB.size.x / 2;
    const holdBNormalizedOffset = map(holdBCenterPos, 0, 800, 0, 1);
    const holdBLeftSensorInfluence = 1 - holdBNormalizedOffset;
    const holdBRightSensorInfluence = holdBNormalizedOffset;
    const leftSensorWeightShare = holdALeftSensorInfluence + holdBLeftSensorInfluence;
    const rightSensorWeightShare = holdARightSensorInfluence + holdBRightSensorInfluence;
    console.log(`virtualMidpoint weight share, left: ${leftSensorWeightShare}, right: ${rightSensorWeightShare}`);
    const leftCorrectionFactor = 1 / rightSensorWeightShare;
    const rightCorrectionFactor = 1 / leftSensorWeightShare;
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        const l = input.left * leftCorrectionFactor;
        const r = input.right * rightCorrectionFactor;
        return new WeightMessage(l, r, l + r, input.ts, false);
    }
}

//export function positive(left:number, right:number): MessageTransformerIntrerface {
   /* export function positive(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        let l = Math.max(input.left, 0);
        let r = Math.max(input.right, 0);
        return new WeightMessage(l, r, l + r);
    }*/
//}

export function slopeCalculator(sampleSize: number): MessageTransformerIntrerface {
    const data: Array<WeightMessage> = [];
    type LinRegType = { slope: number; intercept: number; r2: number };
    function linearRegression(y: Array<number>, x: Array<number>) {
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
        const lr: LinRegType = { slope:0, intercept:0, r2:0 };
        const n = y.length;
        lr.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        lr.intercept = (sumY - lr.slope * sumX) / n;
        lr.r2 = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);
        return lr;
    }
    return function(input: WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; }
        data.push(input);
        if(data.length > sampleSize) {
            data.shift();
        }
        const x = Array.from(Array(data.length), (_, index) => index)
        const leftData = data.map(a => a.combined);
        const rightData = data.map(a => a.combined);
        const combinedData = data.map(a => a.combined);
        const lrLeft = linearRegression(combinedData, x);
        const lrRight = linearRegression(combinedData, x);
        const lrCombined = linearRegression(combinedData, x);
        return new WeightMessage(lrLeft.slope, lrRight.slope, lrCombined.slope, 0, false);
    }
}