import { expect, test } from "vitest";
import { main } from ".";

test("sanity test", () => {
  main({ iteration_cnt: 20 });
  expect(1 + 1).toBe(2);
});
