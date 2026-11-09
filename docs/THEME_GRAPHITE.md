# 石墨夜间主题

`graphite` 是 #150 在 2026-11-02 获授权实现的 Web 源码主题，尚未 npm 发布，npm 0.11.3 不包含。默认主题仍为 `rhine`；既有四主题的 CSS、字号和动效不变。`ThemeName` 增加一个值，消费方的穷举分支需要同步处理，建议从 `themes` 生成选择器。

```tsx
import { ThemeProvider } from '@linhey/rhine-design/theme';
<ThemeProvider defaultTheme="graphite">{/* 真实组件 */}</ThemeProvider>
```

CSS-only 接入先加载 `@linhey/rhine-design/styles.css`，再加载 `@linhey/rhine-design/theme-graphite.css`，在真实根节点使用 `.rhine-theme[data-rhine-theme="graphite"]`。主题入口自动导入；普通组件入口不自动加载。受控切换、Portal、草稿保留和宿主持久化职责沿用[主题 API](THEMING.md)，不支持嵌套 Provider，不自动跟随系统切换主题。

| 角色 | 值 / 用途 |
| --- | --- |
| 画布 / 侧栏 / 表面 / 浮层 | `#15191c` / `#1b2024` / `#20262a` / `#272e33` |
| 正文 / 辅助文字 | `#e9eced` / `#a2adb2` |
| 装饰线 / 控件边界 | `#3b454b` / `#7c898f`，用途分开 |
| 操作 / 选中背景 | `#a5c7b6` / `#303e3b`，操作上使用深色文字 |
| 警告 / 错误 | `#e2bb78` / `#f0a39c`，独立深色状态背景 |
| 几何 / 动效 | 卡片 12px、控件 8px；沿用默认字号、间距、操作目标、减少动态 |

这是一套低装饰深色外观：不使用战术切角、扫描纹理、发光或外部字体。危险按钮悬停与选择卡悬停覆盖基础浅色字面值；错误文字、输入边界、Tabs 下划线、选择勾选和焦点环保留。禁用文字沿用产品语义，验收区分规范豁免。媒体与独立艺术背景保留其原有显式 appearance 语义，不将装饰图误作正文颜色证明。

真实展台 `?theme=graphite#graphite` 和隔离 `?fixture=graphite` 使用公开 TextField、Switch、Button、Dialog、ThemePicker、Checkbox、DataTable 等组件。包含设置错误/重试/等待取消、禁用、列表正常/加载/失败重试/空态、长记录、正文和浮层内主题切换。所有数据为合成，动作不连接真实服务。`#theme-picker` 使用相同 ThemeSample 生成的 960×600 实际组件截图，其他四张图不变，摘要保存在 assets manifest。

执行 `scripts/check-theme-roles.js` 检查五主题代表颜色角色；`scripts/check-graphite-theme.js` 检查石墨展台状态、布局、键盘、减少动态与主题切换；`scripts/check-neutral-picker.js` 检查五张图与既有 picker 交互。结果、失败及验证边界见[石墨主题验收](THEME_GRAPHITE_VERIFICATION.md)。颜色检查不等于全库 WCAG 认证，CSS zoom 2 不等于原生浏览器缩放；无 UIKit、发行和真实消费产品结论。
