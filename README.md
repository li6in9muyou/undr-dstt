# Notes

## [MageStudio/PathFindingDemo](https://github.com/MageStudio/PathFindingDemo)

[MageStudio](https://github.com/MageStudio/PathFindingDemo) implements A* and builds a 3D scene to demonstrate it.
See a [live demo](https://pathfindingdemo.now.sh/).
3D scene includes a plane, multiple obstacles, one starting point and one finishing point.
Path found by A* is drawn on the plane after obstacles are spawned.

## [stefangeneralao/genetic-path-finder](https://github.com/stefangeneralao/genetic-path-finder/tree/master)

Run this repo with

```bash
$ npm i
$ node server
```

to see a very artistic presentation.

This repo implements a genetic algorithm.
Each piece of gene is an array of `p5.Vector.random2D()` which are movement vectors at every simualation iteration.
There is no grid system or graph system, it's just a 2D plane.
Path is drawn accroding to aforementioned movement vectors.
Once the position of an individual is inside a predined static target area, that individual is considered survived.

## [WinterWonderland/pyPathFindingDemo](https://github.com/WinterWonderland/pyPathFindingDemo/tree/master)

A very handy grid-based path finding visualization built with pygame.
This could be handy if I am asked to make a GUI demo in the future.
BFS, DFS, greddy, A\* algorithms are implemented using a flexible tree search framework.

## [another implementation of A\* in python](https://github.com/Tomanlon/AstarPathFinding/tree/main)

meh

## [whatever](https://github.com/arrtvv852/ML-for-AGV-dispatching-module/tree/master)

SVN is used in this work. I have not yet looked into it.

## [AGVS_simulation](https://github.com/junzhexuA/AGVS_simulation)

This is source code used in a published paper.
However, code quality is very poor.
System input and output are stored in Excel spreadsheets and they are extremely enigmatic.
It's not worth it to adopt its input/output format.
I'd better design my own.
