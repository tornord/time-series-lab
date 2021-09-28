import { PCA } from "ml-pca";
import { getUniverse } from "./data/universe";
import { correlation, synchronize } from "./timeSeries";

const stdevs: number[] = [];
const universe = getUniverse();
const corrs = correlation(universe.map((d) => d.measures));
const vss = synchronize(universe.map((d) => d.measures)).map((vs) => vs.map(Math.log));
const logrets = vss.slice(1).map((vs, i) => vs.map((v, j) => v - vss[i][j]));
const pca: any = new PCA(logrets);
const evals = pca.getEigenvalues();
// const evecs: any = pca.getEigenvectors().valueOf();
const nf = 4; // Number of factors
const f =
  1 /
  pca
    .getExplainedVariance()
    .slice(0, nf)
    .reduce((sum: number, d: number) => sum + d, 0);
// const pcastdevs = pca.S.slice(0, nf).map((d: number) => Math.sqrt(f * d));
const eigenVectors = pca.U.data.map((d: number[]) => d.slice(0, nf));

const ps = [];
for (let i = 0; i < evals.length; i++) {
  ps.push([universe[i].ticker.toLowerCase().replace(/ /g, ""), 10 * eigenVectors[i][0], 10 * eigenVectors[i][1]]);
}
const scatterData = {
  xs: ps.reduce((p: any, c, i) => {
    p[c[0]] = `${c[0]}_x`;
    return p;
  }, {}),
  columns: ps.reduce((p, c, i) => {
    p.push([`${c[0]}_x`, c[1]] as any);
    p.push([`${c[0]}`, c[2]] as any);
    return p;
  }, []),
  type: "scatter",
};