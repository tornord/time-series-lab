import superstoreSalesData from "./superstore-sales-data.json";

interface SuperstoreSalesDataItem {
  orderDate: string;
  sales: number;
}

const dataUngrouped: SuperstoreSalesDataItem[] = (superstoreSalesData as any[])
  .filter((d) => !isNaN(d.Sales) && d.Sales > 0)
  .map((d) => {
    const m = d["Order Date"].match(/([0-9]+)\/([0-9]+)\/([0-9]+)/) as string[];
    return { orderDate: `${m[3]}-${m[2]}-${m[1]}`, sales: d["Sales"] };
  });
export const salesByDate: SuperstoreSalesDataItem[] = Object.values(
  dataUngrouped.reduce((p: { [date: string]: SuperstoreSalesDataItem }, c: SuperstoreSalesDataItem) => {
    let key = c.orderDate.slice(0, 7);
    let d = p[key];
    if (!d) {
      d = { orderDate: key + "-01", sales: 0 };
      p[key] = d;
    }
    d.sales += c.sales;
    return p;
  }, {})
);
salesByDate.sort((d1, d2) => (d1.orderDate < d2.orderDate ? -1 : 1));
