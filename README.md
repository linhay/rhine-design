<p align="center">
  <img src="components/assets/logo.svg" width="96" height="96" alt="Rhine Design 三角构架标志" />
</p>

<h1 align="center">莱茵设计 · Rhine Design</h1>

<p align="center">暖白与苔绿，三角与细线。让界面拥有清晰的秩序与克制的节奏。</p>

<p align="center">
  <a href="#quick-start">快速接入</a> ·
  <a href="#components">组件</a> ·
  <a href="#documentation">设计规范</a> ·
  <a href="#ai-skills">AI Skills</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a> ·
  <a href="CHANGELOG.md">版本记录</a>
</p>

Rhine Design 是面向 React 应用的开源设计系统，适合桌面工具、管理界面和数据密集型应用。它将设计规范、40 个组件和动效示例放在一起，帮助团队建立一致、可复用的界面语言。

- **一致的视觉语言**：色彩、字体、文字层级、间距、几何与焦点规则。
- **40 个可组合组件**：覆盖布局、表单、数据、导航、浮层和反馈。
- **可验证的动效**：10 组播放 / 重播 / 复位演示，以及三角构架启动编排。
- **面向开发协作**：组件契约、交互展台和 AI skill 帮助设计与实现保持一致。

基于 React 与 Radix UI，采用 [Apache-2.0](LICENSE) 许可证。

<a id="quick-start"></a>

## 快速接入

需要 **React 19**。当前已验证的构建环境为 **Vite**，开发建议使用 **Node 24**。

首次 npm 发布尚未完成，目前可在你的 React 项目中通过公开仓库安装：

```sh
npm install git+https://github.com/linhay/rhine-design.git
```

包的导入名称为 `@linhey/rhine-design`。正式项目建议在 Git URL 后附加 `#<commit>` 固定源码版本，并提交 lockfile。

```tsx
import { Button, Stack, Surface, Text } from '@linhey/rhine-design';

export function Welcome() {
  return (
    <div className="tod-theme">
      <Surface>
        <Stack gap={4}>
          <Text as="h1" variant="title">开始新的工作</Text>
          <Text tone="muted">用统一的组件，构建属于你的工作空间。</Text>
          <Button onClick={() => { /* 在这里处理点击 */ }}>继续</Button>
        </Stack>
      </Surface>
    </div>
  );
}
```

入口自动加载样式，用 `.tod-theme` 包裹页面即可使用默认主题。布局和颜色变量使用 `--tod-*` 前缀；完整定义见 [tokens.css](components/tokens.css)。

### 兼容范围

- 包导出 TS/TSX、CSS 和 SVG 源码，构建器需支持 CSS 导入与 Vite 的 SVG `?no-inline` 引用；目前未验证其他构建器和 SSR。
- 浮层挂载到最近的 `.tod-theme`。请将主题根放在页面根部，避免对它使用 `transform`、裁剪或 `contain`。
- 组件提供呈现与交互，应用负责数据请求、搜索、分页和操作结果。
- 当前提供默认暖白主题；Logo 支持独立的深浅配色，完整组件深色主题尚未提供。

<a id="components"></a>

## 组件

| 类别 | 组件 |
| --- | --- |
| 品牌与文字 | Logo · Text |
| 操作 | Button · Icon · IconButton · Link · CopyButton |
| 布局 | Surface · Toolbar · Divider · Stack · Inline · Grid |
| 表单与选择 | TextField · Textarea · Select · Checkbox · RadioGroup · Switch · SearchField · Combobox · SelectionCard |
| 导航与展开 | Tabs · SegmentedControl · Disclosure |
| 数据 | Metric · KeyValue · DataTable · Pagination |
| 浮层 | Dialog · ConfirmDialog · Popover · Menu · Tooltip |
| 状态与反馈 | Badge · Notice · Toast · Progress · Skeleton · EmptyState |

参数、状态和组合示例见[组件 API](components/README.md)与[常用组件契约](components/COMMON_COMPONENTS.md)。

<a id="documentation"></a>

## 设计规范与展台

| 主题 | 文档 | 本地展台锚点 |
| --- | --- | --- |
| 视觉基础与组合原则 | [设计规范](docs/DESIGN_SYSTEM.md) | `/#foundation` |
| 字体、文字层级与数值 | [Typography](components/TYPOGRAPHY.md) | `/#typography` |
| 品牌几何与 Logo | [Logo 契约](components/README.md#品牌标志) | `/#brand` |
| 动效、交互与减少动态 | [Motion](components/MOTION.md) | `/#motion` |
| 启动动画与就绪衔接 | [Startup](components/STARTUP.md) | `/#startup` |
| 系统覆盖与演进方向 | [组件系统对照](docs/DESIGN_SYSTEM_AUDIT.md) | — |

本地展台包含组件状态、键盘操作、长文本、加载与错误示例。动效可播放、重播、复位和慢放，并支持减少动态模式。

```sh
git clone https://github.com/linhay/rhine-design.git
cd rhine-design
npm ci
npm run dev
```

打开 `http://127.0.0.1:18309/`，使用上表中的锚点访问对应章节。

<a id="ai-skills"></a>

## AI Skills

[`rhine-design` skill](skills/rhine-design/SKILL.md) 帮助 AI 编程助手查找组件 API、遵循字体与动效规范，并优先复用已有组件。它适用于支持 `SKILL.md` 的工具；Codex 可通过 `$rhine-design` 调用。

安装组件包后，在你的项目根目录执行：

```sh
mkdir -p .agents/skills
cp -R node_modules/@linhey/rhine-design/skills/rhine-design .agents/skills/
```

然后向助手提出具体任务，例如：

> 使用 $rhine-design 设计一个设置页面，包含搜索、选项开关和保存反馈；复用现有组件，并提供键盘操作与减少动态效果。

skill 中提供以下参考入口：

| 文件 | 用途 |
| --- | --- |
| [SKILL.md](skills/rhine-design/SKILL.md) | 使用范围、设计先行流程、版本与源码定位 |
| [TASK_MAP.md](skills/rhine-design/references/TASK_MAP.md) | 按字体、表单、数据、浮层、动效等任务选择规范 |
| [API_MAP.md](skills/rhine-design/references/API_MAP.md) | 按组件名定位真实实现和公开入口 |
| [integration.md](skills/rhine-design/references/integration.md) | 主题、构建、数据所有权与迁移注意事项 |

升级组件时请同步更新 skill；如果已做本地定制，先比较差异再合并。其他工具请将同一 skill 目录放入其支持的技能路径。

## 参与贡献

欢迎提交问题、文档改进和组件提案。遇到问题时，请在 [Issues](https://github.com/linhay/rhine-design/issues) 提供组件名、版本、预期行为及最小复现。

开发环境、验证命令和 PR 说明见 [贡献指南](CONTRIBUTING.md)。版本变化和升级说明见 [CHANGELOG](CHANGELOG.md)。

## 许可证

[Apache License 2.0](LICENSE)。版权声明见 [NOTICE](NOTICE)。第三方依赖遵循各自的许可证。
