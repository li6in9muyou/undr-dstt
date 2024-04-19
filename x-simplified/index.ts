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

function planShortestPath(
  factory: { getNeighbours: (me: number) => number[] },
  from: number,
  to: number,
): IterableIterator<number> {
  return [from, to].values();
}

class Agv {
  public location: number;
  public job: Job | null;
  private route: IterableIterator<number>;
  private getNextJob: (who: Agv) => Job;
  private factory: FactoryMap;

  constructor(
    factory: FactoryMap,
    initLocation: number,
    getNextJob: (who: Agv) => Job,
  ) {
    this.location = initLocation;
    this.job = null;
    // TODO: maybe we should push jobs to agv so that job scheduling process could be made more pronounced
    this.getNextJob = getNextJob;
    this.factory = factory;
  }
  public assignJob(job: Job) {
    console.assert(
      this.job === null,
      "Agv::assignJob: currently running a job",
    );
    this.job = job;
  }
  public update(): number {
    if (this.job === null) {
      this.job = this.getNextJob(this);
      this.route = planShortestPath(this.factory, this.job.from, this.job.to);
    } else {
      const nextLocation = this.route.next().value;
      const arrived = nextLocation == null;
      const must_wait = this.factory.isOccupied(nextLocation);
      if (arrived) {
        this.job = null;
        // TODO: what to do after one job is completed?
      } else if (must_wait) {
        // do nothing
      } else {
        this.location = nextLocation;
      }
    }
    return this.location;
  }
}

const agvs = [new Agv(simpliestFactory, A.id, () => jobs[0])];

// SIMULATION
const queuedJobs: Job[] = [];
function getNextJob(elapsed) {
  if (queuedJobs.length === 0) {
    queuedJobs.push(...jobs.filter((j) => j.arrival_time >= elapsed));
    // FIXME: make sure that pop() returns the oldest job
    queuedJobs.sort((a, b) => a.arrival_time - b.arrival_time);
  }
}
for (let elapsed = 1; elapsed < 100; elapsed++) {
  // TODO: what if there are so many incoming jobs that overwhelms agv?
  for (const agv of agvs) {
    if (agv.isIdle()) {
    }
  }
}
