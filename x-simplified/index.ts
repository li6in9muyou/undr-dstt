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
    this.getNextJob = getNextJob;
    this.factory = factory;
  }
  public update() {
    if (this.job === null) {
      this.job = this.getNextJob(this);
      this.route = planShortestPath(this.factory, this.job.from, this.job.to);
    } else {
      this.location = this.route.next().value;
      if (this.location == null) {
        this.job = null;
      }
    }
  }
}

const agvs = [new Agv(simpliestFactory, A.id, () => jobs[0])];
