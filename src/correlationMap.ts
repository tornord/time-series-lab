import { numeric } from "ts-math";

type Matrix = number[][];

function createVector(n: number, value: number): number[] {
  return [...Array(n)].map(() => value);
}

function zeros(nr: number, nc: number) {
  return [...Array(nr)].map(() => createVector(nc, 0));
}

function sqrtSumColumnsSubSquareTranspose(matrix: Matrix, row1: number, columns: number, row2: number, maxrow: number) {
  let res = zeros(1, maxrow - row2);
  for (let i = row2; i < maxrow; ++i) {
    let sum = 0;
    for (let c = 0; c < columns; ++c) {
      let d = matrix[row1][c] - matrix[i][c];
      sum += d * d;
      //sum += math.square(matrix[row1][c] - matrix[i][c]);
    }
    res[0][i - row2] = Math.sqrt(sum);
  }
  return res;
}

function distanceError(matrix: Matrix, rho: Matrix) {
  let n = rho[0].length;
  let e = 0;
  let cols = matrix[0].length;
  for (let i = 0; i < n - 1; ++i) {
    let d = sqrtSumColumnsSubSquareTranspose(matrix, i, cols, i + 1, n);
    for (let ix = 0; ix < d.length; ++ix) {
      for (let c = 0; c < d[0].length; ++c) {
        let x = 1 - d[ix][c] - rho[i][c + i + 1];
        e += x * x;
        //e += math.square(1 - d[ix][c] - rho[_i][c + _i + 1]);
      }
    }
  }
  return e;
}

function subSquareTranspose(matrix: Matrix, row1: number, columns: number, row2: number, maxrow: number) {
  let res = zeros(columns, maxrow - row2);
  for (let i = row2; i < maxrow; ++i) {
    for (let c = 0; c < columns; ++c) {
      let d = matrix[row1][c] - matrix[i][c];
      res[c][i - row2] = d * d;
      //res[c][i - row2] = math.square(matrix.subset(math.index(row1, c)) - matrix.subset(math.index(i, c)));
    }
  }
  return res;
}

function columnMeans(m: Matrix) {
  const ss = createVector(m[0].length, 0);
  for (let r = 0; r < m.length; r++) {
    const row = m[r];
    for (let c = 0; c < row.length; c++) {
      ss[c] += row[c];
    }
  }
  for (let c = 0; c < ss.length; c++) {
    ss[c] /= m.length;
  }
  const res = zeros(m.length, m[0].length);
  for (let r = 0; r < m.length; r++) {
    const row = m[r];
    for (let c = 0; c < row.length; c++) {
      res[r][c] = ss[c];
    }
  }
  return res;
}

function sumColumns(matrix: Matrix) {
  const nc = matrix[0].length;
  const d = zeros(1, nc);
  for (let g = 0; g < nc; ++g) {
    let sum = 0;
    for (let c = 0; c < matrix.length; ++c) {
      sum += matrix[c][g];
    }
    d[0][g] = sum;
  }
  return d;
}

export function calcCorrPositions(corrs: Matrix) {
  let rho = corrs;
  let pmin: Matrix = [];
  let emin = 0;
  let n = rho[0].length;
  let dp = 0.1e-3;
  let m = Math.floor(1.2 * Math.exp(2 / (n - 2) + 4));

  for (let u = 0; u < 20; ++u) {
    let p = zeros(n, 2);
    // fill p with random numbers, should be equivalent to Matlab's p = 0.5*(2*rand(n,2)-1);
    // original comment: % p is points in 2D space, distance between points represents correlation corr=1-distance
    for (let row = 0; row < n; row++) {
      for (let column = 0; column < 2; column++) {
        p[row][column] = Math.random() - 0.5;
      }
    }
    let mp = columnMeans(p);
    p = numeric.sub(p, mp);
    // % Optimize corr map
    for (let k = 0; k < m; ++k) {
      let d0 = distanceError(p, rho);
      let gp = zeros(n, 2);
      for (let i = 1; i < n; ++i) {
        for (let j = 0; j < 2; ++j) {
          let _d = zeros(n, 2);
          _d[i][j] = dp;
          // should be equivalent to: gp(i,j) = (distanceerror(p+d, rho)-d0)/dp;
          gp[i][j] = numeric.div(numeric.sub(distanceError(numeric.add(p, _d), rho), d0), dp);
        }
      }
      p = numeric.sub(p, numeric.mul(gp, 0.05));
    }
    p = numeric.sub(p, columnMeans(p));
    let e = distanceError(p, rho);
    if (emin === 0 || e < emin) {
      emin = e;
      pmin = p;
    }
  }
  // time to normalize our points.
  let p: Matrix = pmin;
  n = p.length;
  p = numeric.sub(p, columnMeans(p));
  /*  should be equivalent to:
   *   if p(1,1)*p(2,2)-p(1,2)*p(2,1)>0
   *       p(:,2) = -p(:,2);
   *   end
   */
  if (p[0][0] * p[1][1] - p[0][1] * p[1][0] > 0) {
    for (let i = 0; i < n; ++i) {
      p[i][1] = -p[i][1];
    }
  }
  let p00 = p[0][0];
  let p01 = p[0][1];
  let A = [
    [p00, -p01],
    [p01, p00],
  ];
  // A = [p(1,1) -p(1,2); p(1,2) p(1,1)];
  // should be equivalent to: r = sqrt(p(1,1)^2+p(1,2)^2);
  //let r = math.sqrt(math.add(math.square(p[0][0]), math.square(p[0][1])));
  let r = Math.sqrt((p[0][0] * p[0][0] + p[0][1] * p[0][1]) / 2);
  // should be equivalent to: cs = linsolve(A,[-r;r]/sqrt(2));
  let b = [-r, r];
  let cs = numeric.solve(A, b); // %Only 2x2 linear equation, can be solved without linsolve

  for (let i = 0; i < n; ++i) {
    let c0 = p[i][0] * cs[0] - p[i][1] * cs[1];
    let c1 = p[i][0] * cs[1] + p[i][1] * cs[0];
    p[i] = [c0, c1];
  }
  n = rho[0].length;
  let rhoh = zeros(n, n);
  let cols = p[0].length;
  for (let i = 0; i < n - 1; ++i) {
    let temp = subSquareTranspose(p, i, cols, i + 1, n);
    let d = numeric.sqrt(sumColumns(temp));
    for (let c = i + 1, dCount = 0; c < n; ++c, dCount++) {
      rhoh[i][c] = numeric.sub(1, d[0][dCount % d[0].length]);
    }
  }
  rhoh = numeric.add(numeric.add(rhoh, numeric.transpose(rhoh)), numeric.identity(n)); // value of rhoh not verified correct.
  return p;
}
