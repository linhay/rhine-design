# 莱茵设计 · 常用组件契约

本文件定义[莱茵设计](../README.md)的常用组件契约。先固定契约和组件展台，再验证；默认优先复用本目录，页面先改设计稿，再按授权接入App。具体业务由宿主定义，不进入通用契约。

## 导航与流程能力（0.4.0）

SideNav、Breadcrumbs、Steps、Drawer、Fieldset、ErrorSummary、StatusTimeline、TimelineLegend 的 API、键盘与场景契约见[交互选型](../docs/INTERACTION_PATTERNS.md)。0.4.0 共48个导出组件；下表保留原24个扩展组件的契约。0.5.0 新增11个组件及DataTable/Pagination扩展，见[应用组件契约](../docs/APPLICATION_COMPONENTS.md)。

## 范围与契约

| 组件 | 最小职责与边界 |
| --- | --- |
| Metric | 标题、值、单位、说明、loading/unknown；不计算或格式化金额 |
| KeyValue | 原生dl键值信息；值允许换行，不隐藏长标识 |
| DataTable | 原生表格、caption、行键、列定义、加载/空/失败、排序事件；不本地筛选排序分页 |
| Pagination | 受控页码、总数、每页大小、加载禁用；总数未知时只依赖hasNext |
| Link | 原生链接，区分跳转与按钮动作，外部新窗口标识 |
| Icon / IconButton | 少量常用16/20px线性图标、44px操作目标、可访问名称 |
| CopyButton | 显式点击后复制；等待真实Promise成功才提示，失败可重试；可注入原生clipboard适配器 |
| Checkbox | 原生复选框、混合态、label/hint；选中由调用方控制 |
| Checkbox `layout="row"`（自 0.10.0） | 侧栏整行选择，名称/说明同列、对称内距与主题选中/焦点；默认 form 不变，见[双行多选契约](../docs/CHECKBOX_ROWS.md) |
| RadioGroup | fieldset/legend与原生radio，独立组名、禁用项、键盘导航 |
| Switch | 原生checkbox加switch语义；只用于二元偏好，不替代账号选择 |
| Textarea | 可见label、hint/error、只读/禁用；允许垂直调整，不做富文本 |
| SearchField | 受控输入；提交/清空事件；中文输入法组合中不提交，不触发隐式全量本地过滤 |
| Combobox | 受控查询与选中值；候选由调用方返回；方向键/Enter/Escape，IME保护，加载/无结果/错误 |
| Tooltip | 鼠标与键盘说明、Escape、可悬停；不可放交互控件或关键信息 |
| Toast | 单条通知、关闭；成功可定时、警告错误持久；hover/focus/页面隐藏暂停计时，无全局队列 |
| Dialog / ConfirmDialog | 标题描述、焦点限制及归还、Escape、滚动；确认默认聚焦取消，异步失败保留内容 |
| Popover | 按钮触发非模态详情、边缘避让、Escape与焦点归还；不替代Tooltip |
| Menu | 操作项/禁用/危险项；方向键/Home/End/输入字符跳转；不是表单选择器 |
| Divider / Stack / Inline / Grid | 语义分隔线、纵排、可换行横排、自适应网格；只消费间距tokens |

上表以早期 V1.4 文档的 24 个扩展组件为基础，当时与已有 16 个合计 40 个；V1.4 是历史文档阶段编号，不是 npm 包版本。当前完整清单与版本边界见[组件入口](README.md)。复杂浮层使用Radix无样式基础，避免维护重复焦点/菜单/碰撞实现；样式由Rhine Design定义。原生表单、数据与布局不引入额外框架。

## 动效与状态

补充参考：[Transitions.dev UX与动效映射](./MOTION.md)。方向感知菜单、内容衔接与结果淡入已在`#motion`展台提供播放/重播候选；尚未推广到通用默认或App，以下为现有组件基线。

- 输入/按钮/选择器沿用120ms交互；Switch滑块120ms，不延迟checked；焦点即时。
- 浮层进入160ms，opacity与最多3px位移；模态缩放不作用于文字。关闭立即恢复焦点，不等待退出动画。Tooltip延迟300ms，focus无需等待；减少动态去除视觉过渡。
- Toast进入180ms，成功默认5秒后关闭；计时与视觉动画独立，减少动态不使通知瞬间消失。
- 指标不滚动计数，表格不做逐行飞入。加载保留已有数据，未知不显示0；分页动作不移动键盘焦点。
- Portal浮层保持同一字体、颜色与减少动态偏好；在嵌套Dialog内的浮层不得被底层页面遮挡。

## 接入契约

统一从 套件的`components/index.ts` 导入，并在页面根部使用 `.rhine-theme`。主题根不要放在带transform、overflow裁剪或contain的局部面板；浮层挂到最近主题根，保持token和减少动态偏好。Dialog、Popover、Menu的trigger与Tooltip的children必须是单个可聚焦、可接收ref和事件的元素；使用Button/IconButton即可。Dialog受控时必须同时传open与onOpenChange。分栏的sidePanel可传ReactNode，或传`closeButton => ReactNode`将关闭按钮放进侧栏导航；函数模式必须展示传入按钮，不能复制第二个关闭入口。

```tsx
<Stack gap={4}>
  <Grid minWidth={180}>
    <Metric label="请求次数" value={stats?.requests ?? null} />
    <Metric label="预估费用" value={formattedCost} description="包含未计价请求" />
  </Grid>
  <DataTable caption="请求明细" rows={rows} rowKey={row => row.id}
    columns={columns} loading={loading} error={error}
    sort={sort} onSortChange={requestSort} onRetry={reload} />
  <Pagination page={page} pageSize={10} total={total}
    loading={loading} onPageChange={requestPage} />
</Stack>
```

示例中的数据与回调由业务层提供。DataTable的columns使用`key/header/render`，可指定`align`与`sortable`；排序回传`{key, direction: 'asc' | 'desc'}`，不会改动rows。Pagination的page从1开始，pageSize须为正整数；total未知时省略并传hasNext，不臆造页数。KeyValue使用`items[{key,label,value}]`；Metric的null/undefined显示未知，0原样保留。

- SearchField传`value/onValueChange/onSearch`；Enter或搜索按钮提交，清空回传空查询。Combobox传`query/onQueryChange/value/onValueChange/options`；options为`{value,label,disabled?}`，查询输入与选中ID分开管理。业务层负责服务端搜索、防抖、取消与过期结果保护，组件不拉全量过滤。
- Checkbox接受原生input属性及indeterminate；混合状态在点击后应由调用方重算，不使用readOnly模拟锁定（原生checkbox无只读行为）。RadioGroup与Switch都是受控，Textarea沿用原生readOnly和disabled语义。
- CopyButton接受`value/label/copy?`，copy适配器返回Promise。等待成功后提示；value变化后忽略旧请求结果，错误不暴露异常正文。宿主原生平台接入应提供平台适配器并做真实剪贴板验收。
- ConfirmDialog的`onConfirm`返回void或Promise；等待时阻止再次确认、取消和Escape，成功后关闭，失败保留内容供重试。任务超时/取消能力由业务回调负责，不让Promise无限悬挂。默认焦点在取消按钮。
- Toast由`open/onOpenChange/title/description/tone/duration`控制；默认5秒，duration≤0常驻，warning/error始终常驻。重复打开同一条已打开通知不会重置计时；要作为新通知应更换key或先关闭。不要把凭证、异常正文等敏感数据放进通知。
- Stack/Inline/Grid的gap取`1/2/3/4/6/8/12`，对应间距token；Grid的minWidth以px计，窄容器自动收缩。Icon的name使用导出IconName类型，不以自由文本插入SVG。

## 设计展台验收

展台使用当前源码的真实组件；本页重点覆盖数据、表单、操作/布局、反馈/浮层四组。合成数据只演示事件与状态；Clipboard仅复制明确的演示字符串。测试覆盖分页边界、请求状态、异步复制失败、IME、候选列表、通知计时、浮层焦点/Escape与窄窗；原生宿主原生平台和屏幕阅读器仍需App接入后单独验收。

Toast 浮动通知（自 0.11.0，npm 0.10.0 不含，见[版本记录](../CHANGELOG.md#01102026-10-27)）：`placement="floating"` 通过 Portal 挂到最近主题根，位于视口右下角，距边缘 16px、最大宽度 400px，窄窗两侧各留 16px。默认 inline 行为保持；浮动通知不占内容流、不抢焦点，关闭后不拦截点击；继承主题与减少动态。反馈展台使用浮动模式。成功沿用 5 秒关闭及悬停/聚焦/隐藏暂停，关键错误仍持久。
