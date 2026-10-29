# 中性 · 黑白轻量

`neutral` 是 #98 新增的未发布源码主题，npm 0.11.3 不包含。它增加 `ThemeName` 的一个值，默认主题仍为 `rhine`；现有三主题视觉保持不变。穷举 ThemeName 的消费代码须增加 neutral 分支，推荐从 `themes` 生成选择器。

```tsx
import { Button, TextField } from '@linhey/rhine-design';
import { ThemeProvider } from '@linhey/rhine-design/theme';

<ThemeProvider defaultTheme="neutral">
  <TextField label="记录名称" defaultValue="合成记录" />
  <Button>继续</Button>
</ThemeProvider>
```

CSS-only 接入先加载 `@linhey/rhine-design/styles.css`，再加载 `@linhey/rhine-design/theme-neutral.css`，使用 `.rhine-theme[data-rhine-theme="neutral"]`。`/theme` 入口自动加载；普通组件入口不自动加载可选主题。ThemePicker 默认提供四项与对应的随包静态预览。主题受控/非受控、并列 Provider、Portal、草稿保留与宿主存储职责沿用 [主题 API](THEMING.md)，不支持嵌套主题根。

## 配色与组件

| 角色 | 值 / 行为 |
| --- | --- |
| 正文、表面与浮层 | `--rhine-bg` / `--rhine-surface` / `--rhine-content-bg`: #fff，无纹理 |
| AppShell 侧栏 | `--rhine-sidebar-bg`: #f5f5f5 |
| 主文、辅助文 | `--rhine-ink`: #202020；`--rhine-muted`: #626262 |
| 操作、链接与 focus | 历史 token `--rhine-green`: #343434，保持公共命名兼容 |
| 选中、分隔与控件边界 | `--rhine-selected`: #ededed；`--rhine-line`: #dedede；`--rhine-control`: #858585 |
| 圆角 | control 10px、card / Dialog / Popover / Menu 16px |
| 错误与警告 | 保留红/棕语义、文字和边界，不强制所有状态灰阶 |

Button 保留 primary/secondary/quiet/danger、busy 与 disabled；Link 保留下划线。TextField 保留错误说明、disabled 与 focus 轮廓；SearchField 复用原生单输入组合与 44px 操作目标。Tabs 使用浅灰选中底与指示线，保持方向键、禁用项和隐藏面板规则。Dialog 只改表面与圆角，沿用焦点约束与返回。AppShell 使用白正文和浅灰侧栏，响应式抽屉保持可访问。状态图表沿用语义色，不以主题替换状态含义。系统和手动减少动态沿用公共组件契约，不增加主题切换动画。

## 依据与边界

2026-10-29 阅读 [Grok Bot 官方设计说明](https://x.ai/news/designing-grok-bot) 的应用示意，采用白正文、浅灰导航、黑灰操作与柔和边界，降低阅读界面的装饰权重；这是 Rhine 的独立中性主题。没有复制名称、角色、品牌资产或业务信息架构；不引入参考站点依赖。

真实展台 `?theme=neutral#neutral` 与隔离 fixture `?fixture=neutral` 提供 Button / Link / TextField / SearchField / Tabs / Dialog / AppShell、错误、禁用、等待与主题切换。固定包和浏览器证据见 [中性主题验收](THEME_NEUTRAL_VERIFICATION.md)。源码合并、Pages 展台、npm 发行与消费迁移分别验收；本改动不发布 npm、不替换产品样稿。
