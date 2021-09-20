import * as math from "ts-math";
import { fmin, round, sqr, createNormalSamples, RandomNumberGenerator } from "ts-math";

const { log, exp, sqrt, pow } = Math;

export const SAFE_LOG_LIMIT = -10;
export const EXP_SAFE_LOG_LIMIT = exp(SAFE_LOG_LIMIT);
const SAFE_LOG_PRIME = (log(EXP_SAFE_LOG_LIMIT + 1e-6) - SAFE_LOG_LIMIT) / 1e-6;

export const safeLog = (x: number) => {
  if (x >= EXP_SAFE_LOG_LIMIT) return log(x);
  return SAFE_LOG_LIMIT + SAFE_LOG_PRIME * (x - EXP_SAFE_LOG_LIMIT);
};

export function logUtility(assetWeights: number[], assetReturns: number[][], scenarioWeights: number[] | null = null) {
  let s = 0;
  let swSum = 0;
  for (let i = 0; i < assetReturns.length; i++) {
    const r = assetReturns[i];
    const sw = scenarioWeights ? scenarioWeights[i] : 1;
    let t = 0;
    let awSum = 0;
    for (let j = 0; j < assetWeights.length; j++) {
      t += assetWeights[j] * r[j];
      awSum += assetWeights[j];
    }
    if (assetWeights.length === r.length - 1) {
      let rn = r[r.length - 1];
      t += (1 - awSum) * rn;
    }
    s += safeLog(1 + t) * sw;
    swSum += sw;
  }
  return s / swSum;
}

export function logUtilityPrime(
  assetWeights: number[],
  k: number,
  assetReturns: number[][],
  scenarioWeights: number[] | null = null
) {
  let s = 0;
  let swSum = 0;
  for (let i = 0; i < assetReturns.length; i++) {
    const r = assetReturns[i];
    const sw = scenarioWeights ? scenarioWeights[i] : 1;
    let t = 0;
    let awSum = 0;
    let someReturnsNotMinusOne = false;
    for (let j = 0; j < assetWeights.length; j++) {
      t += assetWeights[j] * r[j];
      awSum += assetWeights[j];
      if (r[j] !== -1) {
        someReturnsNotMinusOne = true;
      }
    }
    let rn = 0;
    if (assetWeights.length === r.length - 1) {
      rn = r[r.length - 1];
      t += (1 - awSum) * rn;
      if (rn !== -1) {
        someReturnsNotMinusOne = true;
      }
    }
    if (someReturnsNotMinusOne) {
      if (t === -1) {
        throw new Error("Division by zero");
      }
      if (1 + t > EXP_SAFE_LOG_LIMIT) {
        s += ((r[k] - rn) / (1 + t)) * sw;
      } else {
        s += (r[k] - rn) * SAFE_LOG_PRIME * sw;
      }
    }
    swSum += sw;
  }
  return s / swSum;
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

export function rollingKelly(rs: number[], alpha: number) {
  const n = rs.length;
  const res = new Array(n);
  const rss = rs.map((d) => [d]);
  for (let i = 0; i < n; i++) {
    if (i < 20) {
      res[i] = 0;
      continue;
    }
    const rsTemp = rss.slice(0, i + 1);
    const ws = new Array(i + 1);
    for (let j = 0; j <= i; j++) {
      ws[j] = pow(1 - alpha, i - j);
    }
    const u = fminLossFun(rsTemp, ws);
    const sol = fmin.conjugateGradient(u, [0.5], {});
    res[i] = sol.x[0];
  }
  return res;
}

function main1() {
  const n = 5000;
  const nAssets = 2;

  const sigmas = [0.005, 0.24];
  const mus = [log(1.02), log(1.07)];
  const rho = 0.2;
  const corrs = [
    [1, rho],
    [rho, 1],
  ];
  const ns = createNormalSamples(n, nAssets, corrs);

  const rs = new Array(n);
  for (let i = 0; i < n; i++) {
    const r = new Array(nAssets);
    for (let j = 0; j < nAssets; j++) {
      let rnd = ns[i][j];
      r[j] = exp(mus[j] - sqr(sigmas[j]) / 2 + sigmas[j] * rnd) - 1;
    }
    rs[i] = r;
  }

  const u = fminLossFun(rs);
  const uPrime = fminPrimeFun(rs);

  const w = 0.16;
  const ws = [...Array(9)].map((d, i) => 0.1 + i * 0.02);
  console.log(ws.map((d, i) => round(u([d]), 4)));
  console.log(u([w]), uPrime([w])[0]);
  var solution1 = fmin.nelderMead(u, [0.5], {});
  var solution2 = fmin.conjugateGradient(u, [0.5], {});

  console.log(solution1.x[0], 1 - solution1.x[0]);
  console.log(solution2.x[0], 1 - solution2.x[0]);
  const x = solution1.x[0];
  const xs = [...Array(9)].map((d, i) => x - (i - 4) * 0.01);
  console.log(xs.map((d, i) => round(1000 * (u([d]) - u([x])), 4)));
}

function main2() {
  const n = 40;
  const ns = createNormalSamplesOneDim(n);
  const sigma = 0.25 / sqrt(252);
  const mu = log(1.06) / 252;
  const rs = ns.map(([rnd]) => exp(mu - sqr(sigma) / 2 + sigma * rnd) - 1);
  const rng = new RandomNumberGenerator("123");
  rng.shuffle(rs);
  const N = 60;
  const ks = rollingKelly(rs, 2 / (N + 1));
  console.log(ks.map((d) => round(d, 1)));
}
