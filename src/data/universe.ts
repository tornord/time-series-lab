// Bank
import seba from "./ms/342.json";
import shba from "./ms/917.json";
import dnb from "./ms/45634.json";
import danske from "./ms/1983.json";
import aza from "./ms/1294.json";

// Industri
import volvb from "./ms/1146.json";
import abb from "./ms/730.json";
import sinch from "./ms/1175000.json";
import hexab from "./ms/104.json";

// Konsumtion
import hmb from "./ms/2926.json";
import embrac from "./ms/2598207.json";
import xpel from "./ms/265453.json";
import tsla from "./ms/251540.json";
import eluxb from "./ms/2193.json";

// Fastigheter
import sbbb from "./ms/949975.json";
import sagab from "./ms/560558.json";

// Bygg
import nccb from "./ms/3788.json";
import swecb from "./ms/5637.json";
import afry from "./ms/906.json";

// Råvaror
import eqnr from "./ms/45643.json";
import akrbp from "./ms/45743.json";
import yar from "./ms/45659.json";

// Telecom
import tel from "./ms/45639.json";
import ericb from "./ms/772.json";
import kivb from "./ms/924.json";

// Läkemedel
import azn from "./ms/1295.json";
import getib from "./ms/1588.json";
import pfe from "./ms/3125752.json";

// Investment
import eqt from "./ms/4528561.json";
import indt from "./ms/3273.json";
import inveb from "./ms/354.json";

// IT
import msft from "./ms/72659.json";
import fb from "./ms/418586.json";
import intc from "./ms/75294.json";
import aapl from "./ms/75250.json";
import amzn from "./ms/75247.json";

import { History, HistoryItem } from "../millistreamApi";
import { TimeSeries } from "../timeSeries";

const names: any[] = [];
names.push(seba, shba, dnb, danske, aza);
names.push(swecb, nccb, afry);
names.push(sbbb, sagab);
names.push(volvb, abb, sinch, hexab);
names.push(eqnr, akrbp, yar);
names.push(hmb, embrac, xpel, tsla, eluxb);
names.push(tel, ericb, kivb);
names.push(azn, getib, pfe);
names.push(eqt, indt, inveb);
names.push(msft, fb, intc, aapl, amzn);

export function historyToTimeSeries(historyItems: HistoryItem[]): TimeSeries {
  const dates = historyItems.map((e: HistoryItem) => e.date);
  const values = historyItems.map((e: HistoryItem) => e.closeprice);
  return { dates, values };
}

export function getUniverse(): History[] {
  names.forEach((h: History) => {
    // const ts = historyToTimeSeries(h.history);
    // h.measures = calcMeasures(ts);
    h.id = String(h.insref);
    h.ticker = h.symbol;
  });
  return names;
}
