import * as math from "ts-math";
import { RandomNumberGenerator, range, round } from "ts-math";
import { agnes, Cluster } from "ml-hclust";
import * as d3 from "d3";
import { toAsciiTable } from "./toAsciiTable";

const round2 = (x: number) => math.round(x, 2);

const { cos, sin, PI, hypot } = Math;

interface TreeChartProps {
  width?: number;
  height?: number;
  data: TreeNode[];
  toLabel?: (d: d3.HierarchyNode<unknown>) => string;
}

interface TreeNode {
  name: string;
  id: number;
  parentId: number | null;
  dataId: number | null;
  agnesHeight: number;
  size: number;
  prune: boolean;
}

function nameFromIndex(idx: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVXYZ";
  const N = chars.length;
  const res = [];
  while (true) {
    const r = idx % N;
    res.push(r);
    idx = (idx - r) / N;
    if (idx === 0)
      return res
        .reverse()
        .map((d) => chars[d])
        .join("");
    idx--;
  }
}

function createRandomData() {
  const N = 7; // number of clusters
  const M = 7; // number of points per cluster
  const rng = new RandomNumberGenerator("123");
  const randomPoint = (c: number[], std: number, rng: RandomNumberGenerator) =>
    c.map((d) => d + std * rng.randN()).map((d) => round(d, 4));
  const randPoints = (c: number[]) => range(M).map((d) => randomPoint(c, 0.05, rng));
  const names = range(N * M).map((d) => {
    const j = d % M;
    const i = (d - j) / M;
    return `${nameFromIndex(i)}${j}`;
  });
  const points: number[][] = [];
  range(N)
    .map((d) => (2 * PI * (d + 0.5)) / N)
    .map((v) => [cos(v), sin(v)].map((x) => (1 + x) / 2))
    .forEach((c) => points.push(...randPoints(c)));

  return { points, names };
}

function flattenAgnes(tree: Cluster) {
  const toArray = (arr: TreeNode[], parentNode: TreeNode | null, tree: any) => {
    let id: number | null = arr.length;
    const parentId = parentNode ? parentNode.id : null;
    const n: TreeNode = {
      id,
      parentId,
      name: tree.index >= 0 ? nameFromIndex(tree.index) : "",
      dataId: tree.index >= 0 ? tree.index : null,
      agnesHeight: tree.height,
      size: tree.index >= 0 ? 10 : 0,
      prune: false,
    };
    arr.push(n);
    for (let i = 0; i < tree.children.length; i++) {
      const c = tree.children[i];
      toArray(arr, n, c);
    }
  };

  const data: TreeNode[] = [];
  toArray(data, null, tree);
  return data;
}

function spliceTree(data: TreeNode[], id: number) {
  const index = data.findIndex((d) => d.id === id);
  if (index === -1) return;
  const node = data[index];
  if (node.parentId === null) return;
  const parentNode = data.find((d) => d.id === node.parentId) ?? null;
  if (!parentNode) return;
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d.parentId === node.id) {
      d.parentId = parentNode.id;
    }
  }
  data.splice(index, 1);
}

function pruneAgnesTree(
  data: TreeNode[],
  pruneFun: (node: TreeNode, parentNode: TreeNode) => boolean,
  markOnly: boolean
) {
  const candidates = [];
  for (let i = 0; i < data.length; i++) {
    const n = data[i];
    if (n.dataId !== null || n.parentId === null) continue;
    const pn = data.find((d) => d.id === n.parentId) ?? null;
    if (!pn) continue;
    n.prune = pruneFun(n, pn);
    if (n.prune) {
      candidates.push(n.id);
    }
  }
  for (let i = 0; i < candidates.length; i++) {
    const id = candidates[i];
    if (!markOnly) {
      spliceTree(data, id);
    }
  }
}

export function TreeTest() {
  const { points: ps, names } = createRandomData();
  const tree = agnes(ps, { method: "ward" });
  const data = flattenAgnes(tree);

  const pruneFun = (node: TreeNode, parentNode: TreeNode) => {
    if (!parentNode) {
      return false;
    }
    const threshold = 0.5;
    return !(parentNode.agnesHeight >= threshold && node.agnesHeight < threshold);
  };
  pruneAgnesTree(data, pruneFun, false);

  // const table = toAsciiTable(
  //   [
  //     data.map((d) => d.id),
  //     data.map((d: any) => d.parentId),
  //     data.map((d: any) => d.lowestBranch),
  //     data.map((d: any) => d.agnesHeight),
  //   ],
  //   ["id", "pid", "lowest", "h"]
  // );
  // console.log(table.toString());

  const toLabel = (d: any) =>
    `${d.data.dataId !== null ? names[d.data.dataId] : ""} - ${d.id} - ${d.data.agnesHeight.toFixed(2)}`;
  return <TreeChart width={600} height={760} data={data} toLabel={toLabel} />;
}

function pathPart(type: string, vs: number[]) {
  return `${type}${vs.map((d) => d.toFixed(2)).join(" ")}`;
}

export function connectorPathCubic(
  x1: number,
  y1: number,
  r1: number,
  a1: number,
  x2: number,
  y2: number,
  r2: number,
  a2: number
) {
  const d1 = { x: x1 + r1 * cos((a1 / 180) * PI), y: y1 + r1 * sin((a1 / 180) * PI) };
  const d2 = { x: x2 + r2 * cos((a2 / 180) * PI), y: y2 + r2 * sin((a2 / 180) * PI) };
  const r = hypot(d2.x - d1.x, d2.y - d1.y);
  // const c = lineIntersection({ x: x1, y: y1 }, { x: x2, y: y2 }, d1, d2);
  const q = 0.25;
  const c1 = { x: d1.x + q * r * cos((a1 / 180) * PI), y: d1.y + q * r * sin((a1 / 180) * PI) };
  const c2 = { x: d2.x + q * r * cos((a2 / 180) * PI), y: d2.y + q * r * sin((a2 / 180) * PI) };

  return `${pathPart("M", [d1.x, d1.y])} ${pathPart("C", [c1.x, c1.y, c2.x, c2.y, d2.x, d2.y])}`;
}
export function connectorPathQuadratic(
  x1: number,
  y1: number,
  r1: number,
  a1: number,
  x2: number,
  y2: number,
  r2: number,
  a2: number
) {
  return `${pathPart("M", [x1, y1])} ${pathPart("Q", [(x1 + x2) / 2, y2, x2, y2])}`;
}

export function TreeChart({ width, height, data, toLabel }: TreeChartProps) {
  width = width ?? 600;
  height = height ?? 300;
  const marginTop = 10;
  const marginBottom = 10;
  const marginLeft = 20;
  const marginRight = 20;
  const branchColor = "hsla(208deg,100%,60%,1)";
  const pruneColor = "hsla(359deg,100%,60%,1)";
  const leaveColor = "hsla(152deg,100%,60%,1)";
  const fontSize = 10;
  const fontColor = "#789";

  const stratFun = d3
    .stratify()
    .id((d: any) => d.id)
    .parentId((d: any) => d.parentId);
  const root = stratFun(data);
  const treeFun = d3.tree().size([height - marginTop - marginBottom, width - marginLeft - marginRight]);
  // const treeFun = d3
  //   .treemap()
  //   .size([width - marginLeft - marginRight, height - marginTop - marginBottom])
  //   .padding((d: any) => (d.data.lowestBranch ? 3 : 0))
  //   .tile(d3.treemapBinary) // treemapSquarify
  //   .round(true);
  root.sum((d: any) => d.size);
  root.sort((a: any, b: any) => {
    let c = a.height - b.height;
    if (c !== 0) return c;
    return (a.data.dataId ?? -1) - (b.data.dataId ?? -1);
  });
  treeFun(root);
  const desc = root.descendants();
  // const leaves = root.leaves();

  const table = toAsciiTable(
    [
      desc.map((d) => d.id),
      desc.map((d: any) => d.data.parentId),
      desc.map((d: any) => d.height),
      desc.map((d: any) => (d.data.prune ? 1 : 0)),
      desc.map((d: any) => d.data.agnesHeight),
    ],
    ["id", "pid", "h", "p", "ah"],
    [0, 0, 0, 0, 2]
  );
  console.log(table.toString());
  console.log(desc);
  const toRect = (d: any) => ({ fill: branchColor, x: d.x0, y: d.y0, width: d.x1 - d.x0, height: d.y1 - d.y0 });
  return (
    <svg
      className="treemap"
      width={width}
      height={height}
      onMouseMove={(e) => {
        // console.log("onMouseMove", e);
      }}
    >
      <g transform={`translate(${marginLeft},${marginTop})`}>
        {desc.map((d: any, i) => (
          <g key={i}>
            {d.children
              ? d.children.map((e: any, j: number, a: any) => (
                  <path
                    key={j}
                    d={`${connectorPathQuadratic(
                      d.y,
                      d.x,
                      6,
                      a.length === 1 ? 0 : -45 + (90 * j) / (a.length - 1),
                      e.y,
                      e.x,
                      6,
                      180
                    )}`}
                    fill="none"
                  />
                )) //<line key={j} x1={d.y} y1={d.x} x2={e.y} y2={e.x} />
              : null}
            <g transform={`translate(${d.y},${d.x})`}>
              <circle
                cx={0}
                cy={0}
                r={6}
                fill={d.children && d.children.length > 0 ? (d.data.prune ? pruneColor : branchColor) : leaveColor}
              />
              <text x={0} y={-8} textAnchor="middle" style={{ fontSize, color: fontColor }}>
                {toLabel ? toLabel(d) : null}
              </text>
            </g>
          </g>
        ))}
        {/* {desc.map((d: any, i) => (
          <rect key={i} {...toRect(d)} />
        ))} */}
      </g>
    </svg>
  );
}
