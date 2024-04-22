export function dj(
  world: { getNeighbours: (me: number) => { id: number; cost: number }[] },
  from: number,
  to: number,
): number[] {
  const costs = new Map();
  costs.set(from, 0);
  costs.set(to, Number.POSITIVE_INFINITY);

  let here = from;
  const task = new Set([here]);
  const processed = new Set();
  const parent = new Map();
  while (here !== null) {
    const costToHere = costs.get(here);
    for (const { id, cost } of world.getNeighbours(here)) {
      if (!processed.has(id)) {
        task.add(id);
      }

      const costWhatIf = costToHere + cost;
      const neverSeenBefore = !costs.has(id);
      const better = costWhatIf < costs.get(id) ?? 0;
      if (better || neverSeenBefore) {
        costs.set(id, costWhatIf);
        parent.set(id, here);
      }
    }
    task.delete(here);
    processed.add(here);

    const orderByMinCost = Array.from(task).toSorted(
      (a: number, b: number) => costs.get(a) - costs.get(b),
    );
    here = orderByMinCost[0] ?? null;
  }

  const path: number[] = [];
  let step = to;
  while (true) {
    path.push(step);
    if (step === from) {
      break;
    }
    step = parent.get(step);
  }
  path.reverse();
  return path;
}

export function planShortestPath(
  world: { getNeighbours: (me: number) => number[] },
  from: number,
  to: number,
) {
  function djAdapter(me: number): { id: number; cost: number }[] {
    return world.getNeighbours(me).map((ngb) => ({ id: ngb, cost: 1 }));
  }
  return dj({ getNeighbours: djAdapter }, from, to);
}
