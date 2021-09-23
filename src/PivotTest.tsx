import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { indexOf, linearRegression } from "ts-math";
import { toEpoch } from "./dateHelper";
import { ema, rollingTrend } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { generateTestTimeSeries, PointType, Series } from "./trend";

const { log, exp, abs, pow } = Math;

function centralEma(vs: number[], alpha: number) {
  const n = vs.length;
  const xs: number[] = new Array(n);
  const ws: number[] = new Array(n);
  const res: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      xs[j] = j - i;
      ws[j] = pow(1 - alpha, abs(i - j));
    }
    const reg = linearRegression(xs, vs, ws);
    res[i] = reg.b;
  }
  return res;
}

function pivots(logValues: number[], alpha: number) {
  const n = logValues.length;
  const res = [];
  const N = Math.round(2 / alpha - 1);
  const xs: number[] = new Array(n);
  const backws: number[] = new Array(n);
  const fwdws: number[] = new Array(n);
  for (let i = N; i < logValues.length - N; i++) {
    for (let j = 0; j < n; j++) {
      xs[j] = j - i;
      backws[j] = j <= i ? pow(1 - alpha, abs(i - j)) : 0;
      fwdws[j] = j >= i ? pow(1 - alpha, abs(i - j)) : 0;
    }
    const backreg = linearRegression(xs, logValues, backws);
    const fwdreg = linearRegression(xs, logValues, fwdws);
    if (backreg.k > 0 && fwdreg.k < 0) {
      res.push({ index: i, type: "max", value: logValues[i] });
    }
    if (backreg.k < 0 && fwdreg.k > 0) {
      res.push({ index: i, type: "min", value: logValues[i] });
    }
  }
  return res;
}

export function PivotTest() {
  let { type, seed }: any = useParams();
  const page = (useLocation().pathname.match(/^\/([a-z]+)\//) as any)[1];

  const N = 20;
  const alpha = 2 / (N + 1);
  const { dates, values } = generateTestTimeSeries(type ?? "stock", seed ?? "1", 120);
  const datesAsNumber = dates.map(toEpoch);
  const logValues = values.map(log);

  const { ks, bs } = rollingTrend(logValues, alpha);
  const emmeans = ema(logValues, alpha);
  const cenemas = centralEma(logValues, 2 / (N / 2 + 1));
  const pivs = pivots(logValues, 2 / (N + 1));

  const series: Series[] = [
    { dates, values },
    { dates, values: bs.map(exp) },
    { dates, values: emmeans.map(exp) },
    { dates, values: cenemas.map(exp) },
    {
      dates: pivs.map((d) => dates[d.index]),
      values: pivs.map((d) => d.value).map(exp),
      drawPath: false,
      pointType: PointType.Circle,
    },
  ];

  // const greenColor = "hsl(122deg 88% 33% / 30%)";
  const trendColor = "rgb(230 42 42 / 30%)";
  return (
    <>
      <TimeSeriesChart
        width={800}
        height={500}
        series={series}
        logarithmic={true}
        minValue={84}
        maxValue={124}
        onMouseMove={(date, value) => {
          const index = indexOf(toEpoch(date), datesAsNumber);
          console.log(date, values[index], exp(cenemas[index]));
        }}
      />
      <Link to={`/${page}/${type ?? "stock"}/${Number(seed ?? "1") + 1}`}>Next</Link>
    </>
  );
}

// http://localhost:3000/pivot/stock/17
