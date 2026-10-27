# 参与 Rhine Design

欢迎通过 Issue 或 Pull Request 改进组件、设计规范、文档和示例。

## 本地开发

使用 Node 24 与 npm：

```sh
git clone https://github.com/linhay/rhine-design.git
cd rhine-design
npm ci
npm run dev
```

展台地址为 `http://127.0.0.1:18309/`。`components/` 是组件源码与契约，`preview/` 使用同一组件演示交互，`tests/` 验证组件行为，`skills/rhine-design/` 提供 AI 助手的检索入口。

## 修改组件

优先组合已有组件和 tokens。新增能力时，同步更新组件契约与展台示例，展示相关的默认、禁用、加载、错误和长文本状态。使用语义化 HTML，保证键盘操作和焦点行为，并提供减少动态效果。

运行检查：

```sh
npm run check
```

它包含测试、类型检查、展台构建和 CSS/SVG 产物检查。视觉变化还需检查 400/520/880 宽度、200% 缩放和相关交互。纯文档修改检查链接与示例即可。

`dist/` 是展台构建结果；包导出源码。修改打包配置时，请在仓库外安装实际 tarball 验证。不要删除入口和 CSS 的 `sideEffects`；Logo 依赖 SVG `?no-inline`。本地链接消费项目时，Vite 使用 `resolve.dedupe: ['react', 'react-dom']` 避免重复 React。

## 文档与 AI skill

README 面向首次接触项目的开发者，优先解释用途、安装、示例、兼容性和文档入口。维护者操作放在专门文档中。

组件 API 变更时，更新契约、示例以及 skill 的 `references/API_MAP.md` 或 `TASK_MAP.md`。索引指向真实源码，不复制第二份 API 定义；skill 的版本信息随包版本更新。

展台包版本由 `preview/packageInfo.ts` 从 `package.json` 读取；组件数量只统计 `components/index.ts` 的公开组件，不计类型与独立主题入口。新增导出时同步该数量、README 完整清单与组件入口。发布后的源码新增能力写入 CHANGELOG 的“未发布”部分，并在相关契约标明旧包不包含；不要因为源码仍使用同一版本字段，就将新能力归入已发布版本。历史版本介绍与验收记录保留原时点。

## 提交 Pull Request

说明解决的问题、变更后的行为，以及已执行的验证。涉及视觉或动效时附上截图或录屏；涉及破坏性 API 变更时提供迁移说明并更新 [CHANGELOG](CHANGELOG.md)。

问题反馈请提供包版本、组件名、预期与实际行为、最小复现。删除复现中的私人数据和凭据。

维护者发布步骤见 [RELEASING](docs/RELEASING.md)。项目采用 [Apache-2.0](LICENSE) 许可证。

## 在线展台

[GitHub Pages](https://linhay.github.io/rhine-design/) 展示 `main` 的组件与演示。现有 CI 先执行 `npm run check`，成功后只上传 `dist/` 并部署；Pull Request 运行检查，不发布站点。工作流也支持在 `main` 手动重跑。

Vite 使用相对资源路径，兼容 `/rhine-design/` 子路径。调整构建或静态资源时，检查在线页面、CSS、JS 和 Logo SVG 均能正常加载，以及 `#motion`、`#startup` 直接访问和重播。
