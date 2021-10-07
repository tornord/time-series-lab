import fs from "fs";

import { fetchInstruments } from "./millistreamApi";

async function fetchAndWriteInstruments(
  name: string,
  lists: string[] | null = null,
  instruments: string[] | null = null
) {
  let res = await fetchInstruments(lists, instruments);
  fs.writeFileSync(`./src/data/ms/${name}.json`, JSON.stringify(res, null, 2), "utf-8");
}

async function main() {
  await fetchAndWriteInstruments("sweden", ["35207", "35208", "35209"], null);

  // https://www.di.se/bors/aktier/embrac-b-2598207/
  // https://www.di.se/bors/aktier/fnox-42953/
  await fetchAndWriteInstruments("sweden-extra", null, ["42953","2598207"]);

  // dnb = 45634
  // eqnr = 45643
  // akrbp = 45743
  // yar = 45659
  await fetchAndWriteInstruments("norway", null, ["45634", "45643", "45743", "45659"]);

  // import msft from "./ms/72659.json";
  // import fb from "./ms/418586.json";
  // import intc from "./ms/75294.json";
  // import aapl from "./ms/75250.json";
  // import amzn from "./ms/75247.json";
  // import pfe from "./ms/3125752.json";
  // import xpel from "./ms/265453.json";
  // https://www.di.se/bors/aktier/pltr-5114190/
  // https://www.di.se/bors/aktier/nke-3125552/
  // https://www.di.se/bors/aktier/tsla-251540/

  await fetchAndWriteInstruments("us", null, [
    "251540",
    "265453",
    "3125552",
    "3125752",
    "418586",
    "5114190",
    "72659",
    "75247",
    "75250",
    "75294",
  ]);

  // https://www.di.se/bors/aktier/?data%5Bcountry%5D=DK&data%5Bmarket%5D=35268
  // https://www.di.se/bors/aktier/danske-1983/
  // https://www.di.se/bors/aktier/maersk-b-3543/
  await fetchAndWriteInstruments("denmark", null, ["1983", "3543"]);
}

main();
