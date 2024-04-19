import { expect, test } from "vitest";
import { main } from ".";

test("sanity test", () => {
  main();
  expect(1 + 1).toBe(2);
});
