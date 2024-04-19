class Job {
  public arrival_time: number;
  public from: number;
  public to: number;
  public completion_time: number;
  constructor(arrival_time: number, from: number, to: number) {
    this.arrival_time = arrival_time;
    this.from = from;
    this.to = to;
    this.completion_time = Number.POSITIVE_INFINITY;
  }
  dumpTimestamps(): string {
    return `arrived ${this.arrival_time} completed ${this.completion_time}`;
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
): number[] {
  if (from === to) {
    return [];
  } else {
    return [from, to];
  }
}

interface Speaker {
  info: (...args: any) => void;
  addPrefix: (prefix: string) => Speaker;
}

class Agv {
  private static serial_number: number = 3000;
  public id: string;

  public location: number;
  public job: Job | null;
  private getRoute: (factory: FactoryMap, from: number, to: number) => number[];
  private factory: FactoryMap;
  private speaker: Speaker;

  constructor(
    factory: FactoryMap,
    initLocation: number,
    speaker: Speaker,
    getRoute: (factory: FactoryMap, from: number, to: number) => number[],
  ) {
    this.id = `agv-${++Agv.serial_number}`;
    this.speaker = speaker;
    this.location = initLocation;
    this.job = null;
    this.factory = factory;
    this.getRoute = getRoute;

    // FIXME: this will break if there are multiple agvs
    speaker.addPrefix(this.id);
  }
  public assignJob(job: Job) {
    console.assert(
      this.job === null,
      "Agv::assignJob: must assign job to and idle agv",
    );

    this.job = job;
  }
  public update(elapsed: number): number {
    if (this.job === null) {
      // idle, do not move
      this.speaker.info(`idle at location ${this.location}`);
      return this.location;
    }

    const route = this.getRoute(this.factory, this.location, this.job.to);
    const nextLocation = route[1] ?? null;
    const isJobCompleted = nextLocation == null;
    const must_wait = this.factory.isOccupied(nextLocation);
    const keep_running = !isJobCompleted && !must_wait;

    if (keep_running) {
      this.speaker.info(`${this.location}->${nextLocation}`);
      this.location = nextLocation;
      return this.location;
    }

    if (isJobCompleted) {
      this.job.completion_time = elapsed;
      this.speaker.info(`${this.job.dumpTimestamps()}`);
      this.job = null;
      // TODO: what to do after one job is completed?
      return this.location;
    }

    if (must_wait) {
      // do nothing
      this.speaker.info(`blocked at location ${this.location}`);
      return this.location;
    }

    console.assert(false, "Agv::update: logic error, invalide execution path");
    throw "LOGIC ERROR";
  }
  public isIdle(): boolean {
    return this.job === null;
  }
}

class SimpleSpeaker implements Speaker {
  private prefix = "";
  info(...args: any[]): void {
    if (this.prefix !== "") {
      console.info(this.prefix, ...args);
    } else {
      console.info(...args);
    }
  }
  addPrefix(prefix: string): Speaker {
    this.prefix = `${prefix}${this.prefix}`;
    return this;
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

  const sp = new SimpleSpeaker();
  const agvs = [new Agv(simpliestFactory, A.id, sp, planShortestPath)];

  // SIMULATION
  const queuedJobs: Job[] = [];

  for (let elapsed = 1; elapsed < config.iteration_cnt; elapsed++) {
    // TODO: what if there are so many incoming jobs that overwhelms agv?
    const idle_agv = agvs.filter((agv) => agv.isIdle());
    if (queuedJobs.length < idle_agv.length) {
      queuedJobs.push(...jobs.filter((j) => j.arrival_time >= elapsed));
      queuedJobs.sort((a, b) => b.arrival_time - a.arrival_time);
    }
    if (queuedJobs.length > 0) {
      for (const agv of idle_agv) {
        agv.assignJob(queuedJobs.pop()!);
      }
    }
    agvs.forEach((agv) => agv.update(elapsed));
  }
}
