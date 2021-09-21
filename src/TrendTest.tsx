import React, { useMemo, useState } from "react";
import AsciiTable from "ascii-table";
import { Link, useLocation, useParams } from "react-router-dom";
import { numeric, RandomNumberGenerator, round, sqr } from "ts-math";
// import { createNormalSamplesOneDim } from "./logUtility";
import { rollingTrend, generateRandomTimeSeries, ema, addDays } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { createNormalSamplesOneDim } from "./logUtility";

const { log, sqrt, abs, exp } = Math;
const skipDebug = true;

function toAsciiTable(arrays: number[][], heading: string[], decimals = null) {
  const rows = numeric.transpose(
    arrays.map((a: number[], i: number) => a.map((v) => v.toFixed(decimals ? decimals[i] : 2))) as any[][]
  );
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

interface TrendStrength {
  mean: number;
  sigma: number;
  startIndex: number;
  endIndex: number;
  strength: number;
  duration: number;
  sharpeRatio: number;
}

function trendStrength(
  logValues: number[],
  endIndex: number,
  alpha: number,
  ks: number[],
  bs: number[],
  meanSigmas: number,
  breachBuffer: number
): TrendStrength {
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
  const mean = exp(ks[endIndex]) - 1;
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
  const sharpeRatio = (sqrt(252) * mean) / sigma;
  const duration = (endIndex - startIndex) / 21;
  const strength = duration * sharpeRatio;
  return { mean, sigma, startIndex, endIndex, strength, sharpeRatio, duration };
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function generateTestTimeSeries(type: string, seed: string, n: number) {
  const rng = new RandomNumberGenerator(seed ?? "1");
  const dailyVol = (0.07 + 0.33 * rng.rand()) / sqrt(252);
  const startDate = "2021-01-01";
  let { dates, values } = generateRandomTimeSeries(
    startDate,
    addDays(startDate, n),
    null,
    0.1,
    dailyVol * sqrt(252),
    0,
    rng.randomSeed()
  );
  if (type === "square" || type === "line") {
    const ns = createNormalSamplesOneDim(dates.length).map((d) => d[0]);
    const ys = ns.map((d, i) => (i - (dates.length - 1) / 2) / ((dates.length - 1) / 2));
    if (type === "square") {
      values = rng.shuffle(ns).map((d, i) => exp(dailyVol * d + (log(86) + (log(114) - log(86)) * sqr(ys[i]))));
    } else {
      values = rng.shuffle(ns).map((d, i) => exp(dailyVol * d + (log(86) + (log(114) - log(86)) * abs(ys[i]))));
    }
  }
  return { dates, values };
}

export function TrendTest() {
  let { type, seed }: any = useParams();
  const N = 20;
  const alpha = 2 / (N + 1);
  const meanSigmas = 2.0;
  const { dates, values, maxIndex, trends, ks, bs } = useMemo(() => {
    const { dates, values } = generateTestTimeSeries(type ?? "stock", seed ?? "1", 121);
    const logValues = values.map(log);
    const { ks, bs } = rollingTrend(logValues, alpha);
    const breachBuffer = 0.1;
    const trends = [];
    let maxStr = Number.NaN;
    let maxIndex = Number.NaN;
    for (let i = 0; i < dates.length; i++) {
      const res = trendStrength(logValues, i, alpha, ks, bs, meanSigmas, breachBuffer);
      trends.push(res);
      if (i >= N && (Number.isNaN(maxStr) || res.strength > maxStr)) {
        maxStr = res.strength;
        maxIndex = i;
      }
    }
    return { dates, values, maxIndex, trends, ks, bs };
  }, [type, seed]);

  const [state, setState] = useState({ endIndex: maxIndex, type: type ?? "stock", seed: seed ?? "1" });
  if ((type ?? "stock") !== state.type || (seed ?? "1") !== state.seed) {
    setState({ endIndex: maxIndex, type: type ?? "stock", seed: seed ?? "1" });
  }

  const res: TrendStrength = trends.find((d) => d.endIndex === state.endIndex) as any;
  console.log(
    res.startIndex,
    state.endIndex,
    round(res.sharpeRatio, 2),
    round(res.duration, 2),
    round(res.strength, 2)
  );
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
  series.push(toSerie(res.startIndex, res.endIndex, meanSigmas * res.sigma));
  return (
    <>
      <TimeSeriesChart
        series={series}
        logarithmic={true}
        minValue={84}
        maxValue={118}
        onMouseMove={(index) => {
          if (index && index !== state.endIndex) {
            console.log(index);
            setState({ endIndex: index, type: state.type, seed: state.seed });
          }
        }}
      />
      <Link to={`/trend/${type ?? "stock"}/${Number(seed ?? "1") + 1}`}>Next</Link>
    </>
  );
}

// http://localhost:3000/trend/stock/91
// http://localhost:3000/trend/line/102
// http://localhost:3000/trend/square/78
