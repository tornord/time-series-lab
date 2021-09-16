import numeric from "numeric";

function mMean(m: number[][]) {
  const d = numeric.dim(m)
  return numeric.sum(m) / d[0]/d[1]
}

const m = [
  [1, 2, 3],
  [4, 5, 6],
];

const mm = numeric.sum(m) / 6
console.log(mMean(m));
