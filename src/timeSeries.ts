import * as math from "ts-math";
import { RandomNumberGenerator } from "ts-math";

const { exp, pow, round, sqrt } = Math;

function toDate(dateAsString: string) {
  return new Date(dateAsString);
}

function dateToString(d: Date) {
  return d.toISOString().substring(0, 10);
}

function addDays(date: string, days: number) {
  const d = toDate(date);
  var res = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, 0, 0, 0));
  res.setUTCHours(0, 0, 0, 0);
  return dateToString(res);
}

function getDayOfWeek(date: string) {
  return toDate(date).getUTCDay();
}

function isBusinessDay(date: string) {
  let w = getDayOfWeek(date);
  return w >= 1 && w <= 5;
}

function generateRandomTimeSeries(
  start: string,
  end: string,
  isBusinessDay: (date: string) => boolean,
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
  while (!isBusinessDay(d)) {
    d = addDays(d, 1);
  }
  while (d <= end) {
    values.push(0);
    dates.push(d);
    d = addDays(d, 1);
    while (!isBusinessDay(d)) {
      d = addDays(d, 1);
    }
  }
  let v = 100.0;
  let c0 = 0.0;
  let c = 0.0;
  var sigma = yearlyvolatility / sqrt(n);
  var r = pow(1.0 + yearlyreturn, 1.0 / n) - 1.0 - math.sqr(sigma) / 2.0;
  for (let i = 0; i < dates.length; i++) {
    values[i] = round(100 * v) / 100;
    c = sigma * rng.randN();
    v *= 1.0 + r + c + autocorrelation * c0;
    c0 = c;
  }
  return { name: String(seed), dates, values };
}

export function randomTimeSeries(rng: RandomNumberGenerator, start: string, end: string) {
  var sigmaMin = 0.15;
  var sigmaMax = 0.3;
  var yearlyReturnAvg = 0.06;
  var yearlyReturnStdev = 0.15;
  var sigma = sigmaMin + (sigmaMax - sigmaMin) * rng.rand();
  var yearlyReturn = yearlyReturnAvg + yearlyReturnStdev * rng.randN();
  var autoCorr = 0.02 * rng.randN();
  var startValue = 100.0 * exp(0.5 * rng.randN());
  var ts = generateRandomTimeSeries(start, end, isBusinessDay, yearlyReturn, sigma, autoCorr, rng.randomSeed());
  ts.values = ts.values.map((d) => (d / 100) * startValue);
  return ts;
}

export function accumulate(values: number[], accumulator: (p: number, c: number, i: number, a: number[]) => number) {
  const res = [];
  let p = Number.NaN;
  for (let i = 0; i < values.length; i++) {
    const c = values[i];
    const v = accumulator(p, c, i, values);
    res.push(v);
    p = c;
  }
  return res;
}

export function diff(values: number[]) {
  return accumulate(values, (p, c, i, a) => (i === 0 ? 0 : c - p));
}

export function ema(values: number[], alpha: number) {
  const accumulator = (p: number, c: number, i: number, a: number[]) => (i === 0 ? c : (1 - alpha) * p + alpha * c);
  const res = [];
  let p = Number.NaN;
  for (let i = 0; i < values.length; i++) {
    const c = values[i];
    const v = accumulator(p, c, i, values);
    res.push(v);
    p = v;
  }
  return res;
}
