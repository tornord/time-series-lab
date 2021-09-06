import fs from "fs";

import { fetchHistory } from "./millistreamApi";

const ids = [ "45643"]

async function main() {
  const res = await fetchHistory(ids, "2020-08-01");
  for (let history of res) {
    fs.writeFileSync(`./src/data/ms/${history.insref}.json`, JSON.stringify(history, null, 2), "utf-8");
  }
}

main();
