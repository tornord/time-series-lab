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

interface TableProps {
  data: any[];
  columns: Column[];
  onClick: (e: MouseEvent, dataItem: any, columnKey: string) => void;
}

export default function Table({ data, columns, onClick }: TableProps) {
  const [sortOrder, setSortOrder] = useState({ key: columns[0].key, ascending: true });
  if (data.length === 0) {
    return <table></table>;
  }
  let sortFun = (d1: any, d2: any) => (d1[sortOrder.key] - d2[sortOrder.key]) * (sortOrder.ascending ? 1 : -1);
  if (data.some((d) => typeof d[sortOrder.key] === "string")) {
    sortFun = (d1: any, d2: any) =>
      d1[sortOrder.key] > d2[sortOrder.key] ? 1 : d1[sortOrder.key] < d2[sortOrder.key] ? -1 : 0;
  }
  data.sort(sortFun);
  return (
    <table>
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
        {data.map((d, i) => (
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
