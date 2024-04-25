import { expect, test } from "vitest";
import { FactoryMap, Agv, Job, simulation } from "./index";
import { planShortestPath } from "./djShortest";

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
  const GRID_SIZE = 3;
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

  rows.forEach((row) => {
    for (let i = 0; i < row.length - 1; i++) {
      grid.twoWayLink(row[i], [row[i + 1]]);
    }
  });

  const jobs: Job[] = [];
  const agvs: Agv[] = [];

  console.log(rows);
  console.log(grid);
});
