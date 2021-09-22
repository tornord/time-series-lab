import * as d3 from "d3";
import * as math from "ts-math";
import { dateToString, toEpoch } from "./dateHelper";
import { minMax, TimeSeries } from "./timeSeries";
import { Series } from "./trend";

interface TimeSeriesChartProps {
  width?: number;
  height?: number;
  series: Series[];
  onMouseMove?: (date: string) => void;
  startDate?: string | null;
  endDate?: string | null;
  minValue?: number;
  maxValue?: number;
  logarithmic?: boolean;
}

interface Point {
  date: number;
  value: number;
}

interface Trace {
  d: string;
  series: Series;
}

const round2 = (x: number) => math.round(x, 2);

function createPathD(
  { dates, values }: TimeSeries,
  xScale: d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number>
) {
  const points: Point[] = dates.map((d, i) => ({ date: toEpoch(d), value: values[i] }));
  const lineXValue = (d: any, i: number) => round2(xScale(d.date));
  const lineYValue = (d: any, i: number) => round2(yScale(d.value));
  const line = d3.line().x(lineXValue).y(lineYValue);
  return line(points as any[]);
}

const isNumber = (x: any) => typeof x === "number";

export function TimeSeriesChart({
  width,
  height,
  series,
  onMouseMove,
  startDate,
  endDate,
  minValue,
  maxValue,
  logarithmic,
}: TimeSeriesChartProps) {
  width = width ?? 600;
  height = height ?? 300;
  const marginTop = 0;
  const marginLeft = 14;
  const marginRight = 33.5;
  const xAxisHeight = 24.5;
  const textColor = "rgb(232, 213, 206)";
  const traceColors = ["rgb(10, 101, 158)", "hsl(122deg 88% 33%)"];
  const xTickSize = 5;
  const fontSize = 11;
  const fontColor = "#789";
  const yRelativeMargin = 0.1;

  // const data = dates.map((d, i) => ({ date: d, value: values[i] }));
  let totMinV = Number.NaN;
  let totMaxV = Number.NaN;
  let totStartD = "";
  let totEndD = "";
  for (let i = 0; i < series.length; i++) {
    const { dates, values } = series[0];
    const minMaxValues = minMax(values);
    const minv = minMaxValues[0] - yRelativeMargin * (minMaxValues[1] - minMaxValues[0]);
    const maxv = minMaxValues[1] + yRelativeMargin * (minMaxValues[1] - minMaxValues[0]);
    if (!isNumber(totMinV) || minv < totMinV) {
      totMinV = minv;
    }
    if (!isNumber(totMaxV) || maxv > totMaxV) {
      totMaxV = maxv;
    }
    if (!totStartD || dates[0] < totStartD) {
      totStartD = dates[0];
    }
    if (!totEndD || dates[dates.length - 1] > totEndD) {
      totEndD = dates[dates.length - 1];
    }
  }
  if (!isNumber(minValue)) {
    minValue = totMinV;
  }  if (!isNumber(totMaxV)) {
    maxValue = totMaxV;
  }  if (!isNumber(totStartD)) {
    startDate = totStartD;
  }  if (!isNumber(totEndD)) {
    endDate = totEndD;
  }
  console.log(minValue, maxValue);
  const yScale = logarithmic === true ? d3.scaleLog() : d3.scaleLinear();
  yScale.domain([minValue as number, maxValue as number]).range([height - xAxisHeight - marginTop, marginTop]);
  const yTicks = yScale.ticks(5);
  const xScale = d3
    .scaleTime()
    .domain([toEpoch(startDate as string), toEpoch(endDate as string)])
    .range([marginLeft, width - marginRight]);
  const xTicks = xScale.ticks(5);
  const traces: Trace[] = [];
  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    traces.push({ d: createPathD(s, xScale, yScale) as string, series: s });
  }

  // console.log(minValue, maxValue, yScale(minValue), yScale(maxValue), yTicks);
  return (
    <svg
      width={width}
      height={height}
      onMouseMove={(e) => {
        const x = e.clientX;
        const date = dateToString(new Date(xScale.invert(x)));
        if (onMouseMove) {
          onMouseMove(date);
        }
      }}
    >
      <g transform={`translate(${0},${height - xAxisHeight})`}>
        <line x1="0" y1="0" x2={width} y2="0" stroke={textColor} strokeWidth="1" />
        {xTicks.map((d, i) => (
          <g key={i} transform={`translate(${xScale(d)},${0})`}>
            <line x1="0" y1="0" x2="0" y2={xTickSize} stroke={textColor} strokeWidth="1" />
            <text
              x="0"
              y={xTickSize + (xAxisHeight - xTickSize - fontSize) / 2 + 0.5}
              textAnchor="middle"
              alignmentBaseline="hanging"
              style={{ fontSize, color: fontColor, fill: fontColor }}
            >
              {dateToString(d)}
            </text>
          </g>
        ))}
      </g>
      <g>
        {yTicks.map((d, i) => (
          <g key={i} transform={`translate(${0},${yScale(d)})`}>
            <line x1="0" y1="0" x2={width} y2="0" stroke={textColor} strokeWidth="1" strokeDasharray="4,3" />
            <text
              x={(width as number) - 1}
              y={-2}
              textAnchor="end"
              style={{ fontSize, color: fontColor, fill: fontColor }}
            >
              {d.toFixed(0)}
            </text>
          </g>
        ))}
      </g>
      {traces.map((trace: Trace, i: number) => (
        <path
          key={i}
          d={trace.d as string}
          fill={trace.series.fillColor ?? "none"}
          stroke={trace.series.color ?? traceColors[i % traceColors.length]}
          strokeWidth={trace.series.strokeWidth ?? 2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
