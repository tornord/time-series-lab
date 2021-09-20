import React from "react";
import { numberFormat, numeric, RandomNumberGenerator, sqr } from "ts-math";
import { createNormalSamplesOneDim } from "./logUtility";
import { rollingTrend, addDays, generateRandomTimeSeries, ema } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import AsciiTable from "ascii-table";

const { log, sqrt, abs, exp } = Math;
const skipDebug = true;

function toAsciiTable(arrays: number[][], heading: string[], decimals = null) {
  const rows = numeric.transpose(arrays.map((a: number[], i: number) => a.map((v) => v.toFixed(decimals ? decimals[i] : 2))) as any[][]);
  var table = AsciiTable.factory({
    heading: ["index", ...heading],
    rows: rows.map((d, i) => [i, ...d]),
  });
  table.setBorder(" ");
  arrays.forEach((a: number[], i: number) => {
    table.setAlign(i + 1, AsciiTable.RIGHT);
  });
  return table;
}

function trendStrength(
  logValues: number[],
  endIndex: number,
  alpha: number,
  ks: number[],
  bs: number[],
  meanSigmas: number,
  breachBuffer: number
) {
  const xs = logValues.slice(0, endIndex + 1);
  const n = xs.length;
  const debug = {
    skip: skipDebug,
    means: new Array(skipDebug ? 0 : n),
    sigmas: new Array(skipDebug ? 0 : n),
    sumBreaches: new Array(skipDebug ? 0 : n),
  };
  const ts = xs.map((d, i) => bs[endIndex] - ks[endIndex] * (endIndex - i));
  const errors = xs.map((d, i) => d - ts[i]);
  const maSqrErrors = ema(errors.map(sqr), alpha);
  const sigma = sqrt(maSqrErrors[n - 1]);
  let sumErrors = 0;
  let startIndex = 0;
  let sumBreach = 0;
  for (let i = 0; i < n; i++) {
    const m = n - 1 - i;
    sumErrors += errors[m];
    const _sigma = i > 0 ? (sigma * meanSigmas) / sqrt(i) : 0;
    const _mean = sumErrors / (i + 1);
    if (!debug.skip) {
      debug.sigmas[m] = _sigma;
      debug.means[m] = _mean;
    }
    if (i !== 0 && startIndex === 0 && abs(_mean) > _sigma) {
      sumBreach += abs(_mean) / _sigma - 1;
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
  return { sigma, startIndex };
}

export function TrendTest() {
  const rng = new RandomNumberGenerator("129");
  // const ns = createNormalSamplesOneDim(21).map((d) => d[0]);
  // const xs = rng.shuffle(ns).map((d, i) => 0.5 * d + (i <= 10 ? 10 - i : i - 10));
  const { dates, values } = generateRandomTimeSeries(
    "2021-01-01",
    "2021-03-01",
    null,
    0.1,
    0.1 + 0.3 * rng.rand(),
    0,
    rng.randomSeed()
  );
  const logValues = values.map(log);
  const endIndex = logValues.length - 1;
  const N = 20;
  const alpha = 2 / (N + 1);
  const { ks, bs } = rollingTrend(logValues, alpha);
  const breachBuffer = 0.1;
  const meanSigmas = 1.6;

  const res = trendStrength(logValues, endIndex, alpha, ks, bs, meanSigmas, breachBuffer);

  console.log(res.sigma, res.startIndex, endIndex);
  const series = [{ dates, values }];
  const toSerie = (i0: number, i1: number, offset: number) => {
    const x0 = bs[i1] - (i1 - i0) * ks[i1];
    const x1 = bs[i1];
    return {
      dates: [dates[i0], dates[i1], dates[i1], dates[i0], dates[i0]],
      values: [exp(x0 + offset), exp(x1 + offset), exp(x1 - offset), exp(x0 - offset), exp(x0 + offset)],
      strokeWidth: 2,
      color: "none",
      fillColor: limitColor,
    };
  };
  const greenColor = "hsl(122deg 88% 33% / 30%)";
  const limitColor = "rgb(230 42 42 / 30%)";
  series.push(toSerie(res.startIndex, endIndex, 1 * res.sigma));
  return <TimeSeriesChart series={series} logarithmic={true} minValue={85} maxValue={118} />;
}
