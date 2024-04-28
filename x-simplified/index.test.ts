import { expect, test } from "vitest";
import { FactoryMap, Agv, Job, simulation } from "./index";
import { planShortestPath } from "./djShortest";
import rng from "mersenne-twister";

test("teleportation bug", () => {
  const straightLine = new FactoryMap(3);

  const [A, M, B] = straightLine.listNodes();
  straightLine.twoWayLink(A, [M]);
  straightLine.twoWayLink(M, [B]);

  const jobs: Job[] = [new Job(1, B, A), new Job(2, B, A)];

  const agvs = [new Agv(straightLine, M, planShortestPath)];
  expect(planShortestPath(straightLine, B, A)).toStrictEqual([B, M, A]);

  simulation({ jobs: jobs, agvs: agvs, iteration_cnt: 18 });
});

test("fully connected trigangle factory", () => {
  const simpliestFactory = new FactoryMap(3);
  const [A, B, C] = simpliestFactory.listNodes();
  simpliestFactory.twoWayLink(A, [B, C]);
  simpliestFactory.twoWayLink(B, [C]);

  const jobs: Job[] = [
    new Job(1, B, A),
    new Job(1, A, B),
    new Job(2, B, A),
    new Job(5, B, A),
  ];

  const agvs = [new Agv(simpliestFactory, A, planShortestPath)];

  simulation({ jobs: jobs, agvs: agvs, iteration_cnt: 20 });
  expect(1 + 1).toBe(2);
});

test("10x10 grid", () => {
  const GRID_SIZE = 6;
  const SIM_ITERATION = 10;
  const grid = new FactoryMap(GRID_SIZE * GRID_SIZE);
  const nodes = grid.listNodes();
  const rows = Array.from(nodes).reduce((manyRow, node) => {
    let lastRow = manyRow[manyRow.length - 1];
    const shouldNextRow = lastRow === undefined || lastRow.length === GRID_SIZE;
    if (shouldNextRow) {
      lastRow = [];
      manyRow.push(lastRow);
    }
    lastRow.push(node);
    return manyRow;
  }, [] as number[][]);

  function connectBetween(world: FactoryMap, nodes: number[]): void {
    for (let i = 0; i < nodes.length - 1; i++) {
      world.twoWayLink(nodes[i], [nodes[i + 1]]);
    }
  }

  rows.forEach((row) => connectBetween(grid, row));

  function zip(
    fn: (zipped: any[], index: number, arrays: any[][]) => any,
    ...arrays: any[][]
  ): void {
    const arrLen = arrays[0].length;
    console.assert(
      arrays.every((arr) => arr.length === arrLen),
      "zip: arrays must have same length",
    );

    for (let i = 0; i < arrLen; i++) {
      const zipped: any[] = [];
      for (const array of arrays) {
        zipped.push(array[i]);
      }
      fn(zipped, i, arrays);
    }
  }

  zip((column: number[]) => connectBetween(grid, column), ...rows);

  const adj = grid.listAdjacentNodes();
  const corners = Array.from(adj.entries())
    .filter(([_, ngb]) => ngb.length === 2)
    .map(([k, _]) => k);

  function sample<T>(
    array: T[],
    n = 1,
    random_fn: () => number = Math.random,
  ): T[] {
    console.assert(
      array.length > n,
      "sample: array.length must be bigger than n",
    );

    const result: T[] = [];
    const taken = new Set<number>();

    while (result.length < n) {
      const i = Math.floor(random_fn() * array.length);
      if (!taken.has(i)) {
        result.push(array[i]);
        taken.add(i);
      }
    }

    return result;
  }

  const gen = new rng(55200628);
  const jobs: Job[] = new Array(SIM_ITERATION).fill(null).map((_, idx) => {
    const arrive_at = idx + 1;
    const [from, to] = sample(corners, 2, gen.random.bind(gen));
    return new Job(arrive_at, from, to);
  });

  const agvs: Agv[] = [new Agv(grid, grid.listNodes()[3], planShortestPath)];

  simulation({ jobs: jobs, agvs: agvs, iteration_cnt: SIM_ITERATION * 8 });
});
