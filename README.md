<p align="center">
  <img src="components/assets/logo.svg" width="96" height="96" alt="Rhine Design 三角构架标志" />
</p>

<h1 align="center">莱茵设计 · Rhine Design</h1>

<p align="center">暖白与苔绿，三角与细线。让界面拥有清晰的秩序与克制的节奏。</p>

<p align="center">
  <a href="https://linhay.github.io/rhine-design/">在线预览</a> ·
  <a href="https://www.npmjs.com/package/@linhey/rhine-design">npm</a> ·
  <a href="#quick-start">快速接入</a> ·
  <a href="#agent-install">交给 Agent 安装</a> ·
  <a href="#components">组件</a> ·
  <a href="#documentation">设计规范</a> ·
  <a href="#ai-skills">AI Skills</a> ·
  <a href="CONTRIBUTING.md">参与贡献</a> ·
  <a href="CHANGELOG.md">版本记录</a>
</p>

Rhine Design 是面向 React 应用的开源设计系统，适合桌面工具、管理界面和数据密集型应用。它将设计规范、81 个组件和动效示例放在一起，帮助团队建立一致、可复用的界面语言。

- **一致的视觉语言**：色彩、字体、文字层级、间距、几何与焦点规则。
- **81 个可组合组件**：覆盖布局、表单、数据、导航、浮层、反馈和 Chat Foundation 工作区组合。
- **可验证的动效**：12 组播放 / 重播 / 复位演示，以及三角构架启动编排。
- **面向开发协作**：组件契约、交互展台和 AI skill 帮助设计与实现保持一致。

基于 React 与 Radix UI，采用 [Apache-2.0](LICENSE) 许可证。

组件负责界面呈现与交互；数据请求、权限、搜索、分页和操作结果由你的应用管理。

<a id="quick-start"></a>

## 快速接入

需要 **React 19 / React DOM 19**。已验证的构建环境为 **Vite**，建议使用 **Node 24**。包提供 TS/TSX、CSS 和 SVG 源码，构建器需要支持 CSS 导入和 Vite 的 SVG `?no-inline` 引用；其他构建器及 SSR 尚未验证。

在现有 React 项目目录中安装。以下示例固定使用已发布的 **0.12.0**：

```sh
npm install --save-exact @linhey/rhine-design@0.12.0
```

将下面的组件放入你的页面：

```tsx
import { useState } from 'react';
import { Button, Stack, Surface, Text } from '@linhey/rhine-design';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="rhine-theme">
      <Surface>
        <Stack gap={4}>
          <Text as="h1" variant="title">你好，Rhine Design</Text>
          <Text aria-live="polite">你已点击 {count} 次</Text>
          <Button onClick={() => setCount(value => value + 1)}>
            试试按钮
          </Button>
        </Stack>
      </Surface>
    </div>
  );
}
```

主入口自动加载组件样式，`.rhine-theme` 提供默认主题。将主题容器放在页面根部，避免在容器上设置 `transform`、裁剪或 `contain`，以保证浮层定位与显示。

<a id="agent-install"></a>

## 交给 Agent 安装

在你的 React 项目中打开编码 Agent，将下面整段提示词交给它即可。提示词会让 Agent 安装 npm 包及同一包附带的 Skill，并检查安装结果。

```text
请在当前项目中安装 Rhine Design 和配套 Skill，直接完成兼容性检查、安装与验证。

1. 阅读项目规则、package.json 和 lockfile，确认应用目录、包管理器、React/React DOM、Node 和构建器版本。保留现有修改；monorepo 安装到实际使用组件的应用，不随意写入根包。

2. 安装 npm 包 @linhey/rhine-design，本文接入基线为 0.12.0。使用 npm 的项目在应用目录执行：
   npm install --save-exact @linhey/rhine-design@0.12.0
   若已有 pnpm、yarn 或 bun，则使用现有包管理器的等价精确版本命令，保持原 lockfile 类型。若已安装更新版本，核对兼容性后保留，不自动降级。
   该基线需要 React 19 / React DOM 19；已验证 Vite，建议 Node 24。遇到不兼容，说明具体差异，不强行升级框架、不用 --force 或 --legacy-peer-deps 绕过检查。

3. 从实际安装的 @linhey/rhine-design 包中读取 skills/rhine-design/SKILL.md，将整个 skills/rhine-design/ 目录（包括 references、agents 等附属文件）安装到当前 Agent 支持的项目级 Skill 目录。
   Codex 使用项目根目录的 .agents/skills/rhine-design/。标准 node_modules 安装且目标不存在时，在项目根目录执行：
   mkdir -p .agents/skills
   cp -R node_modules/@linhey/rhine-design/skills/rhine-design .agents/skills/rhine-design
   monorepo、依赖提升或非 node_modules 布局先定位实际包路径，再复制。其他 Agent 使用其支持的项目级目录；不要猜测路径或改全局配置。
   如果目标已存在，先比较内容：一致则跳过，有定制则保留并合并适用更新，不盲目覆盖。不从 main 下载另一份 Skill，也不只复制 SKILL.md。

4. 读取安装后的 Skill 和 references/integration.md，核对真实包版本、公开导出与主题接入方式。Skill 内的版本说明可能早于 npm 包，以实际包的类型、实现和对应文档为准。

5. 验证 manifest 与 lockfile 的精确版本、Skill 文件完整性和本地引用路径，运行项目已有且相关的类型检查、构建或测试。需要确认组件可导入时使用最小临时示例，并在验证后清理；不要改造业务页面。若当前 Agent 尚未发现新 Skill，明确说明其加载方式，不把文件复制完成当作已加载。

6. 汇报实际安装版本、修改文件、Skill 路径、验证结果和未解决问题。本次范围是安装与验证；不提交或推送代码、不发布包、不自动迁移页面，也不因安装 Skill 自动获得向外部发送项目资料的授权。
```

安装完成后，可继续向 Agent 提出页面任务，例如：“使用 Rhine Design 做一个设置页面，先查已安装组件和规范，再实现表单与保存反馈。”

## 版本与兼容

- 本页安装与代码示例以正式 **0.12.0** 为基线，包含 72 个组件和五套主题。发布制品、范围与验收边界见 [0.12.0 发布记录](docs/releases/0.12.0.md)。
- 从旧版本升级时，若穷举 `ThemeName`，需补齐 `neutral` 与 `graphite` 分支。其他变化见 [CHANGELOG](CHANGELOG.md)，升级时同步精确依赖与 lockfile。
- 包内 `docs/`、`components/` 和 `skills/` 可从 `node_modules/@linhey/rhine-design/` 查阅。Skill 自身的版本说明可能早于 npm 包，使用 API 时核对实际导出、类型与实现。
- GitHub 主线文档和在线展台随 `main` 更新；安装包的能力以精确版本为准。后续主线文档不自动进入已发布制品。需要源码试用时固定提交，不用浮动 `main` 作为正式依赖。

<a id="components"></a>

## 组件

| 类别 | 组件 |
| --- | --- |
| 品牌与文字 | Logo · Text |
| 操作 | Button · ButtonLink⁴ · Icon · IconButton · Link · CopyButton · ResponsiveActions（0.12.0） |
| 布局与背景 | Surface · Toolbar · Divider · Stack · Inline · Grid · Background² · AppShell² · AppShellToggle⁴ · OrbitBackdrop³ · NeutronStarBackdrop⁴ |
| 表单与选择 | TextField · Fieldset¹ · ErrorSummary¹ · Textarea · Select · Checkbox · RadioGroup · Switch · SearchField · Combobox · SelectionCard · DateField² · DateRangePicker² · NumberField² · TreeSelect² · RemoteMultiSelect² · MappingEditor（0.12.0） · ThemePicker⁴ · ThemePreview⁴ |
| 导航与展开 | SettingsNavigation（0.12.0） · SideNav¹ · Breadcrumbs¹ · Steps¹ · Tabs · SegmentedControl · Disclosure |
| 聊天组合（自 0.11.2） | ChatThread · ChatCard |
| Chat Foundation 工作区（main，尚未发布） | ChatShell · WorkspaceRail · AgentList · AgentRow · ChatHeader · MessageList · MessageBubble · Composer · AgentInspector |
| 搜索与筛选组合 | ListFilterBar⁵ |
| 数据与媒体 | Metric · KeyValue · DataTable · Pagination · StatusTimeline¹ · StatusTimelineList⁴ · TimelineLegend¹ · TrendChart² · StackedBar² · MediaCard² · MediaViewer² |
| 浮层 | Drawer¹ · Dialog · ConfirmDialog · Popover · Menu · Tooltip |
| 状态与反馈 | Badge · Notice · Toast · Progress · Skeleton · EmptyState |

¹ 自 0.4.0 提供。² 自 0.5.0 提供。³ 自 0.6.0 提供。⁴ 自 0.8.0 提供。⁵ 自 0.9.0 提供。

参数、状态和组合示例见[组件 API](components/README.md)与[常用组件契约](components/COMMON_COMPONENTS.md)。

## 主题与背景

默认主题使用暖白与苔绿。0.12.0 还提供战术终端、橙趣、中性和石墨主题；主题根、CSS 变量与动画名称统一使用 `rhine-` 命名空间。

```tsx
import { Button, Surface } from '@linhey/rhine-design';
import { ThemeProvider, useTheme } from '@linhey/rhine-design/theme';

function Appearance() {
  const { setTheme } = useTheme();
  return <Button onClick={() => setTheme('graphite')}>切换石墨主题</Button>;
}

export function App() {
  return (
    <ThemeProvider defaultTheme="neo-brutalism">
      <Surface><Appearance /></Surface>
    </ThemeProvider>
  );
}
```

`ThemeProvider` 自动生成主题容器，无需再包裹 `.rhine-theme`。偏好存储由宿主管理；支持并列 Provider，不支持嵌套覆盖。受控模式、动态切换和浮层继承见[主题 API](docs/THEMING.md)。Logo 的深浅配色独立于界面主题。

| 需要 | 接入与示例 |
| --- | --- |
| 统一画布、正文、侧栏、卡片、浮层与媒体背景 | [背景与应用外壳](docs/APPLICATION_COMPONENTS.md) · [场景背景配置](docs/THEMING.md#场景背景050) |
| 选择界面风格 | [橙趣](docs/THEME_NEO_BRUTALISM.md) · [中性](docs/THEME_NEUTRAL.md) · [石墨](docs/THEME_GRAPHITE.md) |
| 轨道装饰、暂停与静态降级 | [OrbitBackdrop](docs/ORBIT_BACKDROP.md) · [轨道展台](https://linhay.github.io/rhine-design/#orbit) |
| 中子星艺术与 WebGL 生命周期 | [NeutronStarBackdrop](docs/NEUTRON_STAR_BACKDROP.md) · [中子星展台](https://linhay.github.io/rhine-design/#neutron-star) |

背景艺术是可选装饰，不表示加载或业务进度。主题切换、减少动态、暂停和卸载行为按各自契约接入。

<a id="documentation"></a>

## 设计规范与展台

无需安装即可打开 **[在线组件展台](https://linhay.github.io/rhine-design/)**，体验组件与动效。

| 主题 | 文档 | 在线预览 |
| --- | --- | --- |
| 聊天消息、卡片与历史 | [Agent Chat](docs/AGENT_CHAT.md) | [聊天消息与记录](https://linhay.github.io/rhine-design/#agent-chat) |
| 编辑布局与局部配色 | [编辑布局配方](docs/EDITORIAL_LAYOUT.md) | [报告、发布说明与概览](https://linhay.github.io/rhine-design/#editorial-layout) |
| 视觉基础与组合原则 | [设计规范](docs/DESIGN_SYSTEM.md) | [视觉基础](https://linhay.github.io/rhine-design/#foundation) |
| 间距、分组与卡片组合 | [Spacing](components/SPACING.md) | [间距与组合](https://linhay.github.io/rhine-design/#spacing) |
| 字体、文字层级与数值 | [Typography](components/TYPOGRAPHY.md) | [字体与文字](https://linhay.github.io/rhine-design/#typography) |
| 品牌几何与 Logo | [Logo 契约](components/README.md#品牌标志) | [品牌标志](https://linhay.github.io/rhine-design/#brand) |
| 动效、交互与减少动态 | [Motion](components/MOTION.md) | [动效实验室](https://linhay.github.io/rhine-design/#motion) |
| 启动动画与就绪衔接 | [Startup](components/STARTUP.md) | [启动动画](https://linhay.github.io/rhine-design/#startup) |
| 轨道装饰、暂停与静态降级 | [OrbitBackdrop](docs/ORBIT_BACKDROP.md) | [轨道星空](https://linhay.github.io/rhine-design/#orbit) |
| 中子星艺术、主题与 WebGL 生命周期 | [NeutronStarBackdrop](docs/NEUTRON_STAR_BACKDROP.md) | [中子星展台](https://linhay.github.io/rhine-design/#neutron-star) |
| 工作空间文件/笔记与关联往返 | [对象阅读组合](docs/OBJECT_READING.md) | [对象阅读](https://linhay.github.io/rhine-design/#object-reading) |
| OpenAPI 与第三方技术文档只读集成 | [技术阅读器配方](docs/TECHNICAL_READER.md) | 规范配方，尚无运行展台 |
| 场景与交互选型 | [使用规范](docs/INTERACTION_PATTERNS.md) | [场景指南](https://linhay.github.io/rhine-design/#patterns) |
| 周期摘要、证据覆盖与每日来源 | [周期报告配方](docs/PERIODIC_REPORTS.md) | [周期报告与跨日来源](https://linhay.github.io/rhine-design/#periodic-report) |
| 个人订阅、渠道受众与失效恢复 | [个人事件通知配方](docs/PERSONAL_NOTIFICATIONS.md) | [个人事件通知](https://linhay.github.io/rhine-design/#personal-notifications) |
| 少量源参数与只读生成结果 | [参数与预览组合](docs/PARAMETER_CONFIG.md) | [参数与生成预览](https://linhay.github.io/rhine-design/#parameter-config) |
| 日期快捷项、范围草稿与确认 | [日期筛选组合](docs/DATE_RANGE_FILTER.md) | [日期筛选](https://linhay.github.io/rhine-design/#date-range-filter) |
| 无框摘要、一行图例与凭证操作消融 | [紧凑组合](docs/COMPACT_ACCOUNT_PATTERNS.md) | [紧凑账号](https://linhay.github.io/rhine-design/#compact-account) |
| 导航与表单流程 | [组件契约](docs/INTERACTION_PATTERNS.md#新组件契约) | [导航](https://linhay.github.io/rhine-design/#navigation) · [表单](https://linhay.github.io/rhine-design/#form-workflow) |
| 系统覆盖与演进方向 | [组件系统对照](docs/DESIGN_SYSTEM_AUDIT.md) | — |
| 多栏目设置与窄容器导航 | [设置 Dialog](docs/SETTINGS_DIALOG.md) | [设置工作区](https://linhay.github.io/rhine-design/#settings-dialog) |
| 模板驱动批量设置与来源映射 | [MappingEditor 与模板组合](docs/TEMPLATE_SETTINGS.md) | [模板设置](https://linhay.github.io/rhine-design/#template-settings) |
| 容器内文字、图标与更多操作切换 | [ResponsiveActions](docs/RESPONSIVE_ACTIONS.md) | [响应式操作](https://linhay.github.io/rhine-design/#responsive-actions) |
| 常驻只读树、外部画布与详情 | [层级浏览配方](docs/RESIDENT_TREE.md) | [常驻层级浏览](https://linhay.github.io/rhine-design/#resident-tree) |
| 只读计划与 Worker Job 登记 | [登记配方](docs/SCHEDULED_JOB_REGISTRY.md) | 宿主组合配方 |
| 消费限额草稿、批量预览与发布状态 | [限额组合](docs/BULK_LIMITS_COMPOSITION.md) | 宿主组合配方 |
| 紧凑部门导航栏与图标动作 | [部门导航配方](docs/COMPACT_DEPARTMENT_HEADER.md) | 宿主组合配方 |

展台包含键盘、长文、加载、错误和减少动态示例。目录与内容独立滚动，章节链接可分享；离开章节会卸载其演示。组件选型也可参考 [Ant Design / MUI 对照](docs/ANTD_MUI_AUDIT.md)。本地运行方式见[贡献指南](CONTRIBUTING.md#本地开发)。

<a id="ai-skills"></a>

## AI Skills

[`rhine-design` Skill](skills/rhine-design/SKILL.md) 帮助编码助手查找规范和真实组件 API。可以直接使用上方[安装提示词](#agent-install)完成 npm 与 Skill 安装，也可以手动安装。

组件包已安装、使用标准 `node_modules` 布局且目标目录不存在时，在项目根目录执行：

```sh
mkdir -p .agents/skills
cp -R node_modules/@linhey/rhine-design/skills/rhine-design .agents/skills/rhine-design
```

以上为 Codex 项目级目录。monorepo 或其他依赖布局先定位实际包；其他 Agent 使用其支持的项目级 Skill 路径。复制整个目录，包括 `references/` 与 `agents/`。目标已存在时先比较，保留定制后合并，避免覆盖或嵌套复制。

复制后读取 `SKILL.md` 和 `references/integration.md`。Skill 内部链接相对于自身目录；以代码格式列出的 `docs/`、`components/` 路径相对于实际安装包。独立 Skill 的固定源码后备链接不代表当前包 API。文件复制完成与 Agent 已发现 Skill 分别确认；加载方式以当前工具说明为准。

| 文件 | 用途 |
| --- | --- |
| [SKILL.md](skills/rhine-design/SKILL.md) | 使用范围、设计流程与版本定位 |
| [TASK_MAP.md](skills/rhine-design/references/TASK_MAP.md) | 按字体、表单、数据、浮层和动效查规范 |
| [API_MAP.md](skills/rhine-design/references/API_MAP.md) | 按组件名查实现和公开入口 |
| [integration.md](skills/rhine-design/references/integration.md) | 主题、构建、数据所有权与迁移 |

安装后可以向助手提出任务：

> 使用 $rhine-design 设计一个设置页面，包含搜索、选项开关和保存反馈；先查已安装组件与规范，再实现键盘操作和减少动态效果。

升级组件时一并比较同包 Skill，保留本地定制。需要页面接入、评审与持续反馈时，参阅[进阶 Agent 接入说明](docs/AGENT_ONBOARDING.md)，按本项目授权选择范围；安装 Skill 不自动授予外发项目资料的权限。

## 产品设计稿评审工具

独立 `/review` 与 `/review/vite` 入口提供场景目录、主题/尺寸/状态控制、URL 分享、隔离画布和静态构建。产品保留自己的页面、HTTP/平台模拟与业务逻辑。

接入与迁移见[产品评审契约](docs/REVIEW_TOOL.md)，范围与证据见[验收记录](docs/REVIEW_VERIFICATION.md)。库源码中可运行 `npm run review:http`、`npm run review:platform`，或 `npm run review:build` 查看两个合成消费示例；这些是库开发命令，不会自动加入你的应用。

## iOS 开发者

[Rhine Design for iOS](https://github.com/linhay/rhine-design-ios) 使用 UIKit 与 Auto Layout，独立维护原生规范、Swift Package 和 Gallery。平台要求、可用版本与验收范围以 iOS 仓库 README 为准；Web npm 包与 Skill 不用于安装 UIKit 组件。

## 问题反馈与贡献

遇到组件问题，请在 [Issues](https://github.com/linhay/rhine-design/issues) 提供包版本、运行环境、预期行为及最小复现。设计建议、用户偏好、成功组合与验证发现同样欢迎；先查 open/closed issues，同类主题补充原 issue，公开示例使用合成数据。

反馈模板与处理流程见[消费反馈与设计共建](CONTRIBUTING.md#消费反馈与设计共建)。开发环境、验证命令和 PR 说明见[贡献指南](CONTRIBUTING.md)；版本变化见 [CHANGELOG](CHANGELOG.md)。

## 许可证

[Apache License 2.0](LICENSE)。版权声明见 [NOTICE](NOTICE)，第三方依赖遵循各自许可证。
