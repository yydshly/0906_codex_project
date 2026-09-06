# 003 · FreePEP 教材下载器

> 收录人教社 780 条教材目录，覆盖普通教育与特殊教育，支持按需筛选、批量下载为 PDF。简要记录，暂不深入研究。

[返回总索引](../../README.md) · [记录依据](notes.md) · [上游仓库](https://github.com/siknet/FreePEP)

## 一图了解

![FreePEP 教材资源范围图：7 类教材共 780 条目录，列出 28 个学科与栏目、年级册次范围，并说明筛选和 PDF 下载能力](../../docs/assets/projects/003-freepep/architecture.png)

先看有哪些教材，再看覆盖的学科与年级：**按学段、学科、年级筛选，批量下载并保存为 PDF。** 图中数量来自查阅版本的目录缓存，不代表全部资源当前可下载；教材内容在下载时从官网获取。此图为原创资料范围说明图，非产品截图。[查看可缩放矢量图](../../docs/assets/projects/003-freepep/architecture.svg)。

## 项目档案

| 项目 | 内容 |
| --- | --- |
| 上游仓库 | https://github.com/siknet/FreePEP |
| 查阅版本 | v1.1；`f5171503d038063304b1bb2db783cf68ccf43c15`（2026-09-04） |
| 记录日期 | 2026-09-06 |
| 状态 | 已归档：完成简要记录 |
| 验证范围 | 阅读源码、统计仓库内目录；未运行下载、未验证成功率 |
| 上游许可证 | LICENSE 为 MIT；README 另有禁止商业用途声明，表述存在冲突；教材授权需单独确认 |
| 介绍形式 | 一张教材资源范围图；无运行截图或交互演示 |

## 收录范围与获取方式

| 教材类别 | 目录条数 |
| --- | ---: |
| 义务教育（六三学制） | 214 |
| 义务教育（五四学制） | 53 |
| 高中 | 107 |
| 聋校 | 109 |
| 盲校（低视力版） | 132 |
| 盲校（盲文版） | 105 |
| 培智学校 | 60 |
| 合计 | 780 |

- **学科与栏目：** 共 28 项，完整名称见上图；涵盖语数外、科学、史地政、技术、体育艺术及特殊教育相关内容。不同学段、类别的学科覆盖不同。
- **年级与册次：** 一至九年级、高中必修与选择性必修，另有跨年级及专项教材。
- **获取方式：** 通过本地 Web 界面或命令行选择教材，支持批量下载、PDF 合成及分类保存。
- **范围说明：** 目录含 780 个不同教材 ID，均标记面向学生。3 条教材记录另附配套资源链接，不计作额外教材，也未验证配套资源下载能力。
- **功能边界：** 搜索针对书名与分类等目录信息，未实现 OCR、正文搜索、知识点整理或 AI 问答。

## 使用价值与局限

适用于有相应使用授权的教材获取与本地归档，也可参考其浏览器自动化和文件处理流程。对当前项目研究库而言，保留用途与实现摘要即可；将来确有教材采集需求时再评估运行与改造。

源码查阅发现：Web 下载路径使用 `re.sub()` 却未导入 `re`；部分页面失败后仍可能合成不完整 PDF；已有 PDF 的跳过判断主要依赖文件大小。目录解析和页面采集依赖上游网站结构。上述判断来自源码，未做运行复现。

若以后重新研究，优先验证可用性和页数完整性。OCR、全文检索、带页码的问答属于可选后续开发，并非当前能力。

## 运行方式备查

以下为上游提供的源码启动方式，本次未执行。需 Python 环境及 Chromium，依赖版本范围见上游 `requirements.txt`。

```sh
pip install -r requirements.txt
playwright install chromium
python webui.py
# 或使用命令行入口
python cli.py
```

Web 默认地址为 `http://127.0.0.1:8000`，默认输出到上游程序目录的 `downloads/`。该功能需要 Python 后端，不能仅靠本仓库的静态 `docs/` 运行。

## 来源

- [核心目录与下载实现](https://github.com/siknet/FreePEP/blob/f5171503d038063304b1bb2db783cf68ccf43c15/pep_core.py)
- [Web 界面与后台队列](https://github.com/siknet/FreePEP/blob/f5171503d038063304b1bb2db783cf68ccf43c15/webui.py)
- [批量脚本](https://github.com/siknet/FreePEP/blob/f5171503d038063304b1bb2db783cf68ccf43c15/download_all.py) · [教材目录](https://github.com/siknet/FreePEP/blob/f5171503d038063304b1bb2db783cf68ccf43c15/pep_catalog.json)
- [上游说明](https://github.com/siknet/FreePEP/blob/f5171503d038063304b1bb2db783cf68ccf43c15/README.md) · [LICENSE](https://github.com/siknet/FreePEP/blob/f5171503d038063304b1bb2db783cf68ccf43c15/LICENSE)
