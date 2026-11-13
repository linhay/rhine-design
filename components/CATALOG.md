# Web 组件目录

本表是主入口的查找目录，不是第二份 API。参数、状态和键盘行为留在链接的契约里。清单只对应 `components/index.ts` 的值导出；类型、CSS 和独立包入口另列，不混进组件行。

安装包以实际导出为准。源码有一行，不表示 npm 已发布该能力。历史版本数量保留在 [CHANGELOG](../CHANGELOG.md)，本表不维护一个总数。

新增默认写成模式配方和展台。只有组件自己管理焦点、请求代次、计时或清理时，才新增公共导出。已经公开的导出保持公开；标成模式组件只说明它是任务组合，不是取消导出。

Web 与 iOS 分开。本表不要求 UIKit 补齐同名控件。

## 原语

用来排版、写字和触发一个动作。它们不拥有页面任务的草稿、查询或保存结果。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `Logo` | 放置三角构架标志 | 不接收点击，不代替页面标题，变色不等于整套深色主题 | [品牌标志](README.md#品牌标志) |
| `Text` | 表达文字层级、语气和数字 | 视觉层级不决定 HTML 语义，不截断或换算业务数值 | [字体](TYPOGRAPHY.md) |
| `Icon` | 辅助识别 | 可操作时用 `IconButton`，并提供名称 | [常用契约](COMMON_COMPONENTS.md) |
| `Divider` | 分隔同一组内容 | 不承载点击或状态 | [间距](SPACING.md) |
| `Stack` | 纵向间距 | 不自动成为卡片或表单 | [间距](SPACING.md) |
| `Inline` | 横向间距，动作并排 | 不保证窄容器不换行 | [间距](SPACING.md) |
| `Grid` | 按容器分列 | 不固定卡片高度来对齐 | [间距](SPACING.md) |
| `Surface` | 一块表面分区 | 不是按钮；只放表格时用 `padding="none"` | [间距](SPACING.md) |
| `Toolbar` | 把一组控件放在一起 | 不伪装成需要方向键的 ARIA toolbar | [组件入口](README.md) |
| `Background` | 按角色铺场景底色或纹理 | 不创建主题根，不代替 `ThemeProvider` | [主题](../docs/THEMING.md) |
| `Button` | 执行动作 | 跳转用 `Link` 或 `ButtonLink`；busy 只防止重复点击，不表示业务成功 | [动作](../docs/BUTTON_ACTIONS.md) |
| `IconButton` | 有名称的图标动作 | 装饰图标用 `Icon`；不把名称只放在颜色里 | [常用契约](COMMON_COMPONENTS.md) |
| `Link` | 原生跳转或下载 | 不用于无地址的执行动作 | [常用契约](COMMON_COMPONENTS.md) |
| `ButtonLink` | 需要按钮外观的原生链接 | disabled 退出 Tab；不把它当普通按钮 | [紧凑组合](../docs/COMPACT_ACCOUNT_PATTERNS.md) |
| `Badge` | 只读短状态 | 不可点击；颜色必须配文字 | [组件入口](README.md) |

## 组件

控件自己有输入、选择、浮层、反馈或展示状态。数据和业务结果仍由宿主提供。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `TextField` | 单行输入 | 输入法组合期间不改写文本；不在组件内做业务校验 | [组件入口](README.md) |
| `Textarea` | 多行输入 | 不把长文截成单行字段 | [常用契约](COMMON_COMPONENTS.md) |
| `SearchField` | 提交一次搜索意图 | 远程搜索、防抖和过期结果由宿主处理 | [单搜索](../docs/SINGLE_SEARCH.md) |
| `NumberField` | 数值输入 | 不替宿主解释单位、币种或舍入 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `DateField` | 单个日期 | 不是日期范围；时区由宿主决定 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `DateRangePicker` | 选择一对日期 | 预设和自定义草稿的页面配方见日期筛选，不另做一个 `DateRangeFilter` 导出 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `Select` | 短列表原生单选 | 要搜索用 `Combobox`；多选和远程数据用各自契约；不支持 multiple | [组件入口](README.md) |
| `Combobox` | 可查询的候选 | 不是命令菜单；选择本身不保存表单 | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Checkbox` | 可独立取消的布尔或多项 | 不把选中当成已保存 | [常用契约](COMMON_COMPONENTS.md) |
| `RadioGroup` | 一组互斥选项 | 选项很少且要搜索时不用它代替 `Combobox` | [常用契约](COMMON_COMPONENTS.md) |
| `Switch` | 立即生效的开关 | 不混同账号选择或表单提交 | [常用契约](COMMON_COMPONENTS.md) |
| `SelectionCard` | 可取消的选择卡片 | 卡片内不再嵌按钮、链接或其他输入 | [组件入口](README.md) |
| `SegmentedControl` | 少量互斥视图或密度 | 不是导航；长列表用 `Tabs` 或 `Select` | [组件入口](README.md) |
| `Tabs` | 同一对象的几块内容 | 栏宽、等分和靠左分别判断，铺满不等于每项等宽 | [摘要页签](../docs/SUMMARY_TABS.md) |
| `TreeSelect` | 在树里选择节点 | 只读层级浏览用配方，不把本控件当成文件浏览器 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `RemoteMultiSelect` | 远程、可分页的多选 | 宿主拥有查询代次；完成选择只收起候选，不提交表单 | [远程分页](../docs/REMOTE_PAGINATION.md) |
| `Fieldset` | 给一组字段共同的名称 | 不代替逐字段错误 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `ErrorSummary` | 提交失败后的错误汇总 | 不清除字段上的错误，不把未知写成失败 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Dialog` | 必须完成或明确放弃的居中任务 | 需要旁边继续操作时用非模态结构，不把所有阅读改成 Dialog | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Drawer` | 保留当前上下文的侧边任务 | 位置不同不改变模态语义；按任务选择，不按习惯互换 | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `ConfirmDialog` | 破坏性或难撤销动作的确认 | 不用于普通保存成功 | [动作](../docs/BUTTON_ACTIONS.md) |
| `Popover` | 短的可操作详情 | 关键长任务用 Dialog；纯说明且非关键才考虑 Tooltip | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Menu` | 一组命令 | 不替代表单选择 | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Tooltip` | 简短、非关键说明 | 触屏必须能从别处得到同一信息；链接和长内容不用它 | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Toast` | 一条短暂通知 | 不建全局队列；错误不靠自动消失才被人看见 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Notice` | 留在页面上的状态说明 | 不把错误伪装成空数据 | [组件入口](README.md) |
| `Progress` | 已知或未知进度 | 不估算真实进度，不把动画结束当完成 | [组件入口](README.md) |
| `Skeleton` | 首次加载占位 | 刷新失败不能用骨架或空态替换已有内容 | [组件入口](README.md) |
| `Disclosure` | 就地展开补充内容 | 关闭内容退出键盘顺序；不是导航 | [组件入口](README.md) |
| `EmptyState` | 没有内容，或没有匹配 | 失败和权限不足用准确反馈，不用空态顶替 | [组件入口](README.md) |
| `Metric` | 一个当前事实 | 不把未知显示成 0；比较口径由宿主提供 | [指标比较](../docs/METRIC_COMPARISON.md) |
| `KeyValue` | 成对事实 | 不是历史；历史用时间轴 | [常用契约](COMMON_COMPONENTS.md) |
| `DataTable` | 表格展示宿主给的行 | 不本地排序或切片来冒充服务端结果；不是电子表格 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `Pagination` | 报告页码并回传翻页意图 | 不拉取全量后再本地分页 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `TrendChart` | 一条趋势 | 不引入图表引擎，不替宿主计算业务指标 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `StackedBar` | 构成比例 | 单次失败不自动变成整段失败；阈值由宿主决定 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `StatusTimeline` | 一段时间的状态证据 | 宿主提供判定和口径；组件不计健康分 | [时间轴组合](../docs/TIMELINE_COMPOSITION.md) |
| `TimelineLegend` | 说明时间轴颜色 | 颜色必须配文字；无参形式只兼容旧标签 | [时间轴组合](../docs/TIMELINE_COMPOSITION.md) |
| `MediaCard` | 媒体摘要 | 不解码或播放业务资产 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `MediaViewer` | 查看一块媒体 | 不提供通用播放器引擎 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `AppShell` | 应用外壳：栏、顶栏和正文 | 业务对象和权限留在宿主；不从 Web 外壳推导 iOS 导航 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `AppShellToggle` | 打开或关闭外壳的栏 | 不是独立导航组件 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `SideNav` | 应用内导航 | 禁用祖先时后代不可用；当前项只标记精确匹配 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Breadcrumbs` | 当前位置 | 不代替侧栏，不承载主任务 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Steps` | 分步进度 | 回退焦点和校验由宿主按契约处理；组件不自动提交 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `CopyButton` | 复制一段明确文本 | 失败要可见；不把复制成功写成业务保存成功 | [常用契约](COMMON_COMPONENTS.md) |
| `ThemePicker` | 选择已有主题 | 不保存偏好；存储由宿主决定 | [主题选择](../docs/THEME_PICKER.md) |
| `ThemePreview` | 并排看主题 | 不切换当前主题，除非宿主把选择接回 `ThemePicker` | [主题选择](../docs/THEME_PICKER.md) |

## 模式组件

这些导出自成一个任务组合，并管理该组合自己的焦点或收纳。能用上面的组件拼成的页面，不要再加同类导出。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `ListFilterBar` | 列表的搜索、少量条件和更多筛选 | 不是通用表单；查询、权限和结果由宿主拥有 | [筛选栏](../docs/LIST_FILTER_BAR.md) |
| `SettingsNavigation` | 设置弹层里按实际容器宽度切换窄选择和宽侧栏 | 不替代普通 `SideNav`；不在页面级导航里套用 | [设置](../docs/SETTINGS_DIALOG.md) |
| `MappingEditor` | 编辑稳定 id 的映射行 | 不提供模板库、权限或保存；模板页用现有组件组合 | [模板设置](../docs/TEMPLATE_SETTINGS.md) |
| `ResponsiveActions` | 容器变窄时收纳次要动作 | 不是另一个 Menu；宽容器仍直接显示主动作 | [自适应动作](../docs/RESPONSIVE_ACTIONS.md) |
| `StatusTimelineList` | 多条紧凑历史 | 单条时间轴用 `StatusTimeline`；规则和详情文案由宿主传入 | [时间轴组合](../docs/TIMELINE_COMPOSITION.md) |

## 模块

整块产品能力。从这里进入，不和按钮并列理解。

装饰艺术不表示任务已经就绪。聊天组件不请求、不鉴权、不证明投递成功。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `OrbitBackdrop` | 需要轨道装饰画布 | 不放进每个工作区；暂停和减少动态遵循自身契约 | [轨道](../docs/ORBIT_BACKDROP.md) |
| `NeutronStarBackdrop` | 需要中子星装饰 | 加载失败要有静态后备；不表示数据已就绪 | [中子星](../docs/NEUTRON_STAR_BACKDROP.md) |
| `ChatThread` | 一条可滚动的会话 | 不解析工具协议，不拥有消息服务 | [聊天](../docs/AGENT_CHAT.md) |
| `ChatCard` | 会话里的结构化卡片 | 大型可执行结果另开视图，不塞进卡片 | [聊天](../docs/AGENT_CHAT.md) |
| `ChatShell` | 聊天工作区的栏和插槽 | 列布局由 Shell 拥有，展台不要再盖一层网格 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `WorkspaceRail` | 工作区入口 | 不是应用级 `SideNav` | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `AgentList` | 受控的 Agent 列表 | 不提供团队计数或目录服务 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `AgentRow` | 列表中的一行 | 行内导航目标由宿主给定 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `ChatPane` | 头部、消息和输入的组合 | 不代替完整工作区外壳 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `ChatHeader` | 会话身份和详情入口 | 不展示未提供的权限或在线证明 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageList` | 宿主给出的消息序列 | 稳定 id 由宿主提供；不在渲染期间新建消息组件类型 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageBubble` | 默认气泡 | 特殊类型用 `MessageRenderer`，不要复制一套气泡 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageMeta` | 作者和时间 | 不把元信息重复进正文 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageContent` | 消息正文 | 不执行其中的工具或链接 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageActions` | 消息上的常驻动作 | 动作是否可用由宿主决定；不悬停才出现 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageStatus` | 加载、错误或未知 | 未知不是失败，也不要显示成成功 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageRenderer` | 按 agent 或 person 换呈现 | 未配置的类型回退默认气泡 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `DayDivider` | 日期分隔 | 无日期时不要造一条分隔 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `Composer` | 受控草稿和提交 | 不发送请求；失败草稿由宿主保留 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `AgentInspector` | 详情摘要 | 布局跟随 `ChatShell`；关闭后焦点归还 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `chatSessionReducer` | 宿主可选的纯状态转移 | 不接管网络、权限或存储 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `initialChatSessionState` | 上述状态的初始值 | 不是消息服务的会话 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |

## 配方

这些页面用现有导出组合。没有同名公共组件。

| 配方 | 使用边界 | 入口 |
| --- | --- | --- |
| 对象阅读 | 文件与笔记的居中阅读；不把所有 Drawer 改成 Dialog | [对象阅读](../docs/OBJECT_READING.md) |
| 紧凑账号 | 身份、额度和凭证动作；不缩掉关键数值 | [紧凑组合](../docs/COMPACT_ACCOUNT_PATTERNS.md) |
| 日期筛选 | 预设、草稿和确认；使用 `DateRangePicker`，没有单独导出 | [日期筛选](../docs/DATE_RANGE_FILTER.md) |
| 设置组合 | 草稿、栏目和有界滚动；导航宽度用 `SettingsNavigation` | [设置](../docs/SETTINGS_DIALOG.md) |
| 自动化卡片 | 持久意图和未知写入；组件不保存 | [自动化](../docs/AUTOMATION_SETTINGS.md) |
| 周期报告 | 证据和跨日来源；日期与生成由宿主拥有 | [周期报告](../docs/PERIODIC_REPORTS.md) |
| 常驻层级树 | 只读浏览；不是新的 Tree 导出 | [常驻树](../docs/RESIDENT_TREE.md) |
| 插件卡片 | 摘要卡加密集配置；不新增卡片组件 | [插件卡片](../docs/PLUGIN_CARD_COMPOSITION.md) |

## 独立包入口

不从主入口导入，也不计入上面的行。

| 入口 | 内容 | 契约 |
| --- | --- | --- |
| `@linhey/rhine-design/theme` | `ThemeProvider`、`useTheme`、主题元数据 | [主题](../docs/THEMING.md) |
| `@linhey/rhine-design/review` | 产品场景评审外壳 | [评审工具](../docs/REVIEW_TOOL.md) |
| `@linhey/rhine-design/review/vite` | Node 侧评审构建辅助 | [评审工具](../docs/REVIEW_TOOL.md) |
| `@linhey/rhine-design/tokens.css` 与主题 CSS | 变量和主题样式 | [主题](../docs/THEMING.md) |

`preview/` 里的页面、启动编排和内部绘制器不是公共组件。产品页面和业务政策留在消费项目。
