# ToD-AI 设计交付索引

当前基线：2026-10-22，V1.4，40个通用React组件与10组动效演示。产品名保持ToD-AI；先复用组件、先改并验证设计稿，再按任务授权迁移App。

| 内容 | 权威入口 / 状态 |
| --- | --- |
| 产品设计规范 | [DESIGN_SYSTEM.md](../docs/DESIGN_SYSTEM.md)，当前基线 |
| 组件API、状态和动效 | [组件README](../components/README.md)、[常用组件](../components/COMMON_COMPONENTS.md) |
| 字体、数字与文案 | [TYPOGRAPHY.md](../components/TYPOGRAPHY.md) |
| 动效实验室与采用边界 | [MOTION.md](../components/MOTION.md)，新配方先在展台评审 |
| 启动动画 · 三角构架归位 | [STARTUP.md](../components/STARTUP.md)，`/#startup`可播放、重播、慢放与异常场景预览；尚未迁移App |
| 通用组件展台 | [展台index.html](../index.html)，由Vite运行真实React组件 |
| 页面样稿 | [refactor/review.html](./refactor/review.html)，合成数据，已同步工具栏/选择器及顶部空间调整 |
| 品牌定稿 | [第三版三角构架](./brand/GEOMETRIC-V3.md)，[SVG母版](../components/assets/logo.svg)是唯一几何源 |
| 系统对照与剩余缺口 | [DESIGN_SYSTEM_AUDIT.md](../docs/DESIGN_SYSTEM_AUDIT.md) |

## 预览与验证

在`design-kit/`根使用Node24运行`npm ci`、`npm run dev`，访问服务输出的地址：

- `/#motion`：播放、重播、复位，原速/4倍慢放，逐例减少动态；浮层可按Escape关闭。
- `/#typography`：字体与文字。
- `/#data`：数据、表单和通用交互。
- `/design/refactor/review.html`：登录、凭证同步和今日用量页面样稿。

套件`npm run check`覆盖组件/展台测试、类型检查与展台构建；父项目`npm run check`同时运行App测试、脚本测试和正式产物排除检查。独立组件展台已另行构建；Chrome验证窄窗、200%缩放、关键交互、焦点与动效中间帧。完整证据边界见[组件README](../components/README.md)与[MOTION.md](../components/MOTION.md)。

## 历史稿与未接入范围

- `refactor/tod-ai-design-system-v1.pdf`是V1.0历史稿，不能覆盖当前Markdown规范。
- `brand/`内三张概念PNG及前两轮说明保留用于溯源；最终形状由第三版SVG定义。
- 旧`design/index.html`等早期业务原型不是当前重构基线，不恢复手动订阅输入、运行日志主界面或独立同步开关。
- 正式App业务页、原生安装/托盘图标及完整深色主题尚未迁移。浏览器合成演示不代替真实IPC、实体输入法、屏幕阅读器或macOS/Windows验收。
- 新的方向展开、加载衔接和结果淡入只在动效实验室生效；没有发布或更改生产服务。
