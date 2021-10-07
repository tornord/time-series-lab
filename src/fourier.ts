import numeric from "numeric";

const { sin, PI } = Math;

export function sinValue(period: number, theta: number, x: number) {
  return sin((x / period) * 2 * PI + theta);
}

function sinCurve(period: number, theta: number) {
  return (x: number) => sin((x / period) * 2 * PI + theta);
}

export function fourierRegression(xs: number[], ys: number[], ws: number[] | null = null, periods: number[]) {
  const one = (_: number) => 1;
  const baseFuns = [one];
  periods.forEach((p) => {
    baseFuns.push(sinCurve(p, PI / 2));
    baseFuns.push(sinCurve(p, 0));
  });
  const xxs = xs.map((d) => baseFuns.map((fun) => fun(d)));
  let wxs = ws ? xxs.map((d, i) => d.map((e) => ws[i] * e)) : xxs;
  let wys = ws ? ys.map((d, i) => d * ws[i]) : ys;
  // const xxs = xs.map((d) => [...Array(n + 1)].map((e, i) => pow(d, n - i)));
  // let wxs = ws ? xxs.map((d, i) => d.map((e) => ws[i] * e)) : xxs;
  const xsT = numeric.transpose(xxs);
  const xsTxs = numeric.dot(xsT, wxs);
  const xsTys = numeric.dot(xsT, wys);
  return numeric.solve(xsTxs as number[][], xsTys as number[]);
}
