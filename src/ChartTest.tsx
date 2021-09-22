import { useMemo } from "react";
import { accumulate, generateRandomTimeSeries, minMax } from "./timeSeries";
import { TimeSeriesChart } from "./TimeSeriesChart";
import { isBusinessDay } from "./dateHelper";

const { log, exp, sqrt } = Math;

export function ChartTest() {
  const startDate = "2020-08-01";
  const endDate = "2021-09-17";
  const timeSeries = useMemo(() => {
    return generateRandomTimeSeries(startDate, endDate, isBusinessDay, 0.1, 0.2, 0, Date.now().toFixed());
  }, []);
  const logValues = accumulate(timeSeries.values, (pRes, pVal, cVal, i) => log(cVal));

  const minMaxRatio = 1.5;
  const minmax = minMax(logValues);
  const mid = exp((minmax[0] + minmax[1]) / 2);
  const maxValue = mid * sqrt(minMaxRatio);
  const minValue = mid / sqrt(minMaxRatio);
  console.log(maxValue / minValue);

  return (
    <TimeSeriesChart
      series={[timeSeries]}
      startDate={startDate}
      endDate={endDate}
      logarithmic={true}
      minValue={minValue}
      maxValue={maxValue}
    />
  );
}
