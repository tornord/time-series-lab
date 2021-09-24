import React, { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { round, indexOf } from "ts-math";
import { toEpoch } from "./dateHelper";
import { rollingTrend } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { calcTrendSignals, generateTestTimeSeries, TrendSignal, trendToSeries } from "./trend";

const { log } = Math;

export function TrendTest() {
  let { type, seed }: any = useParams();
  const page = (useLocation().pathname.match(/^\/([a-z]+)\//) as any)[1];
  const N = 20;
  const alpha = 2 / (N + 1);
  const meanSigmas = 2.0;
  const breachBuffer = 0.1;
  const { dates, datesAsNumbers, values, trendSignals } = useMemo(() => {
    const { dates, values } = generateTestTimeSeries(type ?? "stock", seed ?? "1", 120);
    const logValues = values.map(log);
    const { ks, bs } = rollingTrend(logValues, alpha);
    const trendSignals = calcTrendSignals(logValues, alpha, ks, bs, meanSigmas, breachBuffer);
    const datesAsNumbers = dates.map(toEpoch);
    return { dates, datesAsNumbers, values, trendSignals };
  }, [type, seed]);

  let maxStr = -Infinity;
  let maxIndex = Number.NaN;
  for (let i = 0; i < dates.length; i++) {
    const res = trendSignals[i];
    if (i >= N && res.strength > maxStr) {
      maxStr = res.strength;
      maxIndex = i;
    }
  }
  const [state, setState] = useState({ endIndex: maxIndex, type: type ?? "stock", seed: seed ?? "1" });
  if ((type ?? "stock") !== state.type || (seed ?? "1") !== state.seed) {
    setState({ endIndex: maxIndex, type: type ?? "stock", seed: seed ?? "1" });
  }

  const res: TrendSignal = trendSignals.find((d) => d.endIndex === state.endIndex) as any;
  console.log(
    res.startIndex,
    state.endIndex,
    round(res.sharpeRatio, 2),
    round(res.duration, 2),
    round(res.strength, 2),
    dates.length
  );
  const series = [{ dates, values }];

  // const greenColor = "hsl(122deg 88% 33% / 30%)";
  const trendColor = "rgb(230 42 42 / 30%)";
  series.push(trendToSeries(dates, res, meanSigmas, trendColor));
  return (
    <>
      <TimeSeriesChart
        width={800}
        height={500}
        series={series}
        logarithmic={true}
        minValue={84}
        maxValue={118}
        onMouseMove={(date) => {
          const t = toEpoch(date);
          let index = indexOf(t, datesAsNumbers);
          if (index === -1 && datesAsNumbers.length > 0) {
            index = 0;
          }
          if (index && index !== state.endIndex) {
            setState({ endIndex: index, type: state.type, seed: state.seed });
          }
        }}
      />
      <Link to={`/${page}/${type ?? "stock"}/${Number(seed ?? "1") + 1}`}>Next</Link>
    </>
  );
}

// http://localhost:3000/trend/stock/91
// http://localhost:3000/trend/line/102
// http://localhost:3000/trend/square/78
