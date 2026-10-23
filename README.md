<p align="center">
  <img src="components/assets/logo.svg" width="96" height="96" alt="Rhine Design 三角构架标志" />
</p>

<h1 align="center">莱茵设计 · Rhine Design</h1>

<p align="center">暖白与苔绿，三角与细线。让界面拥有清晰的秩序与克制的节奏。</p>

<p align="center">
  <a href="https://linhay.github.io/rhine-design/">在线预览</a> ·
  <a href="#quick-start">快速接入</a> ·
  <a href="#components">组件</a> ·
  <a href="#documentation">设计规范</a> ·
  <a href="#ai-skills">AI Skills</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a> ·
  <a href="CHANGELOG.md">版本记录</a>
</p>

Rhine Design 是面向 React 应用的开源设计系统，适合桌面工具、管理界面和数据密集型应用。它将设计规范、48 个组件和动效示例放在一起，帮助团队建立一致、可复用的界面语言。

- **一致的视觉语言**：色彩、字体、文字层级、间距、几何与焦点规则。
- **48 个可组合组件**：覆盖布局、表单、数据、导航、浮层和反馈。
- **可验证的动效**：12 组播放 / 重播 / 复位演示，以及三角构架启动编排。
- **面向开发协作**：组件契约、交互展台和 AI skill 帮助设计与实现保持一致。

**main 新增能力：**六个导航/表单流程组件及场景规范尚未发布到 npm 0.3.0；在线展台跟随 main，安装前请核对[版本记录](CHANGELOG.md)。新增组件及选型见[交互规范](docs/INTERACTION_PATTERNS.md)，参考项目见[GitHub 调研](docs/REFERENCE_RESEARCH.md)。

基于 React 与 Radix UI，采用 [Apache-2.0](LICENSE) 许可证。

<a id="quick-start"></a>

## 快速接入

需要 **React 19**。当前已验证的构建环境为 **Vite**，开发建议使用 **Node 24**。

在你的 React 项目中安装：

```sh
npm install @linhey/rhine-design@0.3.0
```

包与版本信息见 [npm](https://www.npmjs.com/package/@linhey/rhine-design)。如需使用未发版的源码，可安装 `git+https://github.com/linhay/rhine-design.git#<commit>`；建议固定版本并提交 lockfile。

```tsx
import { Button, Inline, Stack, Surface, Text } from '@linhey/rhine-design';

export function Welcome() {
  return (
    <div className="rhine-theme">
      <Surface>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text as="h1" variant="title">开始新的工作</Text>
            <Text tone="muted">用统一的组件，构建属于你的工作空间。</Text>
          </Stack>
          <Inline gap={2}>
            <Button onClick={() => { /* 在这里处理点击 */ }}>继续</Button>
          </Inline>
        </Stack>
      </Surface>
    </div>
  );
}
```

入口自动加载样式，用 `.rhine-theme` 包裹页面即可使用默认主题。布局和颜色变量使用 `--rhine-*` 前缀；完整定义见 [tokens.css](components/tokens.css)。

### 可选主题（main，尚未发布 npm）

展台右上角可切换并记忆主题。新增 **橙趣 · 粗描边**：浅灰蓝点阵背景、米白圆角卡片、黑色粗边、向右下偏移的硬阴影与亮橙主按钮。打开 [在线订阅管理示例](https://linhay.github.io/rhine-design/?theme=neo-brutalism#subscriptions)，体验卡片详情、管理菜单与演示表单；本地开发访问 `http://127.0.0.1:18309/?theme=neo-brutalism#subscriptions`。

从包含此主题的源码版本接入，在组件样式之后导入主题，并在页面根部设置属性：

```tsx
import { Button, Surface } from '@linhey/rhine-design';
import '@linhey/rhine-design/theme-neo-brutalism.css';

<div className="rhine-theme" data-rhine-theme="neo-brutalism">
  <Surface><Button>主要操作</Button></Surface>
</div>
```

完整变量、类型标签、交互与减少动态规则见 [橙趣主题规范](docs/THEME_NEO_BRUTALISM.md)。现有暖白主题与 `theme-arknights.css` 战术终端主题仍可独立使用。

类名、CSS 变量、动画名称与动态设置统一使用 `rhine-` 命名空间。升级到 0.3.0 时请同步迁移主题根、自定义样式与动效属性，具体见 [迁移说明](CHANGELOG.md#030)。

### 兼容范围

- 包导出 TS/TSX、CSS 和 SVG 源码，构建器需支持 CSS 导入与 Vite 的 SVG `?no-inline` 引用；目前未验证其他构建器和 SSR。
- 浮层挂载到最近的 `.rhine-theme`。请将主题根放在页面根部，避免对它使用 `transform`、裁剪或 `contain`。
- 组件提供呈现与交互，应用负责数据请求、搜索、分页和操作结果。
- 默认使用暖白主题；main 还提供可选的战术终端与橙趣主题。Logo 的深浅配色独立于界面主题。

<a id="components"></a>

## 组件

| 类别 | 组件 |
| --- | --- |
| 品牌与文字 | Logo · Text |
| 操作 | Button · Icon · IconButton · Link · CopyButton |
| 布局 | Surface · Toolbar · Divider · Stack · Inline · Grid |
| 表单与选择 | TextField · Fieldset¹ · ErrorSummary¹ · Textarea · Select · Checkbox · RadioGroup · Switch · SearchField · Combobox · SelectionCard |
| 导航与展开 | SideNav¹ · Breadcrumbs¹ · Steps¹ · Tabs · SegmentedControl · Disclosure |
| 数据 | Metric · KeyValue · DataTable · Pagination · StatusTimeline¹ · TimelineLegend¹ |
| 浮层 | Drawer¹ · Dialog · ConfirmDialog · Popover · Menu · Tooltip |
| 状态与反馈 | Badge · Notice · Toast · Progress · Skeleton · EmptyState |

¹ main 新增，尚未包含在 npm 0.3.0。

参数、状态和组合示例见[组件 API](components/README.md)与[常用组件契约](components/COMMON_COMPONENTS.md)。

<a id="documentation"></a>

## 设计规范与展台

无需安装即可打开 **[在线组件展台](https://linhay.github.io/rhine-design/)**，体验组件与动效。

| 主题 | 文档 | 在线预览 |
| --- | --- | --- |
| 视觉基础与组合原则 | [设计规范](docs/DESIGN_SYSTEM.md) | [视觉基础](https://linhay.github.io/rhine-design/#foundation) |
| 间距、分组与卡片组合 | [Spacing](components/SPACING.md) | [间距与组合](https://linhay.github.io/rhine-design/#spacing) |
| 字体、文字层级与数值 | [Typography](components/TYPOGRAPHY.md) | [字体与文字](https://linhay.github.io/rhine-design/#typography) |
| 品牌几何与 Logo | [Logo 契约](components/README.md#品牌标志) | [品牌标志](https://linhay.github.io/rhine-design/#brand) |
| 动效、交互与减少动态 | [Motion](components/MOTION.md) | [动效实验室](https://linhay.github.io/rhine-design/#motion) |
| 启动动画与就绪衔接 | [Startup](components/STARTUP.md) | [启动动画](https://linhay.github.io/rhine-design/#startup) |
| 场景与交互选型 | [使用规范](docs/INTERACTION_PATTERNS.md) | [场景指南](https://linhay.github.io/rhine-design/#patterns) |
| 导航与表单流程 | [组件契约](docs/INTERACTION_PATTERNS.md#新组件契约) | [导航](https://linhay.github.io/rhine-design/#navigation) · [表单](https://linhay.github.io/rhine-design/#form-workflow) |
| 系统覆盖与演进方向 | [组件系统对照](docs/DESIGN_SYSTEM_AUDIT.md) | — |

展台采用左侧分组目录、右侧单章节工作区；目录与内容独立滚动，当前章节高亮，原有锚点可直接分享并支持浏览器前进/后退。窄屏使用可展开目录，选择章节后自动收起。动效偏好跨章节保留。

展台包含组件状态、键盘操作、长文本、加载与错误示例。动效可播放、重播、复位和慢放，并支持减少动态模式。离开章节会卸载其演示，返回后重新开始。在线版本跟随 `main` 更新；如需本地运行：

```sh
git clone https://github.com/linhay/rhine-design.git
cd rhine-design
npm ci
npm run dev
```

打开 `http://127.0.0.1:18309/`，使用相同的 `#foundation`、`#motion` 等锚点访问对应章节。

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
