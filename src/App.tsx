import React, { useRef, useEffect } from "react";
import c3 from "c3";
import "c3/c3.css";
import * as math from "ts-math";
// import { groupBy } from "lodash";

import "./App.css";
import superstoreSalesData from "./data/train.json";

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

interface DataItem {
  orderDate: string;
  sales: number;
}

const dataUngrouped: DataItem[] = (superstoreSalesData as any[])
  .filter((d) => !isNaN(d.Sales) && d.Sales > 0)
  .map((d) => {
    const m = d["Order Date"].match(/([0-9]+)\/([0-9]+)\/([0-9]+)/) as string[];
    return { orderDate: `${m[3]}-${m[2]}-${m[1]}`, sales: d["Sales"] };
  });
const salesByDate: DataItem[] = Object.values(
  dataUngrouped.reduce((p: { [date: string]: DataItem }, c: DataItem) => {
    let key = c.orderDate.slice(0, 7);
    let d = p[key];
    if (!d) {
      d = { orderDate: key + "-01", sales: 0 };
      p[key] = d;
    }
    d.sales += c.sales;
    return p;
  }, {})
);
salesByDate.sort((d1, d2) => (d1.orderDate < d2.orderDate ? -1 : 1));

(window as any).superstoreSalesData = salesByDate;
console.log(salesByDate);

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
      ["x", ...salesByDate.map((d) => d.orderDate)],
      ["data1", ...salesByDate.map((d) => d.sales)],
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
      <p>{math.round(math.stdev([1, 2, 3, 4, 5, 6]), 6)}</p>
      <Chart {...{ data, axis }} />
    </div>
  );
}

export default App;
