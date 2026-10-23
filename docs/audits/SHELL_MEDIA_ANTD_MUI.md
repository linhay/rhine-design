# Background、AppShell 与媒体组件对标

查阅日期：**2026-10-24（Asia/Shanghai）**。对照对象为 Ant Design 与 MUI 官方在线文档；查阅时页面分别标示 Ant Design 6.6.7、Material UI 9.5.0。本记录核对 Rhine Design 0.5.0 的 API 与交互，不表示 npm 0.4.0 已有这些能力，也不宣称与两套组件库完全兼容。

## 官方依据与对应关系

| Rhine 组件 | Ant Design 对照 | MUI 对照 | 对应范围 |
| --- | --- | --- | --- |
| Background | [Layout](https://ant.design/components/layout/#api) 的区域与样式能力 | [Box](https://mui.com/material-ui/react-box/)、[Theming](https://mui.com/material-ui/customization/theming/) | 没有同名、同职责组件；只对照局部表面样式、主题继承和原生属性，不把 ThemeProvider 当作背景组件 |
| AppShell | [Layout.Sider](https://ant.design/components/layout/#layout.sider)、[Drawer](https://ant.design/components/drawer/#api) | [响应式 Drawer](https://mui.com/material-ui/react-drawer/#responsive-drawer)、[Drawer API](https://mui.com/material-ui/api/drawer/) | 主体布局、受控折叠、宽度/断点与临时侧栏；MUI 没有同名 AppShell |
| MediaCard | [Card](https://ant.design/components/card/#api)、[Image](https://ant.design/components/image/#api) 的加载/错误展示 | [Card / CardMedia / CardActionArea](https://mui.com/material-ui/react-card/#primary-action) | 媒体内容、主操作与次操作分区；图片请求不归 Card 容器 |
| MediaViewer | [Image.PreviewGroup](https://ant.design/components/image/#previewgrouptype) | [全屏 Dialog](https://mui.com/material-ui/react-dialog/#full-screen-dialogs)、[Dialog API](https://mui.com/material-ui/api/dialog/) | 分组浏览、边界、焦点与全屏浮层；MUI Core 没有 Image.PreviewGroup 的直接替代品 |

AntD 的 Sider 提供折叠状态与响应式配置；MUI 区分常驻与临时 Drawer。两者均可控制临时面板开关和出现边缘。Rhine 保留已有桌面状态协议，新增独立的抽屉控制，以免导航点击无法关闭手机抽屉。[AntD Layout](https://ant.design/components/layout/#layout.sider)、[AntD Drawer](https://ant.design/components/drawer/#api)、[MUI Drawer](https://mui.com/material-ui/api/drawer/)。

MUI Card 将主点击区域与补充操作分开；Rhine 的复选框原已独立，本轮新增同样独立的 `actions` 内容区域。AntD Image 的资源载入、变换和 PreviewGroup 集合管理范围更大，不能把提供一个全屏 Dialog 视为完成这些功能。[MUI Card](https://mui.com/material-ui/react-card/#primary-action)、[AntD Image](https://ant.design/components/image/#previewgrouptype)。

## 逐项核对与结果

| 组件 / 核对项 | 原实现 | 本轮处理 / 判定 |
| --- | --- | --- |
| Background：主题继承 | 六种语义区域、局部 appearance、单一主题根 | 保留。背景不创建 Provider，不拦截指针，不引入定位上下文 |
| Background：原生扩展 | HTML 属性、className、style；类型缺少 ref | 补齐 React 19 `ref`，透传到同一 div；样式覆盖优先级不变 |
| Background：纹理 | auto 仅 canvas；正文默认纯色 | 保留用户已确定的设计；不是 MUI `sx` 的同构实现 |
| AppShell：布局 | single / double-left / left-right，正文挂载稳定 | 保留，三种布局沿用同一正文树 |
| AppShell：桌面状态 | `open`、`onOpenChange` 必填 | 保留受控契约。不开辟第二套默认桌面状态，避免持久化状态来源分裂 |
| AppShell：临时侧栏状态 | 只有内部 state，宿主导航无法关闭 | **补齐** `drawerOpen`、`onDrawerOpenChange`；省略受控值时继续本地管理，并支持 `defaultDrawerOpen` |
| AppShell：边缘 | 全部复用默认右 Drawer | **修正**：全局导航从左出现；double-left 次栏从左；left-right 次栏从右。共享 Drawer 新增 `side`，其默认右侧保持兼容 |
| AppShell：尺寸 | 桌面224/256、容器阈值760/1120固定 | **补齐**每栏 `width`（桌面 px）、`breakpoint`（容器 px）；省略保持原值；阈值相等时使用桌面栏。以 clientWidth 布局像素判断，不受 CSS zoom/transform 对视觉边界尺寸的放大影响 |
| AppShell：局部样式 | 根元素无扩展入口 | **补齐** `className` / `style`，不开放替换焦点管理结构的任意 slots |
| AppShell：焦点 | 栏隐藏/移除返回存活按钮，抽屉由 Radix 管理 | 保留并回归。正文输入不因侧栏折叠而重建 |
| MediaCard：选择 vs 打开 | 独立 checkbox 与打开按钮 | 保留。禁用同时阻止打开/选择；不会把 loading 自动等同 disabled |
| MediaCard：错误恢复 | 有加载/错误/空态，但没有次操作位置 | **补齐**独立 `actions`，可以放重试；点击不触发 `onOpen` / 选择 |
| MediaCard：内容 / 样式 | 预览 ReactNode；缺少根节点属性 | **补齐**原生 article 属性、ref、className、style；修正数值 `0` 预览被误当空态 |
| MediaViewer：受控 / 默认 | 支持 open、onOpenChange；缺默认打开 | **补齐** `defaultOpen`。受控 open 优先；仍需宿主采纳回调更新状态 |
| MediaViewer：信息侧栏 | 没有 onMetadataOpenChange 时不能切换 | **补齐**本地状态与 `defaultMetadataOpen`；传入 metadataOpen 时保持受控；按钮与信息区域通过 aria-controls 关联；数值0内容有效 |
| MediaViewer：上一项 / 下一项 | 按钮动作由宿主提供；缺快捷键 | **补齐** ← / →；`keyboardNavigation=false` 可关闭这些快捷键。Escape 退出由 Radix 保持 |
| MediaViewer：集合边界 | 缺 callback 即禁用，无独立禁用状态 | **补齐** previousDisabled / nextDisabled；缺 callback 仍禁用；无自动循环，数据索引由宿主维护 |
| MediaViewer：到达边界后的焦点 | Chrome 将变为 disabled 的已聚焦按钮焦点丢到 body | **修复**：将焦点移到查看器本体，反向方向键仍有效；离开查看器返回实际打开它的媒体卡片 |
| MediaViewer：快捷键冲突 | 此前没有快捷键 | 新快捷键跳过编辑器、select、视频/音频、slider/tree/listbox/tablist/menu，跳过组合输入、修饰键与嵌套 Portal；不劫持这些控件的方向键 |
| MediaViewer：内容 / 样式 | children / actions / metadata 已可组合 | 保留这些语义插槽，**补齐** className/style 到全屏 Dialog 内容；不改变暗色媒体画布 |
| 浮层：主题 / 焦点 / 退出 | Portal 到最近主题根，Radix focus trap、Escape | 保留。点击操作、键盘、嵌套层及实际 opener 返回继续由现有机制负责 |

## 新增 API 的边界

```tsx
// open 管理桌面折叠；drawerOpen 管理临时浮层，两者互不替代。
<AppShell
  layout="left-right"
  navigation={{
    label: '导航', content: navigation,
    open: navigationExpanded, onOpenChange: setNavigationExpanded,
    drawerOpen: navigationDrawerOpen, onDrawerOpenChange: setNavigationDrawerOpen,
    width: 240, breakpoint: 800,
  }}
>
  {body}
</AppShell>

<MediaViewer
  trigger={<button>查看媒体</button>}
  title={current.title} description={`${index + 1} / ${items.length}`}
  onPrevious={() => setIndex(index - 1)} previousDisabled={index === 0}
  onNext={() => setIndex(index + 1)} nextDisabled={index === items.length - 1}
  metadata={metadata} defaultMetadataOpen
>
  {preview}
</MediaViewer>
```

- `defaultOpen`、`defaultMetadataOpen`、`defaultDrawerOpen` 只作为初始值；后续控制使用对应受控属性。抽屉保持打开跨过宽度断点时仍可完成当前操作，关闭后恢复桌面布局。
- `width` 仅管理桌面侧栏，抽屉仍使用现有 `min(440px, 100%)`。`breakpoint` 使用容器宽度，不能直接替换 AntD 的命名视口断点。
- 主体子树保持挂载；侧栏内容在桌面与 Portal 抽屉之间会重挂载，需保留的表单/查询状态仍由宿主控制。这不等同 AntD `destroyOnHidden=false` 的内容生命周期。
- `MediaCard actions` 中的业务按钮由宿主管理 busy/disabled；卡片 `disabled` 控制自身打开与选择。预览区域应提供非交互缩略图；完整视频控件放在 Viewer，避免把交互元素嵌进主按钮。
- MediaViewer 不持有 items/index，不猜测首尾、循环或资源顺序。完整资源的加载/失败重试内容通过 children/actions 组合；MediaCard 的状态不自动代表完整资源状态。

## 明确保留的差异

1. AntD Image 的缩放、旋转、拖拽、轮播集合 API 未移植；本次解决媒体壳层和已有宿主分页动作。没有对任意 children 强制应用图像变换，以免改变视频及原生媒体交互。
2. MUI `sx`、任意组件替换、AntD 语义 DOM 样式对象未照搬；Rhine 保留 CSS tokens、className/style 和既有 ReactNode 插槽，避免引入第二套样式引擎。
3. AppShell 没有侧栏拖拽调整宽度、迷你图标栏、触摸滑出手势；Drawer 只提供当前需要的左右边缘，未新增上下抽屉。需要这些行为时应另立完整交互契约，不能只补同名 props。
4. Background 不提供 MUI Box 的任意 component/as；根 div 与原生 role/aria 属性已覆盖当前背景容器场景。它不是布局、可点击卡片或新的主题作用域。

## 验证证据

- `tests/ShellMediaParity.test.tsx` 新增 **10 项**行为回归；与既有 `tests/Extensions.test.tsx` 一起 **25 项通过**。覆盖受控值不被本地修改、默认状态、左右位置、精确断点、自定义宽度、隐藏栏焦点、错误重试分区、metadata、快捷键边界与冲突。类型检查通过。
- Chromium 真实开发展台，橙趣主题400px：左导航抽屉 `x=0,width=400`，右侧圆角与向右阴影正确，动画从左进入；媒体从卡片打开，方向键连续 `1→2→3→2`，最后一项禁用后焦点仍留在查看器；Escape 回到实际卡片。
- 520px、减少动态模式，三套主题的左右抽屉共6次：左侧 `x=0,width=440`，右侧 `x=80,right=520`；全部无抽屉内部横向溢出，Escape 关闭成功。
- 1600px 浏览器窗口的容器测量：正常 `clientWidth=1134 / visualWidth=1136`，两栏常驻；CSS 200% `502 / 1008`，两栏正确转抽屉；CSS `transform:scale(.5)` 后 `1134 / 568`，两栏仍常驻。证明断点依据布局宽度，而不是变换后的视觉尺寸。这里是 CSS zoom/transform 验证，不声称浏览器菜单缩放实测。
- 首次浏览器复现明确发现「边界按钮禁用导致焦点回 body」，修复后重复验证反向快捷键成功。JSDOM 回归同时检查焦点目标，但不将其视为真实布局证据。
- 完整跨主题/宽度、构建产物与包安装验证由本轮总体验收统一记录；这里的开发浏览器结果不代替生产 bundle、原生 WebView 或屏幕阅读器实测。
