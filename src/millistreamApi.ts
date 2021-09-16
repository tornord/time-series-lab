//@ts-ignore
import AsyncCache from "exp-asynccache";
//@ts-ignore
import * as config from "exp-config";
//@ts-ignore
import buildFetch, { initLRUCache } from "exp-fetch";
import PromisePool from "@supercharge/promise-pool";

const cache = new AsyncCache(
  initLRUCache({
    max: 10000,
    maxAge: 5 * 60,
  })
);

const fetchConfig = {
  clone: false,
  cache,
  errorOnRemoteError: false,
  freeze: false,
  deepFreeze: false,
  followRedirect: false,
  timeout: 2000,
};

const fetchBuilder = buildFetch(fetchConfig);
const msFetch = fetchBuilder.fetch;

enum CommandType {
  Quote = "quote",
  Calendar = "calendar",
  History = "history",
  Fundamentals = "fundamentals",
}

export interface HistoryItem {
  date: string;
  time: string;
  closeprice: number;
}

export interface History {
  id: string
  insref: string;
  name: string;
  symbol: string;
  ticker: string;
  history: HistoryItem[];
  measures: Measures;
}


type Vector = number[];

export interface Measures {
  dates: string[];
  datesAsNumber: Vector;
  values: Vector;
  returns: Vector;
  logReturns: Vector;
  rsi14: Vector;
  ema20: Vector;
  ema40: Vector;
  ema60: Vector;
  sqr20: Vector;
  sqr40: Vector;
  sqr60: Vector;
  kelly20: Vector;
  kelly40: Vector;
  kelly60: Vector;
  pos20: Vector;
  neg20: Vector;
  pos40: Vector;
  neg40: Vector;
  pos60: Vector;
  neg60: Vector;
}

export interface Instrument {
  insref: string;
  name: string;
  company: string;
}

export interface CalendarEventItem {
  type: number;
}

export interface CalendarEvent {
  name: string;
  calendarevent: CalendarEventItem[];
}

export interface FundamentalsItem {
  period: string;
  insref: string;
}

export interface Fundamentals {
  companyref: string;
  fundamentals: FundamentalsItem[];
}

// const baseUrl = (cmd: CommandType): string =>
//   `${config.MS_URL}/mws.fcgi?usr=${config.MS_USER}&pwd=${config.MS_SECRET}&cmd=${cmd}&filetype=json`;
const baseUrl = (cmd: CommandType): string =>
  `${config.MS_URL_DELAYED}/mws.fcgi?usr=${config.MS_USER_DELAYED}&pwd=${config.MS_SECRET}&cmd=${cmd}&filetype=json`;

export async function fetchInstruments(lists: number[], insrefs: string[], fields: string[]): Promise<Instrument[]> {
  if (!fields) {
    fields = [
      "insref",
      "name",
      "symbol",
      "lastprice",
      "diff1d",
      "diff1dprc",
      "dayhighprice",
      "daylowprice",
      "quantity",
      "time",
      "eps",
      "dividend",
      "totalnumberofshares",
      "numberofshares",
      "company",
      "closeprice1d",
      "ath",
      "athdate",
      "diff1mprc",
      "diffytdprc",
      "diff1yprc",
      "per",
      "per_ttm",
      "psr",
      "bvps",
      "dps",
      "dividendyield",
      "turnover",
      "date",
      "shortdescription",
    ];
  }
  if (!fields.find((d) => d === "insref")) {
    fields.unshift("insref");
  }
  const url =
    `${baseUrl(CommandType.Quote)}&timezone=Europe%2FStockholm&` +
    `${lists ? `list=${lists.join(",")}` : `insref=${insrefs.join(",")}`}&` +
    `fields=${fields.join("%2C")}&instrumenttype=4`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    return [];
  }
  return res;
}

export async function fetchCalendarEvents(insrefs: string[]): Promise<CalendarEvent[]> {
  const fields = [
    "name",
    "insref",
    "type",
    "company",
    "companyname",
    "subtype",
    "date",
    "paymentdate",
    "dividend",
    "period",
    "symbol",
  ];
  const url = `${baseUrl(CommandType.Calendar)}` + `&fields=${fields.join("%2C")}&insref=${insrefs.join(",")}`;
  const res = await fetch(url);
  return res;
}

export function getCompanyRefs(instruments: Instrument[]): string[] {
  const companiesDict: { [key: string]: boolean } = {};
  for (let i = 0; i < instruments.length; i++) {
    companiesDict[instruments[i].company] = true;
  }
  return Object.keys(companiesDict);
}

export async function fetchFundamentals(
  companyRefs: string[],
  startDate: string,
  endDate: string
): Promise<Fundamentals[]> {
  const { results } = await PromisePool.for(companyRefs)
    .withConcurrency(5)
    .process(async (companyref: string) => {
      const fields = [
        "insref",
        "sales",
        "gp",
        "ebit",
        "ptp",
        "np",
        "eps",
        "dividend",
        "fixedasset",
        "intangibleasset",
        "goodwill",
        "financialasset",
        "inventory",
        "shortterminv",
        "cce",
        "totalassets",
        "accountsreceivable",
        "othercurrentasset",
        "totsheqliabilities",
        "shequity",
        "minorityinterest",
        "ltliabilities",
        "curliabilities",
        "fiscalperiod",
        "currency",
        "totalnumberofshares",
        "currentassets",
      ];
      const url =
        `${baseUrl(CommandType.Fundamentals)}` +
        `&filetype=json&startdate=${startDate}&enddate=${endDate}&currency=SEK&` +
        `fields=${fields.join("%2C")}&timezone=Europe%2FStockholm&insref=${companyref}`;
      const msRes = await fetch(url);
      return msRes;
    });

  const res = results
    .map((d: Fundamentals[]) => {
      if (d.length === 0) {
        return null;
      }
      const f = d[0];
      f.companyref = f.fundamentals[0].insref;
      return f;
    })
    .filter((d: any) => d !== null);

  return res as any;
}

export async function fetchSingleHistory(insref: string, startDate: string): Promise<History> {
  const fields = ["insref", "name", "symbol", "date", "time", "closeprice", "closeyield", "closenav"];
  const url =
    `${baseUrl(CommandType.History)}` +
    `&insref=${insref}&startdate=${startDate}&adjusted=1&` +
    `fields=${fields.join("%2C")}&timezone=Europe%2FStockholm`;
  const res = await fetch(url);
  return !res || res.length === 0 ? null : res[0];
}

export async function fetchHistory(insrefs: string[], startDate: string): Promise<History[]> {
  const { results } = await PromisePool.for(insrefs)
    .withConcurrency(5)
    .process(async (insref: string) => await fetchSingleHistory(insref, startDate));
  const res = results.filter((d) => d !== null);
  return res;
}

async function fetch(url: string) {
  let result = await cache.get(url);
  if (result !== undefined) {
    console.log("request to MS was cached");
    return result;
  }
  console.log("request sent to MS");
  result = await msFetch(url);
  return result;
}
