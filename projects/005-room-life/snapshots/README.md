# 人物形象留档

## V1 · 2026-09-07 优化前

`v1-20260907/` 保存用户提出“保存当前形象，然后开始优化”时的完整源码、测试、依赖锁定文件和原始文档。文件未经修改，SHA-256 记录在 `v1-20260907/manifest.json`。

- 原始人物实现：`v1-20260907/src/character.js`。
- 完整可运行留档：仓库 `docs/demos/005-room-life/versions/v1/`。启动根目录静态服务器后访问 `/demos/005-room-life/versions/v1/`。
- 原始截图：仓库 `docs/assets/projects/005-room-life/v1/`。
- 当前页面的“初版”按钮使用 `src/character-v1.js`，与留档人物源码逐字节一致。它在当前交互环境中展示旧形象；上述完整留档页面则保留原始界面、镜头和行为。

## 恢复方法

恢复整套首版时，将留档中的 `src/`、`tests/`、`package.json`、`package-lock.json` 和 `build.mjs` 复制回本项目对应位置，再运行 `npm ci`、`npm test`、`npm run build`。操作前保存当前源码。只需要观察旧形象时，使用页面内切换按钮即可，不必恢复文件。

原始快照中的文档和构建脚本保留当时的相对路径，因此应在恢复到项目根目录后使用；无需在快照目录内安装依赖。后续构建不覆盖 `versions/v1/`。

## V2 · 衣橱改造前参考

[v2-before-wardrobe/character.js](v2-before-wardrobe/character.js) 保存 O12 开始前的人物源码；[同镜头实机截图](../../../docs/assets/projects/005-room-life/before-wardrobe-v2.jpg) 用于外观对照。这是单个源文件的参考备份，不是独立可运行的整套版本，不应直接覆盖当前人物文件后运行新衣橱界面。完整可运行旧版本仍使用上方 V1 留档。
