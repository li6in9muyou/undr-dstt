class Job {
  public arrival_time: number;
  public from: number;
  public to: number;
  constructor(arrival_time: number, from: number, to: number) {
    this.arrival_time = arrival_time;
    this.from = from;
    this.to = to;
  }
}

// TODO: make this completely contained in FactoryMap
class GraphNode {
  private static next_id = 1000;
  public id: number;
  public neighbours: GraphNode[];
  public occupants = new Set<Agv>();
  constructor() {
    this.id = GraphNode.next_id++;
    this.neighbours = [];
  }

  linkTo(...nodes: GraphNode[]): GraphNode {
    this.neighbours.push(...nodes);
    return this;
  }
}

class FactoryMap {
  private nodes: Map<number, GraphNode> = new Map();
  constructor(nodes: GraphNode[]) {
    nodes.forEach((node) => this.nodes.set(node.id, node));
  }
  public getNeighbours(who: number): number[] {
    const me = this.getById(who);
    if (me === null) {
      return [];
    }
    return me.neighbours.map((ngb) => ngb.id);
  }
  public getById(id: number): GraphNode | null {
    return this.nodes.get(id) ?? null;
  }
  public isOccupied(where: number): boolean {
    return (this.getById(where)?.occupants.size ?? -1) > 0;
  }
}

function planShortestPath(
  factory: { getNeighbours: (me: number) => number[] },
  from: number,
  to: number,
): IterableIterator<number> {
  return [from, to].values();
}

interface Speaker {
  log: (...args: any) => void;
  debug: (...args: any) => void;
  info: (...args: any) => void;
}

class Agv {
  public location: number;
  public job: Job | null;
  private route: IterableIterator<number> | null;
  private factory: FactoryMap;
  private speaker: Speaker;

  constructor(factory: FactoryMap, initLocation: number, speaker: Speaker) {
    this.speaker = speaker;
    this.location = initLocation;
    this.job = null;
    // TODO: maybe we should push jobs to agv so that job scheduling process could be made more pronounced
    this.factory = factory;
  }
  public assignJob(job: Job) {
    console.assert(
      this.job === null,
      "Agv::assignJob: must assign job to and idle agv",
    );

    this.job = job;
    this.route = planShortestPath(this.factory, this.job.from, this.job.to);
  }
  public update(elapsed: number): number {
    if (this.job === null) {
      // idle, do not move
      return this.location;
    }

    console.assert(
      this.route !== null,
      "Agv::update: a job must have a valid route",
    );

    const nextLocation = this.route!.next().value;
    const arrived = nextLocation == null;
    const must_wait = this.factory.isOccupied(nextLocation);
    const keep_running = !arrived && !must_wait;

    if (keep_running) {
      this.location = nextLocation;
      return this.location;
    }

    if (arrived) {
      this.speaker.info(
        `arrived ${this.job.from}@t${this.job.arrival_time}->${this.job.to}@t${elapsed}`,
      );
      this.job = null;
      // TODO: what to do after one job is completed?
      return this.location;
    }

    if (must_wait) {
      // do nothing
      return this.location;
    }

    console.assert(false, "Agv::update: logic error, invalide execution path");
    throw "LOGIC ERROR";
  }
  public isIdle(): boolean {
    return this.job === null;
  }
}

export function main(config = { iteration_cnt: 10 }) {
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
  ];
  const agvs = [new Agv(simpliestFactory, A.id, console)];

  // SIMULATION
  const queuedJobs: Job[] = [];

  for (let elapsed = 1; elapsed < config.iteration_cnt; elapsed++) {
    // TODO: what if there are so many incoming jobs that overwhelms agv?
    const idle_agv = agvs.filter((agv) => agv.isIdle());
    if (queuedJobs.length < idle_agv.length) {
      queuedJobs.push(...jobs.filter((j) => j.arrival_time >= elapsed));
      // FIXME: make sure that pop() returns the oldest job
      queuedJobs.sort((a, b) => a.arrival_time - b.arrival_time);
    }
    if (queuedJobs.length > 0) {
      for (const agv of idle_agv) {
        agv.assignJob(queuedJobs.pop()!);
      }
    }
    agvs.forEach((agv) => agv.update(elapsed));
  }
}
