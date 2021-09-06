import fs from "fs";

import { fetchHistory } from "./millistreamApi";

const id = "5637";

async function main() {
  const res = await fetchHistory([id], "2020-08-01");
  console.log(res);
  const history = res.find((d) => String(d.insref) === id);
  fs.writeFileSync(`./src/data/${id}.json`, JSON.stringify(history, null, 2), "utf-8");
}

main();
