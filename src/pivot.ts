import { polynomialRegression } from "ts-math";

const { abs, pow } = Math;

export enum PivotType {
  Min = "Min",
  Max = "Max",
}

export interface TurningPoint {
  index: number;
  value: number;
  type: PivotType;
}

export function centralRegression(vs: number[], alpha: number, order: number) {
  const n = vs.length;
  const xs: number[] = new Array(n);
  const ws: number[] = new Array(n);
  const res: any[] = new Array(n);
  const pows = vs.map((d, i) => pow(1 - alpha, i));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      xs[j] = j - i;
      ws[j] = pows[abs(i - j)];
    }
    const reg = polynomialRegression(xs, vs, ws, order);
    res[i] = {
      q: order >= 2 ? reg[reg.length - 3] : 0,
      k: order >= 1 ? reg[reg.length - 2] : 0,
      b: reg[reg.length - 1],
    };
  }
  return res;
}

// Finds all local max and mins.
export function turningPoints(vs: number[]): TurningPoint[] {
  const n = vs.length;
  const res = [];
  for (let i = 1; i < n - 1; i++) {
    const v = vs[i];
    if (v > vs[i - 1] && v > vs[i + 1]) {
      res.push({ index: i, type: PivotType.Max, value: vs[i] });
    }
    if (v < vs[i - 1] && v < vs[i + 1]) {
      res.push({ index: i, type: PivotType.Min, value: vs[i] });
    }
  }
  return res;
}

export function findPivot(vs: number[], i0: number, i1: number, type: PivotType) {
  let mv = Number.NaN;
  let mi = i0;
  for (let i = i0; i <= i1; i++) {
    const v = vs[i];
    if (
      (type === PivotType.Min && (Number.isNaN(mv) || v < mv)) ||
      (type === PivotType.Max && (Number.isNaN(mv) || v > mv))
    ) {
      mv = v;
      mi = i;
    }
  }
  return mi;
}

export function adjustPivot(vs: number[], index: number, type: PivotType, inc: number) {
  const n = vs.length;
  while (index >= 0 && index < n) {
    const v = vs[index];
    if (inc === -1 && index === 0) return index;
    if (inc === 1 && index === n - 1) return index;
    const a = type === PivotType.Min ? -1 : 1;
    if (a * v > a * vs[index + inc]) return index;
    index += inc;
  }
  return index;
}

export function pivots(vs: number[], alpha: number, polynomOrder: number = 4): TurningPoint[] {
  const n = vs.length;
  const coeffs = centralRegression(vs, alpha, polynomOrder);
  const tps = turningPoints(coeffs.map((d) => d.k));
  const res: any[] = [];
  if (tps.length === 0) return res;
  const t0 = tps[0].type === PivotType.Min ? 1 : 0;
  for (let i = 0; i <= tps.length; i++) {
    const i0 = i === 0 ? 0 : tps[i - 1].index;
    const i1 = i === tps.length ? n - 1 : tps[i].index;
    const type = (i + t0) % 2 === 0 ? PivotType.Min : PivotType.Max;
    let mi = findPivot(vs, i0, i1, type);
    if (mi === i0 && mi >= 0) {
      mi = adjustPivot(vs, mi, type, -1);
    }
    if (mi === i1 && mi < n) {
      mi = adjustPivot(vs, mi, type, 1);
    }
    res.push({ index: mi, value: vs[mi], type });
  }
  return res;
}
