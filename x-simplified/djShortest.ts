import { dijkstrasAlgorithm, getShortestPath } from "dijkstras-algorithm-ts";

export function planShortestPath(
  factory: { getNeighbours: (me: number) => number[] },
  from: number,
  to: number,
): number[] {
  return getShortestPath(dijkstrasAlgorithm(graph, from), to);
}
