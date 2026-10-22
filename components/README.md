# 莱茵设计 · 通用组件 V1.4

本目录提供[莱茵设计 · Rhine Design](../README.md)的 React 组件、设计变量和 API 契约。组件接收应用传入的数据与动作，不绑定特定后端或原生平台。包名为`@linhey/rhine-design`；样式变量和类名使用`tod-`命名空间。

共40个组件。已有16个基础组件，新增24个数据、表单、操作、浮层和布局组件，见[常用组件契约](./COMMON_COMPONENTS.md)。[字体与文字规范](./TYPOGRAPHY.md)与[主流系统对照与缺口](../docs/DESIGN_SYSTEM_AUDIT.md)共同约束复用。静态页面样稿也使用同源Toolbar/Select CSS，不运行React。

页面改动遵循：优先复用组件 → 先在设计稿/展台修改并验证 → 再按任务授权实现到App。缺组件先补组件与展台，不在业务页另写同用途样式；同一任务已授权设计和实现时连续推进，无需重复确认。

## 使用

先按[套件接入说明](../README.md#quick-start)安装组件包，再导入：

```tsx
import { Button, Notice, Progress, Surface } from '@linhey/rhine-design';

export function Example() {
  return (
    <div className="tod-theme">
      <Surface>
        <Notice tone="warning" title="需要处理">请检查后重试。</Notice>
        <Progress label="任务进度" value={null} />
        <Button variant="secondary" onClick={() => { /* 业务动作 */ }}>重试</Button>
      </Surface>
    </div>
  );
}
```

入口 `index.ts` 自动导入组件 CSS。使用一个 `.tod-theme` 包裹组件树，获得字体、盒模型、焦点和动效降级规则。主题根放在页面根部，不加transform、裁剪或contain；浮层Portal挂在最近的主题根以继承变量和减少动态偏好。独立运行与跨项目导入方式见[套件入口](../README.md)；跨仓复用核对React19与套件package.json中的5个Radix依赖，不导入展台。

- `tokens.css`：唯一色彩、尺寸与动画变量来源。
- `styles.css`：`tod-` 前缀组件样式，业务页面可组合布局但不覆盖组件状态。
- `components.tsx`：原有基础组件；`Actions/Data/Forms/Layout/Overlays/Toast.tsx`承载新增组件。表单与业务数据由调用方控制，浮层开关、通知计时及复制结果只管理局部交互。
- `../preview/`：使用同一组件实现的开发预览，独立 HTML 入口，无业务客户端依赖。
- [index.html](../index.html)：Vite 开发入口，在套件根运行 `npm run dev` 后访问 `http://127.0.0.1:18309/`。

旧 `design/refactor/tokens.css` 只转引此处变量，避免页面样稿与组件库各维护一份颜色。

## 组件契约

| 组件 | 关键输入 | 状态与边界 |
| --- | --- | --- |
| Button | variant=primary/secondary/quiet/danger；busy；busyLabel；原生按钮属性 | 默认 type=button；busy 保留焦点并拦截再次 click，不自动把业务标记成功；disabled 使用原生禁用 |
| Logo | variant=mark/icon/lockup；theme=light/dark/auto；size；animate；decorative；label；wordmark | 第三版三角构架；默认静态、48px、浅色单标志；最小16px；无点击/业务状态 |
| Text | variant；as；tone；numeric；HTML属性 | 默认p/body；视觉层级不决定HTML语义；长文本可换行；不转换数值或截断文本 |
| Select | label；hint；error；原生单选select属性；option子节点 | 标签与描述自动关联；原生菜单和键盘；受控或defaultValue；不支持multiple/size列表模式；箭头装饰性且不接收点击 |
| Toolbar | title；description；children；HTML div属性 | 自适应控件组合，role=group与普通Tab顺序；不伪装为需要方向键导航的ARIA toolbar；不含业务状态 |
| Badge | tone=neutral/success/warning/error；children | 只读短状态，颜色必须配文字，不做可点击按钮 |
| Surface | HTML div 属性 | 静态分区，无点击语义；不是弹窗或导航 |
| SelectionCard | label；selected；onSelectedChange；disabled；children | 原生 checkbox 可取消；是否单选由上层控制；内部不嵌套按钮/链接/其他输入 |
| TextField | label；hint；error；原生 input 属性 | label 与 id 自动关联；错误与提示组成 aria-describedby；输入值由调用方管理 |
| Tabs | label；items[{value,label,content,disabled?}]；value；onValueChange | value 必须指向有效可用项；唯一 value；左右/Home/End，跳过禁用项；隐藏面板保留挂载但退出可访问树 |
| SegmentedControl | label；items[{value,label,disabled?}]；value；onValueChange | 原生 radio，独立 name 防多组干扰；方向键和禁用行为由浏览器提供 |
| Notice | tone；title；children；action | error 使用 alert，其余 status；调用方决定显示/移除，不自动倒计时关闭错误 |
| Progress | label；value:number/null；valueText? | null/NaN 为未知进度；数值钳制 0–100；组件不执行或估算真实进度 |
| Skeleton | label；lines | 1–8 行，默认 3 行；单一可访问加载描述，装饰行隐藏 |
| Disclosure | title；children；defaultOpen | 非受控原生 details；挂载后 defaultOpen 不作远程控制；支持开合中断与反向，关闭内容退出键盘顺序 |
| EmptyState | title；description；action | 说明当前状态并可给一个下一步动作；不将错误伪装成空数据 |

新增24项API与组合示例见[常用组件契约](./COMMON_COMPONENTS.md)。TextField封装单行输入，Select使用原生单选；需要查询候选时用Combobox。复杂浮层采用Radix Dialog、AlertDialog、Popover、DropdownMenu、Tooltip的无样式基础，莱茵设计提供视觉与动效。Toast只处理单条通知；不加入全局队列、表格引擎、图表包或业务数据层。

浏览状态不等于执行结果；页面使用宿主的真实状态决定selected/busy/notice，视觉反馈不能提前宣称业务完成。

## 动效规范

本节`/#…`相对独立展台服务根（默认18309）。

启动动画候选见[三角构架归位](./STARTUP.md)与`/#startup`。专属分镜不改变通用Logo入场参数，也不作为真实初始化等待门槛。

用户指定的Transitions.dev参考与莱茵设计取舍见[UX与动效补充](./MOTION.md)。`/#motion`已提供10组播放、重播、复位与4倍慢放示例，可逐例切换减少动态。方向展开、内容淡入与结果反馈仅在实验室作为候选实现；通用默认实现仍以下表和实际组件为准。

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

缓动变量：`--tod-ease-standard: cubic-bezier(.2,0,0,1)`；`--tod-ease-exit: cubic-bezier(.4,0,1,1)`。

### 降级与中断

- 系统 `prefers-reduced-motion: reduce` 始终优先；组件容器也可用 `data-tod-motion="reduced"` 显式减少动态。
- 减少动态时过渡与循环动画全部关闭，直接到达最终状态。未知进度保留静态轨迹与「处理中」文字，骨架保留静态结构。
- Disclosure 的在途 Web Animation 在系统偏好变化或预览切换减少动态时取消并完成当前意图。没有 Web Animations 支持时立即展开/收起。
- 原生 details 保证完全关闭后隐藏内容不再接收 Tab。收起时把内部焦点送回 summary；卸载取消未完成动画。
- 动画不承诺异步任务一定成功；不使用定时器模拟业务完成。预览中的 900ms 保存仅为明确标记的本地演示。
- 组件不提供全局开启/关闭业务状态的开关；动画是视觉层的可选增强。

## 页面采用顺序

先 Button、TextField、Notice、Badge；再 Tabs、SegmentedControl 与 Surface；随后 SelectionCard、Progress、Skeleton、Disclosure、EmptyState。逐页替换时保持业务 DTO/动作调用不变。

组件不放账号字段、API-Key 格式化、服务端分页或系统路径逻辑；这些属于业务组件。新业务组合达到实际复用需求后再提取，不预先建通用数据层。

## 验证入口与边界

在仓库根执行npm run check。浏览器核对400/520/880/1200宽度、200%缩放、键盘/焦点、展开反向、减少动态中断与加载宽度。JSDOM不代替视觉或原生辅助技术验收。

本仓构建产物是独立展台；消费项目只导入组件入口，避免把preview中的模拟流程打入业务产物。版本变化和迁移见[CHANGELOG](../CHANGELOG.md)。
