import { expect, it } from "vitest";
import { planShortestPath } from "./djShortest";

it("should return shortest path", () => {
  const world = new (class {
    private nodes: Map<number, number[]>;
    public constructor() {
      this.nodes = new Map([
        [0, [1, 2, 3]],
        [1, [3]],
        [2, [0, 20]],
        [3, [1]],
        [20, [2]],
      ]);
    }
    public getNeighbours(me: number): number[] {
      return this.nodes.get(me)!;
    }
  })();
  expect(planShortestPath(world, 0, 20)).toStrictEqual([0, 2, 20]);
});
