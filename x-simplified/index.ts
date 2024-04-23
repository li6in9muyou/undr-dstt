import { planShortestPath } from "./djShortest";

const SIM_CTX = { elapsed: NaN };

function traceJobCompleted(
  job: Job,
  agv: Agv,
): { agv: string; from: number; to: number } {
  // statistic
  job.completion_time = SIM_CTX.elapsed;
  // render
  console.log(
    `${agv.id} job arrived ${job.arrival_time} completed ${job.completion_time}`,
  );
  return {
    agv: agv.id,
    from: job.from,
    to: job.to,
  };
}

function traceJobAssigned(
  job: Job,
  agv: Agv,
): { agv: string; from: number; to: number } {
  // statistic
  job.start_time = SIM_CTX.elapsed;
  // render
  console.log(`${agv.id} assigned: ${job.from} ~~> ${job.to}`);
  return {
    agv: agv.id,
    from: job.from,
    to: job.to,
  };
}

class Job {
  public from: number;
  public to: number;

  public arrival_time: number;
  public start_time: number;
  public completion_time: number;

  constructor(arrival_time: number, from: number, to: number) {
    this.arrival_time = arrival_time;
    this.from = from;
    this.to = to;
    this.completion_time = Number.POSITIVE_INFINITY;
  }
  dumpTimestamps(): string {
    return `job arrived ${this.arrival_time} completed ${this.completion_time}`;
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
    console.assert(Number.isFinite(where), "querying invalid location");
    return (this.getById(where)?.occupants.size ?? -1) > 0;
  }
}

interface Speaker {
  info: (...args: any) => void;
  addPrefix: (prefix: string) => Speaker;
}

enum AgvS {
  // no job assigned, do nothing
  Roaming = 9000,
  // running to job.to to deliver whatever crap
  Running = 9001,
  // moving to job.from to pick up whatever crap
  Fetching = 9002,
}

class Agv {
  private static serial_number: number = 3000;
  public id: string;
  public state: AgvS;

  public location: number;
  public job: Job | null;
  private getRoute: (factory: FactoryMap, from: number, to: number) => number[];
  private factory: FactoryMap;
  private speaker: Speaker;
  public loaded: boolean;

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
    this.state = AgvS.Roaming;
    this.loaded = false;

    // FIXME: this will break if there are multiple agvs
    speaker.addPrefix(this.id);
    this.speaker.info(`starting at ${this.location}`);
  }
  public assignJob(job: Job) {
    console.assert(
      this.job === null,
      "Agv::assignJob: must assign job to and idle agv",
    );

    this.job = job;
    traceJobAssigned(job, this);
  }
  public update(elapsed: number): number {
    if (this.isIdle()) {
      // idle, do not move
      this.state = AgvS.Roaming;
      this.speaker.info(`idle at location ${this.location}`);
      return this.location;
    }

    if (this.isFetching()) {
      // [current_ignored, nextLocation, ...rest_ignored]
      const [_, nextLocation, ...__] = this.getRoute(
        this.factory,
        this.location,
        this.job!.from,
      );
      const arrived_after_this_step = nextLocation === this.job!.from;
      const already_arrived = nextLocation === undefined;
      if (!already_arrived) {
        this.speaker.info(
          `fetching: destination ${this.job!.from} current ${this.location}`,
        );
      }
      if (arrived_after_this_step) {
        this.loaded = true;
        this.state = AgvS.Running;
        this.speaker.info(`${this.location}->${nextLocation}`);
        this.location = nextLocation;
        return this.location;
      }

      if (already_arrived) {
        this.loaded = true;
        this.state = AgvS.Running;
        // fall through
      }
    }

    const [_, nextLocation, ...__] = this.getRoute(
      this.factory,
      this.location,
      this.job!.to,
    );
    const isJobCompleted = this.location === this.job!.to;
    const must_wait = !!nextLocation && this.factory.isOccupied(nextLocation);
    const keep_running = !isJobCompleted && !must_wait;

    if (keep_running) {
      this.speaker.info(`${this.location}->${nextLocation}`);
      this.location = nextLocation;
      return this.location;
    }

    if (isJobCompleted) {
      traceJobCompleted(this.job!, this);
      this.job = null;
      this.loaded = false;
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
  public isFetching(): boolean {
    return this.job !== null && !this.loaded;
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
    new Job(5, B.id, A.id),
  ];

  const sp = new SimpleSpeaker();
  const agvs = [new Agv(simpliestFactory, A.id, sp, planShortestPath)];

  // SIMULATION
  const queuedJobs: Job[] = [];

  for (let elapsed = 1; elapsed < config.iteration_cnt; elapsed++) {
    SIM_CTX.elapsed = elapsed;

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
