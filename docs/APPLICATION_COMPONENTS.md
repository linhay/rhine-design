# 应用组件与状态契约

本页对应 GitHub issues [#1](https://github.com/linhay/rhine-design/issues/1)、[#2](https://github.com/linhay/rhine-design/issues/2)、[#3](https://github.com/linhay/rhine-design/issues/3)、[#4](https://github.com/linhay/rhine-design/issues/4)、[#5](https://github.com/linhay/rhine-design/issues/5)。新增 9 个组件，公共组件总数为 57。

**版本边界：以下为待发布的 0.5.0 候选 API，npm 0.4.0 不含这些能力。** 本次不改变现有组件必填参数；DataTable/Pagination 的参数均为新增可选项。发布前可以固定包含本改动的 Git 提交，发布后使用 `npm install --save-exact @linhey/rhine-design@0.5.0` 并提交 lockfile。不要在版本尚未发布时按此 npm 命令升级。候选预览不代表 registry 或消费应用已经升级。

公开类型从包主入口导出，真实实现是 API 权威：`Background.tsx`、`AppShell.tsx`、`AdvancedForms.tsx`、`Media.tsx`、`Data.tsx`。兼容范围沿用 React 19 + Vite；native WebView、其他构建器、SSR 和屏幕阅读器组合需消费项目另行验证。无需新增依赖。

## 背景层级

| 区域 | token / API | 规则 |
| --- | --- | --- |
| 应用画布 | `--rhine-canvas-bg`，`roleTone="canvas"` | 整体底色，允许主题纹理 |
| 正文区域 | `--rhine-content-bg`，`roleTone="content"`（默认） | 默认纯色；显式 `decoration="theme"` 可启用主题纹理 |
| 全局 / 上下文 / 辅助侧栏 | `--rhine-sidebar-bg`，`roleTone="sidebar"` | 不透明纯色，边界使用 `--rhine-line` |
| 卡片 / 表单 | `--rhine-surface-bg`，`roleTone="surface"` | 不透明阅读表面，默认无纹理 |
| 弹窗 / 浮层 | `--rhine-overlay-bg`，`roleTone="overlay"` | 默认无纹理，遮罩独立使用 `--rhine-backdrop-bg` |
| 图片 / 视频 | `--rhine-media-bg`，`roleTone="media"` | 中性深色底与配套浅色文字，默认无纹理 |

纸面默认无纹理；战术终端使用 32px 低对比网格；橙趣使用 14px 点阵。主题统一提供 `--rhine-background-texture`、`--rhine-background-scale`、`--rhine-background-mark`，无需消费者复制渐变。`decoration="auto"` 为默认值，仅 canvas 使用主题纹理，正文和 AppShell 默认纯色。`theme` 显式启用主题纹理，`none` 关闭本区域装饰，主题切换不会重新启用它。Background 另提供 surface/overlay/media 场景及局部 appearance 覆盖，完整六场景配置见[主题契约](THEMING.md#场景背景未发布)。

`decoration` 默认 `auto`，仅画布默认跟随主题纹理，AppShell 正文默认纯色。`appearance` 支持局部底色、文字色、纹理与尺寸覆盖，完整变量及优先级见[场景背景配置](THEMING.md#场景背景未发布)。展台 `#backgrounds` 仅展示当前主题，随右上角选择器同步切换。

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

`AppShell` 接收 `layout="single" | "double-left" | "left-right"`；`navigation` 必填、`secondary` 在后两种布局可选。面板形状为 `{ label, content, open, onOpenChange }`；`header` 放当前任务操作、`children` 为正文，`decoration` 控制正文背景。

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

## 表单

| 组件 | 主要 API | 数据与键盘契约 |
| --- | --- | --- |
| DateField | `label/value/onValueChange/min/max/disabled/error` | 原生 `input type=date`；ISO 日期字符串或空字符串，无 UTC/时区转换，原生日历和键盘由浏览器实现 |
| DateRangePicker | 上述范围 + `value={start,end}`、`presets=[{label,value}]` | 两个原生日期输入，自定义范围、受控预设、清空；结束日期下界取 start/min 较晚者；反向范围显示错误，不静默调换 |
| NumberField | `value: number|null`、`onValueChange/min/max/step/precision/disabled/error` | 编辑中保存字符串；失焦/Enter 提交；无效及越界输入保留并报错；上下键/按钮步进与钳制边界；空字符串提交 null |
| TreeSelect | `nodes/value/onValueChange/expandedKeys/onExpandedChange/multiple`、loading/error/disabled | 节点为 `{id,label,disabled?,children?}`；父子独立选择，默认单选；调用方提供搜索后的树，不做全量过滤 |
| RemoteMultiSelect | `query/onQueryChange/value/onValueChange/options`、loading/error/disabled | value 是完整 `{value,label,disabled?}[]`，已选标签不依赖本次结果；不重复选中；清空保留禁选标签 |

日期 min/max 约束原生日历和表单有效性；手动编辑、业务校验及最终提交由宿主验证。原生日期面板位于浏览器 UI，不放在受裁剪的自定义浮层。日历外观、屏幕阅读器和移动 WebView 行为由具体浏览器决定，不声称提供自绘日历。预设必须使用宿主计算好的日期；不得以本机时区代替产品时区。没有“今天”隐式计算。

NumberField 支持小数步进（默认 1）；precision 限制为 0–15 位，未指定时步进清除至 12 位的浮点尾差；IEEE-754 数值精度不适用于高精度货币账本。`-`、`1.` 等草稿在编辑时不改写；外部 value 真正变化时覆盖草稿。输入法组词时不提交或步进。

TreeSelect 使用 tree/treeitem/group，Tab 进入一个可见节点，上下/Home/End 移动，右键展开或进入首个子项，左键收起或返回父项，Space/Enter 选择。禁选节点可导航和展开，但不能勾选。多选用 aria-checked，单选用 aria-selected。节点 ID 全树唯一稳定；过滤后的祖先与展开状态由宿主提供，选择状态不随结果集消失。

RemoteMultiSelect 复用 Combobox 的方向键、Enter、Escape 和 IME 防误提交。加载或失败时禁止选择旧候选，已选项仍显示且可移除；选中后关闭候选列表，继续输入可追加选择。异步取消、序列检查、服务端查询和时区解释全部归宿主。展台有可取消的本地延迟结果演示，但不是生产数据层。

分组底色 `--rhine-field-group-bg`；树缩进 `--rhine-tree-indent`；其余输入、选择、错误和焦点继续用既有语义 tokens，字号不低于 12px。

## DataTable 与 Pagination

所有新参数可选，原表格保持原生 table 语义。此处提供可展开的层级表格，不实现可编辑 ARIA treegrid；键盘使用 Tab 与原生 checkbox/button，不冒充网格方向键导航。

- `selection={keys,onChange,isDisabled?}`：keys 为稳定 rowKey 数组，可包含其他页/查询中的记录。表头只选择/取消当前可见且未禁选的行；保留不可见和禁选键，部分选中为 mixed。加载时禁用选择。
- `expansion={keys,onChange,getChildren?,renderDetail?,canExpand?}`：子行按宿主顺序展开，层级有文字说明；renderDetail 为独立 region，可与子行共存。keys 由宿主管理，折叠不清空选择；不请求子数据、不更改导出范围。大树的加载与虚拟化由宿主决定，本组件不内置虚拟表格。
- `rowLabel` 默认 rowKey，建议传业务可读名称，供选择/展开按钮命名。所有层级 rowKey 必须全局唯一稳定。
- `stickyHeader/maxHeight`：提供明确局部滚动区；列可设 `width/sticky/stickyOffset`。多列固定时由宿主按已知宽度提供累计 offset；需为正文至少保留一个可读列，不将多列固定到遮满窄屏。展台固定右侧一个操作列。
- `density="comfortable" | "compact"`：单元格内距为 12/16px 或 6/12px，业务文字 14px、层级说明 12px，操作仍为 44px。tokens：`--rhine-table-cell-padding`、`--rhine-table-header-bg`、`--rhine-table-selected-bg`。
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

## 媒体

`MediaCard` 接收 title、date、kind（photo/video/RAW/Live）、preview、state（ready/loading/error/empty）、aspectRatio（默认 4/3）、onOpen；可选 selected/onSelectedChange/disabled。preview 内的 img/video 使用 contain 保持原比例；媒体类型及失败均有文字。打开按钮与选择 checkbox 为兄弟元素，选择不会触发打开；卡片没有内置网络、轮播、虚拟列表或滚轮监听。preview 应为非交互缩略图，不在打开按钮里嵌套视频控制器。宿主在 img.onError/onLoad 后设置 state，缺预览默认 empty，日期为空显示未知。

`MediaViewer` 接收 trigger/title/description/children、受控 open/onOpenChange、onPrevious/onNext、actions、metadata/metadataOpen/onMetadataOpenChange。复用 Radix Dialog 的焦点范围与 Escape，关闭归还实际打开它的卡片/触发器；宿主若卸载或虚拟化掉触发器，应在 onOpenChange 中安排替代焦点。

查看器采用同一主题根中的中性媒体 tokens：canvas `#101214`、overlay `#202428`、text `#f6f7f8`、muted `#bcc3ca`、border `#68727c`、focus `#9bceff`。不把战术主题当暗色媒体模式，也不嵌套 Provider。顶部操作可换行，触控目标至少 44px；桌面 metadata 位于右侧，760px 以下移到底部。短窗口内容可滚动，关闭按钮始终在顶部可达。

媒体 children、下载链接和资源版本选择通过 slots 提供；库不持有下载路径、播放状态或路由。actions 中使用原生 button/select/a 可自动使用中性叠加样式。宿主可将 scroll-snap 列表放入画布，并保留原有 Masonic 或其他虚拟列表。仅复用模态的背景滚动管理，没有增加 wheel 事件锁或自定义手势拦截。内部 Dialog/Popover 优先响应 Escape，下一次 Escape 再关闭查看器；媒体自身不播放进场动画，减少动态遵循同一主题根。

## 真实展台

开发服务 `npm run dev` 后访问：

- `/#app-shell`：三种布局、独立背景、Surface、固定顶部操作、Drawer/Dialog、状态与可编辑草稿。
- `/#advanced-forms`：日期预设/自定义/清空、数字草稿、树单多选、远程延迟/取消/IME，以及加载/失败/空/禁用。
- `/#advanced-data`：跨页选中键、禁选、层级/详情、密度、已知/未知总数和局部固定列。
- `/#media`：默认、长标题、加载、错误、缺预览，媒体查看器中的版本/下载与分层 Escape。

页首切换三主题及减少动态不重建当前展台；切换章节会卸载演示。自动测试验证受控行为，浏览器验收单独记录于 [候选验证](ISSUE_VALIDATION.md)。发布验收通过后按 [发布流程](RELEASING.md)发布精确版本；在发布前 issues 仍保留版本交付待办。
