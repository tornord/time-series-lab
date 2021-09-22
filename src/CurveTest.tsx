import React from "react";
import { NaturalCubicSpline, range } from "ts-math";

import { addDays, toEpoch } from "./dateHelper";
import { TimeSeriesChart } from "./TimeSeriesChart";

export function CurveTest() {
  const dates0 = [0, 10, 30, 40].map((d) => addDays("2021-01-01", d));
  const values0 = [1, 4, 4.5, 3];
  const c = new NaturalCubicSpline(dates0.map(toEpoch), values0);
  const dates1 = range(41).map((d) => addDays("2021-01-01", d));
  const values1 = dates1.map((d) => c.y(toEpoch(d)));
  return (
    <TimeSeriesChart
      series={[{ dates: dates0, values: values0 },{ dates: dates1, values: values1 }]}
      onMouseMove={(date) => {
        console.log(date);
      }}
    />
  );
}
