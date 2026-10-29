# 应用组件与状态契约

本页对应 GitHub issues [#1](https://github.com/linhay/rhine-design/issues/1)、[#2](https://github.com/linhay/rhine-design/issues/2)、[#3](https://github.com/linhay/rhine-design/issues/3)、[#4](https://github.com/linhay/rhine-design/issues/4)、[#5](https://github.com/linhay/rhine-design/issues/5)、[#6](https://github.com/linhay/rhine-design/issues/6)。新增 11 个组件，公共组件总数为 59。

**版本边界：以下 API 自 0.5.0 提供，npm 0.4.0 不含这些能力。** 本次不改变现有组件必填参数；DataTable/Pagination 的参数均为新增可选项。使用 `npm install --save-exact @linhey/rhine-design@0.5.0` 并提交 lockfile。组件库升级不代表消费应用已经迁移。

公开类型从包主入口导出，真实实现是 API 权威：`Background.tsx`、`AppShell.tsx`、`AdvancedForms.tsx`、`Media.tsx`、`Data.tsx`。兼容范围沿用 React 19 + Vite；native WebView、其他构建器、SSR 和屏幕阅读器组合需消费项目另行验证。无需新增依赖。

2026-10-24 已对全部新增组件及扩展逐项核对 Ant Design / MUI 官方 API 与交互，修复与保留差异见[对标清单](ANTD_MUI_AUDIT.md)。以下契约包含本轮补齐；原有必填参数保持兼容。

## 背景层级

| 区域 | token / API | 规则 |
| --- | --- | --- |
| 应用画布 | `--rhine-canvas-bg`，`roleTone="canvas"` | 整体底色，允许主题纹理 |
| 正文区域 | `--rhine-content-bg`，`roleTone="content"`（默认） | 默认纯色；显式 `decoration="theme"` 可启用主题纹理 |
| 全局 / 上下文 / 辅助侧栏 | `--rhine-sidebar-bg`，`roleTone="sidebar"` | 不透明纯色，边界使用 `--rhine-line` |
| 卡片 / 表单 | `--rhine-surface-bg`，`roleTone="surface"` | 不透明阅读表面，默认无纹理 |
| 弹窗 / 浮层 | `--rhine-overlay-bg`，`roleTone="overlay"` | 默认无纹理，遮罩独立使用 `--rhine-backdrop-bg` |
| 图片 / 视频 | `--rhine-media-bg`，`roleTone="media"` | 中性深色底与配套浅色文字，默认无纹理 |

纸面默认无纹理；战术终端使用 32px 低对比网格；橙趣使用 14px 点阵。主题统一提供 `--rhine-background-texture`、`--rhine-background-scale`、`--rhine-background-mark`，无需消费者复制渐变。`decoration="auto"` 为默认值，仅 canvas 使用主题纹理，正文和 AppShell 默认纯色。`theme` 显式启用主题纹理，`none` 关闭本区域装饰，主题切换不会重新启用它。Background 另提供 surface/overlay/media 场景及局部 appearance 覆盖，完整六场景配置见[主题契约](THEMING.md#场景背景050)。

`decoration` 默认 `auto`，仅画布默认跟随主题纹理，AppShell 正文默认纯色。`appearance` 支持局部底色、文字色、纹理与尺寸覆盖，完整变量及优先级见[场景背景配置](THEMING.md#场景背景050)。展台 `#backgrounds` 仅展示当前主题，随右上角选择器同步切换。

```tsx
import { Background, Surface } from '@linhey/rhine-design';
import { ThemeProvider } from '@linhey/rhine-design/theme';

<ThemeProvider defaultTheme="neo-brutalism">
  {/* 用 Background 替换原本 background: var(--rhine-bg) 的正文 div。 */}
  <Background roleTone="content">
    <Surface>不透明的内容卡片</Surface>
  </Background>
</ThemeProvider>
```

背景直接绘制在元素上，无伪元素、无点击拦截层、无 transform/contain/position 副作用。纹理从该区域左上角开始，`background-attachment: scroll` 固定在滚动容器的框上：滚动其内部内容时图案不重置、不跟随内容漂移；外层移动整个区域时背景随框移动。各独立区域拥有独立原点，不承诺跨两个元素接缝完全对齐。使用 CSS 默认背景裁剪；内容和焦点在背景上方，裁剪、滚动和 Portal 不受 Background 改变。背景无动画，也无需嵌套 ThemeProvider。

## 三种外壳布局

### 内联控制按钮（0.8.0）

默认 `controls="header"` 保持既有顶部操作栏。宿主已有页面导航栏时可用 `controls="inline"`：没有 `header` 内容就不生成顶部横栏。将 `AppShellToggle placement="panel"` 放入侧栏品牌区，将对应的 `placement="content"` 放入正文导航栏；每个面板各放一对。`panel` 默认 navigation，可选 secondary；`iconOnly` 使用已有 IconButton。不要另写折叠状态、复制 Drawer 或用 CSS 隐藏默认横栏。

展开桌面面板时只显示品牌区的收起按钮；收起后正文显示展开按钮；窄窗正文按钮打开 Drawer，抽屉使用已有关闭按钮。`content` 控制保留挂载以归还焦点，`panel` 控制随内联面板隐藏。正文入口必须放在始终可达的位置（推荐使用 `contentHeader` 导航插槽），即使切换页面也要保留。折叠/展开与断点变化迁移键盘焦点，Drawer 继续负责 Escape 与焦点约束。控件没有异步、加载或错误状态，不把业务 busy 绑定到导航。

```tsx
<AppShell controls="inline" layout="single"
  navigation={{ label: '导航', open, onOpenChange: setOpen,
    content: <><div>Workspace <AppShellToggle placement="panel" iconOnly /></div><Navigation /></> }}
  contentHeader={<nav aria-label="工作区导航"><Inline>
    <AppShellToggle placement="content" iconOnly /><h1>{pageTitle}</h1>{actions}
  </Inline></nav>}>
  <Content />
</AppShell>
```

仅含动作的顶部可选 `collapseEmptyContentHeader`（未发布，默认false），直传恢复控件与条件动作，按hidden可见性折叠；具体结构限制和设置页组合见[设置页组合](SETTINGS_DIALOG.md#设置页组合53未发布)。

### 工作区导航栏（0.8.0）

参考 [Ant Design Layout](https://ant.design/components/layout/) 的 Header / Sider / Content 分工与 [MUI App Bar](https://mui.com/material-ui/react-app-bar/) 的标题、导航和操作组合，工作区顶部承载当前位置与导航入口。用可选 `contentHeader` 将导航栏放在正文滚动区外，与侧栏并列；它不会随正文滚走，不需要宿主另写 sticky。既有 `header` 仍位于整个外壳顶部，不传新插槽时保持原有行为。

展台左侧显示全局导航入口与当前页标题，右侧显示上下文目录与工作区信息；桌面侧栏展开时入口由品牌区承担，收起后恢复到导航栏，窄窗使用菜单图标打开 Drawer。标题允许换行，操作保留命中尺寸；正文的草稿状态和业务操作留在正文。底色与分隔线随三主题变化，橙趣使用墨色粗线，战术使用信号色边界。

平级工作区不强制 Breadcrumbs；当前页只保留一个可访问的 h1，正文不再重复标题。此处依据用户“这是导航区”的纠正，替代旧展台仅有状态/操作行的组合；没有导航栏需求的宿主仍可省略 `contentHeader`。真实父子层级可按需组合 Breadcrumbs，展台自身的章节路径不属于产品平级工作区。

验收包括三主题 × 400/520/880px 长标题无横向溢出、200% CSS zoom 重排、正文滚动时导航栏位置不变、侧栏展开/收起及焦点归还、窄窗 Drawer 切页与未保存草稿保留、信息弹窗 Escape 返回入口。原生浏览器缩放与屏幕阅读器组合需另验。

真实展台 `#app-shell` 可切换默认顶部和内联控制模式；沿用三布局、长文案、正文草稿、禁用/加载/错误状态与全局主题/减少动态设置。

`AppShell` 接收 `layout="single" | "double-left" | "left-right"`；`navigation` 必填、`secondary` 在后两种布局可选。面板形状为 `{ label, content, open, onOpenChange }`；`header` 为整壳顶部区域、`contentHeader` 为正文列的常驻导航区域（0.8.0）、`children` 为正文，`decoration` 控制正文背景。

| 方案 | 用途 | 顺序 |
| --- | --- | --- |
| single | 简单管理或设置工具 | 全局导航 + 正文 |
| double-left | 目录、列表与编辑任务 | 全局导航 + 上下文目录 + 正文 |
| left-right | 检查器、对象属性与预览 | 全局导航 + 正文 + 辅助详情 |

全局栏宽 224px，次栏宽 256px，正文伸展，三栏同时展开时至少留约 638px 正文空间。判断依据是外壳容器宽度，适用于嵌入展台或桌面应用：小于 1120px 先将次栏转为 Drawer，小于 760px 再将全局栏转为 Drawer。抽屉初始关闭；桌面 `open` 偏好保留，回到宽窗后恢复。已经打开的 Drawer 在扩宽窗口时保持到用户关闭，避免中断操作；不会自动丢弃正文或选中项。

外壳需要父级提供明确高度（例如 `height: 100dvh`，展台用固定高度）。header 是不滚动的同级区域，body 填满余高；导航、次栏和正文各自 `overflow:auto`。宿主不应再给这些区域内的整页容器设置第二个垂直滚动。表格的局部横向/有限高度滚动是显式例外。没有拖拽宽度、持久化或停靠管理器。

```tsx
const [navigationOpen, setNavigationOpen] = useState(true);
const [detailsOpen, setDetailsOpen] = useState(true);
// currentId、draft 等业务状态放在 AppShell 的上层。
<div style={{ height: '100dvh' }}>
  <AppShell layout="left-right"
    navigation={{ label: '全局导航', open: navigationOpen,
      onOpenChange: setNavigationOpen, content: <SideNav {...navigationProps} /> }}
    secondary={{ label: '辅助详情', open: detailsOpen,
      onOpenChange: setDetailsOpen, content: <ObjectDetails value={object} /> }}
    header={<Button onClick={save}>保存</Button>}>
    <Editor value={draft} onChange={setDraft} />
  </AppShell>
</div>
```

SideNav 继续负责当前项、长名称和 aria-current；Drawer 继续负责 Tab、Escape 和触发器焦点归还。正文不因切换布局或主题重建。面板在抽屉与内联之间转换时可能重新挂载，因此选中、展开、输入和请求状态必须提升到宿主；不要在面板 render 时启动不可取消的副作用。主题切换不改变 React key。切换或隐藏面板时将位于其中的焦点送回对应操作按钮。

`ShellPanel.drawerOpen/defaultDrawerOpen/onDrawerOpenChange` 独立控制临时抽屉，桌面 `open` 偏好不受影响；宿主选完导航项后可设置 drawerOpen=false。`width` 和 `breakpoint` 使用 CSS px，默认仍为上述数值；断点按容器布局宽度判断。全局导航与双左次栏从左侧打开，左右布局的辅助栏从右侧打开。AppShell 支持 className/style，Background 支持原生属性及 ref。受控与非受控模式在组件生命周期内保持一致。

## 表单

| 组件 | 主要 API | 数据与键盘契约 |
| --- | --- | --- |
| DateField | `label/value/onValueChange/min/max/disabled/error` | 原生 `input type=date`；ISO 日期字符串或空字符串，无 UTC/时区转换，原生日历和键盘由浏览器实现 |
| DateRangePicker | 上述范围 + `value={start,end}`、`presets=[{label,value}]`、`compact?` | 两个原生日期输入，自定义范围、受控预设、清空；compact 合并为一体区间框；结束日期下界取 start/min 较晚者；反向范围显示错误，不静默调换 |
| NumberField | `value: number\|null`、`onValueChange/min/max/step/precision/disabled/error` | 编辑中保存字符串；失焦/Enter 提交；无效及越界输入保留并报错；上下键/按钮步进与钳制边界；空字符串提交 null |
| TreeSelect | `nodes/value/onValueChange/expandedKeys/onExpandedChange/multiple`、loading/error/disabled | 节点为 `{id,label,disabled?,children?}`；父子独立选择，默认单选；调用方提供搜索后的树，不做全量过滤 |
| RemoteMultiSelect | `query/onQueryChange/value/onValueChange/options`、loading/error/disabled、`maxVisibleTags?` | value 是完整 `{value,label,disabled?}[]`，已选标签不依赖本次结果；再次点击已选候选取消；清空保留禁选标签；maxVisibleTags 限制常显数量并提供展开/收起，展开区域有界滚动 |

日期 min/max 约束原生日历和表单有效性；手动编辑、业务校验及最终提交由宿主验证。原生日期面板位于浏览器 UI，不放在受裁剪的自定义浮层。日历外观、屏幕阅读器和移动 WebView 行为由具体浏览器决定，不声称提供自绘日历。预设必须使用宿主计算好的日期；不得以本机时区代替产品时区。没有“今天”隐式计算。

DateField 新增 `readOnly/required/id/name/hint/onValidationChange`；外部日期或 min/max 改变会更新格式/范围错误，不自动回写值。DateRangePicker 同样支持 readOnly/required/hint/onValidationChange，另有 `clearable`（默认 true）、`startLabel/endLabel/startName/endName`。预设含非法日期、反向区间或任一端越界时禁用。onValidationChange 回传格式/范围/显式 error，required 仍走提交时的原生表单校验。只读时保留浏览与聚焦，预设、清空、步进和选择不能更改值。

原生日期的未完成片段可能同时表现为 `value=""` 与 `validity.badInput=true`，不能把它当作用户清空边界。DateField 保留此局部编辑状态并回传“请填写完整有效的日期。”，完整有效提议仍由宿主受控接受或拒绝；DateRangePicker 汇总两端校验。内置清空/预设同时清掉原生草稿；宿主在已接受值不变时强制恢复整个字段，须用独立 reset revision/key 明确重置，不能期待同值 props 推断重置意图。这些行为已包含于 #22 主线修复，消费旧副本需单独升级。

窄容器的重复横向内距由共享日期组处理：0.9.1 的 [#25](https://github.com/linhay/rhine-design/issues/25) 修复在实际容器不超过280 CSS px时取消日期组横向 padding/边框，并单列排列两端；DateField 自身不超过180 CSS px时仅将水平 padding 收到已有4px token，保持输入字号、44px 高度、完整日期和原生日历入口。此尺寸修复不更改日期值/API。400px视口、200% CSS zoom 的 Drawer 内输入曾仅116 CSS px，且 `scrollWidth === clientWidth`，因此必须实际读写最后日期片段，不能仅以无 DOM 溢出验收。单个 DateField 的宽度仍由宿主容器提供，同样需核对实际编辑区；本修复不承诺任意小宽度都能完整容纳浏览器原生日期。

NumberField 支持小数步进（默认 1）；precision 限制为 0–15 位，未指定时普通提交保留解析后的 JS 数值，步进清除至 12 位的浮点尾差；IEEE-754 数值精度不适用于高精度货币账本。`-`、`1.` 等草稿在编辑时不改写；外部 value 真正变化时覆盖草稿。未改变值的失焦/Enter 不触发 onValueChange；输入法组词时不提交或步进。

NumberField 另有 `readOnly/required/id/name/hint/controls`（按钮默认显示）；Escape 取消未提交草稿并恢复受控值，第二次 Escape 可交给外层浮层。min/max 变化会直接标明当前越界，不伪造用户输入或自动修改宿主值。空值步进按有效范围处理，不再把空字符串当成已达到零边界。

TreeSelect 使用 tree/treeitem/group，Tab 进入一个可见节点，上下/Home/End 移动，右键展开或进入首个子项，左键收起或返回父项，Space/Enter 选择。禁选节点可导航和展开，但不能勾选。多选用 aria-checked，单选用 aria-selected。节点 ID 全树唯一稳定；过滤后的祖先与展开状态由宿主提供，选择状态不随结果集消失。

首次进入优先已选可见节点；字符前缀定位不改变选择，`*` 展开同层分支，Ctrl/⌘+A 仅切换可见可选节点。外部收起时焦点回可见祖先。节点 `selectable=false` 用于结构分组；readOnly 允许浏览展开而禁止选择。`name` 为选中 key 生成同名 hidden inputs，disabled 不提交。

RemoteMultiSelect 自 0.11.3 提供可选 `activeValue/onActivateValue` 让已选标签正文成为查看详情的按钮，与移除按钮并列。激活仅收起搜索并通知宿主，不改变选择或提交表单；当前项使用主题描边与 `aria-pressed`。原生按钮支持 Enter/Space。disabled（含单项 disabled）禁止激活；readOnly 禁止修改选择但允许激活查看。未传回调保留原标签行为。宿主负责当前对象、独立草稿和移除后的回退。见 [#69](https://github.com/linhay/rhine-design/issues/69)。

RemoteMultiSelect 复用 Combobox 的方向键、Enter、Escape 和 IME 防误提交。加载或失败时禁止选择旧候选，已选项仍显示且可移除；默认选中后保持候选列表打开，可再次点击或方向键+Enter取消已选候选；真正禁用/锁定项不可更改。打开多选候选时，输入框Tab进入“完成选择”，Shift+Tab返回输入框；从完成按钮继续Tab关闭候选并沿输入框后的正常控件前进。面板底部“完成选择”只收起候选并归焦输入框，保留查询和值，不提交宿主表单；最终保存由宿主负责。Escape或点击外部也保留草稿。`closeOnSelect=true` 恢复选完关闭。`clearQueryOnSelect` 默认 false；新增 readOnly/clearable/placeholder/hint/name。空查询 Backspace 删除最后一个可移除标签，标签×移除与清空统一归焦输入框并收起候选；输入框内空查询Backspace删除则保留原展开/收起状态，不因归焦改变候选状态。仅重新点击、输入或方向键才展开。没有可移除项（含0项或只有锁定项）时隐藏“清空选择”；锁定标签保留。name 以同名 hidden inputs 提交受控 keys。单选 Combobox 的默认关闭行为不变。异步取消、序列检查、服务端查询和时区解释全部归宿主。展台有可取消的本地延迟结果演示，但不是生产数据层。

分组底色 `--rhine-field-group-bg`；树缩进 `--rhine-tree-indent`；其余输入、选择、错误和焦点继续用既有语义 tokens，字号不低于 12px。

## DataTable 与 Pagination

所有新参数可选，原表格保持原生 table 语义。此处提供可展开的层级表格，不实现可编辑 ARIA treegrid；键盘使用 Tab 与原生 checkbox/button，不冒充网格方向键导航。

- `selection={keys,onChange,isDisabled?}`：keys 为稳定 rowKey 数组，可包含其他页/查询中的记录。表头只选择/取消当前可见且未禁选的行；保留不可见和禁选键，部分选中为 mixed。加载时禁用选择。
- `expansion={keys,onChange,getChildren?,renderDetail?,canExpand?}`：子行按宿主顺序展开，层级有文字说明；renderDetail 为独立 region，可与子行共存。keys 由宿主管理，折叠不清空选择；不请求子数据、不更改导出范围。大树的加载与虚拟化由宿主决定，本组件不内置虚拟表格。
- `rowLabel` 默认 rowKey，建议传业务可读名称，供选择/展开按钮命名。所有层级 rowKey 必须全局唯一稳定。
- `stickyHeader/maxHeight`：提供明确局部滚动区；列可设 `width/sticky/stickyOffset`。多列固定默认按实测 CSS 布局宽度自动累计 offset，显式 stickyOffset 优先；需为正文至少保留一个可读列，不将多列固定到遮满窄屏。展台固定右侧两个窄列。
- `density="comfortable" | "compact"`：默认单元格内距为 12/16px 或 6/12px；橙趣 comfortable 为 16/12px，compact 同为 6/12px。业务文字 14px、层级说明 12px，操作仍为 44px。tokens：`--rhine-table-cell-padding`、`--rhine-table-header-bg`、`--rhine-table-hover-bg`、`--rhine-table-selected-bg`；选中底色优先于悬停，固定列使用不透明底色。
- `Pagination.onPageSizeChange` 和 `pageSizeOptions`：仅回传页大小意图，宿主决定是否回到第一页、是否取消请求。total 已知时推导页数；未知时依赖 hasNext。库不筛选、排序、请求或切割全量 rows。

```tsx
<DataTable caption="记录" rows={response.rows} columns={columns}
  rowKey={row => row.id} rowLabel={row => row.name}
  selection={{ keys: selected, onChange: setSelected, isDisabled: row => !row.canSelect }}
  expansion={{ keys: expanded, onChange: setExpanded, getChildren: row => row.children ?? [] }}
  stickyHeader maxHeight={480} loading={loading} error={error} />
<Pagination page={page} pageSize={pageSize} total={response.total}
  hasNext={response.hasNext} onPageChange={requestPage} onPageSizeChange={requestPageSize} />
```

迁移必须保留选择、导出、查询和层级状态。错误与刷新保留已有行，空数据不伪装成错误；已有 sort/onSortChange 不变。

`selection.mode` 默认 multiple，可选 single 使用原生 radio（读取 keys 第一项）；新选择回传单个 key，替换旧单选。`hideSelectAll` 保留单行操作但不显示全选。`DataColumn.rowHeader` 输出 th scope=row；`onSortReset` 提供显式取消排序，宿主清空 sort 后生效。canExpand=false 同时阻止旧展开 key 渲染子行/详情，详情 ID 按行 key 稳定。

Pagination 新增 `disabled/label/showFirstButton/showLastButton`；首末页按钮默认不显示，未知总量时末页不可操作。负数与非有限 total 视作未知；总量缩小导致当前页超界时明确标注，上一页返回已知末页，不自动发请求。翻页到边界时焦点移至相邻可用按钮，页码摘要有状态播报。

## 媒体

`MediaCard` 接收 title、date、kind（photo/video/RAW/Live）、preview、state（ready/loading/error/empty）、aspectRatio（默认 4/3）、onOpen；可选 selected/onSelectedChange/disabled。preview 内的 img/video 使用 contain 保持原比例；媒体类型及失败均有文字。打开按钮与选择 checkbox 为兄弟元素，选择不会触发打开；卡片没有内置网络、轮播、虚拟列表或滚轮监听。preview 应为非交互缩略图，不在打开按钮里嵌套视频控制器。loading 时预览保持隐藏挂载，宿主可在 img.onError/onLoad 后设置 state；缺预览默认 empty，日期为空显示未知。

`MediaViewer` 接收 trigger/title/description/children、受控 open/onOpenChange、onPrevious/onNext、actions、metadata/metadataOpen/onMetadataOpenChange。复用 Radix Dialog 的焦点范围与 Escape，关闭归还实际打开它的卡片/触发器；宿主若卸载或虚拟化掉触发器，应在 onOpenChange 中安排替代焦点。

MediaCard 支持原生 article 属性、ref 与独立 actions（重试等操作不能嵌套在打开按钮里）。MediaViewer 支持 defaultOpen、defaultMetadataOpen 及 className/style；不传 metadataOpen 时，信息栏按钮即可管理内部状态。`previousDisabled/nextDisabled` 显式表达边界，左右键默认触发上/下一项，可用 `keyboardNavigation=false` 关闭；输入框、选择器、媒体播放器和嵌套浮层保留自身按键。导航按钮到达边界变禁用时焦点留在查看器内，可继续反向浏览。

0.8.0 将中性媒体区域限定为查看器的画布（canvas `#101214`、text `#f6f7f8`、focus `#9bceff`）。卡片、类型标签、工具栏和信息栏使用宿主主题的 surface/ink/control/radius tokens：莱茵纸面细边、战术直角与信号色、橙趣墨色粗边与硬阴影。卡片选中态不改变边框宽度，不引起排列跳动；选择与重试位于独立底部操作区。媒体像素保持原色和 contain 比例，不跟随主题变色。

顶部操作可换行，触控目标至少 44px；桌面 metadata 位于右侧，760px 以下移到底部。查看器按固定定位视口的百分比尺寸取景，避免 CSS zoom 将 dvh 高度重复放大；操作栏可达，正文和信息可以滚动。不嵌套 Provider，沿用宿主的动效与主题偏好。此视觉调整自 0.8.0 提供，0.6.0 不包含。

媒体 children、下载链接和资源版本选择通过 slots 提供；库不持有下载路径、播放状态或路由。actions 中使用原生 button/select/a 可自动使用宿主主题的控件样式。宿主可将 scroll-snap 列表放入画布，并保留原有 Masonic 或其他虚拟列表。仅复用模态的背景滚动管理，没有增加 wheel 事件锁或自定义手势拦截。内部 Dialog/Popover 优先响应 Escape，下一次 Escape 再关闭查看器；媒体自身不播放进场动画，减少动态遵循同一主题根。

## 健康详情与运维图表（issue #6）

`TimelineSegment.detail` 可选，形状为 `{ start, end, reason?, counts?: [{ id, label, value: number|null, unit? }], methodology? }`。开始/结束时间是宿主格式化的含时区字符串；计数 0 与 null 分别呈现为零和未知，NaN/Infinity 也视为未知。统计口径缺失时明确标注未提供，不猜测原因或成功率。旧版只有 label/status 的调用仍兼容。

完整与 compact 健康条均复用同一结构化详情。键盘聚焦和方向键、鼠标定位、触屏按下均打开同一个非模态 Popover；默认优先向上，空间不足自动转向下方，距离视口 12px，内容超过可用高度时内部滚动。Escape 或关闭按钮收起，点击外部也可退出。Popovers 挂到同一主题根，不受侧栏/卡片裁剪。保留当前时段的 aria-valuetext，并用 aria-details 指向已展开详情；焦点不因鼠标悬停被抢走。减少动态无新增例外。

StatusTimeline 通过 `activeId/defaultActiveId/onActiveChange` 按稳定时段 ID 控制选中；未指定或当前 ID 消失时显示最后一个时段。`open/defaultOpen/onOpenChange` 控制详情，`disabled` 禁止操作及显示详情。Enter/Space 将键盘焦点送入详情关闭按钮，退出后返回健康条且不会立即重开。

### 多条历史记录（0.8.0）

时间条默认色块高 28px，悬停或聚焦选中块高 36px；compact 轨道高 28px，44px 命中区垂直居中。完整时间条沿用 44px 轨道；图例尺寸独立，不随色块加高。

`StatusTimelineList({ label, items, emptyLabel?, density? })` 统一标题、摘要、备注、分隔与 compact 时间条。同一列表一次只展开一条详情；鼠标切换记录不抢焦点，键盘进入详情后退出返回对应时间条，嵌套 Dialog 的下一次 Escape 才关闭外层。行删除、禁用或历史变为空时关闭旧详情。

每项为 `StatusTimelineItem`：稳定的 `id`、文字 `title`、可选 `summary: ReactNode`、`note`、`unavailableLabel`，以及 `timeline: { segments, startLabel, endLabel, disabled? } | null`。null 表示历史不可用，空 segments 表示没有时段；两者均不冒充健康。`emptyLabel` 默认“暂无历史记录”，`unavailableLabel` 默认“历史记录暂不可用 · 未知”。摘要由宿主提供，0 与未知应明确区分。行 ID 和时段 ID 不使用数组索引，确保排序或刷新后保留正确身份。

组件不请求、排序、分页或计算健康/额度。宿主保留数据权限、服务端分页与加载/错误反馈；列表只协调呈现与详情开关。真实展台 `/#monitoring` 覆盖默认、加载、错误保留旧记录、空、未知、不完整、禁用、长名称及分栏弹窗。

```tsx
<StatusTimelineList label="资源历史" items={[
  { id: 'resource-a', title: '资源 A', summary: '剩余 78%',
    timeline: { segments, startLabel: '10/23 00:00 UTC+8', endLabel: '10/24 00:00 UTC+8' } },
  { id: 'resource-b', title: '资源 B', summary: '剩余未知', timeline: null },
]} />
```

`TrendChart({ label, unit, rangeLabel, description, points, kind, stale?, error?, loading? })` 提供 `kind="bar" | "line"`，每个 point 是 `{id,label,value:number|null}`。宿主负责时间桶、排序、聚合、单位与统计说明；组件只映射坐标。零是有效采样，未知值不补零、不插值，折线路径在缺失点处断开；图内 ×、SVG 可访问说明和可展开的原始数据表共同表示缺失。单位、范围与图例均为 HTML 文字，避免窄屏 SVG 缩放导致文字小于 12px。多条资源指标使用多个命名图表组合，不内置数据请求或图表引擎。

`StackedBar` 使用相同的 label/unit/rangeLabel/description/反馈字段，接收 `parts=[{id,label,value:number|null,tone?:1|2|3|4}]`。只在每项计数均已知、非负、有限且总和大于零时按传入计数绘制占比；任意未知值会停止归一化并显示“总量未知”，仍列出全部已知/未知计数。全零和负数各有说明。百分比是图例中对这组计数的数学占比，保留一位小数，不是健康分数或成功率。宿主必须提供互斥分类，不能把重叠统计相加当作总量。

两类图表新增 `valueFormatter(value:number|null)`；非有限值以 null 传入。TrendChart 刻度与逐点文字采用格式化，原始数据表保留原数值；StackedBar 格式化图例但不改变比例算法，零分段不占色带空间。TrendChart 可聚焦图形后用左右/Home/End，或悬停/轻触查看同一时段。`activePointId/defaultActivePointId/onActivePointChange` 支持受控高亮与多图联动；null 清除高亮，丢失 ID 不替代为别的样本。高亮值以 HTML 文字播报，缺失桶仍可查看。

图表 `stale` 显示采集陈旧说明，`error` 显示错误并保留旧数据，loading 同样保留旧数据；空数组与全未知区分。图例逐项提供名称与数值，不只靠颜色。`--rhine-chart-series-1/2/3/4`、`--rhine-chart-grid`、`--rhine-chart-missing` 是语义 tokens；前两色跟随主题主色/信号色，后两色供独立分类使用。图形不闪烁、不扫光、不内置告警阈值。相关 API 自 0.5.0 提供，npm 0.4.0 不包含。

```tsx
<StatusTimeline label="请求历史" segments={segmentsWithDetail}
  startLabel="10:00 UTC+8" endLabel="11:00 UTC+8" />
<TrendChart kind="line" label="CPU 使用率" unit="%" rangeLabel={range}
  description="每分钟采样，缺失保持未知" points={serverPoints}
  stale={staleMessage} error={requestError} />
<StackedBar label="互斥结果分类" unit="次" rangeLabel={range}
  description="按最终结果分类" parts={serverCounts} />
```

## 真实展台入口

开发服务 `npm run dev` 后访问：

- `/#app-shell`：三种布局、独立背景、Surface、固定顶部操作、Drawer/Dialog、状态与可编辑草稿。
- `/#advanced-forms`：日期预设/自定义/清空、数字草稿、树单多选、远程延迟/取消/IME，以及加载/失败/空/禁用。
- `/#advanced-data`：跨页选中键、禁选、层级/详情、密度、已知/未知总数和局部固定列。
- `/#media`：默认、长标题、加载、错误、缺预览，媒体查看器中的版本/下载与分层 Escape。
- `/#monitoring`：结构化时段详情与紧凑条、柱形趋势、缺失点折线、已知/未知占比、文本替代及空/陈旧/错误状态。

页首切换三主题及减少动态不重建当前展台；切换章节会卸载演示。自动测试验证受控行为，浏览器与版本验收单独记录于 [验证记录](ISSUE_VALIDATION.md)。精确版本的制品校验和与消费验证按 [发布流程](RELEASING.md)保留。

远程分页契约见 [REMOTE_PAGINATION](REMOTE_PAGINATION.md)，标签激活与分页均自 0.11.3 提供。

RemoteMultiSelect/Combobox完成或Escape后的延迟归焦只处理原输入框、关闭浮层和失焦/守卫节点；用户或宿主已移到其他控件时不再抢回。快速重开仍按打开代次拒绝旧关闭回调，Tab离开保留现有Dialog边界保护。此补充为#78源码修复，尚未发布。

### 可激活长标签的窄正文（#69 回归修复，未发布）

激活正文与移除按钮保持并列键盘目标，均至少44×44 CSS px。可激活长标签在折叠及展开状态都允许换行，不裁掉名称；完整名称与aria-pressed保留，移除空间不被正文挤占。maxVisibleTags仍控制常显标签数量，展开区域继续有界垂直滚动；不改变非激活标签既有的紧凑显示契约。激活按钮的专用收缩规则必须比通用标签按钮的flex:none更具体，内部文字span也要允许收缩与任意长词换行，不能只依靠CSS导入顺序。

合成展台“141px窄正文标签”在有界Dialog中复用RemoteSelectionExample，约束选择器有效宽度上限为141 CSS px（Neo主题400px/200%时受Dialog边框影响为140px，覆盖更窄边界），使用公开组件，不在产品侧增加CSS覆盖。真实生产及固定制品后置styles.css需验证三主题×400/520/880×100/200% CSS zoom的折叠/展开、完整名称、活动状态、激活/移除、键盘、只读/禁用及焦点保护。CSS zoom不代表原生网页缩放；合成分页不代表真实服务。0.11.3历史正式验收保持有效，本项修复未发布，原消费升级/临时覆盖删除另验。

脚本：`check-remote-tag-wrap.js`量测141px、标签/按钮边界、文字与正文横溢出并验证交互；`prepare-remote-wrap-consumer.mjs <tarball> <new-directory>`从固定包复制同一合成展台，以公开入口加后置公共CSS构建，包含模板焦点回归入口。

`StatusTimelineList.density`及单行`TimelineLegend.density`新增可选`compact`，默认`default`保持兼容；紧凑组合须保留外层`Stack gap={1}`以容纳44px命中区，见[密度契约](COMPACT_ACCOUNT_PATTERNS.md#时间条与图例的紧凑密度23-新增未发布)。该参数尚未发布。

### 字段标题附属动作（未发布）

Combobox / RemoteMultiSelect 可传 `labelAction`，保留 string label 与已选列表名称；动作是 label 旁独立节点，独立获取目录复用 secondary Button、标题轻量切换可用 quiet，获取只更新候选且不更改选择或草稿。可用性、busy、取消和迟到结果由宿主处理。无动作布局兼容；见[标题动作契约](FIELD_LABEL_ACTION.md)。

RemoteMultiSelect 的 `tagDensity="compact"` 与 `maxVisibleTags` 独立；28px细指针/44px粗或混合输入、完整值换行和原交互契约见[紧凑标签](COMPACT_TEMPLATE.md)。此为未发布增量。
