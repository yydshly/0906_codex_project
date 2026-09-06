# 新增和维护研究项目

## 1. 建立研究条目

```sh
npm run project:new -- --slug project-name --name "项目名称" --repo https://github.com/owner/repository
```

`slug` 使用小写英文字母、数字和短横线。自动建立 `projects/001-project-name/` 和 `docs/assets/projects/001-project-name/`，并登记至 `projects.json`。没有真实项目时索引保持为空。

## 2. 补充研究内容

在子项目 README 填写：项目价值、上游来源、研究版本、运行方式、关键设计、实验结果和后续计划。过程记录写入 `notes.md`，实验代码按需要放入该项目目录。

截图统一存放在 `docs/assets/projects/<编号-短名>/`，建议使用清晰的 PNG 或 WebP，并在文档中说明截图的功能与结论。子项目 README 使用 `../../docs/assets/projects/<编号-短名>/文件名` 引用图片。

## 3. 更新登记表

以下仅是字段示例，不会占用正式项目编号：

```json
{
  "id": "001",
  "slug": "project-name",
  "order": 10,
  "name": "项目名称",
  "summary": "用一句话说明项目价值与研究重点",
  "repository": "https://github.com/owner/repository",
  "status": "待研究",
  "tags": ["AI", "Web"],
  "cover": "docs/assets/projects/001-project-name/cover.png",
  "coverAlt": "工作台截图：展示任务列表和执行结果",
  "demo": "demos/001-project-name/"
}
```

| 字段 | 约定 |
| --- | --- |
| `id` | 从 `001` 起分配的固定编号，不重用、不随排序修改 |
| `slug` | 创建时确定的英文短名，尽量保持稳定 |
| `order` | 正整数，按升序展示；默认间隔 10，方便插入排序 |
| `status` | `待研究`、`研究中`、`已完成`、`已归档` |
| `summary` | 首页展示的一句话摘要 |
| `tags` | 技术或主题标签数组 |
| `cover` | 仓库内真实图片路径；未准备时留空字符串 |
| `coverAlt` | 图片内容说明；配置封面时必填 |
| `demo` | 相对 `docs/` 的演示目录，或完整 HTTPS 外部地址；未部署时留空 |

保留已归档条目，以防编号被再次分配。更换展示顺序只修改 `order`，相同 `order` 按编号升序排列。

## 4. 同步与提交

```sh
npm run sync
npm run check
git add .
git commit -m "docs: add research project"
git push
```

同步会更新根 README 中的索引、图片速览和 Web 入口。校验会检查编号与目录、字段、图片和本地演示入口是否存在，以及生成内容是否过期。远程 URL 的在线状态需在发布演示时实际验证。
