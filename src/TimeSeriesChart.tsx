import moment from "moment";
import * as d3 from "d3";
import * as math from "ts-math";
import { dateToString, indexOf } from "./timeSeries";

interface TimeSeriesChartProps {
  width?: number;
  height?: number;
  dates: string[];
  values: number[];
  onMouseMove?: (index: number, date: string) => void;
  startDate: string | null;
  endDate: string | null;
  minValue?: number;
  maxValue?: number;
  logarithmic?: boolean;
}

export function TimeSeriesChart({
  width,
  height,
  dates,
  values,
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
  const traceColor = "rgb(10,101,158)";
  const xTickSize = 5;
  const fontSize = 11;
  const fontColor = "#789";
  const yRelativeMargin = 0.12;

  const data = dates.map((d, i) => ({ date: d, value: values[i] }));
  const minMaxValues = minMax(values);
  const minValueWithMargin = minValue ?? minMaxValues[0] - yRelativeMargin * (minMaxValues[1] - minMaxValues[0]);
  const maxValueWithMargin = maxValue ?? minMaxValues[1] + yRelativeMargin * (minMaxValues[1] - minMaxValues[0]);
  const yScale = logarithmic === true ? d3.scaleLog() : d3.scaleLinear();
  yScale.domain([minValueWithMargin, maxValueWithMargin]).range([height - xAxisHeight - marginTop, marginTop]);
  const yTicks = yScale.ticks(5);
  const startDateAsNumber = new Date(startDate ?? dates[0]).getTime();
  const endDateAsNumber = new Date(endDate ?? dates[dates.length - 1]).getTime();
  const xScale = d3
    .scaleTime()
    .domain([startDateAsNumber, endDateAsNumber])
    .range([marginLeft, width - marginRight]);
  const xTicks = xScale.ticks(5);
  const lineXValue = (d: any, i: number) => math.round(xScale(new Date(d.date).getTime()), 2);
  const lineYValue = (d: any, i: number) => math.round(yScale(d.value), 2);
  const line = d3.line().x(lineXValue).y(lineYValue);
  const tracePathD = line(data as any[]);

  // console.log(minValue, maxValue, yScale(minValue), yScale(maxValue), yTicks);
  return (
    <svg
      width={width}
      height={height}
      onMouseMove={(e) => {
        const x = e.clientX;
        const date = dateToString(new Date(xScale.invert(x)));
        const index = indexOf(
          new Date(date).getTime(),
          dates.map((d) => new Date(d).getTime())
        );
        if (onMouseMove) {
          onMouseMove(index, date);
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
      <path
        d={tracePathD as string}
        fill="none"
        stroke={traceColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function minMax(vs: number[]) {
  let vMin = Number.NaN;
  let vMax = Number.NaN;
  for (let i = 0; i < vs.length; i++) {
    const v = vs[i];
    if (Number.isNaN(vMin) || v < vMin) {
      vMin = v;
    }
    if (Number.isNaN(vMax) || v > vMax) {
      vMax = v;
    }
  }
  return [vMin, vMax];
}
