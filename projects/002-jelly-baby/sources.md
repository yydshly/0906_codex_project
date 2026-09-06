# 002 · Jelly-Baby · 源码证据索引

[返回研究文档](README.md) · [研究记录](notes.md)

本页链接固定到 `df52c92a8459286bb287f0849764929e73b4f8ce`，避免上游 `main` 更新后改变分析依据。访问与核对日期：2026-09-06。源码表明存在实现，不代表本地已运行通过。

## S1 项目说明与配置

- [README.md](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/README.md)：操作方式、作者描述的取舍与限制；其中光学及步进描述存在滞后，见本项目差异表。
- [package.json](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/package.json)：`private: true`、Vite、TypeScript、Three.js 0.185 系列与运行/检查脚本。这里声明的是依赖范围，实际安装版本以锁文件为准。
- [固定提交](https://github.com/scottstts/Jelly-Baby/commit/df52c92a8459286bb287f0849764929e73b4f8ce)：焦散从 CPU 转向 GPU 光源空间近似的变更。

## S2 物理系统

- [soft-body.js](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/physics/soft-body.js)：`SoftBody`、`solveElastic`、`solveBarrier`、`solveGrab`、`solveContacts`、`preserveOrientation`、`stepJS`、`updateSurface`；弹性、接触、抓取、方向修复与休眠。
- [constants.js](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/physics/constants.js)：密度、shear、bulk、阻尼、重力、`1/240` 步长、三轮迭代、摩擦和抓取力上限。
- [soft-body-kernel.js](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/physics/soft-body-kernel.js)：WASM 加速入口，调用位置可由 `soft-body.js` 追踪；尚未完成二进制与 JavaScript 路径的完整等价性审查。

## S3 运动与运行循环

- [locomotion.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/game/locomotion.ts)：`Locomotion.step`；节点驱动力、姿态恢复、交替步态、抓取时释放驱动以及跳跃冲量。
- [fixed-step.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/game/fixed-step.ts)：`FixedStepper.advance`；最多接纳 50 ms，最多补算十二步。
- [runtime.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/game/runtime.ts)：`startGame` 和渲染循环；物理、表皮、GPU 焦散、异步光学和合成的调用顺序。

## S4 材质与光学

- [baby.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/graphics/baby.ts)：`MeshPhysicalNodeMaterial`、`opticalThickness`、面部表面绑定和绘制顺序。
- [refractive-light.js](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/graphics/refractive-light.js)：`SurfaceBVH`、`updateViewThickness`、`OpticalShadowField`、`RefractiveLightField`；GPU 前后深度、折射、聚光、吸收、模糊与渲染目标。
- [transport.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/graphics/transport.ts)：`OpticalTransport`；一个未完成请求、30 Hz 请求上限、厚度插值和相机变化时复用形状结果。
- [transport.worker.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/graphics/transport.worker.ts)：代理表面变形、BVH 更新、阴影及厚度两阶段返回；当前不输出焦散。

## S5 模型与绑定

- [jelly-baby.json](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/assets/model/jelly-baby.json)：二进制布局、源哈希及绑定数组。物理节点数 `2940 / 3 = 980`，四面体数 `16104 / 4 = 4026`；可见顶点数 `216702 / 3 = 72234`，三角形数 `433392 / 3 = 144464`；光学代理顶点数 `30270 / 3 = 10090`，三角形数 `60528 / 3 = 20176`。
- [deform-surface.js](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/physics/deform-surface.js)：表皮位置与法线更新的进一步阅读入口；本轮主要通过调用点和验证脚本交叉核对其作用。

## S6 验证脚本

- [verify-performance.mjs](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/scripts/verify-performance.mjs)：固定步进次数、完整表皮位置/法线对照、代理阴影覆盖及厚度误差、GPU 焦散调用结构、Worker 数据转移与复用。该脚本包含无需打开浏览器的结构和数值检查，不能视为 GPU 执行验证。
- [verify-physics.mjs](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/scripts/verify-physics.mjs)：后续物理回归检查入口，本轮未执行。
- [benchmark.mjs](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/scripts/benchmark.mjs)：后续 CPU 基准入口，本轮未执行，不提供帧率结论。

## S7 运行环境

- [renderer.ts](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/src/graphics/renderer.ts)：安全上下文与 `navigator.gpu` 检查，禁用 WebGL 后备渲染，设备故障处理，分辨率和像素比控制。
- [package-lock.json](https://github.com/scottstts/Jelly-Baby/blob/df52c92a8459286bb287f0849764929e73b4f8ce/package-lock.json)：后续固定依赖复现及 Node.js 兼容范围核对入口；本轮未安装依赖。

## 事实与分析的分界

使用场景的适合程度、扩展优先级、组件化建议和“软体与光学实验台”的定位，均是本研究的分析判断，不是上游的功能承诺。授权检查结论仅描述本次仓库/API 快照，不能据此推断代码和素材已经允许任意复用。
