import React, { useRef, useEffect } from "react";
import c3 from "c3";
import "c3/c3.css";
import * as math from "ts-math";
import { RandomNumberGenerator } from "ts-math";

import "./App.css";
import { salesByDate } from "./SuperstoreSalesData";
// import { airlinePassengers } from "./AirlinePassengersData";
import { randomTimeSeries, ema, diff } from "./timeSeries";
import Table from "./Table";
import sweco from "./data/5637.json";

const rng = new RandomNumberGenerator("123");

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

(window as any).superstoreSalesData = salesByDate;
// console.log(salesByDate);
// console.log(airlinePassengers);
// const ts = randomTimeSeries(rng, "2020-12-05", "2021-09-05");
// const ts2 = { dates: ts.dates.slice(), values: ts.values.map((d, i) => 100 - i + 2 * Math.floor(i / 3)) };
const ts2 = { dates: sweco.history.map((d) => d.date), values: sweco.history.map((d) => d.closeprice) };
const N = 5;
const emas1 = ema(ts2.values, 2 / (N + 1));
const ssmas = ema(ts2.values, 1 / N);
const diffs = diff(ts2.values);
const ups = diffs.map((d, i) => Math.max(d, 0));
const downs = diffs.map((d, i) => Math.max(-d, 0));
const emaUps = ema(ups, 1 / 14);
const emaDowns = ema(downs, 1 / 14);
const rsis: number[] = [];
for (let i = 0; i < ts2.values.length; i++) {
  const up = emaUps[i];
  const down = emaDowns[i];
  const rsi = 100 - (down === 0 ? (up === 0 ? 50 : 0) : 100 / (1 + up / down));
  rsis.push(rsi);
}

function Chart({ data, axis }: { data: any; axis: any }) {
  const ref = useRef(null);
  useEffect(() => {
    c3.generate({
      bindto: ref.current,
      data,
      axis,
    });
  }, []);
  return <div className="chart" ref={ref}></div>;
}

function App() {
  const data = {
    x: "x",
    xFormat: "%Y-%m-%d",
    columns: [
      ["x", ...ts2.dates],
      ["data1", ...ts2.values],
    ],
  };
  const axis = {
    x: {
      type: "timeseries",
      tick: {
        format: "%Y-%m-%d",
      },
    },
  };
  return (
    <div className="App">
      <Chart {...{ data, axis }} />
      <Table
        data={ts2.values.map((d, i) => ({
          date: ts2.dates[i],
          value: math.numberFormat(d, "0.0000"),
          ema3: math.numberFormat(emas1[i], "0.0000"),
          ssmas: math.numberFormat(ssmas[i], "0.0000"),
          diff: math.numberFormat(diffs[i], "0.0000"),
          up: math.numberFormat(ups[i], "0.0000"),
          down: math.numberFormat(downs[i], "0.0000"),
          rsi: math.numberFormat(rsis[i], "0.0000"),
        }))}
        columns={[
          { key: "date" },
          { key: "value" },
          { key: "ema3" },
          { key: "ssmas" },
          { key: "diff" },
          { key: "up" },
          { key: "down" },
          { key: "rsi" },
        ]}
        onClick={null}
      />
    </div>
  );
}

export default App;
