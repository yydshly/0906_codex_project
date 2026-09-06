# 003 · FreePEP 教材下载器

> 人教社教材目录检索、逐页采集与 PDF 归档工具。简要记录，暂不深入研究。

[返回总索引](../../README.md) · [记录依据](notes.md) · [上游仓库](https://github.com/siknet/FreePEP)

## 一图了解

![FreePEP 内容与能力导览：获取目录、选择教材、采集页面、合成 PDF；下方说明辅助能力、适用场景和功能边界](../../docs/assets/projects/003-freepep/architecture.png)

从左到右看：**找教材 → 获取逐页图片 → 合成 PDF → 分类保存**。上方是操作入口，下方是辅助能力、使用价值与局限。此图基于源码整理，为原创说明图，非产品截图；本次未运行下载。[查看可缩放矢量图](../../docs/assets/projects/003-freepep/architecture.svg)。

## 项目档案

| 项目 | 内容 |
| --- | --- |
| 上游仓库 | https://github.com/siknet/FreePEP |
| 查阅版本 | v1.1；`f5171503d038063304b1bb2db783cf68ccf43c15`（2026-09-04） |
| 记录日期 | 2026-09-06 |
| 状态 | 已归档：完成简要记录 |
| 验证范围 | 阅读源码、统计仓库内目录；未运行下载、未验证成功率 |
| 上游许可证 | LICENSE 为 MIT；README 另有禁止商业用途声明，表述存在冲突；教材授权需单独确认 |
| 介绍形式 | 一张内容与能力导览图；无运行截图或交互演示 |

## 能力与原理

核心流程：**获取教材目录 → 按条件筛选 → 下载逐页图片 → 合成 PDF → 按学段、年级保存。**

- 缓存目录包含 780 条不同教材 ID；支持按学段、学科、年级和关键词查找教材。
- 提供本地 Web 界面、命令行入口和多本教材并发下载脚本。
- 从官网前端数据解析并解密目录，使用 Playwright 加载阅读器和获取页面图片，使用 Pillow 合成 PDF。
- 缓存目录不等于教材全文资料库；现有搜索针对元数据。未实现 OCR、正文搜索、知识点整理或 AI 问答。

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
