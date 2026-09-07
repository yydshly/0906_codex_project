# 007 · AI Agent Book · 源码与文档证据

研究锚点：[`7572c78e8284416d05cd3435c627b1b38c452ff2`](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2)，核对日期 2026-09-07。

## 项目定位与内容规模

| 结论 | 直接来源 | 证据边界 |
| --- | --- | --- |
| 核心公式为 `Agent = LLM + 上下文 + 工具` | [固定版本 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/README.md) | 作者对全书的组织方式 |
| 固定版本 README 列出 10 章、109 个配套实验和 15 种语言入口 | [固定版本 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/README.md) | 语言版本可能滞后于中文原版；实验包含本地项目与外部复现轨道 |
| Python 统一支持 3.11–3.13，部分实验另需系统依赖、外部仓库或凭据 | [运行配套实验](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/README.md#%E8%BF%90%E8%A1%8C%E9%85%8D%E5%A5%97%E5%AE%9E%E9%AA%8C) | 不代表所有实验共享同一套依赖或都能在 CPU 环境运行 |
| 上游采用 Apache License 2.0 | [LICENSE](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/LICENSE) | 外部复现仓库仍使用各自许可证 |

## 核心机制

| 机制 | 直接来源 | 我们据此得出的结论 |
| --- | --- | --- |
| 搜索 Agent 在循环中调用模型，识别 `tool_calls`，执行搜索，将 observation 写回历史，设最大迭代次数 | [`chapter1/web-search-agent/agent.py`](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter1/web-search-agent/agent.py) | ReAct 由消息历史、结构化调用和程序循环实现 |
| 混合检索并行取得 dense / sparse 结果，合并文档、使用 RRF 或加权融合，再重排序 | [`chapter3/retrieval-pipeline/retrieval_pipeline.py`](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter3/retrieval-pipeline/retrieval_pipeline.py) | 知识能力来自检索与上下文组织，模型并未凭空获得私有事实 |
| Coding Agent 解析工具参数，从注册表取得工具、执行后包装结果并加入消息 | [`chapter5/coding-agent/agent.py`](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter5/coding-agent/agent.py) | 模型负责提出动作，Harness 负责真实执行和错误处理 |
| 评估闭环为 reset → run → snapshot → verifier → record | [第七章 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter7/README.md) | 最终文本、过程违规和环境状态需要分开验证 |
| 持续进化包含轨迹验证、候选更新、回归、灰度与回滚 | [第九章 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter9/README.md) | 从经验学习需要可信信号与发布门，不能直接把失败输出写回系统 |
| 多 Agent 实验固定消息信封、worker 生命周期、独立审核和结算 | [第十章 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter10/README.md) | 并行能力来自运行时调度和隔离，角色提示只是协作的一部分 |

## 能力入口

- [第一章：基础搜索、搜索与代码执行、图像工作流](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter1)
- [第二章：本地模型、KV Cache、Prompt、Skills、注入与压缩](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter2)
- [第三章：记忆、检索、RAG、结构化索引与知识抽取](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter3)
- [第四章：MCP、感知 / 执行 / 协作工具与主动工具发现](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter4)
- [第五章：Coding Agent、媒体、日志、ERP、动态 UI 与 Agent 创建](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter5)
- [第六章：异步、事件、语音、Computer Use 与机器人](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter6)
- [第七章：环境、Rubric、成本、统计和多种 Agent 基准](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter7)
- [第八章：预训练、SFT、RL、蒸馏和多模态训练](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter8)
- [第九章：轨迹验证、Prompt 优化、自修改与回滚](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter9)
- [第十章：角色转移、翻译、并行研究和 Agent 社会](https://github.com/bojieli/ai-agent-book/tree/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter10)

## 实验结果与状态边界

| 观察 | 来源 | 正确解释 |
| --- | --- | --- |
| 主动工具发现实验没有观察到准确率提升，但减少工具 schema 文本和耗时 | [第四章 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter4/README.md) | 这是固定任务与模型下的结果，不证明该方法在所有场景都无效 |
| 代码辅助 K&K 逻辑实验结果低于纯思考路线 | [第五章 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter5/README.md) | 工具可用性不等于模型会正确使用工具 |
| Prompt 蒸馏出现明显提升，CoT 蒸馏提升未显著 | [第八章 README](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/chapter8/README.md) | 不同训练目标、模型、数据和样本量不能合并成统一结论 |
| 部分外部服务、长期基准和机器人实验仍未完成 | [实验状态台账](https://github.com/bojieli/ai-agent-book/blob/7572c78e8284416d05cd3435c627b1b38c452ff2/docs/EXPERIMENT_STATUS.md) | 克隆、安装或 smoke test 不等于完成正式实验 |

## 本项目表达边界

本项目没有复制上游正文、源码或图片。README 和网页中的能力分类、流程图、场景映射与采用建议，是依据上述公开来源形成的研究性重组；建议项不代表上游已经实现对应的产品能力。
