import _ from "lodash-es";

const SIM_CTX = { elapsed: NaN };

function interalTraceAgvFetch(
  isDone: boolean,
  agv: Agv,
  job: Job,
): { done: boolean; agv: string } {
  if (!isDone) {
    agv.stats_fetching_time.add(SIM_CTX.elapsed);
    console.log(
      `${agv.id} fetching: destination ${job.from} current ${agv.location}`,
    );
  }
  return { done: isDone, agv: agv.id };
}

function traceAgvStartFetch(
  agv: Agv,
  job: Job,
): { done: boolean; agv: string } {
  return interalTraceAgvFetch(false, agv, job);
}

function traceAgvLocation(
  agv: Agv,
  current: number,
  next: number,
): { agv: string; from: number; to: number } {
  // statistic
  const idle = agv.isIdle();
  const blocked = current === next && !agv.isIdle();
  const init = Number.isNaN(current);
  if (!init) {
    switch (agv.state) {
      case AgvS.Roaming:
        agv.stats_idle_time.add(SIM_CTX.elapsed);
        break;
      case AgvS.Running:
        agv.stats_running_time.add(SIM_CTX.elapsed);
        break;
      default:
        // ignored
        break;
    }
  }

  // render
  if (idle) {
    console.log(`${agv.id} idle at location ${next}`);
  } else if (init) {
    console.log(`${agv.id} starting at ${next}`);
  } else {
    console.log(`${agv.id} ${current}->${next}`);
  }
  return {
    agv: agv.id,
    from: current,
    to: next,
  };
}

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

export class Job {
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

class GraphNode {
  private static next_id = 1000;
  public id: number;
  public neighbours: GraphNode[];
  public occupants = new Set<Agv>();
  constructor() {
    this.id = GraphNode.next_id++;
    this.neighbours = [];
  }

  oneWayTo(...nodes: GraphNode[]): GraphNode {
    this.neighbours.push(...nodes);
    return this;
  }

  twoWayTo(...nodes: GraphNode[]): GraphNode {
    this.neighbours.push(...nodes);
    nodes.forEach((node) => node.neighbours.push(this));
    return this;
  }
}

export class FactoryMap {
  private nodes: Map<number, GraphNode> = new Map();
  public listAdjacentNodes(): Map<number, number[]> {
    return new Map(
      Array.from(this.nodes).map(([k, gn]) => [
        k,
        gn.neighbours.map((n) => n.id),
      ]),
    );
  }
  public listNodes(): number[] {
    return Array.from(this.nodes.values()).map((node) => node.id);
  }
  public oneWayLink(from: number, to: number[]): FactoryMap {
    const destNodes = to.map((t) => this.getById(t));
    const startNode = this.getById(from);
    if (startNode === null || destNodes.some((n) => n === null)) {
      throw `FactoryMap: invalid node id ${from}`;
    }
    destNodes.forEach((dest) => startNode!.oneWayTo(dest!));
    return this;
  }
  public twoWayLink(from: number, to: number[]): FactoryMap {
    const destNodes = to.map((t) => this.getById(t));
    const startNode = this.getById(from);
    if (startNode === null || destNodes.some((n) => n === null)) {
      throw `FactoryMap: invalid node id ${from}`;
    }
    destNodes.forEach((dest) => startNode!.twoWayTo(dest!));
    return this;
  }

  constructor(nodeCnt: number) {
    new Array(nodeCnt)
      .fill(null)
      .map(() => new GraphNode())
      .forEach((node) => this.nodes.set(node.id, node));
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
  public tryOccupy(where: number, who: Agv): boolean {
    console.assert(Number.isFinite(where), "querying invalid location");
    const node = this.getById(where);
    const isValidNode = node !== null;
    const canOccupy = (node?.occupants.size ?? NaN) === 0;

    if (isValidNode && canOccupy) {
      node.occupants.add(who);
      return true;
    } else {
      return false;
    }
  }
}

enum AgvS {
  // no job assigned, do nothing
  Roaming = 9000,
  // running to job.to to deliver whatever crap
  Running = 9001,
  // moving to job.from to pick up whatever crap
  Fetching = 9002,
}

export class Agv {
  public stats_idle_time = new Set();
  public stats_fetching_time = new Set();
  public stats_running_time = new Set();

  private static serial_number: number = 3000;
  public id: string;
  public state: AgvS;

  public location: number;
  public job: Job | null;
  private getRoute: (factory: FactoryMap, from: number, to: number) => number[];
  private factory: FactoryMap;
  public loaded: boolean;

  constructor(
    factory: FactoryMap,
    initLocation: number,
    getRoute: (factory: FactoryMap, from: number, to: number) => number[],
  ) {
    this.id = `agv-${++Agv.serial_number}`;
    this.location = initLocation;
    this.job = null;
    this.factory = factory;
    this.getRoute = getRoute;
    this.state = AgvS.Roaming;
    this.loaded = false;

    traceAgvLocation(this, NaN, this.location);
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
      traceAgvLocation(this, this.location, this.location);
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
        traceAgvStartFetch(this, this.job!);
        traceAgvLocation(this, this.location, nextLocation);
        this.location = nextLocation;
        return this.location;
      }

      if (arrived_after_this_step) {
        this.loaded = true;
        this.state = AgvS.Running;
        traceAgvLocation(this, this.location, nextLocation);
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
    const isJobCompleted = this.loaded && this.location === this.job!.to;
    const must_wait =
      !!nextLocation && this.factory.tryOccupy(nextLocation, this);
    const keep_running = !isJobCompleted && !must_wait;

    if (keep_running) {
      traceAgvLocation(this, this.location, nextLocation);
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
      traceAgvLocation(this, this.location, this.location);
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

export function simulation(config: {
  iteration_cnt: number;
  jobs: Job[];
  agvs: Agv[];
}) {
  const { jobs, agvs, iteration_cnt } = config;
  // SIMULATION
  const queuedJobs: Job[] = [];

  for (let elapsed = 1; elapsed < iteration_cnt; elapsed++) {
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
  // FIXME: replace xxx_time with xxx_duration
  class JobStat {
    public turn_around_time: number;
    public wait_time: number;
    public run_time: number;
  }
  const jobs_with_stat: (JobStat & Job)[] = jobs.map((job) => {
    const jobStat = _.cloneDeep(job) as JobStat & Job;
    jobStat.turn_around_time = jobStat.completion_time - jobStat.arrival_time;
    jobStat.run_time = jobStat.completion_time - jobStat.start_time;
    jobStat.wait_time = jobStat.start_time - jobStat.arrival_time;
    return jobStat;
  });
  const turn_around_time = _.map(jobs_with_stat, "turn_around_time");
  const run_time = _.map(jobs_with_stat, "run_time");
  const wait_time = _.map(jobs_with_stat, "wait_time");
  console.log(
    `average: turn around time ${turn_around_time.reduce((sum, x) => sum + x, 0) / jobs.length}, ` +
      `run time ${run_time.reduce((sum, x) => sum + x, 0) / jobs.length}, ` +
      `wait time ${wait_time.reduce((sum, x) => sum + x, 0) / jobs.length}`,
  );
  // TODO: put everything into print_min_max_stats
  const min_turn_around_time = Math.min(...turn_around_time);
  const min_run_time = Math.min(...run_time);
  const min_wait_time = Math.min(...wait_time);
  const max_turn_around_time = Math.max(...turn_around_time);
  const max_run_time = Math.max(...run_time);
  const max_wait_time = Math.max(...wait_time);
  console.log(
    `min-max: turn around time ${min_turn_around_time}<${max_turn_around_time}, ` +
      `run time ${min_run_time}<${max_run_time}, ` +
      `wait time ${min_wait_time}<${max_wait_time}`,
  );
  function print_min_max_stats<T>(
    stats: T[],
    measure: keyof T,
    min_measure: number,
    max_measure: number,
  ): void {
    console.log(
      `min ${String(measure)}`,
      _.filter(stats, [measure, min_measure]),
    );
    console.log(
      `max ${String(measure)}`,
      _.filter(stats, [measure, max_measure]),
    );
  }
  print_min_max_stats(
    jobs_with_stat,
    "turn_around_time",
    min_turn_around_time,
    max_turn_around_time,
  );
  print_min_max_stats(
    jobs_with_stat,
    "wait_time",
    min_wait_time,
    max_wait_time,
  );
  print_min_max_stats(jobs_with_stat, "run_time", min_run_time, max_run_time);
  agvs.forEach((agv) =>
    console.log(
      `time distribution: ${agv.id} ` +
        `fetching ${agv.stats_fetching_time.size}, ` +
        `running ${agv.stats_running_time.size}`,
    ),
  );
}
