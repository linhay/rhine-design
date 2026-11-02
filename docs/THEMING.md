# 主题接入

`ThemeProvider`、`useTheme`、`themes` 和相关类型从 `@linhey/rhine-design/theme` 导出。此能力自 0.4.0 提供，npm 0.3.0 不包含；建议固定版本并提交 lockfile。组件仍从 `@linhey/rhine-design` 导入。

`neutral` 为 #98 新增的未发布源码能力，npm 0.11.3 不包含。完整配色与兼容边界见 [中性主题](THEME_NEUTRAL.md)。

`graphite` 是 #150 授权实现的未发布候选主题，接入、视觉与验收边界见 [石墨夜间主题](THEME_GRAPHITE.md)。

## 接入一次，随处切换

```tsx
import { Button } from '@linhey/rhine-design';
import { ThemeProvider, useTheme } from '@linhey/rhine-design/theme';

function Appearance() {
  const { theme, setTheme } = useTheme();
  return <Button onClick={() => setTheme('arknights')}>
    当前：{theme}，切换战术主题
  </Button>;
}

export function App() {
  return <ThemeProvider defaultTheme="rhine"><Appearance /></ThemeProvider>;
}
```

主题入口自动加载基础样式与五套内置主题，不需要另行导入主题 CSS、添加 `.rhine-theme` 或修改 DOM。Provider 渲染一个真实的 `div.rhine-theme`，通过 `data-rhine-theme` 应用主题，不重建子组件。普通组件入口保持独立，不额外加载可选主题。

## API

```ts
type ThemeName = 'rhine' | 'arknights' | 'neo-brutalism' | 'neutral' | 'graphite';

interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  defaultTheme?: ThemeName;
  theme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
}

function useTheme(): {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};
```

| 属性 / 行为 | 约定 |
| --- | --- |
| `defaultTheme` | 非受控初始值，默认 `rhine`；后续修改该属性不会重置当前选择 |
| `theme` | 受控值；提供后以宿主传入值为准，`defaultTheme` 不生效 |
| `onThemeChange` | 请求切换到不同主题时同步调用；初次挂载、宿主更新 props、重复选择当前主题不会调用 |
| `setTheme(next)` | 非受控时更新内部值并通知；受控时仅通知宿主，宿主回传 `theme` 后生效 |
| 根节点属性 | 支持 `children`、`className`、`style`、`id`、ARIA、事件及 `data-rhine-motion` 等 div 属性；库保留 `.rhine-theme` 和 `data-rhine-theme` 的控制权 |
| 无 Provider | `useTheme()` 抛出明确错误 |
| 无效主题名 | TypeScript 限制为 `ThemeName`；运行时传入非法名字也会抛错，不静默应用不存在的主题 |

受控模式中需由 `onThemeChange` 更新宿主状态，否则选择仅产生请求、界面保持原值。不要在同一个 Provider 生命周期中切换受控和非受控模式。

## 使用主题列表生成选择器

`themes` 是只读元数据列表，每项包含稳定标识 `name` 和展示名称 `label`；`ThemeName` 从列表推导。不要根据中文名称保存偏好。

```tsx
import { Select } from '@linhey/rhine-design';
import { themes, useTheme } from '@linhey/rhine-design/theme';

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return <Select label="界面主题" value={theme} onChange={event => {
    const next = themes.find(item => item.name === event.target.value);
    if (next) setTheme(next.name);
  }}>
    {themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}
  </Select>;
}
```

## 宿主管理偏好

```tsx
import { useState } from 'react';
import { ThemeProvider, type ThemeName } from '@linhey/rhine-design/theme';

export function App() {
  const [theme, setTheme] = useState<ThemeName>('rhine');
  return <ThemeProvider theme={theme} onThemeChange={setTheme}>
    <ThemeSelect />
  </ThemeProvider>;
}
```

库不读写 `localStorage`、Cookie、URL 或账号设置。宿主将这些偏好校验为 `ThemeName` 后传入；读取失败或未知名称时应自行选择默认值。服务端渲染与其他构建器尚未验收；若宿主使用 SSR，需确保服务端和客户端初始值一致。

展台 `preview/GalleryShell.tsx` 是受控接入示例：有效 URL `?theme=` 优先，其次有效本地偏好，最后 `rhine`；主动切换后移除主题查询参数，保留其他参数和章节 hash；存储不可用时仍可切换。上述持久化行为属于展台，不是库默认行为。

## 范围、浮层和动态

- 第一版支持多个并列 Provider，各自维护主题。**不支持嵌套 Provider**，会抛错；不要把 Provider 嵌在另一个带主题的 `.rhine-theme` 内，也不要用嵌套手写主题根尝试覆盖风格。现有后代 CSS 选择器尚不具备嵌套隔离能力。
- Provider 放在页面根部，不添加 `transform`、裁剪或 `contain`。Dialog、Drawer、Menu、Popover、Tooltip、Combobox 的浮层沿用最近 `.rhine-theme` 挂载机制，主题切换时同步继承。
- 切换只改变视觉属性，不重挂载子树，不清除表单、关闭弹窗或重置滚动。宿主不要给 Provider 或应用子树添加 `key={theme}`。
- 主题 API 不注入切换动画。系统减少动态和 `data-rhine-motion="reduced"` 沿用组件规则。
- 内置主题属于视觉风格；不提供 `system` / `dark` / `light` 模式枚举。Logo 的 `theme` 仍是独立配色属性。
- 公共主题 CSS 只包含组件视觉。展台布局、HUD、终端读数、扫描与开机装饰位于 `preview/theme-*.css`，不会随公共主题入口进入应用。

## 从手写主题根迁移

将 `<div className="rhine-theme" data-rhine-theme="arknights">` 替换为 `<ThemeProvider defaultTheme="arknights">`，删除额外主题 CSS 导入；原根节点的布局类、`id`、动效属性直接传给 Provider。需要动态切换时调用 `useTheme().setTheme()`。

旧的 CSS-only 用法继续支持：先导入基础组件样式，再导入 `theme-arknights.css` 、`theme-neo-brutalism.css` 或 `theme-neutral.css`，在根节点设置属性。两种用法选择一种即可，不要为迁移再包一层主题根。

## 场景背景（0.5.0）

`Background` 从组件主入口导出，复用当前主题，不生成主题根。使用 `roleTone` 选择场景；默认是 `content`。主题定义颜色和纹理，业务无需判断当前主题名称。展台 `#backgrounds` 只展示当前选中主题的六类场景；使用右上角主题选择器切换四套内置主题，背景随之同步更新。

| `roleTone` | 用途 | 默认纹理 | 底色 / 文字变量 |
| --- | --- | --- | --- |
| `canvas` | 页面、工作台底层 | 跟随主题：纸面无纹理、战术网格、橙趣点阵 | `--rhine-canvas-bg` / `--rhine-canvas-text` |
| `content` | 正文、阅读区 | 无 | `--rhine-content-bg` / `--rhine-content-text` |
| `sidebar` | 导航、侧栏 | 无 | `--rhine-sidebar-bg` / `--rhine-sidebar-text` |
| `surface` | 卡片、表单分区 | 无 | `--rhine-surface-bg` / `--rhine-surface-text` |
| `overlay` | 弹窗、浮层表面 | 无 | `--rhine-overlay-bg` / `--rhine-overlay-text` |
| `media` | 图片、视频画布 | 无 | `--rhine-media-bg` / `--rhine-media-text` |

每类背景还有 `--rhine-{roleTone}-texture` 变量，仅用于 `Background` 的场景纹理。纹理尺寸使用 `--rhine-background-scale`。媒体底色默认引用已有 `--rhine-media-canvas`，保留中性深色及配套浅色文字；`Surface` / `Fieldset` 使用表面底色，Dialog / Drawer / Popover / Menu 使用浮层底色，模态遮罩使用独立的 `--rhine-backdrop-bg`。Tooltip 保留各主题的强调配色。

```tsx
import { Background, Surface } from '@linhey/rhine-design';

<Background roleTone="canvas">
  <Background roleTone="content">
    <Surface>正文默认关闭纹理，卡片保持不透明。</Surface>
  </Background>
</Background>

// 显式开启当前区域的主题纹理；纸面主题仍然没有纹理。
<Background roleTone="content" decoration="theme">概览区域</Background>

// 局部配色：同时选择能清楚阅读的文字色。
<Background appearance={{ color: '#e5ece3', textColor: '#242b28' }}>
  阅读区域
</Background>
```

`decoration` 默认 `auto`，使用场景默认值；`theme` 显式使用主题纹理；`none` 强制移除纹理，包括 `appearance.texture`。`appearance` 可局部覆盖 `color`、`textColor`、`texture`、`textureSize`，优先于场景/主题默认值；省略项仍跟随主题，嵌套 `Background` 重置为自身场景，不继承外层局部覆盖。原生 `style` 保持最终 CSS 覆盖权。

背景只负责当前元素的绘制，不添加内边距、固定高度、定位、裁剪、伪元素或鼠标拦截层。`overlay` 只是视觉表面，不创建对话框、遮罩或焦点管理；实际交互使用 Dialog / Drawer 等组件。媒体与局部文字配色不重写子组件自身的颜色变量；输入、按钮等仍使用完整主题样式。

若需全主题配置，在**主题根**通过 CSS 变量覆盖对应场景的底色、文字与纹理；局部调整优先用 `appearance`。局部背景不会传递给挂在主题根的 Portal，浮层仍使用主题的浮层变量。

兼容已有源码调用：`roleTone` 的原有三种值与显式 `theme` / `none` 均保留；省略 `decoration` 的正文及 `AppShell` 改为 `auto`，默认纯色。需要旧版正文纹理的调用方显式传入 `decoration="theme"`。侧栏显式传入 `theme` 现在也会开启纹理；默认仍关闭。以上能力自 0.5.0 提供，不属于 npm 0.4.0。

主题选择组件 [ThemePicker / ThemePreview](THEME_PICKER.md) 自 0.8.0 提供；静态预览避免嵌套 Provider。接入时核对源码与实际安装包，不由 main 展台推断发布范围。

## 颜色角色验收

现有五主题的代表场景由 `scripts/check-theme-roles.js` 在生产展台上量测，执行与边界见 [贡献流程](../CONTRIBUTING.md#颜色角色检查)。复用按钮、聊天检查的 sRGB 相对亮度算式，新增透明背景逐层合成、状态分类与定向反例；不引入配色生成器、外部字体或运行依赖。

| 角色 | 实际入口与状态 | 判断 |
| --- | --- | --- |
| 强调填充上的文字 | `?fixture=neutral` 的 Button 默认、hover、busy；`#button-actions` 的启用危险按钮默认/hover/焦点 | 文字按实际字号/字重取阈值 |
| 强调文字 | Dialog / Popover 内的 Link、hover | 使用实际浮层背景，不拿品牌原色代替文字角色 |
| 正文与辅助文字 | TextField 值/placeholder 与 Textarea 边界、Dialog 标题/说明、DataTable 表头/单元格/hover | 透明层逐层合成；不只取最近的非透明字符串 |
| 状态文字 | TextField 错误、Notice 警告/成功、DataTable 读取失败 | 文字阈值；错误文字、输入保留与状态语义另验 |
| 必要非文本状态 | TextField 边界/错误边界、Tabs 选中指示、键盘焦点环 | 与实际相邻背景比，不比较非相邻的 default/hover 两种颜色 |
| 选择状态文字 | `#selection` 的 SelectionCard hover 与 selected 标题/说明 | 检查真实叠层背景，保留勾选语义 |
| 场景表面 | `#backgrounds` 的 canvas/content/sidebar/surface/overlay/media | 先测默认 auto，再通过真实选择器切换 none 对照；已有网格/点阵按全部透明度端点及多层交点计算保守下限 |
| 禁用与装饰 | 禁用 Button；装饰分隔线、非必要按钮边界、模态遮罩 | 禁用值留作观察，与规范豁免分开；装饰项 N/A，不机械要求 3:1 |

依据 [WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)：普通文字至少 4.5:1，大字至少 3:1；脚本以 CSS 24px，或至少 14pt（56/3px）且粗体作为大字边界，比较前不四舍五入。禁用控件文字属于豁免，豁免不代表达到了某个另行约定的产品可读性目标。APCA 不替代本项 WCAG 验收。

[SC 1.4.11](https://www.w3.org/TR/WCAG22/#non-text-contrast) 对识别控件及状态所需的视觉信息要求至少 3:1；[W3C 边界说明](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html#boundaries)明确：文字或图标已足以识别控件时，不要求额外的可见外框。焦点测量不等于覆盖全部焦点面积、遮挡、键盘或读屏要求。

战术主题输入边界修复（#151，未发布）：仅非禁用 TextField / Textarea 的边界改为 `#69737d`，错误边框恢复 `--rhine-error` 优先级。焦点内描边和背景扫光保留，通用 `--rhine-control` 与装饰线不变；npm 0.11.3 不含该修复。

本检查只证明列出的当前源码样本，不是全库 WCAG 合规认证，也不证明 npm 发行或消费项目。仅识别现有单色透明扫光、双线网格、圆点图案的固定形状；逐层组合所有端点（含交点），先逐 RGB 通道取上下界，再计算前景/背景亮度包络与对比度下限；不能直接把端点亮度当作内部极值，红绿等相反通道方向可能在 alpha 内部产生更低亮度。包络可能比实际绘制更保守，下限不足时不能直接归为产品缺陷，应进一步复核实际颜色路径/像素，不宣称逐像素采样。未知图像、其他渐变形状、祖先或被测样式（含伪元素）整体透明度不为 1 时输出 `UNMEASURED` 并使结果失败，不能把未知当作通过。伪元素还检查自己的 display/visibility；按钮有矩形不能证明指示线已绘制。长文、裁剪、原生缩放、状态语义继续按各自入口验收。

[#150](https://github.com/linhay/rhine-design/issues/150) 的石墨夜间已于 2026-11-02 获用户授权进入实现，并复用本验收。瑞士蓝与书卷阅读仍为研究建议；本次不将阅读模式新增为主题。
