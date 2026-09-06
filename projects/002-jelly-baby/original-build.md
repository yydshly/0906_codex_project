# 002 · Jelly-Baby · 原版构建与来源

[返回研究文档](README.md) · [文件校验清单](build-manifest.json)

## 构建对象

- 来源：[scottstts/Jelly-Baby](https://github.com/scottstts/Jelly-Baby)。
- Commit：`df52c92a8459286bb287f0849764929e73b4f8ce`。
- 日期：2026-09-06。
- 环境：Windows，Node.js 22.15.0，npm 10.9.2。
- 运行源码变更：无。仅通过 Vite 的 `--base ./` 使资源适配研究子目录。
- 保留范围：编译后的 HTML、CSS、JavaScript、Worker、模型二进制、EXR、木纹贴图、图标及依赖许可证；不导入参考实验、Git 历史或依赖安装目录。
- 运行目录：`docs/demos/002-jelly-baby/original/`；清单内 13 个文件约 33.26 MB，清单之后补充的 NOTICE 不属于编译产物。

原本尝试通过 iframe 嵌入作者在线应用，但在浏览器检查中出现环境贴图请求失败。最终使用固定版本的同源构建，避免原版运行依赖外部部署状态。

## 复现构建

在仓库外的临时目录准备上游固定提交。可克隆后检出，或按 GitHub 文件树下载 `src/`、`public/favicon.svg`、`index.html`、`package.json`、`package-lock.json`、`tsconfig.json`。

```sh
git clone https://github.com/scottstts/Jelly-Baby.git
cd Jelly-Baby
git checkout --detach df52c92a8459286bb287f0849764929e73b4f8ce
npm ci
npm run build -- --base ./
```

本次使用选择性下载，在仓库外缓存完成构建。将 `dist/` 的内容复制到对应 `original/` 目录，并保留依赖许可证。维护时对照 [build-manifest.json](build-manifest.json) 更新文件大小、版本、构建命令和 SHA-256；不要混用不同版本产物。

通过本项目静态服务器打开 [原版独立页面](http://127.0.0.1:8765/demos/002-jelly-baby/original/)。不建议直接以 file 协议打开原版，因为它需要安全上下文、模块、Worker 和资源加载。

## 实际验证

- `npm ci` 成功。
- `npm run build -- --base ./` 成功，包含 TypeScript 检查。Vite 提示有大于 500 kB 的 JS 分块；这不是构建失败。
- 本地同源 iframe 显示真实三维果冻、木纹桌面与光影，`#loading` 进入隐藏状态。
- 已操作重置和拖拽，保存实际浏览器截图；不宣称完整物理回归或性能测试通过。
- 尚未运行上游 `lint`、`test:physics`、`test:performance` 和 `benchmark`，未做真机兼容性或音质评价。

## 许可与发布状态

本次检查没有确认到 Jelly-Baby 的明确统一许可证。保留来源和依赖许可并不意味着整个项目及素材已获得某种统一开源授权。当前文件作为研究复现快照随仓库提交；上游代码及素材的授权范围仍待核实，不能将本仓库的提交记录视为权利人授权。

`three-LICENSE.txt` 和 `delaunator-LICENSE.txt` 仅说明对应依赖的许可，不能代替 Jelly-Baby 自身及素材的授权。
