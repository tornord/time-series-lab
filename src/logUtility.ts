import * as math from "ts-math";
import { fmin } from "ts-math";

const { log, exp, pow } = Math;

export const SAFE_LOG_LIMIT = -10;
const EXP_SAFE_LOG_LIMIT = exp(SAFE_LOG_LIMIT);
const SAFE_LOG_PRIME = (log(EXP_SAFE_LOG_LIMIT + 1e-6) - SAFE_LOG_LIMIT) / 1e-6;

export const safeLog = (x: number) => {
  if (x >= EXP_SAFE_LOG_LIMIT) return log(x);
  return SAFE_LOG_LIMIT + SAFE_LOG_PRIME * (x - EXP_SAFE_LOG_LIMIT);
};

export function logUtility(assetWeights: number[], assetReturns: number[][], scenarioWeights: number[] | null = null) {
  let s = 0;
  let wSum = 0;
  for (let i = 0; i < assetReturns.length; i++) {
    const r = assetReturns[i];
    let t = 0;
    let sw = 0;
    for (let j = 0; j < assetWeights.length; j++) {
      t += assetWeights[j] * r[j];
      sw += assetWeights[j];
    }
    if (assetWeights.length === r.length - 1) {
      t += (1 - sw) * r[r.length - 1];
    }
    s += safeLog(1 + t) * (scenarioWeights ? scenarioWeights[i] : 1);
    wSum += scenarioWeights ? scenarioWeights[i] : 1;
  }
  return s / wSum;
}

export function logUtilityPrime(
  assetWeights: number[],
  k: number,
  assetReturns: number[][],
  scenarioWeights: number[] | null = null
) {
  let s = 0;
  let wSum = 0;
  for (let i = 0; i < assetReturns.length; i++) {
    const r = assetReturns[i];
    let t = 0;
    let sw = 0;
    let someReturnsNotMinusOne = false;
    for (let j = 0; j < assetWeights.length; j++) {
      t += assetWeights[j] * r[j];
      sw += assetWeights[j];
      if (r[j] !== -1) {
        someReturnsNotMinusOne = true;
      }
    }
    let rn = 0;
    if (assetWeights.length === r.length - 1) {
      rn = r[r.length - 1];
      t += (1 - sw) * rn;
      if (rn !== -1) {
        someReturnsNotMinusOne = true;
      }
    }
    if (someReturnsNotMinusOne) {
      if (t === -1) {
        throw new Error("Division by zero");
      }
      s += ((r[k] - rn) / (1 + t)) * (scenarioWeights ? scenarioWeights[i] : 1);
    }
    wSum += scenarioWeights ? scenarioWeights[i] : 1;
  }
  return s / wSum;
}

export function fminLossFun(assetReturns: number[][], scenarioWeights: number[] | null = null) {
  return (ws: number[], wsPrime: number[] | null = null) => {
    if (wsPrime) {
      for (let k = 0; k < ws.length; k++) {
        wsPrime[k] = -logUtilityPrime(ws, k, assetReturns, scenarioWeights);
      }
    }
    return -logUtility(ws, assetReturns, scenarioWeights);
  };
}

export function fminPrimeFun(assetReturns: number[][], scenarioWeights: number[] | null = null) {
  return (ws: number[]) => {
    const wsPrime = new Array(ws.length);
    for (let k = 0; k < ws.length; k++) {
      wsPrime[k] = -logUtilityPrime(ws, k, assetReturns, scenarioWeights);
    }
    return wsPrime;
  };
}

export function createNormalSamplesOneDim(n: number) {
  return [...Array(n)].map((d, i) => [math.normalInv((i + 0.5) / n, 0, 1)]);
}
