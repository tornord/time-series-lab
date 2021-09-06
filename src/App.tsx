import React, { useRef, useEffect } from "react";
import c3 from "c3";
import "c3/c3.css";
import * as math from "ts-math";
import { RandomNumberGenerator } from "ts-math";

import "./App.css";
import { salesByDate } from "./SuperstoreSalesData";
// import { airlinePassengers } from "./AirlinePassengersData";
import { randomTimeSeries, ema, diff, rsi } from "./timeSeries";
import Table from "./Table";
import sweco from "./data/ms/5647.json";

const rng = new RandomNumberGenerator("123");

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

(window as any).superstoreSalesData = salesByDate;
// console.log(salesByDate);
// console.log(airlinePassengers);
// const ts = randomTimeSeries(rng, "2020-12-05", "2021-09-05");
// const ts2 = { dates: ts.dates.slice(), values: ts.values.map((d, i) => 100 - i + 2 * Math.floor(i / 3)) };
const ts2 = { dates: sweco.history.map((d) => d.date), values: sweco.history.map((d) => d.closeprice) };
const N = 14;
const emas = ema(ts2.values, 2 / (N + 1));
const ssmas = ema(ts2.values, 1 / N);
const rsis = rsi(ts2.values);

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
  const rsiData = {
    x: "x",
    xFormat: "%Y-%m-%d",
    columns: [
      ["x", ...ts2.dates],
      ["data1", ...rsis],
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
      <Chart {...{ data: rsiData, axis }} />
      <Table
        data={ts2.values.map((d, i) => ({
          date: ts2.dates[i],
          value: math.numberFormat(d, "0.0000"),
          emas: math.numberFormat(emas[i], "0.0000"),
          ssmas: math.numberFormat(ssmas[i], "0.0000"),
          rsi: math.numberFormat(rsis[i], "0.0000"),
        }))}
        columns={[
          { key: "date" },
          { key: "value" },
          { key: "emas" },
          { key: "ssmas" },
          { key: "rsi" },
        ]}
        onClick={null}
      />
    </div>
  );
}

export default App;
