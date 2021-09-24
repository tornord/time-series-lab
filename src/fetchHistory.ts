import fs from "fs";
import { has } from "lodash";

import { History, HistoryItem, fetchHistory } from "./millistreamApi";

const universeIds = [
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
  "42953",
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

const later = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay));

function writeHistory(hs: History[]) {
  for (let h of hs) {
    fs.writeFileSync(`./src/data/ms/${h.insref}.json`, JSON.stringify(h, null, 2), "utf-8");
    console.log(`${h.name} done`);
  }
}

async function fetchUniverse() {
  const res = await fetchHistory(universeIds, "2020-08-01");
  writeHistory(res);
}

async function fetchAll() {
  const instrs = JSON.parse(fs.readFileSync("./src/data/ms/instruments.json", "utf-8"));
  const allIds = instrs.map((d: any) => String(d.insref));
  const batchSize = 15;
  let i = 0;
  while (i < allIds.length) {
    const ids = allIds.slice(i, i + batchSize);
    i += batchSize;
    console.log(ids.join(","));
    const res = await fetchHistory(ids, "2020-08-01");
    writeHistory(res);
    await later(1200);
  }
}

// fetchUniverse()
fetchAll();
