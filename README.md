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

Rhine Design 是面向 React 应用的开源设计系统，适合桌面工具、管理界面和数据密集型应用。它将设计规范、71 个源码组件和动效示例放在一起，帮助团队建立一致、可复用的界面语言。

- **一致的视觉语言**：色彩、字体、文字层级、间距、几何与焦点规则。
- **71 个源码可组合组件**：覆盖布局、表单、数据、导航、浮层和反馈。
- **可验证的动效**：12 组播放 / 重播 / 复位演示，以及三角构架启动编排。
- **面向开发协作**：组件契约、交互展台和 AI skill 帮助设计与实现保持一致。

基于 React 与 Radix UI，采用 [Apache-2.0](LICENSE) 许可证。

## 版本与源码范围

- **当前已发布版本：0.11.3**。主入口包含 ChatThread / ChatCard，共 69 个组件，统计不含类型及独立 `/theme` 入口的 ThemeProvider、hook 和元数据。发布是否可安装以 npm registry 为准。
- **0.11.0 新增**：产品评审 `/review`、`/review/vite`，摘要页签 `Tabs description/status`、`Toast placement="floating"`、`SegmentedControl size="compact"` 及相邻 Disclosure 分隔线与生产动效修正。npm 0.10.0 不包含这些新增 API。
- **0.11.2 聊天组合**：消息分组、结构化卡片及历史跟随见 [Agent Chat](docs/AGENT_CHAT.md)，不在 0.11.0 制品中。
- **0.11.2 设置 Dialog**：公开 height/footer、可省略 description、固定头尾和独立正文滚动；[固定制品及消费验收](docs/releases/0.11.2.md)。main 的对象阅读、聊天细节和评审壳后续改动尚未发布。
- **0.11.3 远程选择**：#69 已选标签激活与 #71 远程分页状态，含快速重开和 Tab 退出后的焦点修复；基于 0.11.2 固定制品交付，#61/#64/#66 仍未发布。见 [发布记录](docs/releases/0.11.3.md)。
- **Tabs 满栏靠左（未发布）**：`layout="content" fullWidth` 独立控制栏宽，保留内容宽度选项，见[规范与接入](docs/SUMMARY_TABS.md#满栏靠左76未发布)；npm 0.11.3 不含此属性。
- **展台随源码更新**，在线部署跟随 main；安装包的能力以精确版本和实际导出/实现为准。上述源码变更、历史版本与接入边界统一见[版本记录](CHANGELOG.md)。

四套源码主题（新增未发布的 [neutral](docs/THEME_NEUTRAL.md)）、轨道艺术、设置导航与主题选择等已有能力见下方组件和规范入口；应用组件的 Ant Design / MUI 对照见[对标清单](docs/ANTD_MUI_AUDIT.md)。

<a id="quick-start"></a>

## 快速接入

需要 **React 19**。当前已验证的构建环境为 **Vite**，开发建议使用 **Node 24**。

在你的 React 项目中安装：

```sh
npm install --save-exact @linhey/rhine-design@0.11.3
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
| 操作 | Button · ButtonLink⁴ · Icon · IconButton · Link · CopyButton · ResponsiveActions（未发布） |
| 布局与背景 | Surface · Toolbar · Divider · Stack · Inline · Grid · Background² · AppShell² · AppShellToggle⁴ · OrbitBackdrop³ · NeutronStarBackdrop⁴ |
| 表单与选择 | TextField · Fieldset¹ · ErrorSummary¹ · Textarea · Select · Checkbox · RadioGroup · Switch · SearchField · Combobox · SelectionCard · DateField² · DateRangePicker² · NumberField² · TreeSelect² · RemoteMultiSelect² · MappingEditor（未发布） · ThemePicker⁴ · ThemePreview⁴ |
| 导航与展开 | SettingsNavigation（未发布） · SideNav¹ · Breadcrumbs¹ · Steps¹ · Tabs · SegmentedControl · Disclosure |
| 聊天组合（源码候选） | ChatThread · ChatCard |
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
| 聊天消息、卡片与历史（源码候选） | [Agent Chat](docs/AGENT_CHAT.md) | [聊天消息与记录](https://linhay.github.io/rhine-design/#agent-chat) |
| 视觉基础与组合原则 | [设计规范](docs/DESIGN_SYSTEM.md) | [视觉基础](https://linhay.github.io/rhine-design/#foundation) |
| 间距、分组与卡片组合 | [Spacing](components/SPACING.md) | [间距与组合](https://linhay.github.io/rhine-design/#spacing) |
| 字体、文字层级与数值 | [Typography](components/TYPOGRAPHY.md) | [字体与文字](https://linhay.github.io/rhine-design/#typography) |
| 品牌几何与 Logo | [Logo 契约](components/README.md#品牌标志) | [品牌标志](https://linhay.github.io/rhine-design/#brand) |
| 动效、交互与减少动态 | [Motion](components/MOTION.md) | [动效实验室](https://linhay.github.io/rhine-design/#motion) |
| 启动动画与就绪衔接 | [Startup](components/STARTUP.md) | [启动动画](https://linhay.github.io/rhine-design/#startup) |
| 轨道装饰、暂停与静态降级 | [OrbitBackdrop](docs/ORBIT_BACKDROP.md) | [轨道星空](https://linhay.github.io/rhine-design/#orbit) |
| 中子星艺术、主题与 WebGL 生命周期 | [NeutronStarBackdrop（0.8.0）](docs/NEUTRON_STAR_BACKDROP.md) | [中子星展台](https://linhay.github.io/rhine-design/#neutron-star) |
| 工作空间文件/笔记与关联往返 | [对象阅读组合](docs/OBJECT_READING.md) | [对象阅读](https://linhay.github.io/rhine-design/#object-reading) |
| OpenAPI 与第三方技术文档只读集成 | [技术阅读器配方](docs/TECHNICAL_READER.md) | 规范配方，尚无运行展台 |
| 场景与交互选型 | [使用规范](docs/INTERACTION_PATTERNS.md) | [场景指南](https://linhay.github.io/rhine-design/#patterns) |
| 个人订阅、渠道受众与失效恢复 | [个人事件通知配方（源码）](docs/PERSONAL_NOTIFICATIONS.md) | [个人事件通知](https://linhay.github.io/rhine-design/#personal-notifications) |
| 少量源参数与只读生成结果 | [参数与预览组合](docs/PARAMETER_CONFIG.md) | [参数与生成预览](https://linhay.github.io/rhine-design/#parameter-config) |
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

复制后，skill 内部链接仍以 skill 目录为基准；以代码格式列出的 `docs/`、`components/` 等路径以已核对版本的组件包根目录为基准。独立安装 skill 且尚未安装组件包时，可使用其标明固定提交的在线契约后备链接；该快照不会跟随 main，也不代表当前安装版本的 API。

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

### 让编码 Agent 接入并持续共建

将下面的完整指令复制给消费项目的编码 Agent，建立「固定制品接入 → 设计稿先行 → 业务实现 → 自动反馈 → 上游更新后接回」闭环。

<details>
<summary>展开可直接复制的接入指令</summary>

```markdown
我要让本项目采用 Rhine Design，并建立持续共建机制。请读取当前项目规则、技术栈和实际实现，完成接入及规则落地，在已授权范围内连续推进。

一、设计来源与项目边界

- Web 设计库：linhay/rhine-design，npm 包：@linhey/rhine-design。注意 GitHub 账号与 npm scope 拼写不同。
- iOS 设计库：linhay/rhine-design-ios，以 UIKit 为主，独立维护规范、组件、版本与原生验收。
- 先核对本项目技术栈与兼容性。其他技术栈先说明可复用规范与实现缺口，不直接套用 React 或 UIKit 组件。
- 通用规范、tokens、组件、组合配方与展台归设计库；产品页面、业务规则、权限、数据与产品设计稿留在本项目。

二、先核对，再接入

1. 检查 Git 边界、当前分支、未提交改动、依赖与现有设计体系，保留已有工作。
2. 读取实际消费版本的 README、设计规范、交互模式、组件索引、相关契约与随包 skill；同时核对设计库当前偏好与决策，并区分它们和已发布 API。
3. 采用兼容的固定版本或可恢复的固定制品，记录版本、来源与摘要，更新 manifest、lockfile 和制品说明。
4. 不修改 node_modules，不复制组件库源码或私有 CSS，不用浮动 main 作为正式依赖。展台有能力、issue 已关闭或源码已实现，都不代表当前安装包可用。
5. 优先复用公开组件、tokens、布局、主题与动效，业务层负责产品组合。避免维护另一套同用途控件和样式。

三、设计稿先行

- 在本项目建立或完善 DESIGN_SYSTEM.md 和 design/，维护页面目录、角色、状态、交互与验收记录。
- 设计稿复用业务实际组件与样式，使用合成数据；模拟能力和设计入口不得进入正式产物。
- Web 若实际消费版本支持官方 review 工具，优先接入其评审壳与协议，避免自行维护通用工具栏、场景路由和 iframe 通信。
- 新增页面、视觉重构和交互调整，先修改可交互设计稿并验证，再同步业务实现；纯后端或不改变界面的修复不机械增加设计阶段。
- 同一任务已授权设计和实现时，按顺序连续完成；仅授权设计时，交付停留在设计范围。
- 迁移前盘点已有且有辨识度的视觉与动画，保留其意图；需要改变时明确说明原因。

四、默认设计原则

- 从用户任务出发，保留必要信息、动作、结果与恢复路径，删除重复提示、装饰和不必要的状态与抽象。
- 操作区只放操作，时间等元信息放到相关内容区。空间不足时依次将文字按钮收为图标按钮、再收进更多菜单，保留可访问名称、权限、顺序、busy 状态与焦点。
- 列表顶部搜索筛选优先使用实际版本提供的 ListFilterBar，最多两个常显条件，其余进入更多筛选，保留已选摘要和请求反馈。
- 搜索与分页保持服务端处理；输入体验通过防抖、输入法组合处理、请求取消和过期响应保护解决。
- 权限与操作结果以真实业务接口为准，不用样式迁移改变权限、数据或成功语义。
- 这些偏好按场景适用；与平台约束或现有明确产品决定冲突时，记录差异与依据。

五、持续反馈与共同成长

我明确授权：本项目任务内形成的设计规范、个人偏好、用户纠正、设计细节、成功组合、验证发现以及组件缺口，都要主动反馈到 linhay/rhine-design issues，无需逐次确认，也不只在缺少组件时反馈。

执行方式：
1. 先检索 open/closed issues 和相关规范，阅读匹配主题。
2. 已完整覆盖则记录关联；存在新增信息则补充原 issue；独立主题新建 issue。
3. 分别标注用户偏好、产品约束、通用建议、已验证事实与待验证推断，保留适用范围，不把个人偏好宣布为所有项目的标准。
4. 说明匿名场景、设计意图、实际消费版本、当前与期望行为、验证证据及可观察的验收条件。
5. 按实际需要建议补充规范、组合配方、组件、展台或回归验证，不默认增加新 API。
6. 公开内容使用合成示例，不上传内部文档、真实业务数据、内部地址、凭据、本机路径或设备标识。
7. 提交后回读确认，把 issue/comment 链接写回本项目记录和交付说明。
8. 提交失败时保留完整脱敏草稿、失败原因和待提交状态，继续独立工作；结果不确定时先查回执，再决定是否重试。

该授权覆盖设计反馈，不自动扩大为公共源码改造、提交推送、合并或正式发布。

六、缺口与临时适配

- 先检查实际导出、契约、版本和已有组合，排除接入错误后再认定缺口，并先查重反馈。
- 本项目允许在任务范围内做最小、可回退的局部适配，验证后继续推进，不因上游规范尚未更新而停等。
- 临时适配不能演变为第二套组件库；代码用最小英文注释标记 Temporary design adaptation 和 issue 链接。
- 产品规范记录“临时方案／待规范复核”：差异、文件与适用范围、制品版本、验证证据、复核触发及移除条件。
- 工程标记不展示给产品用户。

七、上游更新后的回接

后续处理同一主题、收到上游更新信息或执行已授权的依赖升级时：
- 主动核对关联 issue、规范、组件、展台和实际可消费制品。
- 区分已反馈、已接受、已实现、已发布、已在本项目验证。
- 同步相关 manifest、lockfile、制品说明和随包 skill，检查无关依赖漂移。
- 验证产品组合行为等价后，清理已被覆盖的临时适配；未覆盖部分保留原因与移除条件。
- 任务内执行此闭环，不自行创建后台轮询或定时监控。

八、验证与交付

- 按项目实际 scripts 完成相关测试、类型检查和构建。
- Web 检查相关窄屏、400/520/880 宽度、200% 缩放、长文本、加载/空/错误、键盘、焦点、浮层与主题。
- 动效检查真实播放、暂停、系统和手动减少动态、尺寸变化及卸载清理；静态截图不能代替动态验收。
- 原生项目补充真实运行入口证据，浏览器模拟不代替原生验证。
- 明确记录通过、失败、未执行及原因，不把设计稿通过描述成正式页面已经接入。

请将上述长期规则按本项目现有文档结构合并到根 AGENTS.md、开发流程和设计文档，去重并保持最小 diff。

本次完成规则落地、兼容性核对、固定依赖接入及可运行的设计评审入口；选择一个真实页面完成设计与实现闭环，作为后续接入范例。其余页面先列出迁移范围与缺口，避免无边界改造。

交付说明包含实际消费版本及来源、已接入范围、设计预览入口、验证结果、反馈链接和剩余缺口。
```

</details>

## 产品设计稿评审工具（自 0.11.0）

新增独立 `/review` 与 `/review/vite` 入口，统一产品场景目录、主题/尺寸/状态控制、URL 分享、隔离画布和静态构建。产品保留页面、HTTP/平台模拟与业务知识，无需复制通用预览壳。**npm 0.10.0 尚不包含此工具**。

源码可运行 `npm run review:http`、`npm run review:platform`，或 `npm run review:build` 构建两个合成消费示例。接入、生命周期、部署与迁移见[产品评审契约](docs/REVIEW_TOOL.md)，实际覆盖与剩余边界见[验收记录](docs/REVIEW_VERIFICATION.md)。

## 参与贡献

欢迎反馈设计规范、用户偏好、交互细节、成功实践与验证发现，也欢迎提交文档改进和组件提案。先查 open/closed issues，同类主题补充原 issue；场景、依据、实际消费版本和验证边界见[消费反馈流程与短模板](CONTRIBUTING.md#消费反馈与设计共建)。反馈不必转换成组件缺陷，处理结论与发行、消费验证分别记录。

开发环境、验证命令和 PR 说明见 [贡献指南](CONTRIBUTING.md)。版本变化和升级说明见 [CHANGELOG](CHANGELOG.md)。

## 许可证

[Apache License 2.0](LICENSE)。版权声明见 [NOTICE](NOTICE)。第三方依赖遵循各自的许可证。

### 多栏目设置工作区（源码候选）

短任务 Dialog 默认自然高度；多栏目编辑推荐显式 `height`、`footer`、`navigation`，保持空态、长表单、加载/错误和栏目切换时的外框稳定。footer直接传按钮或Fragment，description仅在帮助决策时提供。`SettingsNavigation` 在实际 Dialog 窄容器中把 SideNav 切为满宽原生 Select，共享栏目和禁用状态，重排保留正文与导航焦点。此组合及窄导航轨道与短屏修复尚未发布，接入前固定候选并验证实际操作空间，见[设置契约](docs/SETTINGS_DIALOG.md)和展台 `#settings-dialog`。

### 模板驱动批量设置（源码候选，未发布）

`MappingEditor` 提供受控来源→目标编辑列表：双侧原生Select、稳定行id、只读/禁用/错误、窄容器重排及增删焦点。模板保存与应用分离、逐目标差异和混合值意图由官方合成组合示范，业务服务与持久化归宿主。见[契约与组合](docs/TEMPLATE_SETTINGS.md)及展台 `#template-settings`；正式npm0.11.3不包含此组件。

`ResponsiveActions` 按实际容器依次呈现文字、图标和竖点菜单，保留44px目标与键盘焦点；源码主入口现有71个组件，发布0.11.3仍为69个。见[容器动作契约](docs/RESPONSIVE_ACTIONS.md)与展台 `#responsive-actions`。

## 常驻层级浏览组合

只读树与外部画布、固定/跟随目标、刷新快照和详情复制的配方见[常驻层级浏览](docs/RESIDENT_TREE.md)。展台 `#resident-tree` 使用公开基础组件与语义 HTML，不新增 Tree 公共导出；npm 0.11.3 尚不包含本配方。
