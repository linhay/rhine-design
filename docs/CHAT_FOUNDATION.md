# Chat Foundation · Agent 工作区基石提案

## 背景

Rhine Design 已有布局、导航、文字、表单、浮层和反馈组件，但没有一套面向 Agent Chat 的完整组合。OpenMausBot 的主界面提供了一个可复用的产品形态：工作区 Rail、Agent 列表、会话正文、消息操作、输入栏和上下文检查并列存在，适合拆成设计系统的 Chat 基础能力。

本提案把完整界面作为一个可交互展台提交，供 Rhine Design 逐步拆解组件。它只定义呈现结构、交互状态和公开契约，不绑定 Bot、成员、线程、权限、模型、事件或后端。

预览入口：`#chat-foundation`。左侧三级目录为“应用能力 → Chat 基石 → 组件”；父入口保留完整工作区，16 个子项各有真实组件展台。原九个 hash 保持兼容，新增 `#chat-foundation-pane`、`#chat-foundation-message-meta`、`#chat-foundation-message-content`、`#chat-foundation-message-actions`、`#chat-foundation-day-divider`、`#chat-foundation-message-status`、`#chat-foundation-message-renderer`。支持直接访问、刷新与前进/后退；底部能力清单已移除。

## 组合结构

```text
ChatShell
├── WorkspaceRail
├── AgentList → AgentRow
├── ChatPane
│   ├── ChatHeader
│   ├── MessageList
│   │   ├── DayDivider
│   │   ├── MessageRenderer → 默认 MessageBubble / 宿主渲染组件
│   │   │   ├── MessageMeta
│   │   │   ├── MessageContent
│   │   │   └── MessageActions
│   │   └── MessageStatus
│   └── Composer
└── AgentInspector
```

展台保留组合级布局，便于评审整体信息层级和交互边界；Chat Foundation 的布局、列表、消息和输入能力已提取为公开受控组件，组合继续作为可复用的 Chat Foundation 示例。

## 当前实现

源码入口为 `components/ChatFoundation.tsx`（兼容性 barrel）；`components/chat-foundation/` 内每个组件有独立的同名文件，`primitives.tsx` 与 `composition.tsx` 只保留兼容导出，`state.ts` 保存纯状态契约，`message-types.ts` 保存稳定消息身份。样式入口为 `components/chat-foundation.css`。以下能力从主入口公开：

- `AgentRow`：受控选中、宿主身份内容、预览和工作中/就绪/离线文字状态；点击只回调 `onSelect`。
- `MessageBubble`：作者、时间、Agent/本人方向、正文、引用和宿主动作插槽；正文仍由宿主传入 React 内容或 Markdown 结果。
- `Composer`：受控文本、Enter 提交、Shift+Enter 换行、忙碌/禁用、附件与动作插槽；提交回调只表示用户提交了当前草稿。
- `WorkspaceRail`：宿主传入工作区项、当前项和 footer，使用原生按钮与 `aria-current`。
- `AgentList`：受控搜索值与 Agent 数据，负责本地候选过滤并组合 `AgentRow`；不请求服务端。
- `ChatHeader`：身份、状态说明、操作和详情入口插槽。
- `MessageList`：日期分隔、消息组合以及宿主传入的空、加载、错误、未知和工作中状态。
- `AgentInspector`：身份、事实、动作和关闭回调；不推断业务事实。
- `ChatShell`：Rail、侧栏、正文和 Inspector 插槽及按工作区实际容器宽度切换的详情覆盖布局。

- `ChatPane`：组合 `header`、`messages`、`composer` 三个显式插槽，不订阅会话、不处理投递。
- `MessageMeta` / `MessageContent` / `MessageActions`：独立的作者时间、正文引用和常驻操作区域；可供宿主自己的消息渲染器组合。`MessageActions` 使用命名 group，quiet 按钮保持灰色小文字和可见焦点。
- `DayDivider` / `MessageStatus`：宿主格式化的日期与显式 empty/loading/error/unknown/working 状态；错误使用 alert，加载/工作中使用 status。
- `MessageRenderer`：根据 `message.kind` 选择 `MessageRenderers` 中的 React 组件；未配置的 Agent/个人消息均回退到 `MessageBubble`。`MessageList.renderers` 接入同一契约，列表继续以宿主消息 `id` 为 key。

这些组件不请求数据、不写入消息、不推断 Agent 成功或权限结果；组件之间只通过 ReactNode、受控值和宿主回调组合。

消息头像与正文气泡顶部对齐；作者/时间、正文、操作各占独立行，隐藏或显示操作不会改变头像位置。无头像时不保留头像列。

展台消息正文区均有可见主题底色：Agent 消息以 `--rhine-ink` 与 `--rhine-surface` 混合，个人消息使用 `--rhine-selected` 并靠右。紧凑 Agent 行的状态文字保持完整，预览使用剩余宽度并可省略；采用名称与预览/状态两行结构，头像和状态点跨两行垂直居中。此行布局属于展台组合，不限制宿主传入的身份插槽。

Inspector 的头像与名称/职责并列，信息项采用标签/值双列，关闭与设置入口保持可达。布局由公共 `ChatShell` 管理四个插槽的固定列，展台不再覆盖列定义；缺少 Rail 或侧栏时不会把正文或详情挪入其他插槽列。

## DSH 固定源码对照

本轮对照 [deepseek-ai/deepseek-harness @ f3803c9](https://github.com/deepseek-ai/deepseek-harness/tree/f3803c96974ad4a94195fb97e5c637e9c2a3afe3)，具体职责对应如下；独立编写 React 实现，未复制 DSH 的运行时或业务模型。

| DSH 源码职责 | Rhine 实现 |
| --- | --- |
| `ui-chat/src/client/chat/ChatView.tsx` 组合会话视图 | `ChatPane` 只组合头部、消息和输入，宿主拥有会话状态 |
| `ChatNodeSeat.tsx` / `register-node-renderers.ts` 按节点类型选取渲染器 | `MessageRenderer` / `MessageList.renderers` 按 agent/person 选择组件，缺省回退；不引入全局插件服务 |
| `MessageItem.tsx` 与 `MessageIconActions.tsx` 分离内容与操作 | `MessageBubble` 组合 `MessageMeta`、`MessageContent`、`MessageActions`，保留本项目常驻灰色文字操作 |
| 会话服务/投影与视图分离 | `state.ts` 只提供 UI reducer，消息数据、协议和提交副作用在宿主；完整展台实际使用 reducer |

DSH 还包含工具、推理、审批、重试、事件投影和分组树等业务节点，本契约没有实现这些协议，也不以简单 `MessageRenderers` 宣称覆盖 DSH 的完整 slot registry。当前目标是通用设计组件的职责与扩展边界。

组件类型与渲染函数应在模块级定义，避免每次宿主 render 都创建新的组件类型而重置局部状态。同一 `id` 在消息更新、前插和重排时保持组件身份；宿主主动更换 renderer 组件类型时，React 会按正常规则重新挂载。组件不自动维护滚动位置或执行复制/朗读。

```tsx
const renderers: MessageRenderers = { agent: ResearchMessage };
// ResearchMessage 可组合 MessageMeta / MessageContent / MessageActions。
<MessageList messages={hostMessages} renderers={renderers} />
```

## 状态与槽位契约

`ChatSessionState`、`ChatSessionAction` 和 `chatSessionReducer` 是无副作用的宿主状态契约。它只保存会话阶段、当前 Agent、搜索词、草稿、详情面板和错误；消息投影、网络请求、线程创建、权限和投递结果仍由消费方的 controller/store 持有。完整 Chat 展台实际通过 `useReducer(chatSessionReducer, ...)` 持有 Agent、搜索、草稿、错误和详情状态；消费方也可以映射到自己的状态机。

`ChatShell` 的 `rail`、`sidebar`、`content` 和 `inspector` 已作为命名插槽保持稳定；插槽内容由宿主或插件组合，Shell 不解析其业务数据。这样可以在不复制核心 Chat 组件的情况下追加工作区入口、操作和详情内容。

## 建议公开组件

| 组件 | 主要输入 | 必须覆盖的状态 |
| --- | --- | --- |
| `ChatShell` | `rail`, `sidebar`, `content`, `inspector`, `inspectorOpen` | 宽屏、窄屏、无右侧栏、导航开关 |
| `WorkspaceRail` | `items`, `activeId`, `onSelect`, `footer` | 当前项、禁用项、Tooltip、键盘导航、窄屏隐藏 |
| `AgentList` | `agents`, `selectedId`, `query`, `onQueryChange`, `onSelect`, `empty` | 搜索、选中、工作中、就绪、离线、空结果 |
| `AgentRow` | `identity`, `preview`, `status`, `selected`, `onSelect` | 长标题、长预览、状态文字与颜色、焦点 |
| `ChatHeader` | `identity`, `subtitle`, `actions`, `inspectorAction` | 标题换行、状态说明、操作溢出 |
| `MessageList` | `messages`, `daySeparators`, `working`, `error`, `empty` | 空、加载、错误、未知结果、长正文、滚动 |
| `MessageBubble` | `author`, `time`, `children`, `kind`, `actions`, `quote` | Agent/本人、Markdown、引用、复制/朗读操作 |
| `Composer` | `value`, `onChange`, `onSubmit`, `disabled`, `busy`, `attachments` | 空、可发送、忙碌、失败后保留输入、键盘发送 |
| `AgentInspector` | `identity`, `facts`, `actions`, `onClose` | 可关闭、长事实、未知/未配置值、窄屏转页面或隐藏 |

## 状态与数据边界

- 组件只呈现宿主传入的状态；不请求数据、不搜索服务端、不创建线程、不写入消息。
- `selected`、`working`、`offline`、`busy`、`error` 和 `unknown` 必须由宿主决定，视觉反馈不能提前表示业务成功。
- 消息内容支持宿主传入的 React 内容或 Markdown 渲染结果；组件不内置 Agent 协议。
- Agent 的身份、模型、权限、工作电脑和记忆是业务事实，Inspector 只负责呈现，不推断或修改。
- Composer 的提交回调只表示用户提交了输入；它不表示消息已经投递、Agent 已接收或工作已完成。

## 交互要求

- Agent 列表搜索框与每一行保持原生键盘顺序；选中项有可读的 `aria-current` 或等价状态。
- 消息操作常驻显示为灰色小文字按钮，不依赖鼠标悬停出现；悬停提供文字反馈，键盘聚焦显示轮廓，存在触控输入时（`any-pointer: coarse`，包括以鼠标为主输入的触屏电脑）保留至少 44px 命中范围。
- Enter 发送、Shift+Enter 换行；提交失败时保留草稿并保留输入焦点。
- Inspector 的关闭动作归还打开它的按钮焦点；窄屏不把详情强制变成模态 Drawer，宿主可选择页面或隐藏。
- 工作中状态显示文字和静态标识，不依赖闪烁或颜色；减少动态模式关闭点动画和过渡。
- 消息正文、错误原因、模型标识和长标题自然换行，不截断决定性信息。

展台可直接检查这些边界：搜索无结果时显示空状态；每个 Agent 行和聊天头部都显示工作中、准备就绪或离线文字；消息区同时展示空、加载中、错误和未知状态示例；输入区的“模拟失败”会保留草稿，成功提交只显示“本地演示”结果；详情关闭后焦点回到“显示详情”；窄屏使用 Agent 选择器，工作区容器宽度不超过 1050px 时详情覆盖在工作区右侧，620px 以下隐藏左侧导航并提供 Agent 选择器；Enter 提交、Shift+Enter 换行，触控设备始终显示消息操作。

在 `data-rhine-motion="reduced"` 或系统减少动态设置下，详情面板不使用过渡，消息操作保持可见，状态文本与布局仍然保留。验证计划覆盖 400、520、880、1200px 和 200% 缩放；本轮真实浏览器已检查前四种视口，200% 浏览器缩放因当前 CLI 会话未提供可复现的原生缩放通道而 SKIPPED，不将其记为通过。该展台的合成状态不代表真实 Agent、消息服务或运行时行为。

## 设计系统拆解顺序

1. 先从现有 `AppShell`、`SideNav`、`Text`、`Badge`、`Divider`、`Textarea`、`Button`、`IconButton`、`Notice` 和 `Surface` 确定组合契约。
2. 提取 `AgentRow`、`MessageBubble` 和 `Composer` 的稳定视觉与交互状态，补充对应测试和展台案例。已完成并从主入口公开。
3. 提取 `ChatShell`、`WorkspaceRail`、`AgentList`、`ChatHeader`、`MessageList`、`AgentInspector` 的响应式布局契约。已完成并从主入口公开。
4. 每个组件独立文件，消息内容/操作/状态/渲染分离，保留兼容导出与公开 API；完整展台实际接通宿主 reducer。已完成。
5. 将本展台中的局部 `rhine-chat-*` 样式迁移为公共 tokens/组件样式；消费项目不应复制这份 CSS。公共组件样式已覆盖提取能力，展台保留组合级布局样式。
6. 在 400/520/880/1200 宽度、200% 缩放、键盘/焦点、错误/空/加载、主题和减少动态下验证。

## 不纳入本次基石

- Agent 运行时、Bot/成员/线程 DTO、消息存储、SSE/WebSocket、权限判定、审批卡和工具协议。
- 模型选择器的供应商逻辑、记忆系统、电脑控制、文件上传和第三方连接器。
- OpenMausBot 的具体品牌、颜色、图标资产和产品文案；Rhine 只提供可主题化的结构与状态。
- 预置的产品导航层级。消费应用负责决定 Chat 是主页面、嵌入面板还是观察端。

未知的运行时 store action 保持原会话状态及对象身份；已知 action 仍由类型联合穷尽检查。日期分隔只在提供非空日期且与上一个已知日期不同时出现，未提供日期的消息不清空已知日期。

## 验证边界

当前展台使用合成 Agent 和消息数据，不连接 OpenMausBot 或 Octora 运行时。公共组件 API、视觉展台和消费项目接入仍需分别验证；本展台通过不等于业务消息或 Agent 行为验收。
