import fs from "fs";

import historyToTimeSeries from "./data/historyToTimeSeries";
import { calcMeasures } from "./timeSeries";
import { History } from "./millistreamApi";
import { MS_PER_DAY } from "./dateHelper";

const { sqrt, abs } = Math;

// function writeDataImportFile(instrs: any[]) {
//   const importRows: string[] = [];
//   const exportRows: string[] = [];
//   for (let i = 0; i < instrs.length; i++) {
//     const instr: any = instrs[i];
//     let tickname: string = instr.symbol.toLowerCase().replace(/ /g, "");
//     if (tickname.match(/^[0-9]/)) {
//       tickname = `_${tickname}`;
//     }
//     importRows.push(`import ${tickname} from "./${instr.insref}.json";`);
//     exportRows.push(`${tickname},`);
//   }
//   let tsFile = `import { History } from "./millistreamApi";\n`;
//   tsFile += `${importRows.join("\n")}\n\n`;
//   tsFile += `export const allInstruments: History[] = [\n${exportRows.map((d) => `  ${d}`).join("\n")}\n];\n`;
//   fs.writeFileSync(`./src/data/ms/instruments.ts`, tsFile, "utf-8");
// }

function writeInsrefsImportFile(instrs: any[]) {
  // const insrefs: string[] = [];
  // for (let i = 0; i < instrs.length; i++) {
  //   const instr: any = instrs[i];
  //   insrefs.push(instr.id);
  // }
  let tsFile = `export const allInstrumentInsrefs: string[] = [\n${instrs
    .map((d) => `  "${d.id}", // ${d.name}`)
    .join("\n")}\n];\n`;
  fs.writeFileSync(`./src/data/ms/instruments.ts`, tsFile, "utf-8");
}

function main() {
  const dir = "./src/data/ms";
  const files = fs.readdirSync(dir);
  const allinstrs = [];
  const skips: { [type: string]: History[] } = {
    tooLowVol: [],
    extremeEvents: [],
    tooShortHistory: [],
    notUpdatedHistory: [],
  };
  let maxDate: string | null = null;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f.match(/^[0-9]+\.json$/)) {
      continue;
    }
    const fileName = `${dir}/${f}`;
    const h = JSON.parse(fs.readFileSync(fileName, "utf-8"));
    const ts = historyToTimeSeries(h.history);
    if (maxDate === null || maxDate < ts.dates[ts.dates.length - 1]) {
      maxDate = ts.dates[ts.dates.length - 1];
    }
    h.id = String(h.insref);
    h.ticker = h.symbol;
    if (ts.values.some((d) => d <= 0 || !Number.isFinite(d))) {
      console.log("Incorrect value", h.name);
    }
    // h.measures = { ...ts, extremeEvents: [], stdev: 0.01 };
    h.measures = calcMeasures(ts);
    fs.writeFileSync(fileName, JSON.stringify(h, null, 2), "utf-8");
    console.log(`${h.name} done.`);
    if (h.measures.stdev < 0.1 / sqrt(252)) {
      skips.tooLowVol.push(h);
    } else if (h.measures.extremeEvents.filter((d: any) => abs(d.sigmas) > 15).length > 0) {
      skips.extremeEvents.push(h);
    } else if (h.measures.dates.length <= 20) {
      skips.tooShortHistory.push(h);
    } else {
      allinstrs.push(h);
    }
  }
  for (let i = 0; i < allinstrs.length; i++) {
    const instr = allinstrs[i];
    const date = instr.measures.dates[instr.measures.dates.length - 1];
    if ((new Date(maxDate as string).getTime() - new Date(date).getTime()) / MS_PER_DAY > 7) {
      skips.notUpdatedHistory.push(instr);
    }
  }
  for (let i = 0; i < skips.notUpdatedHistory.length; i++) {
    const instr = skips.notUpdatedHistory[i];
    const idx = allinstrs.findIndex((d) => d.insref === instr.insref);
    if (idx === -1) continue;
    allinstrs.splice(idx, 1);
  }

  writeInsrefsImportFile(allinstrs);
  console.log(`Written ${allinstrs.length} instruments`);

  console.log("\nVolatility too low:");
  skips.tooLowVol.forEach((h) => console.log(`${h.name} => ${h.measures.stdev * sqrt(252)}`));
  console.log("\nExtreme events:");
  skips.extremeEvents.forEach((h) =>
    console.log(
      `${h.name} => ${h.measures.extremeEvents
        .filter((d: any) => abs(d.sigmas) > 15)
        .map((d) => d.date)
        .join(", ")}`
    )
  );
  console.log("\nToo short history:");
  skips.tooShortHistory.forEach((h) => console.log(`${h.name} => ${h.measures.dates.length}`));
  console.log("\nNot updated history:");
  skips.notUpdatedHistory.forEach((h) => console.log(h.name));
}

main();
