import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { indexOf, range, sum } from "ts-math";
import { toEpoch } from "./dateHelper";
import { TimeSeriesChart, useCursor } from "./TimeSeriesChart";
import { generateTestTimeSeries } from "./trend";
import { fourierRegression, sinValue } from "./fourier";
import { minMax } from "./timeSeries";
// import instr from "./data/ms/42953.json";

const { log, PI, exp, hypot, atan2, pow } = Math;

// http://localhost:3000/fourier/sin/513

export function calcFourier(dates: string[], logValues: number[], endIndex: number | null) {
  const M = dates.length;
  const N = 40;
  const periods = [-1, 0, 1, 2].map((d) => N * pow(2, d));
  const alpha = 2 / (N + 1);
  const index: number = !Number.isNaN(endIndex) ? (endIndex as number) : M - 1;
  const ws = new Array(dates.length);
  for (let i = 0; i < dates.length; i++) {
    ws[i] = i > index ? 0 : pow(1 - alpha, index - i);
  }
  const ks = fourierRegression(range(logValues.length), logValues, ws, periods);
  console.log(periods.map((p, i) => hypot(ks[2 * i + 1], ks[2 * i + 2])));
  console.log(periods.map((p, i) => (180 / PI) * atan2(ks[2 * i + 2], ks[2 * i + 1])));

  const xs = [];
  const ys = [];
  const hs = periods.map((p, i) => hypot(ks[2 * i + 1], ks[2 * i + 2]));
  const ts = periods.map((p, i) => atan2(ks[2 * i + 2], ks[2 * i + 1]));
  for (let i = 0; i < dates.length; i++) {
    const x = sum(hs.map((h, j) => h * sinValue(periods[j], PI / 2 - ts[j], i)));
    const y = sum(hs.map((h, j) => h * sinValue(periods[j], 0 - ts[j], i)));
    xs.push(x);
    ys.push(y);
  }
  // console.log(hs);
  // console.log(ks[0], ...periods.map((p, i)=>hypot(ks[2 * i + 1], ks[2 * i + 2])));
  // const x = sum(hs.map((h, j) => h * sinValue(periods[j], PI / 2 - ts[j], index)));
  // const y = sum(hs.map((h, j) => h * sinValue(periods[j], -ts[j], index)));
  // console.log(index, (180 / PI) * Math.atan2(y, x), x, y);

  const fourierValues = dates.map((d: string, i: number) => {
    let s = ks[0];
    periods.forEach((p, j) => {
      s += ks[2 * j + 1] * sinValue(p, PI / 2, i);
      s += ks[2 * j + 2] * sinValue(p, 0, i);
    });
    return exp(s);
  });

  // const fourierValues2 = dates.map((d: string, i: number) => {
  //   let s = ks[0];
  //   periods.forEach((p, j) => {
  //     s += hs[j] * sinValue(p, PI / 2 - ts[j], i);
  //   });
  //   return exp(s);
  // });

  return { fourierValues, xs, ys };
}

export function FourierTest() {
  let { type, seed }: any = useParams();
  const page = (useLocation().pathname.match(/^\/([a-z]+)\//) as any)[1];
  const M = 120;
  const { dates, datesAsNumbers, values, logValues, minValue, maxValue } = useMemo(() => {
    const { dates, values } = generateTestTimeSeries(type ?? "random", seed ?? "1", M);
    // const { dates, values } = (instr as any).measures;
    const datesAsNumbers = dates.map(toEpoch);
    const logValues = values.map(log);
    let [minValue, maxValue] = minMax(values);
    minValue /= 1.05;
    maxValue *= 1.05;
    return { dates, datesAsNumbers, values, logValues, minValue, maxValue };
  }, [M, type, seed]);

  const cursor = useCursor(true, false);

  let maxIndex = Number.NaN;
  const [state, setState] = useState({ endIndex: 119, type: type ?? "random", seed: seed ?? "1" });
  if ((type ?? "random") !== state.type || (seed ?? "1") !== state.seed) {
    setState({ endIndex: maxIndex, type: type ?? "random", seed: seed ?? "1" });
  }

  const { fourierValues, xs, ys } = calcFourier(dates, logValues, state.endIndex);

  // const res: TrendSignal = trendSignals.find((d) => d.endIndex === state.endIndex) as any;
  // console.log(
  //   res.startIndex,
  //   state.endIndex,
  //   round(res.sharpeRatio, 2),
  //   round(res.duration, 2),
  //   round(res.strength, 2),
  //   dates.length
  // );
  const series1 = [
    { dates, values },
    { dates, values: fourierValues },
  ];
  const series2 = [{ dates, values: xs }];
  const series3 = [{ dates, values: ys }];

  // console.log(minMax(xs),minMax(ys))

  // // const greenColor = "hsl(122deg 88% 33% / 30%)";
  // const trendColor = "rgb(230 42 42 / 30%)";
  // series.push(trendToSeries(dates, res, meanSigmas, trendColor));
  return (
    <>
      <TimeSeriesChart
        width={800}
        height={500}
        series={series1}
        logarithmic={true}
        minValue={minValue}
        maxValue={maxValue}
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
        cursor={cursor}
      />
      <TimeSeriesChart
        width={800}
        height={120}
        series={series2}
        logarithmic={false}
        onMouseMove={(date, value) => {
          const t = toEpoch(date);
          let index = indexOf(t, datesAsNumbers);
          if (index === -1 && datesAsNumbers.length > 0) {
            index = 0;
          }
          if (index && index !== state.endIndex) {
            setState({ endIndex: index, type: state.type, seed: state.seed });
          }
        }}
        cursor={cursor}
      />
      <TimeSeriesChart
        width={800}
        height={120}
        series={series3}
        logarithmic={false}
        onMouseMove={(date, value) => {
          const t = toEpoch(date);
          let index = indexOf(t, datesAsNumbers);
          if (index === -1 && datesAsNumbers.length > 0) {
            index = 0;
          }
          if (index && index !== state.endIndex) {
            setState({ endIndex: index, type: state.type, seed: state.seed });
          }
        }}
        cursor={cursor}
      />
      <Link to={`/${page}/${type ?? "random"}/${Number(seed ?? "1") + 1}`}>Next</Link>
    </>
  );
}

// http://localhost:3000/trend/stock/91
// http://localhost:3000/trend/line/102
// http://localhost:3000/trend/square/78
