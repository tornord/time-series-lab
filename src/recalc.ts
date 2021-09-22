import fs from "fs";

import { historyToTimeSeries } from "./data/universe";
import { calcMeasures } from "./timeSeries";

function main() {
  const dir = "./src/data/ms";
  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const fileName = `${dir}/${files[i]}`;
    const h = JSON.parse(fs.readFileSync(fileName, "utf-8"));
    const ts = historyToTimeSeries(h.history);
    h.measures = calcMeasures(ts);
    fs.writeFileSync(fileName, JSON.stringify(h, null, 2), "utf-8");
    console.log(`${h.name} done.`)
  }
}

main();
