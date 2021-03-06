import { useEffect, useMemo, useState } from "react";
import { minMax } from "./timeSeries";
import Grid, { Column } from "./Grid";
// import { getUniverse } from "./data/universe";
import { TimeSeriesChart, useCursor } from "./TimeSeriesChart";
import { History } from "./millistreamApi";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { indexOf, RandomNumberGenerator, stdev } from "ts-math";
import { ChartTest } from "./ChartTest";
import { TrendTest } from "./TrendTest";
import { calcFourier, FourierTest } from "./FourierTest";
import { PointType, Series, trendToSeries } from "./trend";
import { toEpoch } from "./dateHelper";
import { CurveTest } from "./CurveTest";
import { BollTest, bollingerToSeries } from "./BollTest";
import { PivotTest } from "./PivotTest";
import { centralRegression, pivots } from "./pivot";
import { allInstrumentInsrefs } from "./data/ms/instruments";
import axios from "axios";
import { TreeTest } from "./TreeTest";

const { sqrt, exp } = Math;
const trendColor = "rgb(230 42 42 / 30%)";

function useFetchHistory(insrefs: string[]) {
  const [data, setData] = useState(null as History[] | null);
  const insrefsStr = insrefs.join(",");
  useEffect(() => {
    const url = `http://localhost:3001/?insrefs=${insrefsStr}`;
    axios.get(url).then(({ data }) => {
      setData(data as unknown as History[] | null);
    });
  }, [insrefsStr]);
  return data;
}

// const rng = new RandomNumberGenerator("123");

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

// (window as any).superstoreSalesData = salesByDate;
// console.log(salesByDate);
// console.log(airlinePassengers);
// const ts = randomTimeSeries(rng, "2020-12-05", "2021-09-05");
// const ts2 = { dates: ts.dates.slice(), values: ts.values.map((d, i) => 100 - i + 2 * Math.floor(i / 3)) };

let startDate: string | null = null;
let endDate: string | null = null;

// const corrPos = calcCorrPositions(corrs);
// console.log(corrPos);

function formatUrlFriendlyName(name: string) {
  if (name !== undefined && name.length > 0) {
    name = name.toLowerCase();
    name = name.replace("$", "\\$");
    name = name.replace(/_|\.| /g, "-");
    name = name.replace(/??|??|??|??/g, "a");
    name = name.replace(/??|??|??|??|??/g, "o");
    name = name.replace(/\/|=|^|#|\*|\(|\)|\+|%/g, "");
  }
  return name;
}

function calcMinMaxs(data: History[]) {
  let totMinMaxRatio = Number.NaN;
  data.forEach((d: History, i: number) => {
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
    if (Number.isNaN(totMinMaxRatio) || md > totMinMaxRatio) {
      totMinMaxRatio = md;
    }

    // const cs = corrs[i];
    // const peers = cs
    //   .map((c, j) => ({ correlation: c, stock: universe[j] }))
    //   .filter((c) => c.stock !== d && c.correlation > 0.5);
    // peers.sort((d1, d2) => d2.correlation - d1.correlation);
    // d.peers = peers;
  });
  return { totMinMaxRatio, startDate, endDate };
}

// (window as any).universe = universe;

function toColumns(data: any[]): Column[] {
  if (data.length === 0) return [];
  const header = null;
  let row: any | null = null;
  for (let i = 0; i < data.length; i++) {
    if (row === null || Object.keys(data[i]).length > Object.keys(row).length) {
      row = data[i];
    }
  }
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
      if (key.startsWith("ema") || key.startsWith("fwd") || key.startsWith("trend") || key.startsWith("std")) {
        format = "0.00%";
      }
      if (key.startsWith("sqr")) {
        format = "0.0%";
      }
      if (key.startsWith("quad") || key.startsWith("lin")) {
        format = "0.000000";
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
  const rng = new RandomNumberGenerator("124");
  let insrefs = allInstrumentInsrefs.slice();
  // rng.shuffle(insrefs);
  // insrefs = insrefs.slice(0, 30);
  const universe = useFetchHistory(insrefs);
  const ms = universe && universe.length > 0 ? universe[0].measures : null;
  const [selectedDate, setSelectedDate] = useState(ms ? ms.dates[ms.dates.length - 1] : null);

  const [selectedStock, setSelectedStock] = useState(universe ? universe[0] : null);
  const { totMinMaxRatio, startDate, endDate } = useMemo(
    () => (universe ? calcMinMaxs(universe) : { totMinMaxRatio: 0, startDate: "", endDate: "" }),
    [universe]
  );
  const cursor = useCursor(true, false);
  useEffect(() => {
    if (universe && !selectedStock) {
      const ms = universe && universe.length > 0 ? universe[0].measures : null;
      setSelectedStock(universe ? universe[0] : null);
      setSelectedDate(ms ? ms.dates[ms.dates.length - 1] : null);
    }
  }, [universe]);

  if (universe === null || selectedStock === null || selectedDate === null) {
    return <div className="App"></div>;
  }
  const selectedIndex = indexOf(toEpoch(selectedDate), selectedStock.measures.datesAsNumber);

  const { fourierValues, xs, ys } = calcFourier(
    selectedStock.measures.dates,
    selectedStock.measures.logValues,
    selectedIndex
  );

  const tableData = universe.map((d: History, i: number) => {
    const res: any = {
      name: d.name,
    };
    const t = toEpoch(selectedDate);
    const index = indexOf(t, d.measures.datesAsNumber);
    if (index < 0) {
      return res;
    }
    res.last = d.measures.values[index];
    [
      "fwd5",
      "rsi14",
      "ema20",
      "std20",
      "std60",
      "boll20",
      "lin20",
      "lin60",
      "quad20",
      "quad60",
      "kelly20",
      "kelly60",
    ].forEach((k) => {
      res[k] = (d.measures as any)[k][index];
    });
    ["std20", "std60"].forEach((d) => (res[d] *= sqrt(252)));
    res.trstr20 = d.measures.trend20[index].strength;
    // res.peers = d.peers.map((e) => `${e.stock.ticker} - ${math.numberFormat(e.correlation, "0%")}`).join(", ");
    return res;
  });
  const minmax = minMax(selectedStock.measures.logValues);
  const mid = exp((minmax[0] + minmax[1]) / 2);
  const maxValue = mid * sqrt(totMinMaxRatio * 1);
  const minValue = mid / sqrt(totMinMaxRatio * 1);
  const trendIndex = indexOf(toEpoch(selectedDate), selectedStock.measures.datesAsNumber);
  const series1: Series[] = [
    selectedStock.measures,
    ...bollingerToSeries(
      selectedStock.measures.dates,
      selectedStock.measures.logValues,
      selectedStock.measures.std20,
      2 / (20 + 1),
      2,
      "rgb(10 101 158 / 20%)",
      "rgb(10 101 158 / 10%)"
    ),
    { dates: selectedStock.measures.dates, values: fourierValues },
  ];
  const Npivot = 40;
  const cenemas = centralRegression(selectedStock.measures.logValues, 2 / (Npivot + 1), 4);
  const pivs = pivots(selectedStock.measures.logValues.slice(0, selectedIndex + 1), 2 / (Npivot + 1), 4);
  series1.push({ dates: selectedStock.measures.dates, values: cenemas.map((d) => d.b).map(exp) });
  series1.push({
    dates: pivs.map((d) => selectedStock.measures.dates[d.index]),
    values: pivs.map((d) => d.value).map(exp),
    drawPath: false,
    pointType: PointType.Circle,
    pointSize: 4,
  });
  const series2: Series[] = [{ dates: selectedStock.measures.dates, values: selectedStock.measures.rsi14 }];
  series2.push({
    dates: pivs.map((d) => selectedStock.measures.dates[d.index]),
    values: pivs.map((d) => selectedStock.measures.rsi14[d.index]),
    drawPath: false,
    pointType: PointType.Circle,
    pointSize: 4,
  });

  if (trendIndex >= 0) {
    series1.push(
      trendToSeries(selectedStock.measures.dates, selectedStock.measures.trend20[trendIndex], 2.0, trendColor) as any
    );
  }
  console.log(selectedDate);
  return (
    <div className="App">
      <TimeSeriesChart
        width={800}
        height={400}
        series={series1}
        onMouseMove={(date) => {
          if (date && date !== selectedDate) {
            setSelectedDate(date);
          }
        }}
        startDate={startDate}
        endDate={endDate}
        minValue={minValue}
        maxValue={maxValue}
        logarithmic={true}
        cursor={cursor}
      />
      <TimeSeriesChart
        width={800}
        height={120}
        series={series2}
        onMouseMove={(date) => {
          if (date && date !== selectedDate) {
            setSelectedDate(date);
          }
        }}
        startDate={startDate}
        endDate={endDate}
        minValue={15}
        maxValue={85}
        cursor={cursor}
      />
      <p>
        {selectedStock.id} -{" "}
        <a
          href={`https://www.di.se/bors/aktier/${formatUrlFriendlyName(
            `${selectedStock.symbol || selectedStock.name}-${selectedStock.insref}`
          )}`}
          target="_blank"
          rel="noreferrer"
        >
          {selectedStock.name}
        </a>{" "}
        - {selectedDate}
      </p>
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
        <Route path="/curve">
          <CurveTest />
        </Route>
        <Route path="/boll/:type/:seed">
          <BollTest />
        </Route>
        <Route path="/trend/:type/:seed">
          <TrendTest />
        </Route>
        <Route path="/fourier/:type/:seed">
          <FourierTest />
        </Route>
        <Route path="/pivot/:type/:seed">
          <PivotTest />
        </Route>
        <Route path="/tree">
          <TreeTest />
        </Route>
        <Route path="/">
          <StartView />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
