# Web 组件目录

分类顺序对标 [Ant Design 组件总览](https://ant.design/components/overview-cn/)：通用、布局、导航、数据录入、数据展示、反馈、其他。这是查找分类，不是兼容实现，也不复制上游 API。

展台侧栏按上述分类提供真实样例，并收纳原有章节。覆盖标签只表示本库契约内的对应能力，不表示与上游 API 等价。

本表只对应 `components/index.ts` 的值导出。类型、CSS 和独立包入口另列。安装包以实际导出为准。源码有一行，不表示 npm 已发布该能力。历史版本数量保留在 [CHANGELOG](../CHANGELOG.md)，本表不维护一个总数。

新增默认写成模式配方和展台。只有组件自己管理焦点、请求代次、计时或清理时，才新增公共导出。已经公开的导出保持公开。

Web 与 iOS 分开。本表不要求 UIKit 补齐同名控件。

## 通用

按钮、图标和排版。它们不拥有页面任务的草稿、查询或保存结果。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `Button` | 执行动作 | 跳转用 `Link` 或 `ButtonLink`；busy 只防止重复点击，不表示业务成功 | [动作](../docs/BUTTON_ACTIONS.md) |
| `IconButton` | 有名称的图标动作 | 装饰图标用 `Icon`；不把名称只放在颜色里 | [常用契约](COMMON_COMPONENTS.md) |
| `Icon` | 辅助识别或显式具名静态图形 | 动作用具名IconButton；未知name不静默降级 | [图标语义](../docs/ICONS.md) |
| `iconNames` | 校验与枚举同源只读图标名称 | 不修改数组或伪造兼容别名 | [图标语义](../docs/ICONS.md) |
| `PlatformMark` | macOS/Windows平台指示 | 不代替完整平台文字、不探测系统或执行下载 | [平台标记](../docs/PLATFORM_MARKS.md) |
| `Text` | 表达文字层级、语气和数字 | 视觉层级不决定 HTML 语义，不截断或换算业务数值 | [字体](TYPOGRAPHY.md) |
| `ResponsiveActions` | 容器变窄时收纳次要动作 | 不是另一个 Menu；宽容器仍直接显示主动作 | [自适应动作](../docs/RESPONSIVE_ACTIONS.md) |
| `Logo` | 放置三角构架标志 | 不接收点击，不代替页面标题，变色不等于整套深色主题 | [品牌标志](README.md#品牌标志) |
| `CopyButton` | 复制一段明确文本 | 失败要可见；不把复制成功写成业务保存成功 | [常用契约](COMMON_COMPONENTS.md) |
| `FloatButton` | 固定在区域角上的动作 | 不表示业务成功；需要跟随页面滚动时不用它 | [组件入口](README.md) |

## 布局

分隔、间距、按最小宽度分列与可选 24 栏、瀑布流和可拖动分隔。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `Divider` | 分隔同一组内容 | 不承载点击或状态 | [间距](SPACING.md) |
| `Stack` | 纵向间距 | 不自动成为卡片或表单 | [间距](SPACING.md) |
| `Inline` | 横向间距，动作并排 | 不保证窄容器不换行 | [间距](SPACING.md) |
| `Grid` | 按容器分列 | 不固定卡片高度来对齐 | [间距](SPACING.md) |
| `Surface` | 一块表面分区 | 不是按钮；只放表格时用 `padding="none"` | [间距](SPACING.md) |
| `Toolbar` | 把一组控件放在一起 | 不伪装成需要方向键的 ARIA toolbar | [组件入口](README.md) |
| `Background` | 按角色铺场景底色或纹理 | 不创建主题根，不代替 `ThemeProvider` | [主题](../docs/THEMING.md) |
| `AppShell` | 应用外壳：栏、顶栏和正文 | 业务对象和权限留在宿主；不从 Web 外壳推导 iOS 导航 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `AppShellToggle` | 打开或关闭外壳的栏 | 不是独立导航组件 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `OrbitBackdrop` | 需要轨道装饰画布 | 不放进每个工作区；暂停和减少动态遵循自身契约 | [轨道](../docs/ORBIT_BACKDROP.md) |
| `NeutronStarBackdrop` | 需要中子星装饰 | 加载失败要有静态后备；不表示数据已就绪 | [中子星](../docs/NEUTRON_STAR_BACKDROP.md) |
| `ChatShell` | 聊天工作区的栏和插槽 | 列布局由 Shell 拥有，展台不要再盖一层网格 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `WorkspaceRail` | 工作区入口 | 不是应用级 `SideNav` | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `ChatPane` | 头部、消息和输入的组合 | 不代替完整工作区外壳 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `Masonry` | 按列排布高度不一的卡片 | 不虚拟化，不保证阅读顺序等于视觉列序 | [组件入口](README.md) |
| `Splitter` | 在两块内容之间调整比例 | 不保存布局，不代替页面级导航 | [组件入口](README.md) |
| `Flex` | 按方向、间距和换行排列 | 不代替 `Stack` / `Inline` 的既有页面间距 | [组件入口](README.md) |
| `Columns` | 24 栏栅格容器 | 不代替按最小宽度分列的 `Grid` | [组件入口](README.md) |
| `Column` | 在 24 栏里占若干栏 | 不单独使用，必须放在 `Columns` 内 | [组件入口](README.md) |

## 导航

当前位置、应用导航、步骤、页签、分页和页内锚点。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `Breadcrumbs` | 当前位置 | 不代替侧栏，不承载主任务 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `SideNav` | 应用内导航 | 禁用祖先时后代不可用；当前项只标记精确匹配 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Menu` | 一组命令 | 不替代表单选择，也不当作导航菜单 | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Steps` | 分步进度 | 回退焦点和校验由宿主按契约处理；组件不自动提交 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Tabs` | 同一对象的几块内容 | 栏宽、等分和靠左分别判断，铺满不等于每项等宽 | [摘要页签](../docs/SUMMARY_TABS.md) |
| `Pagination` | 报告页码并回传翻页意图 | 不拉取全量后再本地分页 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `Link` | 原生跳转或下载 | 不用于无地址的执行动作 | [常用契约](COMMON_COMPONENTS.md) |
| `ButtonLink` | 需要按钮外观的原生链接 | disabled 退出 Tab；不把它当普通按钮 | [紧凑组合](../docs/COMPACT_ACCOUNT_PATTERNS.md) |
| `SettingsNavigation` | 设置弹层里按实际容器宽度切换窄选择和宽侧栏 | 不替代普通 `SideNav`；不在页面级导航里套用 | [设置](../docs/SETTINGS_DIALOG.md) |
| `Anchor` | 链接到同一页的标题并标出当前可见项 | 不改变路由，不代替侧栏 | [组件入口](README.md) |
| `NavigationMenu` | 横向或纵向原生导航链接 | 命令用 `Menu`；路由归宿主，不模拟 Ant Menu 的全部模式 | [新增契约](PROVIDED_COMPONENTS.md) |
| `Dropdown` | 从按钮打开一组操作并在选择后关闭 | 不保存，不代替导航菜单 | [组件入口](README.md) |

## 数据录入

输入、选择、筛选、级联、颜色、评分、滑动条、时间和本地文件。数据和上传结果仍由宿主提供。

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
| `TreeSelect` | 在树里选择节点 | 默认内联，presentation=dropdown 提供下拉；不把它当成文件服务 | [应用组件](../docs/APPLICATION_COMPONENTS.md)  / [交互增量](../docs/INTERACTION_CONTRACTS.md) |
| `RemoteMultiSelect` | 远程、可分页的多选 | 宿主拥有查询代次；完成选择只收起候选，不提交表单 | [远程分页](../docs/REMOTE_PAGINATION.md)  / [交互增量](../docs/INTERACTION_CONTRACTS.md) |
| `Fieldset` | 给一组字段共同的名称 | 不代替逐字段错误 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `ErrorSummary` | 提交失败后的错误汇总 | 不清除字段上的错误，不把未知写成失败 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `ListFilterBar` | 列表的搜索、少量条件和更多筛选 | 不是通用表单；查询、权限和结果由宿主拥有 | [筛选栏](../docs/LIST_FILTER_BAR.md) |
| `MappingEditor` | 编辑稳定 id 的映射行 | 不提供模板库、权限或保存；模板页用现有组件组合 | [模板设置](../docs/TEMPLATE_SETTINGS.md) |
| `Composer` | 受控草稿和提交 | 不发送请求；失败草稿由宿主保留 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `Cascader` | 沿层级选择一个路径 | 不保存，不代替树的只读浏览 | [组件入口](README.md) |
| `ColorPicker` | 选择一个色值 | 不写入主题，不把颜色当作唯一状态 | [组件入口](README.md) |
| `Mentions` | 在文本中插入一个提及 | 不发送消息，不查询人员服务 | [组件入口](README.md) |
| `Rate` | 选择一个分数 | 不提交评价 | [组件入口](README.md) |
| `Slider` | 在范围内调整一个数值，可配人类刻度 | 不保存或默默夹紧非法宿主值 | [范围契约](../docs/INTERACTION_CONTRACTS.md#slider与rangeslider) |
| `RangeSlider` | 同轨道受控双阈值、间距及两端键盘操作 | 不代替宿主业务联动或服务端校验 | [范围契约](../docs/INTERACTION_CONTRACTS.md#slider与rangeslider) |
| `TimePicker` | 选择当天时间 | 时区由宿主决定，不是日期 | [组件入口](README.md) |
| `Transfer` | 在可选和已选之间移动项 | 不请求远程数据 | [组件入口](README.md) |
| `Upload` | 选择本地文件并允许移除 | 不上传，不表示保存成功 | [组件入口](README.md) |
| `AutoComplete` | 输入时从给定候选补全，也允许自定义文本 | 不查询远程服务 | [组件入口](README.md) |
| `Form` | 把提交交给宿主 | 不接管字段校验，不清除输入 | [组件入口](README.md) |

## 数据展示

只读事实、表格、媒体、头像、日历、轮播、标签、二维码、引导和虚拟列表。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `Badge` | 只读短状态 | 不可点击；颜色必须配文字；不是计数徽标 | [组件入口](README.md) |
| `SegmentedControl` | 少量互斥视图或密度 | 不是导航；长列表用 `Tabs` 或 `Select` | [组件入口](README.md) |
| `Disclosure` | 就地展开补充内容 | 关闭内容退出键盘顺序；不是导航 | [组件入口](README.md) |
| `EmptyState` | 没有内容，或没有匹配 | 失败和权限不足用准确反馈，不用空态顶替 | [组件入口](README.md) |
| `Metric` | 一个当前事实 | 不把未知显示成 0；比较口径由宿主提供 | [指标比较](../docs/METRIC_COMPARISON.md) |
| `KeyValue` | 成对事实 | 不是历史；历史用时间轴 | [常用契约](COMMON_COMPONENTS.md) |
| `DataTable` | 表格展示宿主给的行 | 不本地排序或切片来冒充服务端结果；不是电子表格 | [应用组件](../docs/APPLICATION_COMPONENTS.md)  / [交互增量](../docs/INTERACTION_CONTRACTS.md) |
| `TrendChart` | 完整或公开紧凑趋势，保留原始采样入口 | 不引入图表引擎，不替宿主计算业务指标 | [应用组件](../docs/APPLICATION_COMPONENTS.md)、[紧凑趋势](../docs/COMPACT_TREND.md) |
| `StackedBar` | 构成比例 | 单次失败不自动变成整段失败；阈值由宿主决定 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `StatusTimeline` | 一段时间的状态证据 | 宿主提供判定和口径；组件不计健康分，也不改成事件轴 | [时间轴组合](../docs/TIMELINE_COMPOSITION.md) |
| `TimelineLegend` | 说明时间轴颜色 | 颜色必须配文字；无参形式只兼容旧标签 | [时间轴组合](../docs/TIMELINE_COMPOSITION.md) |
| `StatusTimelineList` | 多条紧凑历史 | 单条时间轴用 `StatusTimeline`；规则和详情文案由宿主传入 | [时间轴组合](../docs/TIMELINE_COMPOSITION.md) |
| `MediaCard` | 媒体摘要 | 不解码或播放业务资产 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `MediaViewer` | 查看一块媒体 | 不提供通用播放器或图片预览组 | [应用组件](../docs/APPLICATION_COMPONENTS.md) |
| `Popover` | 短的可操作详情 | 关键长任务用 Dialog；纯说明且非关键才考虑 Tooltip | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `Tooltip` | 非关键的短文本或结构化只读数据行 | 触屏从常驻处取得同一信息；交互与长阅读使用Popover/Dialog | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `ChatThread` | 一条可滚动的会话 | 不解析工具协议，不拥有消息服务 | [聊天](../docs/AGENT_CHAT.md) |
| `ChatCard` | 会话里的结构化卡片 | 大型可执行结果另开视图，不塞进卡片 | [聊天](../docs/AGENT_CHAT.md) |
| `AgentList` | 受控的 Agent 列表 | 不提供团队计数或目录服务 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `AgentRow` | 列表中的一行 | 行内导航目标由宿主给定 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `ChatHeader` | 会话身份和详情入口 | 不展示未提供的权限或在线证明 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageList` | 宿主给出的消息序列 | 稳定 id 由宿主提供；不在渲染期间新建消息组件类型 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageBubble` | 默认气泡 | 特殊类型用 `MessageRenderer`，不要复制一套气泡 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageMeta` | 作者和时间 | 不把元信息重复进正文 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageContent` | 消息正文表面 | 只读Markdown可组合RichText；不执行工具或代码 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `RichText` | 有界只读Markdown、字面高亮与原文复制 | 不执行HTML/脚本、不拉远程图或全量消息 | [只读富文本](../docs/RICH_TEXT.md) |
| `MessageActions` | 消息上的常驻动作 | 动作是否可用由宿主决定；不悬停才出现 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageStatus` | 加载、错误或未知 | 未知不是失败，也不要显示成成功 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `MessageRenderer` | 按 agent 或 person 换呈现 | 未配置的类型回退默认气泡 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `DayDivider` | 日期分隔 | 无日期时不要造一条分隔 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `AgentInspector` | 详情摘要 | 布局跟随 `ChatShell`；关闭后焦点归还 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `chatSessionReducer` | 宿主可选的纯状态转移 | 不接管网络、权限或存储 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `initialChatSessionState` | 上述状态的初始值 | 不是消息服务的会话 | [Chat 基石](../docs/CHAT_FOUNDATION.md) |
| `Avatar` | 用图片或名称首字表示身份 | 图片失败不留破图；不是账号状态 | [组件入口](README.md) |
| `Calendar` | 在月历中选择日期 | 不选择时间，不保存日程 | [组件入口](README.md) |
| `Carousel` | 在已有内容间切换 | 默认不自动播放，不表示加载 | [组件入口](README.md) |
| `VirtualList` | 只渲染长列表的可见行 | 不排序，不代替分页 | [组件入口](README.md) |
| `QRCode` | 为短文本生成可展示的码 | 上限78 UTF-8字节；独立解码验证，不代表所有手机相机通过 | [组件入口](README.md) |
| `Tag` | 可移除的文字标签 | 颜色不单独表达状态；不是徽标 | [组件入口](README.md) |
| `Tour` | 逐步说明界面 | Escape 关闭；不保存进度，不代替必读错误 | [组件入口](README.md) |
| `Card` | 一块带标题的内容 | 无标题表面仍用 `Surface` | [组件入口](README.md) |
| `Collapse` | 多组展开，可只保留一组 | 单组补充仍用 `Disclosure` | [组件入口](README.md) |
| `Descriptions` | 成组展示标签和值 | 单对事实仍用 `KeyValue` | [组件入口](README.md) |
| `Image` | 查看一张图片的预览 | 不解码业务资产 | [组件入口](README.md) |
| `List` | 展示宿主给出的列表项 | 不请求、不排序 | [组件入口](README.md) |
| `EventTimeline` | 按时间排列事件 | 不代替时段证据 `StatusTimeline` | [组件入口](README.md) |
| `Tree` | 受控展开/选择、只读节点槽及移动提案 | 不提供文件服务或持久化；下拉树选择用TreeSelect | [树交互](../docs/TREE.md) |
| `CountBadge` | 在动作旁显示数量和文字 | 颜色不单独表达数量；短状态仍用 `Badge` | [组件入口](README.md) |

## 反馈

必须停留、短暂出现、表示进度、结果或水印的反馈。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `Notice` | 留在页面上的状态说明 | 不把错误伪装成空数据 | [组件入口](README.md) |
| `Dialog` | 必须完成或明确放弃的居中任务 | 需要旁边继续操作时用非模态结构，不把所有阅读改成 Dialog | [浮层](../docs/FLOATING_OVERLAYS.md)  / [交互增量](../docs/INTERACTION_CONTRACTS.md) |
| `Drawer` | 保留当前上下文的侧边任务 | 位置不同不改变模态语义；按任务选择，不按习惯互换 | [浮层](../docs/FLOATING_OVERLAYS.md) |
| `ConfirmDialog` | 破坏性或难撤销动作的确认 | 不用于普通保存成功；也不是气泡确认 | [动作](../docs/BUTTON_ACTIONS.md) |
| `Toast` | 一条短暂通知 | 不建全局队列；错误不靠自动消失才被人看见 | [场景交互](../docs/INTERACTION_PATTERNS.md) |
| `Progress` | 已知或未知进度 | 不估算真实进度，不把动画结束当完成 | [组件入口](README.md) |
| `Skeleton` | 首次加载占位 | 刷新失败不能用骨架或空态替换已有内容 | [组件入口](README.md) |
| `Result` | 展示完成、失败或需要处理的结果文字 | 不代表业务已经成功 | [组件入口](README.md) |
| `Spin` | 用可见文字表示正在进行 | 不估算进度，不代替失败说明 | [组件入口](README.md) |
| `Watermark` | 在内容上重复一段文字 | 不拦截点击，不保护内容 | [组件入口](README.md) |
| `Message` | 由宿主放置并关闭的一条提示 | 不建立全局队列 | [组件入口](README.md) |
| `Notification` | 留在页面上直到明确关闭的通知 | 不自动排队，不代替必读错误 | [组件入口](README.md) |
| `Popconfirm` | 在触发处确认一个动作 | 破坏性对话框仍用 `ConfirmDialog` | [组件入口](README.md) |

## 其他

主题配置、粘住、应用边界和装饰边框。不建立全局提示队列。

| 导出 | 何时用 | 何时不用 | 契约 |
| --- | --- | --- | --- |
| `ThemePicker` | 选择已有主题 | 不保存偏好；存储由宿主决定 | [主题选择](../docs/THEME_PICKER.md) |
| `ThemePreview` | 并排看主题 | 不切换当前主题，除非宿主把选择接回 `ThemePicker` | [主题选择](../docs/THEME_PICKER.md) |
| `Affix` | 在滚动容器内保持一段内容可见 | 不固定到整个视口，不遮挡主操作 | [组件入口](README.md) |
| `App` | 划定一块命名区域 | 不创建全局提示队列，不代替 `ThemeProvider` | [组件入口](README.md) |
| `BorderBeam` | 给一块内容加装饰边框 | 不表示加载或成功 | [组件入口](README.md) |
| `ConfigProvider` | 给一块区域提供密度等局部配置 | 不切换主题，不代替 `ThemeProvider` | [组件入口](README.md) |
| `Util` | classNames 与数值 clamp 纯工具 | 不做 DOM、主题或业务数据管理 | [新增契约](PROVIDED_COMPONENTS.md) |
| `useConfig` | 读取当前配置边界的密度 | 没有 Provider 时使用常规密度 | [组件入口](README.md) |

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
