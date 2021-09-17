import c3 from "c3";
import { useEffect } from "react";
import { useRef } from "react";

import { TimeSeries } from "./timeSeries";

export function toChartProps(ts: TimeSeries, onClick: null | ((event: any, el: HTMLElement, ts: any) => void) = null) {
  return {
    data: {
      x: "x",
      xFormat: "%Y-%m-%d",
      columns: [
        ["x", ...ts.dates],
        [(ts as any).name, ...ts.values],
      ],
      onclick: (ev: any, el: HTMLElement) => {
        if (onClick) onClick(ev, el, ts);
      },
    },
    axis: {
      x: {
        type: "timeseries",
        tick: {
          format: "%Y-%m-%d",
        },
      },
    },
  };
}

export function C3Chart({ data, axis }: { data: any; axis: any }) {
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
