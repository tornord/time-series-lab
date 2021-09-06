import { startCase } from "lodash";
import React from 'react';

export default function Table({ data, columns, onClick }) {
  if (data.length === 0) {
    return <table></table>;
  }
  return (
    <table>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <th key={i} className={c.className}>
              {c.header ?? startCase(c.key)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((d, i) => (
          <tr key={i} className={i%2===0?"even":"odd"}>
            {columns.map((c, j) => (
              <td
                key={j}
                className={c.className}
                onClick={(e) => (d && onClick ? onClick(e, d, c.key) : null)}
              >
                {d ? d[c.key] : ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

//colSpan='2'
