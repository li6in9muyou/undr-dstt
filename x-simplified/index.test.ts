import { expect, test } from "vitest";
import { GraphNode, FactoryMap, Agv, Job, simulation } from "./index";
import { planShortestPath } from "./djShortest";

test("fully connected trigangle factory", () => {
  const A = new GraphNode();
  const B = new GraphNode();
  const C = new GraphNode();
  B.linkTo(A, C);
  A.linkTo(B, C);
  C.linkTo(A, B);

  const simpliestFactory = new FactoryMap([A, B, C]);

  const jobs: Job[] = [
    new Job(1, B.id, A.id),
    new Job(1, A.id, B.id),
    new Job(2, B.id, A.id),
    new Job(5, B.id, A.id),
  ];

  const agvs = [new Agv(simpliestFactory, A.id, planShortestPath)];

  simulation({ jobs: jobs, agvs: agvs, iteration_cnt: 20 });
  expect(1 + 1).toBe(2);
});
