import React, { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { indexOf, linearRegression, polynomialRegression } from "ts-math";
import { toEpoch } from "./dateHelper";
import { minMax } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { generateTestTimeSeries, PointType, Series } from "./trend";
import { centralRegression, pivots, turningPoints } from "./pivot";

const { log, exp } = Math;

export function PivotTest() {
  const [selectedDate, setSelectedDate] = useState(null as any as string);
  let { type, seed }: any = useParams();
  const page = (useLocation().pathname.match(/^\/([a-z]+)\//) as any)[1];

  const N = 40;
  const alpha = 2 / (N + 1);
  const { dates, values } = generateTestTimeSeries(type ?? "stock", seed ?? "1", 240);
  const datesAsNumber = dates.map(toEpoch);
  const logValues = values.map(log);

  const cenemas = centralRegression(logValues, alpha, 4);
  const pivs = pivots(logValues, alpha, 4);

  const series1: Series[] = [
    { dates, values },
    { dates, values: cenemas.map((d) => d.b).map(exp) },

    {
      dates: pivs.map((d) => dates[d.index]),
      values: pivs.map((d) => d.value).map(exp),
      drawPath: false,
      pointType: PointType.Circle,
      pointSize: 6,
    },
  ];
  const tps = turningPoints(cenemas.map((d) => d.k));
  const series2: Series[] = [
    { dates, values: cenemas.map((d) => d.k) },
    {
      dates: tps.map((d) => dates[d.index]),
      values: tps.map((d) => d.value),
      drawPath: false,
      pointType: PointType.Circle,
      pointSize: 4
    },
  ];
  if (selectedDate) {
    series1.push({
      dates: [selectedDate, selectedDate],
      values: minMax(values),
      strokeDasharray: "3 4",
      strokeWidth: 1,
      color: "rgb(232, 213, 206)",
    });
    series2.push({
      dates: [selectedDate, selectedDate],
      values: minMax(cenemas.map((d) => d.k)),
      strokeDasharray: "3 4",
      strokeWidth: 1,
      color: "rgb(232, 213, 206)",
    });
  }

  // const greenColor = "hsl(122deg 88% 33% / 30%)";
  const trendColor = "rgb(230 42 42 / 30%)";
  return (
    <>
      <TimeSeriesChart
        width={800}
        height={500}
        series={series1}
        logarithmic={true}
        onMouseMove={(date, value) => {
          const index = indexOf(toEpoch(date), datesAsNumber);
          if (index >= 0 && index < dates.length) {
            console.log(date, values[index], exp(cenemas[index].b));
            if (date !== selectedDate && date >= dates[0] && date <= dates[dates.length - 1]) {
              setSelectedDate(date);
            }
          }
        }}
      />
      <TimeSeriesChart
        width={800}
        height={200}
        series={series2}
        logarithmic={false}
        onMouseMove={(date, value) => {
          const index = indexOf(toEpoch(date), datesAsNumber);
          if (index >= 0 && index < dates.length) {
            console.log(date, values[index], exp(cenemas[index].b));
            if (date !== selectedDate && date >= dates[0] && date <= dates[dates.length - 1]) {
              setSelectedDate(date);
            }
          }
        }}
      />
      <Link to={`/${page}/${type ?? "stock"}/${Number(seed ?? "1") + 1}`}>Next</Link>
    </>
  );
}

// http://localhost:3000/pivot/stock/17
