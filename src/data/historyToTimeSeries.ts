import { HistoryItem } from "../millistreamApi";
import { TimeSeries } from "../timeSeries";

export default function historyToTimeSeries(historyItems: HistoryItem[]): TimeSeries {
  const idxVals = historyItems
    .map((e: HistoryItem, i: number) => ({ index: i, value: e.closeprice }))
    .filter((d) => typeof d.value === "number" && d.value > 0 && Number.isFinite(d.value));

  const dates = idxVals.map(({ index }) => historyItems[index].date);
  const values = idxVals.map(({ value }) => value);
  return { dates, values };
}
