import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { round } from "ts-math";
import { rollingTrend } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { calcTrendSignals, generateTestTimeSeries, TrendSignal } from "./trend";

const { log, exp } = Math;

export function TrendTest() {
  let { type, seed }: any = useParams();
  const N = 20;
  const alpha = 2 / (N + 1);
  const meanSigmas = 2.0;
  const breachBuffer = 0.1;
  const { dates, values, trendSignals } = useMemo(() => {
    const { dates, values } = generateTestTimeSeries(type ?? "stock", seed ?? "1", 121);
    const logValues = values.map(log);
    const { ks, bs } = rollingTrend(logValues, alpha);
    const trendSignals = calcTrendSignals(logValues, alpha, ks, bs, meanSigmas, breachBuffer);
    return { dates, values, trendSignals };
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
  const toSerie = (i0: number, i1: number, offset: number) => {
    const x1 = trendSignals[i1].b;
    const x0 = x1 - (i1 - i0) * trendSignals[i1].k;
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
