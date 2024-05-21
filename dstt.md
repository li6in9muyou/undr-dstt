---
title: AGV调度系统的设计与实现
link-citations: true
link-bibliography: true
reference-section-title: 参考文献
references:
  - type: article-journal
    id: wc53
    author:
      - family: Watson
        given: J. D.
      - family: Crick
        given: F. H. C.
    issued:
      date-parts:
        - - 1953
          - 4
          - 25
    title: "Molecular structure of nucleic acids: a structure for
      deoxyribose nucleic acid"
    title-short: Molecular structure of nucleic acids
    container-title: Nature
    volume: 171
    issue: 4356
    page: 737-738
    DOI: 10.1038/171737a0
    URL: https://www.nature.com/articles/171737a0
    language: en-GB
---

# how to citation and bibliography

[@wc53] said hello world and DNA is twisted.
[@wc53] are awarded handsomely.

# 系统整体设计

## 主要组成部分

### 地图模型

地图被抽象为有向图，目前边的权重均为1。
每个节点有一个唯一的 id 。
每个地图节点都可以容纳一定量的 agv ，目前节点都是只能容纳1个 agv 。

### 货物模型

货物被抽象为三元组，（运送始发地，运送终到地，运输任务到达时间）。
其中运送始发地和运送终到地以地图节点的 id 来表示，运输任务到达时间以系统模拟轮次序号表示。
任何一个货物运输任务都可以被任何一个 agv 承载。
货物运输任务一旦产生就一定要被 agv 运输完毕，不处理任务超时或中途取消的情况。

### agv 模拟器

在本模拟系统中， 每台 agv 都占用一个地图节点。
agv 被建模为一个简单数据对象，里面存储的信息如下：

- 位置，用节点的 id 表示。
- 是否载货，布尔值。
- 所载货物，货物三元组。

调度程序可将货物运输任务指派给 agv ，指派后 agv 根据设定的路线规划程序在地图中走行，完成以下几个阶段的子任务：

1. 取货物，从 agv 的当前位置去往货物的运送始发地
2. 送货物，从货物的运送始发地前往货物的运送终到地

### agv 调度程序

该子系统负责将货物运输任务指派给 agv 。
货物运输任务的指派算法如下：

算法输入：
- agv 集合
- 货物运输任务集合

算法输出：
- 任务指派集合 schedule ，其中的元素为（agv， 指派给 agv 的运输任务）。

算法终止条件：
- agv 集合中所有 agv 都有载货
- 或者，货物运输任务集合为空

算法步骤：
1. 从所有的 `agv` 中选出那些没有载货的 `agv` ，装入集合 `idleAgvs` 。
2. 把任务队列中的任务按照任务到达的先后顺序排序，装入列表 `tasks`。
3. 从 `tasks` 中取出任一任务，记为 task ，从 `idleAgvs` 中取出任一 `agv` ，记为 agv 。将元组（agv，task）装入集合 schedule 中。

## agv 路线规划算法

算法输入：
