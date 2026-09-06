# 004 · Multica：多 Agent 协作与执行控制研究

> Multica 把已有 Agent 工具组织成可派工、可追踪的工作平台：模型决定怎么做，程序管理任务、进程、并发与反馈。

[返回总索引](../../README.md) · [在线研究展览](https://yydshly.github.io/0906_codex_project/demos/004-multica/) · [整体架构与控制](architecture.md) · [源码证据](sources.md) · [运行与验证](running.md) · [研究记录](notes.md)

## 项目档案

| 项目 | 内容 |
| --- | --- |
| 上游 | [multica-ai/multica](https://github.com/multica-ai/multica) |
| 研究版本 | [7a438bd5b8bf39afd54259a7eb0971390e50a8ef](https://github.com/multica-ai/multica/tree/7a438bd5b8bf39afd54259a7eb0971390e50a8ef)，提交时间 2026-09-05 |
| 核对日期 | 2026-09-06 |
| 范围 | 官方文档、固定版本源码阅读、原创架构图、独立调度教学演示 |
| 实跑边界 | 已构建静态研究站；未运行 Multica 后端 / Daemon，未验证真实模型调用或生产性能 |
| 许可 | Multica License：Apache 2.0 全文与额外条件共同构成，不能简称纯 Apache 2.0 |
| 状态 | 本轮源码与架构整理已完成；实际采用与性能仍待验证 |

## 从这张图进入研究

[![Multica 整体架构引导图：入口、平台、多机执行、工具与模型，以及并发和任务推进两条控制循环；原创整理，非产品截图](../../docs/assets/projects/004-multica/architecture-guide.png)](../../docs/assets/projects/004-multica/multica-system-control-architecture.svg)

先沿“入口 → 平台 → Daemon → Agent 工具 → 模型与工作资源”理解边界，再阅读并发与任务推进。详细图提供可缩放 SVG：

| 图 | 解决的问题 |
| --- | --- |
| [整体开发架构](../../docs/assets/projects/004-multica/multica-system-architecture.svg) | 模块归属、部署、通信、数据存放与扩展入口 |
| [工具与模型接入](../../docs/assets/projects/004-multica/multica-execution-architecture.svg) | Codex / Claude Code 如何启动，角色如何绑定工具与模型 |
| [并发与完成控制](../../docs/assets/projects/004-multica/multica-system-control-architecture.svg) | 名额、队列、目录锁、反馈及最终验收 |
| [功能总览](../../docs/assets/projects/004-multica/multica-capability-architecture.svg) | 任务、小队、技能、自动化与观测 |

图示是依据证据重组的逻辑架构，模块框不代表独立微服务；角色和模型搭配是示例。

## 意义：整合资源，并管理资源如何工作

它接入模型和 Agent 工具的现有能力，新增任务队列、协作触发、执行环境管理与统一记录。价值在于减少切换终端、复制上下文、检查失败和跟进结果的人工成本。可以让多个 Agent 分别做独立任务，也可以围绕同一目标协作。

本质是 **工具接入 + 任务组织 + 运行调度 + 协作记录 + 结果展示**。接入多个模型本身不会自动产生可靠分工或正确成果。

| 层次 | 提供方 | 职责 |
| --- | --- | --- |
| 推理与生成 | 模型服务或工具支持的本地模型 | 理解、规划、生成内容 |
| 实际操作 | Codex、Claude Code 等工具 | 文件、命令、工具调用 |
| 组织与调度 | Multica 服务端与 Daemon | 路由、队列、并发、进程与反馈 |
| 人机协作 | 界面与通知入口 | 讨论、日志、成果关联、审阅 |

## 六个关键结论

1. **Agent 是长期配置，Run 是一次执行。** Runtime 是机器上的工具或兼容配置；不同角色可复用同一工具和模型。
2. **工具通过进程协议接入。** Codex 使用 app-server / JSON-RPC；Claude Code 使用流式 JSON。Multica 传入模型选项，工具使用自身服务配置和认证。
3. **小队先触发负责人。** 人设置负责人和成员；负责人获得名册与规则，用结构化提及评论派工。普通文字 @名字 不等同于有效路由标记。
4. **异步来自独立任务，并行来自独立进程。** Daemon 先取机器名额再请求领取；服务端事务检查 Agent 占用；目录条件进一步约束执行。
5. **负责人通常派工后结束本轮。** 成员反馈或相关阶段事件符合规则时触发后续 Run，不需要常驻进程等待。
6. **Run 完成不等于 Issue 完成。** 负责人决定继续、等待或提交 in_review，人工或已有集成确认 done。

完整过程、边界与证据见 [architecture.md](architecture.md) 和 [sources.md](sources.md)。

## 为什么关注度高

2026-09-06 GitHub API 查询记录为 **49,014 Stars、6,332 Forks**。这是关注度快照，不是部署数量、留存或效率证明。

本研究认为其吸引力来自多 Agent 管理需求、“给 AI 同事派任务”的易理解体验、复用已有工具，以及代码可查看和可自托管。这是产品定位分析；未找到可靠的传播渠道归因，不能断言具体增长原因。

## 与其他研究方向的区别

以下比较能力层次，不是针对各项目当前版本的完整功能测评。

| 研究方向 | 通常关注什么 | 与 Multica 的关系 |
| --- | --- | --- |
| AgentScope 等 Agent 框架 | 编程构建 Agent、工具与协作逻辑 | 更接近开发基础设施；Multica 聚焦现有工具的工作管理 |
| HumanLayer / dzhng 等 Skills 集合 | 操作规程、角色方法、提示 | 提供工作方法，不单独替代运行队列和进程管理 |
| CLIProxyAPI 等代理 | 模型接口、认证与请求路由 | 属于模型接入层，和任务协作层不同 |
| 终端上下文工具 | 单个环境的上下文与操作体验 | 改善局部工作；Multica 聚焦跨任务、角色与机器 |

## 场景与对我们的意义

适合研究的场景：前后端分工、并行代码审查、多个仓库独立维护、定期报告或检查、多人共用可追踪工作空间。一个人只处理一项简单任务时，额外管理层收益可能较小。

最值得复用的是 **模型做决策、程序维护规则、事件连接多轮工作** 的分层。采用评估应记录人工跟进时间、返工率、成果质量、成本与恢复表现；本轮没有这些实测数据。

## 扩展方向

| 类型 | 方向 |
| --- | --- |
| 已有架构入口 | 新角色与小队、Skills、工具支持的 MCP、更多机器、兼容 Runtime Profile、工具适配器、渠道与自动化 |
| 建议新增或加强 | 总预算、派工次数、总时限、可执行验收、依赖约束、成果版本与集成冲突处理 |

建议项不代表上游已经完整实现。提示词里的“检查完成”不能代替程序强制的质量门禁。

## 许可与发布范围

固定版本 [完整许可证](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/LICENSE) 对第三方托管、商业嵌入和品牌标识另有条件；单一组织内部使用与向第三方提供服务的条款不同。GitHub API 的 SPDX 识别为 NOASSERTION。采用或分发时应阅读完整许可，不能只取 Apache 部分。

本次发布原创研究、架构图与独立教学逻辑，不包含上游程序，不提供可执行用户代码的 Multica 托管实例。图片不是官方产品截图。

## 查看与维护

仓库根目录运行 `python -m http.server 8000 --directory docs`，访问 /demos/004-multica/。完整验证、教学约束及官方运行入口见 [running.md](running.md)。

更新研究先固定上游提交，再核对 sources.md、更新文档 / SVG / 网页；元数据修改后执行 `npm run sync` 和 `npm run check`。
