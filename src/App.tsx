import React, { useRef, useEffect } from "react";
import c3 from "c3";
import "c3/c3.css";
import * as math from "ts-math";
// import { groupBy } from "lodash";

import "./App.css";
import { salesByDate } from "./SuperstoreSalesData";
import { airlinePassengers } from "./AirlinePassengersData";

// https://towardsdatascience.com/an-end-to-end-project-on-time-series-analysis-and-forecasting-with-python-4835e6bf050b

(window as any).superstoreSalesData = salesByDate;
// console.log(salesByDate);
console.log(airlinePassengers);

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
    xFormat: "%Y-%m",
    columns: [
      // ["x", ...salesByDate.map((d) => d.orderDate)],
      // ["data1", ...salesByDate.map((d) => d.sales)],
      ["x", ...airlinePassengers.map((d) => d.Month)],
      ["data1", ...airlinePassengers.map((d) => d.Passengers)],
    ],
  };
  const axis = {
    x: {
      type: "timeseries",
      tick: {
        format: "%Y-%m",
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
