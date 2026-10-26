# 莱茵设计 · 通用组件

本目录提供[莱茵设计 · Rhine Design](../README.md)的 React 组件、设计变量和 API 契约。组件接收应用传入的数据与动作，不绑定特定后端或原生平台。包名为`@linhey/rhine-design`；样式变量和类名使用`rhine-`命名空间。

0.8.0 共66个组件，新增 NeutronStarBackdrop、StatusTimelineList、AppShellToggle 与 ButtonLink；0.6.0 为60个；0.5.0为59个，0.4.0为48个，0.3.0为40个。新增导航、表单流程及健康时间轴组件见[场景与交互规范](../docs/INTERACTION_PATTERNS.md)，原24个扩展组件见[常用组件契约](./COMMON_COMPONENTS.md)。[字体与文字规范](./TYPOGRAPHY.md)与[主流系统对照与缺口](../docs/DESIGN_SYSTEM_AUDIT.md)共同约束复用。静态页面样稿也使用同源Toolbar/Select CSS，不运行React。

中子星艺术、主题物品和生命周期见[中子星契约](../docs/NEUTRON_STAR_BACKDROP.md)与[轨道背景契约](../docs/ORBIT_BACKDROP.md)。安装版本与源码导出分别核对。

页面改动遵循：优先复用组件 → 先在设计稿/展台修改并验证 → 再按任务授权实现到App。缺组件先补组件与展台，不在业务页另写同用途样式；同一任务已授权设计和实现时连续推进，无需重复确认。

## 间距组合

[间距规范](SPACING.md)定义尺度、分组与卡片配方：Surface默认负责24px内边距，嵌套Stack提供8px标题/说明和16px内容/操作间隔，Inline提供8px按钮间隔；Surface不自动给子元素加间距。单独承载表格时使用 0.9.1 的 `padding="none"`，只取消容器外围内距，保留表头/单元格间距。展台`#spacing`可检查默认、加载、错误、长文案及无外围内距表格。

## 使用

先按[套件接入说明](../README.md#quick-start)安装组件包，再导入：

```tsx
import { Button, Inline, Notice, Progress, Stack, Surface } from '@linhey/rhine-design';

export function Example() {
  return (
    <div className="rhine-theme">
      <Surface>
        <Stack gap={4}>
        <Notice tone="warning" title="需要处理">请检查后重试。</Notice>
        <Progress label="任务进度" value={null} />
        <Inline gap={2}><Button variant="secondary" onClick={() => { /* 业务动作 */ }}>重试</Button></Inline>
        </Stack>
      </Surface>
    </div>
  );
}
```

入口 `index.ts` 自动导入组件 CSS。使用一个 `.rhine-theme` 包裹组件树，获得字体、盒模型、焦点和动效降级规则。主题根放在页面根部，不加transform、裁剪或contain；浮层Portal挂在最近的主题根以继承变量和减少动态偏好。独立运行与跨项目导入方式见[套件入口](../README.md)；跨仓复用核对React19与套件package.json中的5个Radix依赖，不导入展台。

0.4.0 新增主题入口 `@linhey/rhine-design/theme`，导出 `ThemeProvider`、`useTheme`、`themes`、`ThemeName` 和 `ThemeProviderProps`（自 0.4.0 提供）。Provider 自动生成主题根并加载内置主题；用 `setTheme('arknights')` 切换，受控偏好与存储由宿主管理。支持并列 Provider，暂不支持嵌套覆盖。完整契约及代码见[主题 API](../docs/THEMING.md)。

- `tokens.css`：唯一色彩、尺寸与动画变量来源。
- `styles.css`：`rhine-` 前缀组件样式，业务页面可组合布局但不覆盖组件状态。
- `components.tsx`：原有基础组件；`Actions/Data/Forms/Layout/Overlays/Toast.tsx`承载新增组件。表单与业务数据由调用方控制，浮层开关、通知计时及复制结果只管理局部交互。
- `../preview/`：使用同一组件实现的开发预览，独立 HTML 入口，无业务客户端依赖。
- [index.html](../index.html)：Vite 开发入口，在套件根运行 `npm run dev` 后访问 `http://127.0.0.1:18309/`。

旧 `design/refactor/tokens.css` 只转引此处变量，避免页面样稿与组件库各维护一份颜色。

## 组件契约

0.5.0 的 Background、AppShell、MediaCard、MediaViewer、DateField、DateRangePicker、NumberField、TreeSelect、RemoteMultiSelect、TrendChart、StackedBar，以及 DataTable/Pagination 和 StatusTimeline 详情扩展见[应用组件契约](../docs/APPLICATION_COMPONENTS.md)。新增 11 个，总数 59；npm 0.4.0 为 48 个。

| 组件 | 关键输入 | 状态与边界 |
| --- | --- | --- |
| Button | variant=primary/secondary/quiet/danger；busy；busyLabel；原生按钮属性 | 默认 type=button；busy 保留焦点并拦截再次 click，不自动把业务标记成功；disabled 使用原生禁用 |
| ButtonLink（0.8.0） | 必填 href；原生 anchor 属性与 ref；Button 同款 variant/busy/busyLabel；disabled | 原生导航/下载；disabled 退出 Tab；busy 保焦点；两者移除 href、阻止主/辅助点击；[契约](../docs/COMPACT_ACCOUNT_PATTERNS.md) |
| Logo | variant=mark/icon/lockup；theme=light/dark/auto；size；animate；decorative；label；wordmark | 第三版三角构架；默认静态、48px、浅色单标志；最小16px；无点击/业务状态 |
| Text | variant；as；tone；numeric；HTML属性 | 默认p/body；视觉层级不决定HTML语义；长文本可换行；不转换数值或截断文本 |
| Select | label；hint；error；原生单选select属性；option子节点 | 标签与描述自动关联；原生菜单和键盘；受控或defaultValue；不支持multiple/size列表模式；箭头装饰性且不接收点击 |
| Toolbar | title；description；children；HTML div属性 | 自适应控件组合，role=group与普通Tab顺序；不伪装为需要方向键导航的ARIA toolbar；不含业务状态 |
| ListFilterBar（0.9.0） | label；search；primary/filters 字段；onReset；refresh；一个 action；result/pending/error | 最多两个常显条件，超出项进入同一 Drawer；宿主维护即时状态、查询和权限；[契约与版本边界](../docs/LIST_FILTER_BAR.md) |
| Badge | tone=neutral/success/warning/error；children | 只读短状态，颜色必须配文字，不做可点击按钮 |
| Surface | padding=default/none；HTML div 属性 | 默认24px内距；none仅取消容器padding，适合纯表格；静态分区，无点击语义；padding自0.9.1提供，见[#24](https://github.com/linhay/rhine-design/issues/24) |
| Background（0.5.0） | roleTone=canvas/content/sidebar/surface/overlay/media；decoration=auto/theme/none；appearance={color,textColor,texture,textureSize}；HTML div 属性 | 默认正文纯色；仅画布默认使用主题纹理；局部覆盖不创建主题根或定位上下文；完整配置见[场景背景](../docs/THEMING.md#场景背景050) |
| SelectionCard | label；selected；onSelectedChange；disabled；showIndicator=true；children | 原生 checkbox 可取消；是否单选由上层控制；showIndicator=false 仅视觉隐藏勾选框，保留键盘与读屏，卡片边界表达选中；内部不嵌套按钮/链接/其他输入 |
| TextField | label；hint；error；原生 input 属性 | label 与 id 自动关联；错误与提示组成 aria-describedby；输入值由调用方管理 |
| Tabs | label；items[{value,label,content,disabled?,description?,status?}]；value；onValueChange | value 必须指向有效可用项；唯一 value；左右/Home/End，跳过禁用项；隐藏面板保留挂载但退出可访问树；description/status为本地候选新增，见下文 |
| SegmentedControl | label；items[{value,label,disabled?}]；value；onValueChange；fullWidth?；size=default/compact | compact为卡片局部操作的32px视觉/44px命中（本地候选）；原生 radio，独立 name 防多组干扰；方向键和禁用行为由浏览器提供；fullWidth 为整行等宽选项，标签和选中底色撑满且文字居中 |
| Notice | tone；title；children；action | error 使用 alert，其余 status；调用方决定显示/移除，不自动倒计时关闭错误 |
| Progress | label；value:number/null；valueText? | null/NaN 为未知进度；数值钳制 0–100；组件不执行或估算真实进度 |
| Skeleton | label；lines | 1–8 行，默认 3 行；单一可访问加载描述，装饰行隐藏 |
| Disclosure | title；children；defaultOpen | 非受控原生 details；挂载后 defaultOpen 不作远程控制；支持开合中断与反向，关闭内容退出键盘顺序；连续分组不加组间 gap，相邻 Disclosure 共用一条分隔线 |
| EmptyState | title；description；action | 说明当前状态并可给一个下一步动作；不将错误伪装成空数据 |

新增24项API与组合示例见[常用组件契约](./COMMON_COMPONENTS.md)。TextField封装单行输入，Select使用原生单选；需要查询候选时用Combobox。复杂浮层采用Radix Dialog、AlertDialog、Popover、DropdownMenu、Tooltip的无样式基础，莱茵设计提供视觉与动效。Toast只处理单条通知；不加入全局队列、表格引擎、图表包或业务数据层。

0.8.0 的 `StatusTimelineList` 与 `TimelineLegend compact/items` 提供紧凑历史组合及一行短图例；宿主传入完整规则，悬停/聚焦/点按查看。无参 TimelineLegend 仍兼容既有标签。真实样机 `/#compact-account` 同时验证无框额度摘要、配对事实与渐进展示的凭证操作，见[紧凑组合规范](../docs/COMPACT_ACCOUNT_PATTERNS.md)。npm 0.6.0 不提供这些扩展。

浏览状态不等于执行结果；页面使用宿主的真实状态决定selected/busy/notice，视觉反馈不能提前宣称业务完成。

## 动效规范

本节`/#…`相对独立展台服务根（默认18309）。

启动动画候选见[三角构架归位](./STARTUP.md)与`/#startup`。专属分镜不改变通用Logo入场参数，也不作为真实初始化等待门槛。

用户指定的Transitions.dev参考与莱茵设计取舍见[UX与动效补充](./MOTION.md)。`/#motion`已提供12组播放、重播、复位与4倍慢放示例，可逐例切换减少动态。方向展开、内容淡入与结果反馈仅在实验室作为候选实现；通用默认实现仍以下表和实际组件为准。

### 品牌标志

用户已选定第三版「三角构架」。[Logo.tsx](./Logo.tsx) 是复用入口，[assets/logo.svg](./assets/logo.svg) 是唯一几何母版；各主题与尺寸均引用同一组三块路径。`?no-inline` 保证生产构建保留可引用的 SVG 文件，避免外部 `<use>` 引用 data URL 的兼容问题。三块图形包围盒为 `(83.5,120.5)–(716.5,679.5)`，在 `800×800` 画布内左右各83.5、上下各120.5，深浅模式保持相同尺寸与中心。不要为深色版另裁图或分别平移路径。

```tsx
<Logo variant="icon" theme="dark" size={96} />
<Logo variant="lockup" size={40} />
<Logo size={80} animate />
// 旁边已有相同品牌文字时隐藏重复的辅助技术描述：
<Logo size={24} decorative />
```

`mark` 为透明单标志，`icon` 为圆角底板，`lockup` 为标志与可配置字标（默认 Rhine Design）；`wordmark`同时提供默认可访问名称，`label`可单独覆盖。浅色为苔绿标志/暖白底；深色为暖白标志/苔绿底。`auto` 跟随系统配色，只有 Logo 改色，不代表组件库已有完整深色主题；透明形态的背景由调用者负责提供。标志画布外建议保留至少宽度的 1/8 安全间距，不拉伸、不旋转。小于24px只用单标志，不加字标。

默认没有动画。`animate` 在挂载时播放一次240ms三块归位，位移最大3 CSS px并淡入，使用 standard 缓动。普通重渲染不会重播；需要显式重播时更换 key。减少动态时直接呈现；动画不承载加载或成功状态。原生安装/托盘保持静态，当前尚未替换打包资产。

### 通用组件

所有时长集中于 tokens；没有弹簧或第三方动画依赖。注意 Web Animations 使用的 token 单位约定为 `ms`，不要替换为 `s`。

| 场景 | 时长 / 缓动 | 动画属性 | 规则 |
| --- | --- | --- | --- |
| Button 悬停 | 120ms / standard | 背景、边框 | 只在可用且非 busy 时生效 |
| Logo 入场 | 240ms / standard | 三块位移 ≤3px + opacity | 显式 animate 才播放一次；减少动态立即静态；不循环、不表示业务状态 |
| Button 按下 | 80ms / standard | translateY(1px) | 不缩放文字，不导致排版移动 |
| 键盘焦点 | 即时 | outline | 不做缓入，不等待动画完成才响应 |
| Button 加载 | 1000ms / linear | 小型 spinner 旋转 | 保留原文本占位保证宽度；busyLabel 给辅助技术 |
| SelectionCard | 120ms / standard | 背景、边框、内描边 | 不移动或抬起整张卡，不改变高度 |
| TextField | 120ms / standard | 背景、边框 | 错误文字即时出现，不抖动输入框 |
| Select | 120ms / standard | 背景、边框 | 原生菜单；焦点即时；箭头不因focus旋转；减少动态关闭过渡 |
| Text / Toolbar | 无 | 无 | 文字、数值不循环、缩放或逐字动画 |
| Tabs 下划线 | 180ms / standard | scaleX | 不用 JS 测量标签宽度；根据激活项展收 |
| Tabs 内容进入 | 180ms / standard | opacity + translateY(3px→0) | 切换立即生效；不等待旧内容退出 |
| SegmentedControl | 120ms / standard | 背景、文字颜色 | 不拖动指示层，避免多行/缩放错位 |
| Notice 进入 | 200ms / standard | opacity + translateY(3px→0) | 退出直接移除；重要错误不自动消失 |
| 已知 Progress | 240ms / standard | scaleX | 不为等待动画延迟真实数值；可从当前画面反向过渡 |
| 未知 Progress | 1000ms / standard | translateX | 永不显示虚假百分比，持续状态文字可见 |
| Skeleton | 1400ms / ease-in-out | opacity 1↔0.55 | 小幅明暗，不做扫光/闪烁；内容就绪后直接替换 |
| Disclosure 开合 | 200ms / standard；收起用 exit | 实测 height + 图标 rotation | 高度动画仅用于该必要布局变化；快速反向取消旧动画并从当前高度续接 |
| Badge / Surface / EmptyState | 无 | 无 | 静态基础内容不额外入场或循环动画 |
| Switch | 120ms / standard | 滑块位移、背景 | checked即时生效；减少动态立即定位 |
| Dialog / ConfirmDialog / Popover / Menu / Tooltip / Combobox | 160ms / standard | opacity，非模态最多3px位移 | 关闭立即归还焦点；Tooltip悬停延迟300ms，键盘无延迟 |
| Toast | 180ms / standard | opacity + translateY(3px→0) | 成功默认5秒；hover/focus/页面隐藏暂停；错误持久；计时不依赖动画 |

缓动变量：`--rhine-ease-standard: cubic-bezier(.2,0,0,1)`；`--rhine-ease-exit: cubic-bezier(.4,0,1,1)`。

### 降级与中断

- 系统 `prefers-reduced-motion: reduce` 始终优先；组件容器也可用 `data-rhine-motion="reduced"` 显式减少动态。
- 减少动态时过渡与循环动画全部关闭，直接到达最终状态。未知进度保留静态轨迹与「处理中」文字，骨架保留静态结构。
- Disclosure 的在途 Web Animation 在系统偏好变化或预览切换减少动态时取消并完成当前意图。没有 Web Animations 支持时立即展开/收起。
- 原生 details 保证完全关闭后隐藏内容不再接收 Tab。收起时把内部焦点送回 summary；卸载取消未完成动画。
- 动画不承诺异步任务一定成功；不使用定时器模拟业务完成。预览中的 900ms 保存仅为明确标记的本地演示。
- 组件不提供全局开启/关闭业务状态的开关；动画是视觉层的可选增强。

### 带说明与状态的 Tabs（本地候选，未发布）

完整规格见[带摘要的页签](../docs/SUMMARY_TABS.md)：名称14/22/600、摘要12/18/400，12px上下内距、8px名称/状态、4px摘要间隔、16px页签间距及24px面板间距。独立可交互展台 `/#summary-tabs` 提供局部宽度与状态切换；普通Tabs保持原有间距。

`description?: string` 显示对象身份等辅助信息，`status?: ReactNode` 用只读 Badge 或纯文本表达状态，不嵌套按钮、链接等交互元素。存在这两项时页签等分可用宽度，标题/状态及辅助文字自然换行；普通纯标题 Tabs 布局保持不变。页签可访问名称始终为 `label`，描述和状态经 `aria-describedby` 关联；选中与焦点保持原语义和动效，减少动态沿用现有规则。

状态由宿主持有，每项同时呈现自己的摘要，不能用当前选中项的摘要填充所有页签。身份变化不得改变 `value` 或重建焦点；状态变化不自动切页。展台 `/#selection` 保留普通Tabs，`/#summary-tabs` 集中提供摘要页签的正常、禁用/加载、错误和长说明，支持局部宽度、键盘、主题及减少动态控件。

## 页面采用顺序

先 Button、TextField、Notice、Badge；再 Tabs、SegmentedControl 与 Surface；随后 SelectionCard、Progress、Skeleton、Disclosure、EmptyState。逐页替换时保持业务 DTO/动作调用不变。

组件不放账号字段、API-Key 格式化、服务端分页或系统路径逻辑；这些属于业务组件。新业务组合达到实际复用需求后再提取，不预先建通用数据层。

## 验证入口与边界

在仓库根执行npm run check。浏览器核对400/520/880/1200宽度、200%缩放、键盘/焦点、展开反向、减少动态中断与加载宽度。JSDOM不代替视觉或原生辅助技术验收。

本仓构建产物是独立展台；消费项目只导入组件入口，避免把preview中的模拟流程打入业务产物。版本变化和迁移见[CHANGELOG](../CHANGELOG.md)。

## 背景与外壳（0.5.0）

新增 `Background` 与 `AppShell`，0.5.0 共 59 个组件；npm 0.4.0 仍为 48 个。Background 支持六类 roleTone、auto/theme/none 装饰策略及 appearance 局部覆盖；AppShell 提供组合展台使用的固定顶部操作区与响应式侧栏。完整 API、最小接入、背景滚动及 Portal 边界见[背景与应用外壳契约](../docs/APPLICATION_COMPONENTS.md)。

0.8.0 新增可选 `AppShell.contentHeader`：工作区导航常驻正文列顶部，正文独立滚动；组合现有 `AppShellToggle`、`Inline`、标题与操作。0.8.0 媒体组件同步更新主题边界：卡片、标签、查看器工具栏与信息栏跟随宿主主题，仅媒体画布保持中性。以上不包含于 npm 0.6.0，交互与验证边界见[应用组件契约](../docs/APPLICATION_COMPONENTS.md)。

## 轨道背景（0.6.0）

`OrbitBackdrop` 自 0.6.0 提供，接收 `HTMLAttributes<HTMLDivElement>` 和 `reducedMotion?: boolean`，包含可选 `children`。0.6.0 提供固定深色轨道艺术与内置暂停 / 继续按钮，Canvas 为 `aria-hidden` 装饰。系统、显式减少动态、祖先偏好、窄窗、页面隐藏、离屏及零尺寸时停帧；恢复沿冻结时间继续，不追赶。Canvas 不可用时保留静态艺术与内容。宿主只组合布局，不复制动画或覆盖组件状态。完整生命周期、主题及接入约束见[轨道背景契约](../docs/ORBIT_BACKDROP.md)，真实组件展台为 `/#orbit`。自 0.6.0 起共 60 个组件。

0.8.0 新增 `appearance?: 'theme' | 'original'`：莱茵展示暖白纸纹、浅绿折面、轻微振翅与悬浮纸屑的折纸鸟；战术展示带倒角晶面、矿物纹理、琥珀裂纹与漂浮碎片的源石晶簇；橙趣展示有烘焙纹理、糖霜、糖针与糖尘的草莓甜甜圈。三套物品按需加载 Three.js，窄屏可播放，遵循同一暂停、减少动态、隐藏与离屏规则；WebGL 失败回退 Canvas2D，Canvas 不可用时使用本地 SVG。`original` 保留初版完整深色轨道。切换主题复用时钟和绘制器，保留暂停与内容草稿。详见[轨道背景契约](../docs/ORBIT_BACKDROP.md)。

0.8.0 新增 `AppShellToggle` 与 `AppShell.controls="inline"`。品牌区/正文区成对放置与可达性要求见[内联控制契约](../docs/APPLICATION_COMPONENTS.md#内联控制按钮080)。
## 中子星背景（0.8.0）

`NeutronStarBackdrop` 接收 `HTMLAttributes<HTMLDivElement>`、`reducedMotion?: boolean`、`appearance?: 'theme' | 'original'` 和可选 `children`。默认从当前主题取得艺术配色，`original` 保留原始深空；切换颜色不重置时间，实体内容控件仍用宿主主题。按需加载 Three.js，保留 28 条磁场线、560 个流粒、700 颗星尘、极向喷流与星核；星系以 28 秒有效播放时间完成一轮深度公转，镜头保持固定。

内置暂停 / 继续；系统、显式和祖先减少动态、隐藏、离屏或零尺寸停帧，恢复不追赶。SSR 不访问浏览器绘制环境，异步初始化晚于卸载时不创建渲染器；无 WebGL、导入失败或 context lost 保留静态艺术和业务内容，context restored 按当前偏好恢复，卸载释放监听、帧循环及 GPU 资源。宿主负责尺寸和普通内容布局，正文不模糊；不以装饰状态控制业务。完整用法与验收见[中子星背景契约](../docs/NEUTRON_STAR_BACKDROP.md)，真实源码展台为 `/#neutron-star`。

内容层只预留底部 `44px + 2 × --rhine-space-4` 控件安全区，不强制正文四边 padding；宿主在自己的 Stack 或页面容器设置边距，避免重复叠加。静态 fallback 保留当前配色的星核、磁场意图，不保证与三维画面逐像素一致。

## 0.8.0 补充

- [浮层缩放与边界](../docs/FLOATING_OVERLAYS.md)：Popover、Menu、Tooltip 与时间轴共享 CSS zoom 修正。
- [设置 Dialog](../docs/SETTINGS_DIALOG.md)：`navigation` 插槽及窄窗/缩放重排。
- [主题选择](../docs/THEME_PICKER.md)：`ThemePicker` / `ThemePreview`，候选源码新增两项组件至 66；旧版安装包仍按自身导出判断。
