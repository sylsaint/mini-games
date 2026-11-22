export const fragments = [
  {
    id: "甲",
    name: "双线 · 点线 · 实线",
    left: [14, 54, 90],
    right: [30, 67, 107],
    patterns: [2, 1, 0],
  },
  {
    id: "乙",
    name: "点线 · 实线 · 双线",
    left: [24, 67, 98],
    right: [25, 62, 103],
    patterns: [1, 0, 2],
  },
  {
    id: "丙",
    name: "实线 · 双线 · 点线",
    left: [26, 64, 102],
    right: [23, 64, 105],
    patterns: [0, 2, 1],
  },
];
// The evidence is a fictional practice swatch. The real object is not cut or handled.
export const known = [38, 78, 115];
export const knownPatterns = [0, 1, 2];

export function fragmentEdge(fragment, turn, level) {
  const list = turn === 180 ? fragment.right : fragment.left;
  const evidence = list.map((v, i) => ({
    n: (turn === 180 ? 132 - v : v) + level,
    pattern: fragment.patterns[i],
  }));
  return turn === 180 ? evidence.reverse() : evidence;
}
export function checkSeam(edge) {
  if (!edge.every((e, i) => e.pattern === knownPatterns[i])) return "pattern";
  if (!edge.every((e, i) => Math.abs(e.n - known[i]) <= 4)) return "position";
  return "matched";
}
export function supportedClaims(indices) {
  return indices.length === 2 && indices.includes(0) && indices.includes(2);
}
