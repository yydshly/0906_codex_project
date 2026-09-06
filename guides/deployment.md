# Web 展示与部署

## 多个 Web 的组织方式

本仓库为多个静态演示预留统一入口：

```text
docs/
  index.html                    展示首页，由登记表生成
  assets/projects/001-name/      封面和截图
  demos/001-name/index.html      第一个演示
  demos/002-name/index.html      第二个演示
```

同一个仓库使用一个 GitHub Pages 站点，不同演示通过子路径访问。预计地址（启用 Pages 后才生效）：

- 首页：`https://yydshly.github.io/0906_codex_project/`
- 项目演示：`https://yydshly.github.io/0906_codex_project/demos/001-name/`

在 `projects.json` 中把对应 `demo` 设置为 `demos/001-name/`，并确保该目录有可访问的 `index.html`。未完成演示时保留空值。

## 启用 GitHub Pages

初始化仅准备站点文件。需要发布时，在仓库 **Settings → Pages → Build and deployment** 中选择：

1. Source：**Deploy from a branch**。
2. Branch：**main**；目录：**/docs**。
3. 保存并等待 GitHub Pages 部署完成。

之后推送 `docs/` 中的变更即可更新站点。仓库中的 `.nojekyll` 让现有静态文件直接发布。

## 接入子项目

普通 HTML/CSS/JS 可直接放入独立演示目录。React、Vue 等项目先构建，再把静态产物放入对应的 `docs/demos/<编号-短名>/`；源码与构建说明保留在 `projects/<编号-短名>/`。

子项目资源路径需要适配 `/0906_codex_project/demos/<编号-短名>/`。优先使用相对资源路径；使用前端路由时选择 hash 路由，或自行处理 Pages 对深层路径刷新返回 404 的情况。

GitHub Pages 只提供静态托管。需要后端、数据库或服务端渲染的项目部署到其他服务，在登记表的 `demo` 填写 HTTPS 地址即可。

## 本地查看

可直接在浏览器打开 `docs/index.html` 检查首页。联调演示时，可在仓库根目录运行：

```sh
python -m http.server 8000 --directory docs
```

访问 `http://localhost:8000/`。发布前运行 `npm run check`，并在实际站点检查各演示链接与资源。

参考：[GitHub Pages 介绍](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
