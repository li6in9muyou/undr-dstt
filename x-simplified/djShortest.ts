import { dijkstrasAlgorithm, getShortestPath } from "dijkstras-algorithm-ts";

export function planShortestPath(
  world: { getNeighbours: (me: number) => number[] },
  from: number,
  to: number,
): number[] {
  costs = new Map();
  costs.set(from, 0);
  costs.set(to, Number.POSITIVE_INFINITY);
  const processed = new Set();

  while (node !== null) {}
}
