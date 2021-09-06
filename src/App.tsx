import React, { useRef, useEffect, useState } from "react";
import c3 from "c3";
import "c3/c3.css";
import * as math from "ts-math";
import { RandomNumberGenerator } from "ts-math";

import { salesByDate } from "./SuperstoreSalesData";
// import { airlinePassengers } from "./AirlinePassengersData";
import { randomTimeSeries, ema, diff, rsi, TimeSeries, toChartProps } from "./timeSeries";
import Table from "./Table";
import { universe } from "./data/universe";

const rng = new RandomNumberGenerator("123");

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

(window as any).superstoreSalesData = salesByDate;
// console.log(salesByDate);
// console.log(airlinePassengers);
// const ts = randomTimeSeries(rng, "2020-12-05", "2021-09-05");
// const ts2 = { dates: ts.dates.slice(), values: ts.values.map((d, i) => 100 - i + 2 * Math.floor(i / 3)) };
const ts2: any = universe.find((d) => d.ticker === "SWEC B");
const rsis = rsi(ts2.values);
universe.forEach((d: any) => {
  d.rsiValues = rsi(d.values);
});

function Chart({ data, axis }: { data: any; axis: any }) {
  const ref = useRef(null);
  useEffect(() => {
    c3.generate({
      bindto: ref.current,
      data,
      axis,
    });
  }, [data, axis]);
  return <div className="chart" ref={ref}></div>;
}

function App() {
  const [selectedIndex, setSelectedIndex] = useState(universe[0].dates.length-1);
  const [selectedStock, setSelectedStock] = useState(universe[0]);
  const rsis = rsi(selectedStock.values);
  console.log(selectedStock);
  const chartClick = (event: any, el: HTMLElement, ts: any) => {
    // console.log("chartClick", args)
    setSelectedIndex(event.index);
  };
  return (
    <div className="App">
      <Chart {...toChartProps(selectedStock, chartClick)} />
      <Chart {...toChartProps({ name: "RSI", dates: selectedStock.dates, values: rsis }, chartClick)} />
      <p>{universe[0].dates[selectedIndex]}</p>
      <Table
        data={universe.map((d: any, i: number) => ({
          name: d.name,
          last: math.numberFormat(d.values[selectedIndex], "0.00"),
          rsi: math.numberFormat(d.rsiValues[selectedIndex], "0.00"),
        }))}
        columns={["name", "last", "rsi"].map((d) => ({ key: d }))}
        onClick={(event: any, stock: any, column: string) => {
          const ts = universe.find((d) => d.name === stock.name);
          setSelectedStock(ts as any);
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

export default App;
