# 证据与来源索引

固定研究版本：[7a438bd5b8bf39afd54259a7eb0971390e50a8ef](https://github.com/multica-ai/multica/tree/7a438bd5b8bf39afd54259a7eb0971390e50a8ef)。官方站点文档滚动更新，访问日期为 2026-09-06；代码链接固定到提交。

| 结论 | 源码 | 核对点 |
| --- | --- | --- |
| 产品定位、技术栈 | [README.md](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/README.md) | 整体组件与接入边界 |
| Codex 接入 | [server/pkg/agent/codex.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/pkg/agent/codex.go) | codexBackend、buildCodexArgs、turn/start；app-server / JSON-RPC |
| Claude Code 接入 | [server/pkg/agent/claude.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/pkg/agent/claude.go) | claudeBackend.Execute、buildClaudeArgs；stream-json / --model |
| 先取得名额再批量领取 | [server/internal/daemon/daemon.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/daemon/daemon.go) | runBatchPoller、newTaskSlotSemaphore、handleTask；归还后唤醒 |
| 事务领取与 Agent 容量检查 | [server/internal/service/task.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/service/task.go) | claimTask、GetAgentForClaimUpdate、CountRunningTasks；Runtime 校验 |
| Redis 辅助提示 | [server/internal/service/task.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/service/task.go) | EmptyClaim、ReclaimCheck；数据库仍是依据 |
| 结构化提及解析 | [server/internal/util/mention.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/util/mention.go) | ParseMentions；mention://agent/<uuid> |
| 评论触发与执行合并 | [server/internal/handler/comment.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/handler/comment.go) | 评论、Agent 目标解析与后续执行 |
| 负责人简报 | [server/internal/handler/squad_briefing.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/handler/squad_briefing.go) | 系统协议、成员名册与小队指令 |
| 上下文进入执行 | [server/internal/daemon/prompt.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/daemon/prompt.go) | 任务与触发评论构成运行上下文 |
| 执行消息存储 | [server/migrations/026_task_messages.up.sql](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/migrations/026_task_messages.up.sql) | 建表起点；不代表完整当前 schema |
| 文件存储接口 | [server/internal/storage/storage.go](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/server/internal/storage/storage.go) | Storage 接口；同目录 local.go / s3.go |
| 运行方式 | [SELF_HOSTING.md](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/SELF_HOSTING.md) | 自托管依赖与官方入口 |
| 完整许可 | [LICENSE](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/LICENSE) | 附加条件与 Apache 2.0 共同构成 |
| 版权与归属 | [NOTICE](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/NOTICE) | 上游声明 |

## 官方文档

- [整体机制](https://multica.ai/docs/how-multica-works)
- [Agent 配置与模型](https://multica.ai/docs/agents-create)
- [Daemon / Runtime / 并发](https://multica.ai/docs/daemon-runtimes)
- [小队与负责人](https://multica.ai/docs/squads)
- [提及与反馈合并](https://multica.ai/docs/mentioning-agents)
- [Run 状态与重试](https://multica.ai/docs/tasks)
- [Issue 状态](https://multica.ai/docs/issues)
- [目录锁与 worktree](https://multica.ai/docs/project-resources)
- [Skills](https://multica.ai/docs/skills)
- [自动化](https://multica.ai/docs/autopilots)
- [安全模型](https://multica.ai/docs/security-model)

## 数字、推断与建议

GitHub API GET /repos/multica-ai/multica 于 2026-09-06 返回 49,014 Stars、6,332 Forks；数字随时间变化。“为何受关注”“对我们的意义”属于产品定位和架构分析，不是增长归因或采用效果调查。预算上限、派工次数、验收硬规则与依赖控制是建议，不应当作上游已有能力引用。

## 图形与教学逻辑

架构图、研究站和调度教学逻辑为本仓库原创整理。未复制整个上游代码或官方 UI。SVG 是可编辑图形，PNG 用于 README 和通用预览。没有虚构产品截图和真实模型执行结果。

