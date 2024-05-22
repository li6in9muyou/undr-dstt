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

# 摘要

在现代化的工厂和仓库中，常使用 agv 来运输货物，研究 agv 的调度和路线规划算法非常的有意义。本文工作目的不仅是要探究 agv 调度系统的设计与实现以及达到吉林大学毕业论文的要求，而且更重要的是要让作者可以取得本科文凭。研究方法是编码实现与上机实验相结合，以编码实现为主、阅读文献为辅。研究成果是设计了一个 agv 调度和路线规划的模拟仿真程序，可以自动的生成货物运输任务，然后把这些任务指派给 agv ，然后再逐一对每个 agv 指挥其走行，经过在不同规模地图的实验，本系统可以保证 agv 不相撞，并能高效的完成货物运输任务。此外，作者也在这个过程中增加了编码经验提高了编码工具使用熟练度。

English abstract will be added after revisions.

**关键词：**agv、路线规划、最短路径算法


# 系统整体设计与实现

## 概述
本文设计了一个 agv 调度和路线规划的模拟仿真程序，可以自动的生成货物运输任务，然后把这些任务指派给 agv ，然后再逐一对每个 agv 指挥其走行，经过在不同规模地图的实验，本系统可以保证 agv 不相撞，并能高效的完成货物运输任务。本文用 typescript 程序设计语言，结合 nodemon、npm、vitest、vite 等现代化主流 web 开发工具链进行开发，文本编辑器使用 neovim 。

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

感谢我每天使用的开发工具的所有开发者、维护者、贡献者。我免费的使用这些开源且免费的工具以及很多闭源但免费的工具，我非常的感激。这些工具包括但不限于，排名不分先后：git 、 neovim 、 Chrome the web browser 、 Google the search engine 、 typescript 、 npm 、 nodejs 、 GitHub 。