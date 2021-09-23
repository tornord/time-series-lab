import fs from "fs";

import { fetchInstruments } from "./millistreamApi";

const lists = ["35207", "35208", "35209"];

async function main() {
  const res = await fetchInstruments(lists);
  fs.writeFileSync(`./src/data/ms/instruments.json`, JSON.stringify(res, null, 2), "utf-8");
}

main();
