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

Rhine Design 是面向 React 应用的开源设计系统，适合桌面工具、管理界面和数据密集型应用。它将设计规范、67 个组件和动效示例放在一起，帮助团队建立一致、可复用的界面语言。

- **一致的视觉语言**：色彩、字体、文字层级、间距、几何与焦点规则。
- **67 个可组合组件**：覆盖布局、表单、数据、导航、浮层和反馈。
- **可验证的动效**：12 组播放 / 重播 / 复位演示，以及三角构架启动编排。
- **面向开发协作**：组件契约、交互展台和 AI skill 帮助设计与实现保持一致。

基于 React 与 Radix UI，采用 [Apache-2.0](LICENSE) 许可证。

## 版本与源码范围

- **发布基线：0.10.0**。2026-10-27 核对 npm registry 的 latest 为 0.10.0；该版本的主入口与当前源码均导出 67 个组件，统计不含类型及独立 `/theme` 入口的 ThemeProvider、hook 和元数据。
- **当前源码包含未发布变更**：摘要页签 `Tabs description/status`、`Toast placement="floating"`、`SegmentedControl size="compact"` 及相邻 Disclosure 分隔线调整。包版本字段仍为 0.10.0，不能用它判断这些能力是否存在。
- **展台随源码更新**，在线部署跟随 main；安装包的能力以精确版本和实际导出/实现为准。上述源码变更、历史版本与接入边界统一见[版本记录](CHANGELOG.md)。

三套主题、轨道艺术、设置导航与主题选择等已有能力见下方组件和规范入口；应用组件的 Ant Design / MUI 对照见[对标清单](docs/ANTD_MUI_AUDIT.md)。

<a id="quick-start"></a>

## 快速接入

需要 **React 19**。当前已验证的构建环境为 **Vite**，开发建议使用 **Node 24**。

在你的 React 项目中安装：

```sh
npm install --save-exact @linhey/rhine-design@0.10.0
```

包与版本信息见 [npm](https://www.npmjs.com/package/@linhey/rhine-design)。如需使用未发版的源码，可安装 `git+https://github.com/linhay/rhine-design.git#<commit>`；建议固定版本并提交 lockfile。

**0.10.0 新增与修复**：紧凑日期、有限多选标签与等宽分段控件；可省略重复说明的筛选抽屉；侧栏双行 `Checkbox layout="row"`；MediaViewer、EmptyState 等组件的字号/行高/字重配对。默认行为保持兼容，完整说明见[版本记录](CHANGELOG.md#01002026-10-26)。

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

### 背景组件（0.5.0）

0.5.0 提供 Background 与 AppShell，npm 0.4.0 不含这两项能力。背景层级、最小接入及兼容范围见[背景与应用外壳契约](docs/APPLICATION_COMPONENTS.md)，真实展台见 [场景背景](https://linhay.github.io/rhine-design/#backgrounds) 和 [背景与侧栏](https://linhay.github.io/rhine-design/#app-shell)。

### 轨道背景（0.6.0）

OrbitBackdrop 承接授权移交的轨道动画，保留环节点、曲线、箭头、光晕与透视，并提供暂停、减少动态和离屏停帧。它是纯装饰，不表示加载或业务进度。契约与接入见[轨道背景](docs/ORBIT_BACKDROP.md)，真实展台见[轨道星空](https://linhay.github.io/rhine-design/#orbit)。

### 中子星背景（0.8.0）

NeutronStarBackdrop 承接另一套独立的中子星艺术，使用按需加载的 Three.js 绘制；内置暂停、减少动态、离屏停帧与静态降级。主题切换不重播，正文与控件不模糊。最小接入、生命周期及版本边界见[中子星契约](docs/NEUTRON_STAR_BACKDROP.md)，源码展台入口为 `/#neutron-star`。不要用轨道组件替换中子星的原视觉配方。

### 一键切换主题（0.4.0）

展台右上角可切换并记忆主题。新增 **橙趣 · 粗描边**：浅灰蓝点阵背景、米白圆角卡片、黑色粗边、向右下偏移的硬阴影与亮橙主按钮。打开 [在线订阅管理示例](https://linhay.github.io/rhine-design/?theme=neo-brutalism#subscriptions)，体验卡片详情、管理菜单与演示表单；本地开发访问 `http://127.0.0.1:18309/?theme=neo-brutalism#subscriptions`。

从 0.4.0 接入，入口自动加载内置主题，页面只需包裹一次：

```tsx
import { Button, Surface } from '@linhey/rhine-design';
import { ThemeProvider, useTheme } from '@linhey/rhine-design/theme';

function Appearance() {
  const { setTheme } = useTheme();
  return <Button onClick={() => setTheme('arknights')}>切换战术主题</Button>;
}

export function App() {
  return <ThemeProvider defaultTheme="neo-brutalism">
    <Surface><Appearance /></Surface>
  </ThemeProvider>;
}
```

受控模式、主题列表、存储职责、浮层继承和迁移方式见 [主题 API 接入](docs/THEMING.md)。第一版支持并列 Provider，不支持嵌套覆盖；偏好由宿主管理，库不读写本地存储。此 API 自 0.4.0 提供。

完整变量、类型标签、交互与减少动态规则见 [橙趣主题规范](docs/THEME_NEO_BRUTALISM.md)。现有 CSS-only 用法仍支持；展台装饰独立放在 `preview/theme-*.css`。

0.5.0 新增六类[场景背景配置](docs/THEMING.md#场景背景050)：画布、正文、侧栏、卡片表单、浮层和媒体。正文默认无纹理，支持局部配色与纹理覆盖；本地展台 `http://127.0.0.1:18309/#backgrounds` 可查看当前主题的六类场景，并通过主题选择器切换。

类名、CSS 变量、动画名称与动态设置统一使用 `rhine-` 命名空间。升级到 0.3.0 时请同步迁移主题根、自定义样式与动效属性，具体见 [迁移说明](CHANGELOG.md#030)。

### 兼容范围

- 包导出 TS/TSX、CSS 和 SVG 源码，构建器需支持 CSS 导入与 Vite 的 SVG `?no-inline` 引用；目前未验证其他构建器和 SSR。
- 浮层挂载到最近的 `.rhine-theme`。请将主题根放在页面根部，避免对它使用 `transform`、裁剪或 `contain`。
- 组件提供呈现与交互，应用负责数据请求、搜索、分页和操作结果。
- 默认使用暖白主题；0.4.0 还提供可选的战术终端与橙趣主题。Logo 的深浅配色独立于界面主题。

<a id="components"></a>

## 组件

| 类别 | 组件 |
| --- | --- |
| 品牌与文字 | Logo · Text |
| 操作 | Button · ButtonLink⁴ · Icon · IconButton · Link · CopyButton |
| 布局与背景 | Surface · Toolbar · Divider · Stack · Inline · Grid · Background² · AppShell² · AppShellToggle⁴ · OrbitBackdrop³ · NeutronStarBackdrop⁴ |
| 表单与选择 | TextField · Fieldset¹ · ErrorSummary¹ · Textarea · Select · Checkbox · RadioGroup · Switch · SearchField · Combobox · SelectionCard · DateField² · DateRangePicker² · NumberField² · TreeSelect² · RemoteMultiSelect² · ThemePicker⁴ · ThemePreview⁴ |
| 导航与展开 | SideNav¹ · Breadcrumbs¹ · Steps¹ · Tabs · SegmentedControl · Disclosure |
| 搜索与筛选组合 | ListFilterBar⁵ |
| 数据与媒体 | Metric · KeyValue · DataTable · Pagination · StatusTimeline¹ · StatusTimelineList⁴ · TimelineLegend¹ · TrendChart² · StackedBar² · MediaCard² · MediaViewer² |
| 浮层 | Drawer¹ · Dialog · ConfirmDialog · Popover · Menu · Tooltip |
| 状态与反馈 | Badge · Notice · Toast · Progress · Skeleton · EmptyState |

¹ 自 0.4.0 提供。² 自 0.5.0 提供。³ 自 0.6.0 提供。⁴ 自 0.8.0 提供。⁵ 自 0.9.0 提供。

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
| 轨道装饰、暂停与静态降级 | [OrbitBackdrop](docs/ORBIT_BACKDROP.md) | [轨道星空](https://linhay.github.io/rhine-design/#orbit) |
| 中子星艺术、主题与 WebGL 生命周期 | [NeutronStarBackdrop（0.8.0）](docs/NEUTRON_STAR_BACKDROP.md) | [中子星展台](https://linhay.github.io/rhine-design/#neutron-star) |
| 场景与交互选型 | [使用规范](docs/INTERACTION_PATTERNS.md) | [场景指南](https://linhay.github.io/rhine-design/#patterns) |
| 日期快捷项、范围草稿与确认 | [日期筛选组合](docs/DATE_RANGE_FILTER.md) | [日期筛选](https://linhay.github.io/rhine-design/#date-range-filter) |
| 无框摘要、一行图例与凭证操作消融 | [紧凑组合](docs/COMPACT_ACCOUNT_PATTERNS.md) | [紧凑账号](https://linhay.github.io/rhine-design/#compact-account) |
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

## 产品设计稿评审工具（未发布候选）

新增独立 `/review` 与 `/review/vite` 入口，统一产品场景目录、主题/尺寸/状态控制、URL 分享、隔离画布和静态构建。产品保留页面、HTTP/平台模拟与业务知识，无需复制通用预览壳。**npm 0.10.0 尚不包含此工具**。

源码可运行 `npm run review:http`、`npm run review:platform`，或 `npm run review:build` 构建两个合成消费示例。接入、生命周期、部署与迁移见[产品评审契约](docs/REVIEW_TOOL.md)，实际覆盖与剩余边界见[验收记录](docs/REVIEW_VERIFICATION.md)。

## 参与贡献

欢迎提交问题、文档改进和组件提案。遇到问题时，请在 [Issues](https://github.com/linhay/rhine-design/issues) 提供组件名、版本、预期行为及最小复现。

开发环境、验证命令和 PR 说明见 [贡献指南](CONTRIBUTING.md)。版本变化和升级说明见 [CHANGELOG](CHANGELOG.md)。

## 许可证

[Apache License 2.0](LICENSE)。版权声明见 [NOTICE](NOTICE)。第三方依赖遵循各自的许可证。
