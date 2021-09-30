import { startCase } from "lodash";
import React, { useState } from "react";
import { numberFormat } from "ts-math";

function format(v: any, formatter: any) {
  if (v === null) return "";
  if (!formatter) return v;
  if (typeof formatter === "string") {
    return numberFormat(v, formatter);
  }
  return formatter(v);
}

export interface Column {
  header?: null | string;
  key: string;
  className: string;
  format?: null | string | ((v: any) => string);
}

interface GridProps {
  data: any[];
  columns: Column[];
  onClick: (e: MouseEvent, dataItem: any, columnKey: string) => void;
}

interface SortOrder {
  key: string;
  ascending: boolean;
}

function sortNumberFun(sortOrder: SortOrder) {
  return (d1: any, d2: any) => {
    const v1 = d1[sortOrder.key];
    const v2 = d2[sortOrder.key];
    if (typeof v1 !== "number" && typeof v2 !== "number") return 0;
    if (typeof v1 !== "number") return 1;
    if (typeof v2 !== "number") return -1;
    return (v1 - v2) * (sortOrder.ascending ? 1 : -1);
  };
}

export default function Grid({ data, columns, onClick }: GridProps) {
  const [sortOrder, setSortOrder] = useState({ key: columns[0].key, ascending: true } as SortOrder);
  if (data.length === 0) {
    return <table></table>;
  }
  let sortFun: (d1: any, d2: any) => number;
  if (data.some((d) => typeof d[sortOrder.key] === "string")) {
    sortFun = (d1: any, d2: any) =>
      (d1[sortOrder.key] > d2[sortOrder.key] ? 1 : d1[sortOrder.key] < d2[sortOrder.key] ? -1 : 0) *
      (sortOrder.ascending ? 1 : -1);
  } else {
    sortFun = sortNumberFun(sortOrder);
  }
  data.sort(sortFun);
  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th
              key={i}
              className={`column${i}`}
              onClick={(e) => {
                setSortOrder({ key: c.key, ascending: sortOrder.key === c.key ? !sortOrder.ascending : true });
              }}
            >
              {c.header ?? startCase(c.key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.slice(0,200).map((d, i) => (
          <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
            {columns.map((c, j) => (
              <td
                key={j}
                className={`column${j}${c.className ? ` ${c.className}` : ""}`}
                onClick={(e: any) => (d && onClick ? onClick(e, d, c.key) : null)}
              >
                {d ? format(d[c.key], c.format) : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

//colSpan='2'
