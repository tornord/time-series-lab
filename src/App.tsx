import { useMemo, useState } from "react";
import * as math from "ts-math";
import { PCA } from "ml-pca";

// import { salesByDate } from "./SuperstoreSalesData";
// import { airlinePassengers } from "./AirlinePassengersData";
import { indexOf, correlation, synchronize, generateRandomTimeSeries, isBusinessDay, accumulate } from "./timeSeries";
import Grid, { Column } from "./Grid";
import { getUniverse } from "./data/universe";
import { minMax, TimeSeriesChart } from "./TimeSeriesChart";
import { History } from "./millistreamApi";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { RandomNumberGenerator, stdev } from "ts-math";
import { ChartTest } from "./ChartTest";
import { TrendTest } from "./TrendTest";

const { min, max, log, sqrt, exp } = Math;

// const rng = new RandomNumberGenerator("123");

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

// (window as any).superstoreSalesData = salesByDate;
// console.log(salesByDate);
// console.log(airlinePassengers);
// const ts = randomTimeSeries(rng, "2020-12-05", "2021-09-05");
// const ts2 = { dates: ts.dates.slice(), values: ts.values.map((d, i) => 100 - i + 2 * Math.floor(i / 3)) };

let startDate: string | null = null;
let endDate: string | null = null;
const stdevs: number[] = [];
const universe = getUniverse();
const corrs = correlation(universe.map((d) => d.measures));
const vss = synchronize(universe.map((d) => d.measures)).map((vs) => vs.map(Math.log));
const logrets = vss.slice(1).map((vs, i) => vs.map((v, j) => v - vss[i][j]));
const pca: any = new PCA(logrets);
const evals = pca.getEigenvalues();
// const evecs: any = pca.getEigenvectors().valueOf();
const nf = 4; // Number of factors
const f =
  1 /
  pca
    .getExplainedVariance()
    .slice(0, nf)
    .reduce((sum: number, d: number) => sum + d, 0);
// const pcastdevs = pca.S.slice(0, nf).map((d: number) => Math.sqrt(f * d));
const eigenVectors = pca.U.data.map((d: number[]) => d.slice(0, nf));

const ps = [];
for (let i = 0; i < evals.length; i++) {
  ps.push([universe[i].ticker.toLowerCase().replace(/ /g, ""), 10 * eigenVectors[i][0], 10 * eigenVectors[i][1]]);
}
const scatterData = {
  xs: ps.reduce((p: any, c, i) => {
    p[c[0]] = `${c[0]}_x`;
    return p;
  }, {}),
  columns: ps.reduce((p, c, i) => {
    p.push([`${c[0]}_x`, c[1]] as any);
    p.push([`${c[0]}`, c[2]] as any);
    return p;
  }, []),
  type: "scatter",
};
for (let i = 0; i < universe.length; i++) {
  const u1 = universe[i];
  const s = stdev(u1.measures.logReturns);
  stdevs.push(s);
}
// const corrPos = calcCorrPositions(corrs);
// console.log(corrPos);
let minMaxRatio = Number.NaN;
universe.forEach((d: History, i: number) => {
  d.measures.dates.forEach((d: string) => {
    if (!startDate || d < startDate) {
      startDate = d;
    }
    if (!endDate || d > endDate) {
      endDate = d;
    }
  });

  const minmax = minMax(d.measures.values);
  const md = minmax[1] / minmax[0];
  if (Number.isNaN(minMaxRatio) || md > minMaxRatio) {
    minMaxRatio = md;
    console.log(d.name, minMaxRatio);
  }

  const cs = corrs[i];
  const peers = cs
    .map((c, j) => ({ correlation: c, stock: universe[j] }))
    .filter((c) => c.stock !== d && c.correlation > 0.5);
  peers.sort((d1, d2) => d2.correlation - d1.correlation);
  // d.peers = peers;
});
(window as any).universe = universe;

function toColumns(data: any[]): Column[] {
  if (data.length === 0) return [];
  const header = null;
  const row = data[0];
  const res = Object.keys(data[0]).map((key) => {
    let className = "alignCenter";
    let format = null;
    if (typeof row[key] === "string") {
      className = "alignLeft maxWidth maxWidth--w140px";
    } else if (data.some((d) => typeof d[key] === "number")) {
      format = "0.00";
      if (key.startsWith("pos") || key.startsWith("neg")) {
        format = "0";
      }
      if (key.startsWith("ema") || key.startsWith("fwd")) {
        format = "0.00%";
      }
      if (key.startsWith("sqr")) {
        format = "0.000%";
      }
      if (key.startsWith("trend")) {
        format = "0.00%";
      }
    }
    if (key === "peers") {
      className = "alignLeft maxWidth maxWidth--w260px";
    }
    if (Array.isArray(row[key])) {
      format = (v: string[]) => v.join(", ");
    }
    return { header, key, className, format };
  });
  return res;
}

function StartView() {
  const ms = universe[0].measures;
  const [selectedDate, setSelectedDate] = useState(ms.dates[ms.dates.length - 1]);
  const [selectedStock, setSelectedStock] = useState(universe[0]);
  // const dateIndex = indexOf(new Date(selectedDate).getTime(), selectedStock.measures.datesAsNumber);
  const tableData = universe.map((d: History, i: number) => {
    const t = new Date(selectedDate).getTime();
    const index = indexOf(t, d.measures.datesAsNumber);
    const res: any = {
      name: d.name,
      last: d.measures.values[index],
    };
    ["fwd5", "rsi14", "ema20", "ema60", "sqr20", "sqr60", "kelly20", "kelly40", "kelly60", "trend20"].forEach((k) => {
      res[k] = (d.measures as any)[k][index];
    });
    // res.peers = d.peers.map((e) => `${e.stock.ticker} - ${math.numberFormat(e.correlation, "0%")}`).join(", ");
    return res;
  });
  const minmax = minMax(selectedStock.measures.logValues);
  const mid = exp((minmax[0] + minmax[1]) / 2);
  const maxValue = mid * sqrt(minMaxRatio * 1.2);
  const minValue = mid / sqrt(minMaxRatio * 1.2);
  console.log(selectedDate);
  return (
    <div className="App">
      <TimeSeriesChart
        series={[selectedStock.measures]}
        onMouseMove={(index, date) => {
          if (date && date !== selectedDate) {
            setSelectedDate(date);
          }
        }}
        startDate={startDate}
        endDate={endDate}
        minValue={minValue}
        maxValue={maxValue}
      />
      <TimeSeriesChart
        height={150}
        series={[{ dates: selectedStock.measures.dates, values: selectedStock.measures.rsi14 }]}
        onMouseMove={(index, date) => {
          if (date && date !== selectedDate) {
            setSelectedDate(date);
          }
        }}
        startDate={startDate}
        endDate={endDate}
        minValue={15}
        maxValue={85}
      />
      {/* <C3Chart data={scatterData} axis={{}} /> */}
      {/* <Chart {...toChartProps(selectedStock as TimeSeries, null)} /> */}
      {/* <Chart {...toChartProps({ name: "RSI", dates: selectedStock.dates, values: rsis }, chartClick)} /> */}
      <p>{selectedDate}</p>
      <p>{selectedStock.name}</p>
      {/* <p>{(selectedStock.trend as Trend).ks[dateIndex]}</p>
  <p>{(selectedStock.trend as Trend).bs[dateIndex]}</p> */}
      <Grid
        data={tableData}
        columns={toColumns(tableData)}
        onClick={(event: any, stock: any, column: string) => {
          const ts: any = universe.find((d) => d.name === stock.name);
          setSelectedStock(ts);
        }}
      />
      {/* <Table
    data={ts2.values.map((d: number, i: number) => ({
      date: ts2.dates[i],
      value: math.numberFormat(d, "0.0000"),
      rsi: math.numberFormat(rsis[i], "0.0000"),
    }))}
    columns={["date", "value", "rsi"].map((d) => ({ key: d }))}
    onClick={null}
  /> */}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/charttest">
          <ChartTest />
        </Route>
        <Route path="/trend">
          <TrendTest />
        </Route>
        <Route path="/">
          <StartView />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
