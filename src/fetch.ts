import fs from "fs";
import { historyToTimeSeries } from "./data/universe";

import { fetchHistory } from "./millistreamApi";
import { calcMeasures } from "./timeSeries";
// import { accumulate, ema, rsi } from "./timeSeries";

const { log } = Math;

const ids = [
  "104",
  "1146",
  "1175000",
  "1294",
  "1295",
  "1588",
  "1983",
  "2193",
  "251540",
  "2598207",
  "265453",
  "2926",
  "3125752",
  "3273",
  "342",
  "354",
  "3788",
  "418586",
  "4528561",
  "45634",
  "45639",
  "45643",
  "45659",
  "45743",
  "560558",
  "5637",
  "72659",
  "730",
  "75247",
  "75250",
  "75294",
  "772",
  "906",
  "917",
  "924",
  "949975",
];
// const ids: string[] = [];

async function main() {
  const res = await fetchHistory(ids, "2020-08-01");
  for (let h of res) {
    const ts = historyToTimeSeries(h.history);
    h.measures = calcMeasures(ts);
    fs.writeFileSync(`./src/data/ms/${h.insref}.json`, JSON.stringify(h, null, 2), "utf-8");
    console.log(`${h.name} done`);
  }
}

main();
