# 运行、验证与部署

## 查看本仓库研究站

独立静态页面，不需要模型凭据、数据库或 Multica 后端。在本研究仓库根目录运行：

```sh
python -m http.server 8000 --directory docs
```

访问 http://localhost:8000/demos/004-multica/。页面使用相对资源路径，适配 Pages 仓库子路径。

```sh
npm run sync
npm run check
node projects/004-multica/tests/simulation.test.mjs
```

Windows 如 npm.ps1 丢失双短横线参数，可用 npm.cmd 执行相同命令。

## 教学模型

选择机器名额及目录模式。负责人先执行计划 Run，然后分派 A / B / C 三项独立工作。各项结束释放名额，反馈触发或合并负责人的检查 Run。全部工作完成并检查后进入 in_review，仍需点击人工验收才能 done。

Direct 教学模式把所有 Run 视为同一个工作目录，串行运行；worktree 模式每个 Run 使用独立目录。时间单位是“步”，不是实测秒数。

该演示不运行多进程或模型，不复刻网络恢复、权限、配额、全部路由规则和上游状态。运行时长、任务内容及反馈是确定性的教学数据。

## 上游 Multica（本轮未实跑）

先阅读固定版本 [SELF_HOSTING.md](https://github.com/multica-ai/multica/blob/7a438bd5b8bf39afd54259a7eb0971390e50a8ef/SELF_HOSTING.md) 与 [Runtime 文档](https://multica.ai/docs/daemon-runtimes)。

1. 选择官方托管服务，或按官方指南准备自托管平台与依赖。
2. 在执行机安装并登录支持的 Agent CLI。
3. 安装并连接 Multica CLI，或由桌面程序管理本机 Daemon。
4. 按环境指引运行 multica daemon start，确认 Runtime 在线。
5. 创建 Agent，绑定 Runtime、模型与职责；创建小队并指定负责人。
6. 以小任务验证日志、目录变更、成果与停止操作，再扩大使用。

这是官方路径摘要，不是已经执行成功的安装记录。运行完整产品与查看研究网页是两件事。

## Pages 部署

发布源：main 分支 /docs。

- [研究站](https://yydshly.github.io/0906_codex_project/demos/004-multica/)
- [全库索引](https://yydshly.github.io/0906_codex_project/)

## 验证记录

2026-09-06 本地检查：

- 目录登记、编号、封面与生成首页通过 npm run check。
- 教学模型通过 1 / 2 / 3 个名额与 worktree / Direct 的六组组合；检查名额不超发、同目录串行、A 结束后 C 可在 B 结束前开始，以及人工审阅边界。
- Playwright 检查五个架构视角、完整派工至人工验收、Direct 模式和重置操作。
- 1440 / 768 / 390 / 320 宽度无横向溢出；无脚本错误和本地资源加载错误。
- 实际浏览器首屏截图：[桌面](../../docs/assets/projects/004-multica/web-desktop.png)、[手机](../../docs/assets/projects/004-multica/web-mobile.png)。截图展示本研究站，不是 Multica 产品。

浏览器检查脚本为 tests/browser.test.cjs，需要已安装 Playwright 与 Chromium；设置 NODE_PATH 指向依赖目录后运行。SITE_URL 可覆盖站点根 URL；SCREENSHOT_DIR 可选择保存真实截图的目录。

2026-09-06 远端验证：

- GitHub Pages 已从 main /docs 成功发布；[首次部署记录](https://github.com/yydshly/0906_codex_project/actions/runs/34020455617)。
- 研究页与索引返回 HTTP 200；线上 Playwright 重跑架构切换、派工、人工验收、Direct 模式和四种宽度检查，全部通过。
- 本地 44 个文档 / 网页相对链接及锚点检查通过。
- 目录校验与教学状态机检查纳入 GitHub Actions；浏览器检查使用独立脚本。

后续发布仍需检查对应提交的 Pages 构建和线上资源；本记录只描述上述核对时点。
