<p align="center"><img src="docs/assets/banner.svg" alt="GitHub Research Lab · 发现、拆解、实践、沉淀" width="100%"></p>

# GitHub 优秀项目研究库

记录近期遇到的优秀开源项目：理解设计、复现功能、整理结论，并将值得展示的实践做成 Web 演示。

这里是研究总入口。每个子项目拥有固定编号、独立研究文档和图片；首页只保留摘要、索引和展示入口。

[研究约定与新增指南](CONTRIBUTING.md) · [Web 展示与部署](guides/deployment.md) · [项目登记表](projects.json)

## 有序项目索引

<!-- PROJECT_INDEX:START -->
尚未登记研究项目。第一个真实项目将从 **001** 开始，后续按展示顺序排列。
<!-- PROJECT_INDEX:END -->

## 图片速览

<!-- PROJECT_GALLERY:START -->
项目封面和截图将在完成实际研究后展示；每张图片链接至对应研究文档。
<!-- PROJECT_GALLERY:END -->

## 目录导航

```text
projects.json                 项目元数据与展示顺序
projects/001-project-name/    单个项目的研究文档、实验与代码
docs/index.html              Web 展示总入口
docs/demos/001-project-name/  各项目的静态 Web 演示
docs/assets/projects/        各项目的封面与截图
templates/project/           新研究项目的文档模板
guides/                      维护与部署说明
scripts/catalog.mjs          新建项目、同步索引和校验
```

## 开始第一项研究

需要 Node.js 22 或更新版本，无需安装第三方依赖。

```sh
npm run project:new -- --slug project-name --name "项目名称" --repo https://github.com/owner/repository
```

命令自动分配从 `001` 开始的编号、创建研究目录并更新首页。补充 `projects.json` 中的简介、状态、图片和演示地址后，运行 `npm run sync` 同步展示，再运行 `npm run check` 校验。

编号一经分配保持不变；展示顺序由 `order` 决定。模板不计入正式索引。

## 来源与许可

研究文档记录原仓库、研究版本和原始许可证。引用、截图及复用代码保留来源和版权说明；各上游项目的许可证以原仓库为准。本仓库暂未指定统一开源许可证。
