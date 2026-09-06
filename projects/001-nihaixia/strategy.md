# 当前方案、参考架构与复用价值

研究日期：2026-09-06。[返回项目](README.md) · [源码架构追踪与固定版本](architecture.md)

## 1. 当前用的是什么方案

需要区分我们制作的展示、上游 Skill 和关联 App。

| 对象 | 已检查的实现 | 意味着什么 |
| --- | --- | --- |
| 本仓库展示页 | HTML / CSS / JavaScript；搜索能力说明、切换流程和参考方案 | 是交互研究档案，尚未接入资料导入、向量库或模型问答 |
| nihaixia Skill | Markdown 知识模块、案例表、索引、SKILL 检索指引与表达规程 | 宿主按主题和关键词搜索、读取片段，再交给大模型回答；可视为轻量文件检索增强，不依赖自带向量库 |
| 关联 nihaixia-app | 打包的 JSON / Markdown、Repository、Dart 规则引擎、Flutter 界面 | 已追踪的核心问卷调用链用程序处理资料，不经过远程大模型；SQLite 主要保存用户状态 |

来源：[Skill 入口](https://github.com/jangviktor-web/nihaixia/blob/68ce4bf21351a35911d173224c1bc66db3e4e754/SKILL.md)、[App 诊断引擎](https://github.com/jangviktor-web/nihaixia-app/blob/9b8dff9281f3b4a643dac8015885c3a4eacec47a/lib/engine/diagnostic_engine.dart)。仅作源码分析，未验证实际回答或诊疗效果。

资料进入产品的概览：

```text
原始讲义 / 扫描件 / 音视频
        ↓ 外部提取或转写；本库没有完整 OCR / ASR 服务
可读文本
        ↓ 清理、分篇、提炼、字段整理、保留来源
Markdown 模块 / 案例 / 索引 / 方法规程
        ├─ 宿主搜索和读取 → 大模型组织回答
        └─ 转换及人工整理 → App 数据与程序规则 → 查询、问卷界面
```

关联 [tcm-distiller](https://github.com/jangviktor-web/tcm-distiller/tree/a3c105f7b8e72cf996c229d970b6be8512e5a40f) 提供整理规程与辅助脚本；[App 提取脚本](https://github.com/jangviktor-web/nihaixia-app/blob/9b8dff9281f3b4a643dac8015885c3a4eacec47a/scripts/extract_acupoints.py) 展示部分资料复用。部分脚本含固定本机路径或预先整理的数据，不能把上述概览当成已经验证的一键重建流水线。这里的“蒸馏”主要是资料和方法提炼，未发现模型权重或训练实现。

大模型可以直接阅读文本。难点是正确提取内容、保留条件与来源，并在提问时找到适量的相关依据。向量化是帮助检索的表示方式，不是让模型理解资料的唯一前提，也不等于把知识训练进模型。

## 2. 可以参考哪些架构

RAG 指先检索相关资料，再把资料提供给模型生成回答。文档解析、知识整理、检索、回答生成是不同环节，下面的方案可以组合。

| 需求 | 可参考方案 | 主要边界 | 一手参考 |
| --- | --- | --- | --- |
| 扫描件、复杂版面和表格 | 文档解析与 OCR，输出结构化文本 | 抽查原件、表格对应及页码；解析不保证事实正确 | [Docling](https://github.com/docling-project/docling) |
| 少量资料精读 | 全文放入上下文，作为简单基线 | 容量、成本与遗漏；资料增多后重新评估 | [Anthropic 上下文与检索说明](https://www.anthropic.com/engineering/contextual-retrieval) |
| 专业术语和编号查找 | 文件导航、关键词 / BM25 检索 | 同义词与口语表达可能漏检 | [本库检索规则](https://github.com/jangviktor-web/nihaixia/blob/68ce4bf21351a35911d173224c1bc66db3e4e754/SKILL.md) |
| 自然语言资料问答 | 关键词 + 向量混合检索，按需重排序，再生成并引用来源 | 比较同一批问题的召回与回答质量；增加服务与维护成本 | [Azure RAG 完整示例](https://github.com/Azure-Samples/azure-search-openai-demo) |
| 分段丢失条件或主体 | 上下文补充、父章节或层级检索 | 生成的背景仍需核对，避免补错语境 | [Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)、[层级索引设计](https://learn.microsoft.com/en-us/azure/developer/ai/advanced-retrieval-augmented-generation) |
| 精确筛选、统计和字段比较 | 结构化数据 + SQL / 程序计算 | 先清理重复与缺失，定义统计口径 | [结构化查询与专用索引](https://learn.microsoft.com/en-us/azure/developer/ai/advanced-retrieval-augmented-generation) |
| 跨文档实体关系、全库主题归纳 | 知识图谱 / GraphRAG | 抽取、消歧、索引和维护更复杂；先确认关系问题确实需要 | [GraphRAG 查询架构](https://microsoft.github.io/graphrag/query/overview/) |

以上是方案分析，不是本项目的性能排名或已实现能力。Azure 示例依赖其云服务，参考其流程不代表必须使用同一部署平台。

建议先用一份真实资料建立完整实验：保留原件与页码 → 按结构整理 → 关键词检索基线 → 比较混合检索 → 带来源回答。先检查提取准确完整、条件例外保留、依据检索正确、回答忠于依据四个方面，再决定是否增加复杂架构。

## 3. 这个库对我们的价值

它提供了把专家资料组织成可调用知识与方法的研究样本。对我们的项目研究库，可以迁移三种组织方式：知识分层与导航、带条件的分析步骤、同批资料供模型和程序分别使用。

| 上游定义的能力 | 可迁移到我们的工作 |
| --- | --- |
| 经典资料查询 | 将源码解读、文档和术语按主题组织并提供检索入口 |
| 辨证过程讲解 | 记录技术选型和排错的判断顺序、适用条件与例外 |
| 方剂资料整理 | 用统一字段比较配置、组件和版本差异 |
| 医案检索 | 建立有环境、过程、结果与出处的复现及故障案例库 |
| 人物表达模拟 | 区分事实依据和讲解风格，研究不同受众的解释方式 |
| 传统文化问答 | 研究多领域知识的分类与路由，标清不同内容的证据边界 |

这些是迁移建议，不意味着医学分析规程可以直接用于技术判断。上游的回答准确性、来源质量和内容授权仍需分别核实。

本项目已经展示六类能力的实现、场景、示例、边界、来源和借鉴价值，并提供五种资料处理场景的交互选型。尚未完成可复现的资料生产服务、自动引用核验、模型效果评测或真实问答后端。
