import fs from "fs";

import { historyToTimeSeries } from "./data/universe";
import { calcMeasures } from "./timeSeries";

const { sqrt } = Math;

function writeDataImportFile(instrs: any[]) {
  const importRows: string[] = [];
  const exportRows: string[] = [];
  for (let i = 0; i < instrs.length; i++) {
    const instr: any = instrs[i];
    let tickname: string = instr.symbol.toLowerCase().replace(/ /g, "");
    if (tickname.match(/^[0-9]/)) {
      tickname = `_${tickname}`;
    }
    importRows.push(`import ${tickname} from "./${instr.insref}.json";`);
    exportRows.push(`${tickname},`);
  }
  let tsFile = `import { History } from "./millistreamApi";\n`;
  tsFile += `${importRows.join("\n")}\n\n`;
  tsFile += `export const allInstruments: History[] = [\n${exportRows.map((d) => `  ${d}`).join("\n")}\n];\n`;
  fs.writeFileSync(`./src/data/ms/instruments.ts`, tsFile, "utf-8");
}

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
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!f.match(/^[0-9]+\.json$/)) {
      continue;
    }
    const fileName = `${dir}/${f}`;
    const h = JSON.parse(fs.readFileSync(fileName, "utf-8"));
    const ts = historyToTimeSeries(h.history);
    h.id = String(h.insref);
    h.ticker = h.symbol;
    if (ts.values.some((d) => d <= 0 || !Number.isFinite(d))) {
      console.log("Incorrect value", h.name);
    }
    h.measures = calcMeasures(ts);
    if (h.measures.stdev > 0.1 / sqrt(252)) {
      allinstrs.push(h);
    } else {
      console.log(`${h.name} volatility too low ${h.measures.stdev * sqrt(252)}`);
    }
    fs.writeFileSync(fileName, JSON.stringify(h, null, 2), "utf-8");
    console.log(`${h.name} done.`);
  }
  writeInsrefsImportFile(allinstrs);
}

main();
