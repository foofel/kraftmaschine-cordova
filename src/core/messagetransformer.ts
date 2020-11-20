import { WeightMessageInterface, WeightMessage } from './sensorreader';
import { TareWeights, Hold, Hangboard } from '@/components/typeexports';
import { map } from './math';

export type MessageTransformerIntrerface = (input:WeightMessageInterface | undefined) => WeightMessageInterface | undefined;

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

export function passTrough(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
    return input;
}

export function clampPositive(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
    if(!input) { return; }
    if(input.passthrough) { return input; };
    return new WeightMessage(
        Math.max(input.left, 0),
        Math.max(input.right, 0),
        Math.max(input.combined, 0),
        input.ts,
        false);
}

export function gramsToKiloGrams(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
    if(!input) { return; }
    if(input.passthrough) { return input; };
    const left = input.left / 1000;
    const right = input.right / 1000;
    return new WeightMessage(left, right, left + right, input.ts, false);
}

export function sum(amount:number): MessageTransformerIntrerface {
    //let values:Array<WeightMessageInterface> = [];
    let current:WeightMessageInterface = new WeightMessage(0, 0, 0, 0,  false);
    let collected:number = 0
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        current = new WeightMessage(
            current.left + input.left, 
            current.right + input.right,
            current.combined + input.combined,
            0,
            false
        );
        collected++;
        if(collected >= amount) {
            let out = new WeightMessage( 
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

export function movingAverage(sampleCount:number): MessageTransformerIntrerface {
    let values:Array<WeightMessageInterface> = [];
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
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

export function exponentialMovingAverage(factor:number): MessageTransformerIntrerface {
    let current:WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
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

export function deadband(deadbandSize:number, target:string): MessageTransformerIntrerface {
    let current:WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let diff:number = Math.abs(current.combined - input.combined);
        if(diff > deadbandSize) {
            current = input;
        }
        return current;
    }
}

export function deadbandGuarded(deadbandSize:number, continuousSamples:number): MessageTransformerIntrerface {
    let current:WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    let contCount:number = -1;
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let diff:number = Math.abs(current.combined - input.combined);
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

export function round(bucketSize:number): MessageTransformerIntrerface {
    const myRound = (x:number, base:number=1) => {
        return base * Math.round(x / base)
    }
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let left = myRound(input.left, bucketSize);
        let right = myRound(input.right, bucketSize);
        let combined = myRound(input.left + input.right, bucketSize);
        return new WeightMessage(
            left,
            right,
            combined,
            input.ts,
            false
        );
    }
}

export function roundHysteresis(bucketSize:number, hyst:number): MessageTransformerIntrerface {
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        // TODO: add a round with hysteresis to avoid jumping too much
        return undefined;
    }
}

export function roundGuarded(bucketSize:number, continuousSamples:number): MessageTransformerIntrerface {
    const myRound = (x:number, base:number=1) => {
        return base * Math.round(x / base)
    }
    let current:WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    let contCount:number = -1;
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let left = myRound(input.left, bucketSize);
        let right = myRound(input.right, bucketSize);
        let combined = myRound(input.left + input.right, bucketSize);
        let next = new WeightMessage(
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

export function guard(continuousSamples:number): MessageTransformerIntrerface {
    let current:WeightMessageInterface = new WeightMessage(0, 0, 0, 0, false);
    let contCount:number = -1;
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
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

export function tared(left:number, right:number): MessageTransformerIntrerface {
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let l = input.left - left;
        let r = input.right - right;
        return new WeightMessage(l, r, l + r, input.ts, false);
    }
}

export function taredByObject(tareWeights:TareWeights): MessageTransformerIntrerface {
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let l = input.left - tareWeights.left;
        let r = input.right - tareWeights.right;
        return new WeightMessage(l, r, l + r, input.ts, false);
    }
}

export function virtualMidpoint(board:Hangboard, holdA:Hold, holdB:Hold): MessageTransformerIntrerface {
    let backplaneWidth = 800; // size in mm
    //let halfWidth = backplaneWidth/2;0
    let boardOffset = (backplaneWidth - board.width) / 2;
    let holdACenterPos = boardOffset + holdA.pos.x + holdA.size.x / 2;
    let holdANormalizedOffset = map(holdACenterPos, 0, 800, 0, 1);
    let holdALeftSensorInfluence = 1 - holdANormalizedOffset;
    let holdARightSensorInfluence = holdANormalizedOffset;
    let holdBCenterPos = boardOffset + holdB.pos.x + holdB.size.x / 2;
    let holdBNormalizedOffset = map(holdBCenterPos, 0, 800, 0, 1);
    let holdBLeftSensorInfluence = 1 - holdBNormalizedOffset;
    let holdBRightSensorInfluence = holdBNormalizedOffset;
    let leftSensorWeightShare = holdALeftSensorInfluence + holdBLeftSensorInfluence;
    let rightSensorWeightShare = holdARightSensorInfluence + holdBRightSensorInfluence;
    console.log(`virtualMidpoint weight share, left: ${leftSensorWeightShare}, right: ${rightSensorWeightShare}`);
    let leftCorrectionFactor = 1 / rightSensorWeightShare;
    let rightCorrectionFactor = 1 / leftSensorWeightShare;
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        let l = input.left * leftCorrectionFactor;
        let r = input.right * rightCorrectionFactor;
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

export function slopeCalculator(sampleSize:number): MessageTransformerIntrerface {
    let data:Array<WeightMessage> = [];
    type LinRegType = { slope:number, intercept:number, r2:number };
    function linearRegression(y:Array<number>, x:Array<number>) {
        var sumX = 0;
        var sumY = 0;
        var sumXY = 0;
        var sumXX = 0;
        var sumYY = 0;
        for (var i = 0; i < y.length; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += (x[i] * y[i]);
            sumXX += (x[i] * x[i]);
            sumYY += (y[i] * y[i]);
        }
        var lr:LinRegType = { slope:0, intercept:0, r2:0 };
        var n = y.length;
        lr.slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        lr.intercept = (sumY - lr.slope * sumX) / n;
        lr.r2 = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);
        return lr;
    }
    return function(input:WeightMessageInterface | undefined): WeightMessageInterface | undefined {
        if(!input) { return; }
        if(input.passthrough) { return input; };
        data.push(input);
        if(data.length > sampleSize) {
            data.shift();
        }
        let x = Array.from(Array(data.length), (_, index) => index)
        let leftData = data.map(a => a.combined);
        let rightData = data.map(a => a.combined);
        let combinedData = data.map(a => a.combined);
        let lrLeft = linearRegression(combinedData, x);
        let lrRight = linearRegression(combinedData, x);
        let lrCombined = linearRegression(combinedData, x);
        return new WeightMessage(lrLeft.slope, lrRight.slope, lrCombined.slope, 0, false);
    }
}