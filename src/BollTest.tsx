import React from "react";
import { useParams } from "react-router-dom";
import { stdev } from "ts-math";
import { getUniverse } from "./data/universe";
import { accumulate, ema, rollingBollinger, rollingStdev } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { toAsciiTable } from "./toAsciiTable";
import { Series } from "./trend";

const { log, exp } = Math;

export function bollingerToSeries(
  dates: string[],
  logValues: number[],
  stdevs: number[],
  alpha: number,
  sigmas: number,
  lineColor: string,
  bandColor: string
): Series[] {
  const meanLogValues = ema(logValues, alpha);
  const meanValues = meanLogValues.map(exp);
  const upperValues = meanLogValues.map((d, i) => d + sigmas * stdevs[i]).map(exp);
  const lowerValues = meanLogValues.map((d, i) => d - sigmas * stdevs[i]).map(exp);
  return [
    { dates, values: lowerValues, color: lineColor },
    { dates, values: upperValues, color: lineColor },
    { dates, values: meanValues, color: lineColor },
    {
      dates: [...dates, ...dates.slice().reverse(), dates[0]],
      values: [...upperValues, ...lowerValues.slice().reverse(), upperValues[0]],
      color: "none",
      fillColor: bandColor,
    },
  ] as Series[];
}

export function BollTest() {
  const universe = getUniverse();
  const stock = universe.find(d=> d.name ==="Apple Inc." )
  let { type, seed }: any = useParams();
  const { dates, values } = (stock as any).measures;// generateTestTimeSeries(type ?? "stock", seed ?? "1", 80);
  const logValues = accumulate(values, (pRes, pVal, cVal, i) => log(cVal));
  const logReturns = accumulate(logValues, (pRes, pVal, cVal, i) => (i === 0 ? 0 : cVal - pVal));
  const N = 20;
  const alpha = 2 / (N + 1);
  const mean = ema(logValues, alpha);
  const stdevs = rollingStdev(logReturns, alpha);
  const bup = mean.map((d, i) => d + 2 * stdevs[i]);
  const blow = mean.map((d, i) => d - 2 * stdevs[i]);
  const boll = rollingBollinger(logValues, alpha);
  const boll2 = logValues.map((d, i) => (stdevs[i] === 0 ? 0 : (d - mean[i]) / stdevs[i]));
  const table = toAsciiTable(
    [dates, logValues, mean, stdevs, boll, bup, blow, boll2],
    ["dates","log", "mean", "std", "boll", "upper", "lower", "boll2"],
    [0,4, 4, 4, 2, 4, 4, 2]
  );
  console.log(table.toString());
  console.log(stdev(logReturns));
  return (
    <TimeSeriesChart
    width={800}
    height={500}
    series={[
        { dates, values },
        ...bollingerToSeries(dates, logValues, stdevs, alpha, 2, "rgb(10 101 158 / 13%)", "rgb(10 101 158 / 10%)"),
      ]}
      onMouseMove={(date, value) => {
        console.log(date, value);
      }}
    />
  );
}
