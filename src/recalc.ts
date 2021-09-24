import fs from "fs";

import { historyToTimeSeries } from "./data/universe";
import { calcMeasures } from "./timeSeries";

function main() {
  const dir = "./src/data/ms";
  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!f.match(/^[0-9]+\.json$/)) {
      continue;
    }
    const fileName = `${dir}/${f}`;
    const h = JSON.parse(fs.readFileSync(fileName, "utf-8"));
    const ts = historyToTimeSeries(h.history);
    h.measures = calcMeasures(ts);
    fs.writeFileSync(fileName, JSON.stringify(h, null, 2), "utf-8");
    console.log(`${h.name} done.`)
  }
}

main();
