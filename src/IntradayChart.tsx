import moment from "moment";
import * as d3 from "d3";

export const value = {
  id: "20",
  name: "OMX Stockholm PI",
  data: [
    [1593610500000, 652.2386],
    [1593673264000, 657.314718],
    [1593673324000, 657.284801],
    [1593673744000, 656.4975],
    [1593674164000, 657.250461],
    [1593674584000, 657.779772],
    [1593675004000, 657.120818],
    [1593675424000, 657.492312],
    [1593675844000, 657.683726],
    [1593676264000, 658.563548],
    [1593676684000, 658.20421],
    [1593677104000, 657.056917],
    [1593677524000, 657.400529],
    [1593677944000, 657.590411],
    [1593678364000, 658.149201],
    [1593678784000, 658.511133],
    [1593679204000, 658.213928],
    [1593679624000, 658.091047],
    [1593680044000, 657.133585],
    [1593680464000, 657.487633],
    [1593680884000, 656.771132],
    [1593681304000, 656.878046],
    [1593681724000, 657.210494],
    [1593682144000, 657.480927],
    [1593682564000, 656.330562],
    [1593682984000, 656.459322],
    [1593683404000, 656.410889],
    [1593683824000, 656.909584],
    [1593684244000, 657.061261],
    [1593684664000, 656.160763],
    [1593685084000, 655.947828],
    [1593685504000, 655.820878],
    [1593685924000, 656.115962],
    [1593686344000, 656.0568],
    [1593686764000, 655.981817],
    [1593687184000, 656.728026],
    [1593687604000, 657.303246],
    [1593688024000, 657.113327],
    [1593688444000, 657.149818],
    [1593688864000, 657.31307],
    [1593689284000, 657.537146],
    [1593689704000, 657.190622],
    [1593690124000, 657.346681],
    [1593690544000, 657.475472],
    [1593690964000, 656.865073],
    [1593691384000, 656.913432],
    [1593691804000, 657.11717],
    [1593692224000, 657.117104],
    [1593692644000, 656.668716],
    [1593693064000, 658.59832],
    [1593693484000, 658.902652],
    [1593693904000, 659.368354],
    [1593694324000, 660.481769],
    [1593694744000, 661.27342],
    [1593695164000, 660.662135],
    [1593695584000, 660.271885],
    [1593696004000, 660.476855],
    [1593696424000, 660.329344],
    [1593696844000, 661.207715],
    [1593697264000, 661.017897],
    [1593697684000, 661.837499],
    [1593698104000, 661.677299],
    [1593698524000, 662.723153],
    [1593698944000, 662.258814],
    [1593699364000, 662.201455],
    [1593699784000, 662.066166],
    [1593700204000, 660.629671],
    [1593700624000, 661.5058],
    [1593701044000, 661.700872],
    [1593701464000, 661.589974],
    [1593701884000, 660.447288],
    [1593702304000, 660.211519],
    [1593702724000, 660.280155],
    [1593703144000, 661.069328],
    [1593703444000, 662.051957],
    [1593703504000, 662.302602],
  ],
};

export function IntradayChart({ value }: {value: any}) {
  const width = 287;
  const height = 161;
  const marginTop = 0;
  const marginLeft = 14;
  const marginRight = 33.5;
  const xAxisHeight = 24.5;
  const textColor = "rgb(232, 213, 206)";
  const traceColor = "rgb(10,101,158)";
  const openHour = 9.0;
  const closeHour = 17.3;
  const xTickSize = 5;
  const fontSize = 9;
  const fontColor = "#789";
  const yRelativeMargin = 0.12;

  const maxTime = value.data[value.data.length - 1][0];
  const xTicks = calcHourTicks(openHour, closeHour, 2);
  const maxMinValues = minMax(value.data.map((d: any) => d[1]));
  const minValue = maxMinValues[0] - yRelativeMargin * (maxMinValues[1] - maxMinValues[0]);
  const maxValue = maxMinValues[1] + yRelativeMargin * (maxMinValues[1] - maxMinValues[0]);
  const yScale = d3
    .scaleLinear()
    .domain([minValue, maxValue])
    .range([height - xAxisHeight - marginTop, marginTop]);
  const yTicks = yScale.ticks(3);
  const xScaleInt = d3
    .scaleLinear()
    .domain([openHour, closeHour + (closeHour < openHour ? 24 : 0)])
    .range([marginLeft, width - marginRight]);
  const xScale = (x: number) => xScaleInt(x + (x < openHour ? 24 : 0));
  const lineXValue = (d: any, i: number) => Math.round(100 * xScale(i === 0 ? openHour : toHour(d[0]))) / 100;
  const lineYValue = (d: any, i: number) => Math.round(100 * yScale(d[1])) / 100;
  const line = d3.line().x(lineXValue).y(lineYValue);
  const tracePathD = line(value.data);

  /*
  console.log(
    openHour,
    closeHour,
    xScale(openHour),
    xScale(closeHour),
    xTicks,
    xTicks.map((d) => xScale(d)),
    xScale(17.5),
    maxTime
  );
*/

  // console.log(minValue, maxValue, yScale(minValue), yScale(maxValue), yTicks);
  return (
    <svg version="1.1" width={width} height={height}>
      <defs>
        <linearGradient x1="0" y1="0" x2="0" y2="1" id="verticalgradient">
          <stop offset="0" stopColor={traceColor} stopOpacity="0.3"></stop>
          <stop offset="1" stopColor={traceColor} stopOpacity="0"></stop>
        </linearGradient>
      </defs>
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
              {hourToString(d)}
            </text>
          </g>
        ))}
      </g>
      <g>
        {yTicks.map((d, i) => (
          <g key={i} transform={`translate(${0},${yScale(d)})`}>
            <line x1="0" y1="0" x2={width} y2="0" stroke={textColor} strokeWidth="1" strokeDasharray="4,3" />
            <text x={width - 1} y={-2} textAnchor="end" style={{ fontSize, color: fontColor, fill: fontColor }}>
              {d.toFixed(0)}
            </text>
          </g>
        ))}
      </g>
      <path
        d={tracePathD + `L${lineXValue([maxTime, 0], -1)},${lineYValue([0, maxMinValues[0]], -1)}Z`}
        fill="url(#verticalgradient)"
        stroke="none"
      />
      <path
        d={tracePathD as string}
        fill="none"
        stroke={traceColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lineXValue(value.data[value.data.length - 1], -1)}
        cy={lineYValue(value.data[value.data.length - 1], -1)}
        r={2.5}
        fill="#a7100c"
      />
      <circle
        cx={lineXValue(value.data[value.data.length - 1], -1)}
        cy={lineYValue(value.data[value.data.length - 1], -1)}
        r={2.5}
        fill="hsla(2, 87%, 35%, 0)"
        stroke-width="1"
        stroke="#a7100c"
      >
        <animate attributeName="r" from="2.5" to="9" dur="2s" begin="0s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="1" to="0" dur="2s" begin="0s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// + ` L${"1,1"}` Math.round(100*xScale(

function minMax(vs: number[]) {
  return [Math.min(...vs), Math.max(...vs)];
}

function hourToString(d: number) {
  let h = Math.floor(d);
  return h.toFixed(0).padStart(2, "0") + ":" + ((d - h) * 60).toFixed(0).padStart(2, "0");
}

function toHour(d: number) {
  const m = moment(d);
  return Number(m.format("H")) + Number(m.format("m")) / 60;
}

function calcHourTicks(open: number, close: number, step: number) {
  if (close < open) {
    close += 24;
  }
  let o = open / step;
  let c = close / step;
  let h = Math.ceil(o);
  let res = [];
  while (h <= c) {
    let r = h * step;
    if (r >= 24) {
      r -= 24;
    }
    res.push(r);
    h++;
  }
  return res;
}
