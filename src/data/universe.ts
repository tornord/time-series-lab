import swecb from "./ms/5637.json";
import seba from "./ms/342.json";
import shba from "./ms/917.json";
import hmb from "./ms/2926.json";
import volvb from "./ms/1146.json";
import nccb from "./ms/3788.json";
import sbbb from "./ms/949975.json";
// import eqnr from "./ms/45643.json";

import { HistoryItem } from "../millistreamApi";

const universe = [swecb, seba, shba, hmb, nccb, sbbb, volvb].map((d) => {
  const name = d.name;
  const ticker = d.symbol;
  const dates = d.history.map((e: HistoryItem) => e.date);
  const values = d.history.map((e: HistoryItem) => e.closeprice);
  return { id: String(d.insref), name, ticker, dates, values };
});

export { universe };
