import { expect, it } from "vitest";
import { planShortestPath } from "./djShortest";

it("should return the shortest among alternatives", () => {
  const world = new (class {
    private nodes: Map<number, number[]>;
    public constructor() {
      this.nodes = new Map([
        [99, [100, 101]],
        [100, [99, 101]],
        [101, [99, 100]],
      ]);
    }
    public getNeighbours(me: number): number[] {
      return this.nodes.get(me)!;
    }
  })();
  expect(planShortestPath(world, 99, 100)).toStrictEqual([99, 100]);
  expect(planShortestPath(world, 101, 100)).toStrictEqual([101, 100]);
  expect(planShortestPath(world, 99, 101)).toStrictEqual([99, 101]);
});

it("should find a path", () => {
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
  expect(planShortestPath(world, 0, 1)).toStrictEqual([0, 1]);
  expect(planShortestPath(world, 2, 20)).toStrictEqual([2, 20]);
  expect(planShortestPath(world, 0, 0)).toStrictEqual([]);
});

it("should return null when there is no path", () => {
  const world = new (class {
    private nodes: Map<number, number[]>;
    public constructor() {
      this.nodes = new Map([
        [0, [1, 2, 3]],
        [1, [3]],
        [2, [0, 20]],
        [3, [1]],
        [20, [2]],
        [30, [20]],
      ]);
    }
    public getNeighbours(me: number): number[] {
      return this.nodes.get(me)!;
    }
  })();
  expect(planShortestPath(world, 0, 30)).toStrictEqual([]);
});
