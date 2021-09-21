import * as math from "ts-math";
import { fmin, numeric, RandomNumberGenerator, sqr } from "ts-math";
// import { PCA } from "ml-pca";
import { fminLossFun } from "./logUtility";
import { addDays, epochToString, isBusinessDay, toEpoch } from "./dateHelper";

const { exp, pow, round, sqrt, log } = Math;

export interface TimeSeries {
  dates: string[];
  values: number[];
}

export interface Trend {
  ks: number[];
  bs: number[];
}

export type Vector = number[];

export interface Measures {
  dates: string[];
  datesAsNumber: Vector;
  values: Vector;
  logValues: Vector;
  returns: Vector;
  logReturns: Vector;
  rsi14: Vector;
  ema20: Vector;
  ema40: Vector;
  ema60: Vector;
  sqr20: Vector;
  sqr40: Vector;
  sqr60: Vector;
  kelly20: Vector;
  kelly40: Vector;
  kelly60: Vector;
  trend20: Vector;
  fwd5: Vector;
  pos20: Vector;
  neg20: Vector;
  pos40: Vector;
  neg40: Vector;
  pos60: Vector;
  neg60: Vector;
}

export function minMax(vs: number[]) {
  let vMin = Number.NaN;
  let vMax = Number.NaN;
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i];
    if (Number.isNaN(vMin) || v < vMin) {
      vMin = v;
    }
    if (Number.isNaN(vMax) || v > vMax) {
      vMax = v;
    }
  }
  return [vMin, vMax];
}

export function generateRandomTimeSeries(
  start: string,
  end: string,
  isBusinessDay: ((date: string) => boolean) | null,
  yearlyreturn: number,
  yearlyvolatility: number,
  autocorrelation: number,
  seed: string
) {
  const rng = new RandomNumberGenerator(seed);
  let d = start;
  const dates: string[] = [];
  const values: number[] = [];
  let n = 252.0;
  while (isBusinessDay ? !isBusinessDay(d) : false) {
    d = addDays(d, 1);
  }
  while (d <= end) {
    values.push(0);
    dates.push(d);
    d = addDays(d, 1);
    while (isBusinessDay ? !isBusinessDay(d) : false) {
      d = addDays(d, 1);
    }
  }
  let v = 100.0;
  let c0 = 0.0;
  let c = 0.0;
  let sigma = yearlyvolatility / sqrt(n);
  let r = pow(1.0 + yearlyreturn, 1.0 / n) - 1.0 - math.sqr(sigma) / 2.0;
  for (let i = 0; i < dates.length; i++) {
    values[i] = round(100 * v) / 100;
    c = sigma * rng.randN();
    v *= 1.0 + r + c + autocorrelation * c0;
    c0 = c;
  }
  return { name: String(seed), dates, values };
}

export function randomTimeSeries(rng: RandomNumberGenerator, start: string, end: string) {
  let sigmaMin = 0.15;
  let sigmaMax = 0.3;
  let yearlyReturnAvg = 0.06;
  let yearlyReturnStdev = 0.15;
  let sigma = sigmaMin + (sigmaMax - sigmaMin) * rng.rand();
  let yearlyReturn = yearlyReturnAvg + yearlyReturnStdev * rng.randN();
  let autoCorr = 0.02 * rng.randN();
  let startValue = 100.0 * exp(0.5 * rng.randN());
  let ts = generateRandomTimeSeries(start, end, isBusinessDay, yearlyReturn, sigma, autoCorr, rng.randomSeed());
  ts.values = ts.values.map((d) => (d / 100) * startValue);
  return ts;
}

export function accumulate(
  values: number[],
  accumulator: (pRes: number, pVal: number, cVal: number, i: number, a: number[]) => number
) {
  const res = [];
  let pRes = Number.NaN;
  let pVal = Number.NaN;
  for (let i = 0; i < values.length; i++) {
    const c = values[i];
    const v = accumulator(pRes, pVal, c, i, values);
    res.push(v);
    pRes = v;
    pVal = c;
  }
  return res;
}

export function diff(values: number[]) {
  return accumulate(values, (pRes, pVal, cVal, i) => (i === 0 ? 0 : cVal - pVal));
}

export function ema(values: number[], alpha: number) {
  // const accumulator = (p: number, c: number, i: number, a: number[]) => (i === 0 ? c : (1 - alpha) * p + alpha * c);
  return accumulate(values, (pRes, pVal, cVal, i) => (i === 0 ? cVal : (1 - alpha) * pRes + alpha * cVal));
  // const res = [];
  // let p = Number.NaN;
  // for (let i = 0; i < values.length; i++) {
  //   const c = values[i];
  //   const v = accumulator(p, c, i, values);
  //   res.push(v);
  //   p = v;
  // }
  // return res;
}

export function rsi(values: number[], N: number = 14) {
  const diffs = diff(values);
  const ups = diffs.map((d, i) => Math.max(d, 0));
  const downs = diffs.map((d, i) => Math.max(-d, 0));
  const emaUps = ema(ups, 1 / N);
  const emaDowns = ema(downs, 1 / N);
  const res: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const up = emaUps[i];
    const down = emaDowns[i];
    const rsi = 100 - (down === 0 ? (up === 0 ? 50 : 0) : 100 / (1 + up / down));
    res.push(rsi);
  }
  return res;
}

export function rollingTrend(vs: number[], alpha: number) {
  let swx = 0.0;
  let swx2 = 0.0;
  let sw = 0.0;
  let swy = 0.0;
  let swxy = 0.0;
  let n = vs.length;
  const ks = [];
  const bs = [];
  let w = pow(1 - alpha, 1 - n);
  for (let i = 0; i < n; i++) {
    let y = vs[i];
    let x = i;
    let xw = x * w;
    swx += xw;
    swx2 += xw * x;
    sw += w;
    swy += w * y;
    swxy += xw * y;
    w *= 1 / (1 - alpha);
    let a = swx * swx - swx2 * sw;
    let k = i === 0 ? 0 : (swy * swx - swxy * sw) / a;
    let b = i === 0 ? y : (swxy * swx - swx2 * swy) / a;
    ks.push(k);
    bs.push(b + k * i);
  }
  return { ks, bs }; // k*x + b = y
}

//console.log(trend([9, 7, 5, 3, 1, 3, 5, 7, 9], 1-1/14));

export function indexOf(t: number, vs: number[]): number {
  let i = -1;
  let n = vs.length;
  if (n === 0) return -1;
  else if (t < vs[0]) return -1;
  else if (t >= vs[n - 1]) return n - 1;

  if (n > 40) {
    //Binary search if >40 (otherwise it's no gain using it)
    let hi = n - 1;
    let low = 0;
    if (t.valueOf() >= vs[hi]) return hi;
    while (hi > low + 1) {
      i = Math.floor((hi + low) / 2);
      if (t >= vs[i]) low = i;
      else {
        hi = i;
        i = low;
      }
    }
    return i;
  } else {
    //Incremental search
    i = 1;
    while (t >= vs[i] && i < n - 1) i++;
    return i - 1;
  }
}

function createVector(n: number, value: number): number[] {
  return [...Array(n)].map(() => value);
}

export function synchronize(timeSeries: { dates: string[]; values: number[] }[]) {
  let n = timeSeries.length;
  let ns = createVector(n, 0);
  const res: number[][] = [];
  while (timeSeries.every((ts, i) => ns[i] < ts.dates.length)) {
    let ds = timeSeries.map((d, i) => d.dates[ns[i]]);
    const dMax = epochToString(Math.max(...ds.map(toEpoch)));
    for (let i = 0; i < ds.length; i++) {
      while (ds[i] < dMax && ns[i] < timeSeries[i].dates.length) {
        ds[i] = timeSeries[i].dates[++ns[i]];
      }
    }
    if (!timeSeries.every((ts, i) => ns[i] < ts.dates.length)) break;
    if (timeSeries.every((ts, i) => ts.dates[ns[i]] === dMax)) {
      const vs = timeSeries.map((ts, i) => ts.values[ns[i]++]);
      res.push(vs);
    }
  }
  return res;
}

export function correlation(timeSeries: { dates: string[]; values: number[] }[]) {
  const vss = synchronize(timeSeries).map((vs) => vs.map(Math.log));
  const logrets = vss.slice(1).map((vs, i) => vs.map((v, j) => v - vss[i][j]));
  const n = timeSeries.length;
  const res = numeric.identity(n);
  for (let i = 0; i < n; i++) {
    const xs = logrets.map((vs) => vs[i]);
    for (let j = i + 1; j < n; j++) {
      const ys = logrets.map((vs) => vs[j]);
      const c = math.corr(xs, ys);
      res[i][j] = c;
      res[j][i] = c;
    }
  }
  return res;
}

// export function stdev(values: number[]) {
//   let n = 0;
//   let vp: number | null = null;
//   const xs = [];
//   while (n < values.length) {
//     let v = Math.log(values[n++]);
//     if (vp !== null) {
//       xs.push(v - vp);
//     }
//     vp = v;
//   }
//   // return { xs, ys };
//   return math.stdev(xs);
// }

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

export function calcMeasures(timeSeries: TimeSeries) {
  const dates = timeSeries.dates.slice();
  const values = timeSeries.values.slice();
  const datesAsNumber = dates.map((d) => new Date(d).getTime());
  const returns = accumulate(values, (pRes, pVal, cVal, i) => (i === 0 ? 0 : cVal / pVal - 1));
  const logValues = accumulate(values, (pRes, pVal, cVal, i) => log(cVal));
  const logReturns = accumulate(logValues, (pRes, pVal, cVal, i) => (i === 0 ? 0 : cVal - pVal));
  const rsi14 = rsi(values);
  const ema20 = ema(returns, 2 / (20 + 1));
  const ema40 = ema(returns, 2 / (40 + 1));
  const ema60 = ema(returns, 2 / (60 + 1));
  const sqr20 = ema(logReturns.map(sqr), 2 / (20 + 1));
  const sqr40 = ema(logReturns.map(sqr), 2 / (40 + 1));
  const sqr60 = ema(logReturns.map(sqr), 2 / (60 + 1));
  const kelly20 = rollingKelly(returns, 2 / (20 + 1));
  const kelly40 = rollingKelly(returns, 2 / (40 + 1));
  const kelly60 = rollingKelly(returns, 2 / (60 + 1));
  const { ks: trend20 } = rollingTrend(logReturns, 2 / (20 + 1));
  const emaLag = (values: number[], alpha: number) =>
    accumulate(values, (pRes, pVal, cVal, i) => (i === 0 ? cVal : (1 - alpha) * pRes + alpha * pVal));
  const fwd5 = emaLag(returns.reverse(), 2 / (5 + 1)).reverse();
  const pos20 = accumulate(ema20, (pRes, pVal, cVal, i) => (i === 0 ? (cVal >= 0 ? 1 : 0) : cVal >= 0 ? pRes + 1 : 0));
  const neg20 = accumulate(ema20, (pRes, pVal, cVal, i) => (i === 0 ? (cVal <= 0 ? 1 : 0) : cVal <= 0 ? pRes + 1 : 0));
  const pos40 = accumulate(ema40, (pRes, pVal, cVal, i) => (i === 0 ? (cVal >= 0 ? 1 : 0) : cVal >= 0 ? pRes + 1 : 0));
  const neg40 = accumulate(ema40, (pRes, pVal, cVal, i) => (i === 0 ? (cVal <= 0 ? 1 : 0) : cVal <= 0 ? pRes + 1 : 0));
  const pos60 = accumulate(ema60, (pRes, pVal, cVal, i) => (i === 0 ? (cVal >= 0 ? 1 : 0) : cVal >= 0 ? pRes + 1 : 0));
  const neg60 = accumulate(ema60, (pRes, pVal, cVal, i) => (i === 0 ? (cVal <= 0 ? 1 : 0) : cVal <= 0 ? pRes + 1 : 0));
  return {
    dates,
    datesAsNumber,
    values,
    logValues,
    returns,
    logReturns,
    rsi14,
    ema20,
    ema40,
    ema60,
    sqr20,
    sqr40,
    sqr60,
    kelly20,
    kelly40,
    kelly60,
    trend20,
    fwd5,
    pos20,
    neg20,
    pos40,
    neg40,
    pos60,
    neg60,
  } as Measures;
}
