# Web 设计体系导航

先按层找能力，再读原契约，最后用安装版本核对导出。本页只做入口，不复制参数，也不维护组件总数。

当前清单是 [组件目录](../components/CATALOG.md)。它对应 `components/index.ts` 的值导出。源码有一行，不表示 npm 已发布。

## 四层

| 层 | 先看 | 不要把它当成 |
| --- | --- | --- |
| 原语 | [目录 · 原语](../components/CATALOG.md#原语)、[字体](../components/TYPOGRAPHY.md)、[间距](../components/SPACING.md) | 页面任务或业务结果 |
| 组件 | [目录 · 组件](../components/CATALOG.md#组件)、[组件契约](../components/README.md)、[常用契约](../components/COMMON_COMPONENTS.md) | 又一份 API 表 |
| 模式 | [目录 · 模式组件](../components/CATALOG.md#模式组件) 与 [配方](../components/CATALOG.md#配方)、[场景交互](INTERACTION_PATTERNS.md) | 必须新增的公共导出 |
| 模块 | [目录 · 模块](../components/CATALOG.md#模块)、[独立包入口](../components/CATALOG.md#独立包入口) | 和按钮并列的基础控件 |

能用现有导出拼成的页面写成配方和展台。只有组件自己管理焦点、请求代次、计时或清理时，才新增公共导出。已发布导出保持导出。

Web 与 iOS 分开。本导航不要求 UIKit 补齐同名控件或相同数量。

## 规范与场景

| 要做的事 | 入口 |
| --- | --- |
| 看颜色、状态和密度 | [设计基线](DESIGN_SYSTEM.md) |
| 选主题 | [主题](THEMING.md)、[主题选择](THEME_PICKER.md) |
| 做设置、筛选、阅读或聊天 | [组件目录](../components/CATALOG.md) 里的模式、配方和模块行 |
| 查一个已有导出的参数 | 目录中的契约链接，或 [API_MAP](../skills/rhine-design/references/API_MAP.md) |
| 看历史数量和发布范围 | [CHANGELOG](../CHANGELOG.md)。那里的组件数是当时记录 |

展台章节由 [GalleryShell](../preview/GalleryShell.tsx) 注册。展台按场景浏览，不代替分层目录。
