# Web 设计体系导航

先按 Ant Design 组件总览的分类找能力，再读原契约，最后用安装版本核对导出。本页只做入口，不复制参数，也不维护组件总数。分类对标不是兼容实现。

当前清单是 [组件目录](../components/CATALOG.md)。它对应 `components/index.ts` 的值导出。源码有一行，不表示 npm 已发布。展台「组件总览」列出对应能力与边界；新增实现见[总览对应能力契约](../components/PROVIDED_COMPONENTS.md)。

## 分类

| 分类 | 先看 | 不要把它当成 |
| --- | --- | --- |
| 通用 | [目录 · 通用](../components/CATALOG.md#通用)、[字体](../components/TYPOGRAPHY.md) | 页面任务或业务结果 |
| 布局 | [目录 · 布局](../components/CATALOG.md#布局)、[间距](../components/SPACING.md) | 页面路由或业务状态 |
| 导航 | [目录 · 导航](../components/CATALOG.md#导航) | 命令或表单提交 |
| 数据录入 | [目录 · 数据录入](../components/CATALOG.md#数据录入)、[组件契约](../components/README.md) | 接管宿主校验和保存 |
| 数据展示 | [目录 · 数据展示](../components/CATALOG.md#数据展示)、[常用契约](../components/COMMON_COMPONENTS.md) | 数据服务或异步结果推断 |
| 反馈 | [目录 · 反馈](../components/CATALOG.md#反馈) | 全局消息队列 |
| 其他 | [目录 · 其他](../components/CATALOG.md#其他)、[配方](../components/CATALOG.md#配方)、[独立包入口](../components/CATALOG.md#独立包入口) | 和按钮并列的基础控件 |

能用现有导出拼成的页面写成配方和展台。只有组件自己管理焦点、请求代次、计时或清理时，才新增公共导出。已发布导出保持导出。

Web 与 iOS 分开。本导航不要求 UIKit 补齐同名控件或相同数量。

## 规范与场景

| 要做的事 | 入口 |
| --- | --- |
| 看颜色、状态和密度 | [设计基线](DESIGN_SYSTEM.md) |
| 选主题 | [主题](THEMING.md)、[主题选择](THEME_PICKER.md) |
| 做设置、筛选、阅读或聊天 | [组件目录](../components/CATALOG.md) 里的对应分类；聊天外壳在布局，消息在数据展示 |
| 查一个已有导出的参数 | 目录中的契约链接，或 [API_MAP](../skills/rhine-design/references/API_MAP.md) |
| 核对本地候选的消费与支持范围 | [固定制品与有限兼容验收](../components/PROVIDED_COMPONENTS.md#固定制品与有限兼容验收2026-11-16)，不把软件证据外推原生平台 |
| 看历史数量和发布范围 | [CHANGELOG](../CHANGELOG.md)。那里的组件数是当时记录 |

展台章节由 [GalleryShell](../preview/GalleryShell.tsx) 注册，分组顺序与组件总览一致。展台不代替目录，也不把未提供写成已有导出。
