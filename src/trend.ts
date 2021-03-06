import { RandomNumberGenerator, sqr } from "ts-math";
import { createNormalSamplesOneDim } from "./logUtility";
import { ema, generateRandomTimeSeries } from "./timeSeries";
import { addDays } from "./dateHelper";
import { toAsciiTable } from "./toAsciiTable";

const { pow, sqrt, log, abs, exp, sin, PI } = Math;

export interface TrendSignal {
  mean: number;
  sigma: number;
  startIndex: number;
  endIndex: number;
  strength: number;
  duration: number;
  sharpeRatio: number;
  q: number;
  k: number;
  b: number;
}

export enum PointType {
  Circle = "Circle",
}

export interface Series {
  dates: string[];
  values: number[];
  color?: string;
  strokeWidth?: number;
  fillColor?: string;
  drawPath?: boolean;
  pointType?: PointType;
  pointSize?: number;
  strokeDasharray?: string;
}

export function trend(vs: number[], alpha: number) {
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
  return { ks, bs };
}

// const transpose = (arrays) => arrays[0].map((_, j) => [arrays.map((d) => d[j])]);

export function trendStrength(
  logValues: number[],
  endIndex: number,
  alpha: number,
  ks: number[],
  bs: number[],
  meanSigmas: number,
  breachBuffer: number,
  skipDebug: boolean = true
): TrendSignal {
  const xs = logValues.slice(0, endIndex + 1);
  const n = xs.length;
  const debug = {
    skip: skipDebug,
    means: new Array(skipDebug ? 0 : n),
    sigmas: new Array(skipDebug ? 0 : n),
    sumBreaches: new Array(skipDebug ? 0 : n),
  };
  const k = ks[endIndex];
  const b = bs[endIndex];
  const ts = xs.map((d, i) => b - k * (endIndex - i));
  const errors = xs.map((d, i) => d - ts[i]);
  const maSqrErrors = ema(errors.map(sqr), alpha);
  const mean = exp(ks[endIndex]) - 1;
  const sigma = sqrt(maSqrErrors[n - 1]);
  let sumErrors = 0;
  let startIndex = 0;
  let sumBreach = 0;
  for (let i = 0; i < n; i++) {
    const m = n - 1 - i;
    sumErrors += errors[m];
    const curSigma = i > 0 ? (sigma * meanSigmas) / sqrt(i) : 0;
    const curMean = sumErrors / (i + 1);
    if (!debug.skip) {
      debug.sigmas[m] = curSigma;
      debug.means[m] = curMean;
    }
    if (i !== 0 && startIndex === 0 && abs(curMean) > curSigma) {
      sumBreach += abs(curMean) / curSigma - 1;
      if (sumBreach > breachBuffer) {
        startIndex = m + 1;
        if (debug) {
          debug.sumBreaches[m] = sumBreach;
        }
        break;
      }
    }
    if (!debug.skip) {
      debug.sumBreaches[m] = sumBreach;
    }
  }
  if (!debug.skip) {
    const table = toAsciiTable(
      [
        logValues.map(exp),
        xs,
        ts,
        errors.map((d) => 100 * d),
        debug.means.map((d) => 100 * d),
        debug.sigmas.map((d) => 100 * d),
        debug.sumBreaches,
      ],
      ["close", "x", "trend", "error", "means", "sigmas", "sumBreaches"]
    );
    console.log(table.toString());
    console.log(sigma, startIndex, endIndex);
  }
  const sharpeRatio = (sqrt(252) * mean) / sigma;
  const duration = (endIndex - startIndex) / 21;
  const strength = duration * sharpeRatio;
  const q = endIndex > 0 ? k - ks[endIndex - 1] : 0;
  return { mean, sigma, startIndex, endIndex, strength, sharpeRatio, duration, q, k, b };
}

export function generateTestTimeSeries(type: string, seed: string, n: number) {
  const rng = new RandomNumberGenerator(seed ?? "1");
  const dailyVol = (0.07 + 0.33 * rng.rand()) / sqrt(252);
  const startDate = "2021-01-01";
  let { dates, values } = generateRandomTimeSeries(
    startDate,
    addDays(startDate, n - 1),
    null,
    0.1,
    dailyVol * sqrt(252),
    0,
    rng.randomSeed()
  );
  if (type !== "random") {
    let ns = createNormalSamplesOneDim(dates.length).map((d) => d[0]);
    ns = rng.shuffle(ns);
    const ys = ns.map((d, i) => (2 * i) / (dates.length - 1) - 1);
    if (type === "square") {
      values = ns.map((d, i) => exp(dailyVol * d + (log(86) + (log(114) - log(86)) * sqr(ys[i]))));
    } else if (type === "line") {
      values = ns.map((d, i) => exp(dailyVol * d + (log(86) + (log(114) - log(86)) * abs(ys[i]))));
    } else if (type === "constant") {
      values = ns.map((d, i) => exp(dailyVol * d + log(100)));
    } else if (type === "sin") {
      const theta = 2 * PI * rng.rand();
      const period = pow(2, 2 * rng.rand() - 1);
      console.log(ns.length * period, (180 / PI) * theta);
      // const theta = 0;
      values = ns.map((d, i) =>
        exp(dailyVol * d + (log(86) + ((log(114) - log(86)) * (1 + sin(period * PI * ys[i] + theta))) / 2))
      );
    }
  }
  return { dates, values };
}

export function calcTrendSignals(
  logValues: number[],
  alpha: number,
  ks: number[],
  bs: number[],
  meanSigmas: number,
  breachBuffer: number
) {
  const trends: TrendSignal[] = new Array(logValues.length);
  for (let i = 0; i < logValues.length; i++) {
    const res = trendStrength(logValues, i, alpha, ks, bs, meanSigmas, breachBuffer);
    trends[i] = res;
  }
  return trends;
}

export function trendToSeries(dates: string[], trendSignal: TrendSignal, meanSigmas: number, fillColor: string) {
  const i0 = trendSignal.startIndex;
  const i1 = trendSignal.endIndex;
  const offset = meanSigmas * trendSignal.sigma;
  const x1 = trendSignal.b;
  const x0 = x1 - (i1 - i0) * trendSignal.k;
  return {
    dates: [dates[i0], dates[i1], dates[i1], dates[i0], dates[i0]],
    values: [exp(x0 + offset), exp(x1 + offset), exp(x1 - offset), exp(x0 - offset), exp(x0 + offset)],
    strokeWidth: 2,
    color: "none",
    fillColor,
  } as Series;
}
