---
title: AGV调度系统的设计与实现
link-citations: true
link-bibliography: true
reference-section-title: 参考文献
references:
  - type: article-journal
    id: SL18
    author:
      - family: Lee
        given: Sangmin
      - family: Lee
        given: JunHo
      - family: Na
        given: Byungsoo
    issued:
      date-parts:
        - - 2018
          - 7
          - 20
    title: "Practical Routing Algorithm Using a Congestion
      Monitoring System in Semiconductor Manufacturing"
    container-title: "IEEE TRANSACTIONS ON SEMICONDUCTOR MANUFACTURING"
    volume: 31
    issue: 4
    DOI: 10.1109/TSM.2018.2858013
  - type: article-journal
    id: Fransen20
    author:
      - family: Fransen
        given: K.J.C.
      - family: van Eekelen
        given: J.A.W.M.
      - family: Pogromsky
        given: A.
      - family: M.A.A.
        given: Boon
      - family: Adan
        given: I.J.B.F.
    issued:
      date-parts:
        - - 2020
          - 6
          - 23
    title: "A dynamic path planning approach for dense, large, grid-based
automated guided vehicle systems"
    container-title: "Computers and Operations Research"
    volume: 123
    DOI: 10.1016/j.cor.2020.105046
  - type: article-journal
    id: zhang16
    author:
      - family: 张
        given: 峥炜
      - family: 陈
        given: 波
      - family: 陈
        given: 卫东
    issued:
      date-parts:
        - - 2016
          - 9
          - 27
    title: "时间窗约束下的 AGV 动态路径规划"
    volume: 32
    issue: 11
---

# 摘要

在现代化的工厂和仓库中，常使用 agv 来运输货物，研究 agv 的调度和路线规划算法非常的有意义。
本文工作目的不仅是要探究 agv 调度系统的设计与实现以及达到吉林大学毕业论文的要求，而且更重要的是要让作者可以取得本科文凭。
研究方法是编码实现与上机实验相结合，以编码实现为主、阅读文献为辅。
研究成果是设计了一个 agv 调度和路线规划的模拟仿真程序，可以自动的生成货物运输任务，然后把这些任务指派给 agv ，然后再逐一对每个 agv 指挥其走行，经过在不同规模地图的实验，本系统可以保证 agv 不相撞，并能高效的完成货物运输任务。
此外，作者也在这个过程中增加了编码经验提高了编码工具使用熟练度。

English abstract will be added after revisions.

**关键词：**agv、路线规划、最短路径算法

# 综述

TODO：这里写其他人写的论文

[@SL18]提出了一个集成了交通量、平均速度、绝对拥堵指数（ACI）和相对拥堵指数（RCI）等关键拥堵指标的拥堵监控系统（CMS），用于实时量化和监控半导体制造自动化物料搬运系统（AMHS）中的拥堵情况。
通过实际案例分析和模拟实验，验证了CMS在监控、优化路径分配和增强路由算法方面的有效性，展示了其在减少平均交付时间和缓解生产损失方面的显著效果。
[Fransen20]使用图表示法来表示网格系统布局，并随时间更新顶点权重。
顶点权重通过指数平滑法进行更新，反映AGV在中心点的停滞时间。当AGV离开中心点时，系统记录其停滞时间，并用此来更新相应顶点的权重。
此外，如果AGV在中心点停滞时间超过顶点权重当前值，则会进行初步更新，提前增加顶点权重。
这种动态规划路径的方法能在拥挤的AGV系统显著提高系统吞吐量。
[zhang16]使用了时间窗用于确保AGV在规划路径上行驶时，不会与其他AGV或系统内的其他活动发生冲突，进而在路径规划过程中，如果发现当前路径上的某个点的时间窗已被占用，算法会重新规划路径，避开冲突，并更新时间窗信息。

# 系统整体设计与实现

## 概述

本文设计了一个 agv 调度和路线规划的模拟仿真程序，可以自动的生成货物运输任务，然后把这些任务指派给 agv ，然后再逐一对每个 agv 指挥其走行，经过在不同规模地图的实验，本系统可以保证 agv 不相撞，并能高效的完成货物运输任务。
本文用 typescript 程序设计语言，结合 nodemon、npm、vitest、vite 等现代化主流 web 开发工具链进行开发，文本编辑器使用 neovim 。

## 主要组成部分

### 地图模型

地图被抽象为有向图，目前边的权重均为1，且保证是连通图。
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

- agv 集合中所有 agv 都有载货。
- 或者，货物运输任务集合为空。

算法步骤：

1. 从所有的 `agv` 中选出那些没有载货的 `agv` ，装入集合 `idleAgvs` 。
2. 把任务队列中的任务按照任务到达的先后顺序排序，装入列表 `tasks`。
3. 从 `tasks` 中取出任一任务，记为 task ，从 `idleAgvs` 中取出任一 `agv` ，记为 agv 。将元组（agv，task）装入集合 schedule 中。

## agv 路线规划算法

算法输入：两个地图节点，用其 id 表示。

算法输出：地图节点列表，用其 id 表示。保证该列表开头和最后一个元素为输入的两个节点，若没有路径，输出控列表。

算法步骤：迪杰斯特拉最小路径算法。

## agv 走行控制算法

该子系统负责控制每台 agv 的走行。

算法输入：

- agv
- 系统模拟轮次序号

算法输出：agv 的下一个位置，用地图节点 id 表示。

算法步骤：

1. 若 agv 未被指派运输任务，输出当前位置，结束。
2. 若 agv 被指派了运输任务却没有载货，记 Path 为 agv 路线规划算法（当前位置，被指派的货物运输任务的运送始发地）的输出，若 Path[1] 没有 agv 占用，输出 Path[1] ，否则输出当前位置，结束。
3. 若 agv 被指派了运输任务且载货，记 Path 为 agv 路线规划算法（当前位置，被指派的货物运输任务的运送终到地）的输出，若 Path[1] 没有 agv 占用，输出 Path[1] ，否则输出当前位置，结束。

# 致谢

感谢我每天使用的开发工具的所有开发者、维护者、贡献者。
我免费的使用这些开源且免费的工具以及很多闭源但免费的工具，我非常的感激。
这些工具包括但不限于，排名不分先后：git 、 neovim 、 Chrome the web browser 、 Google the search engine 、 typescript 、 npm 、 nodejs 、 GitHub 。
