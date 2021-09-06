import swecb from "./5637.json";
import seba from "./342.json";

const timeSeries = [swecb, seba].map((d) => {
  const name = d.name;
  const dates = d.history.map((d) => d.date);
  const values = d.history.map((d) => d.closeprice);
  return { name, dates, values };
});

const stocks = [
  {
    id: "342",
    name: "SWEC B",
  },
  {
    id: "342",
    name: "SEB A",
  },
];

export { stocks, timeSeries };
