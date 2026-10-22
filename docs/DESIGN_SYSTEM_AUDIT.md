# 主流设计系统对照与补齐顺序

调研日期：2026-10-22。对照当前 `design-kit/components/` 与 ToD-AI 的登录、凭证同步、今日用量场景。以下优先级是本项目判断；引用用于说明参考系统的原则，不代表它们要求采用我们的尺寸、配色或组件清单。

## 参考与取舍

| 官方系统 | 关注点 | ToD-AI采用方式 |
| --- | --- | --- |
| [Material Foundations](https://m3.material.io/foundations/) | 把token、交互状态、布局、内容和无障碍作为基础层 | 补齐状态与文字规范；保持现有几何、苔绿和暖白，不引入整套Material外观 |
| [Fluent Typography](https://fluent2.microsoft.design/typography) | 平台字体与语义文字层级 | 系统字体、中文混排、字号行高token；不照搬其最小字号 |
| [Fluent Select](https://fluent2.microsoft.design/components/web/react/core/select/usage) | 区分原生选择、富选项Dropdown和可输入Combobox | 当前短列表使用原生Select，保留系统菜单和键盘能力 |
| [Carbon Overview](https://www.carbondesignsystem.com/getting-started/designing/overview) | 区分基础、组件、任务模式和数据可视化 | 用量统计、账号身份、同步状态属于业务组合，避免全部塞进基础组件 |
| [Carbon Data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) | 明确表头、工具栏、数据行和分页的职责 | 后续优先提取请求明细与分页；不预建电子表格、批量编辑或表格引擎 |
| [Radix Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) | 标签、键盘和焦点管理是组件契约 | 每个控件写清语义和焦点行为；复杂浮层出现时评估成熟基础实现，不手写只在鼠标下有效的弹层 |

## 当前已经落地

2026-10-22追加用户指定的[Transitions.dev](https://transitions.dev/)参考，具体UX、动效映射和已实现/候选边界见[MOTION.md](../components/MOTION.md)。随后按用户授权在`/design/components/#motion`实现10组可播放/重播、4倍慢放及减少动态对照；新动画限定在展台，组件数量仍为40，未迁移App。

V1.4共40个React组件。原16项为Button、Badge、Surface、SelectionCard、TextField、Tabs、SegmentedControl、Notice、Progress、Skeleton、Disclosure、EmptyState、Logo、Text、Select、Toolbar；用户进一步授权补齐常用组件，新增24项见[组件契约](../components/COMMON_COMPONENTS.md)。

V1.3新增Text/Select/Toolbar、9档文字样式和[字体/文案规范](../components/TYPOGRAPHY.md)。静态样稿工具栏复用同源CSS，修正箭头并移除App内重复品牌顶栏。已有Logo深浅版本不等于完整深色主题。

## 还需要补什么

| 优先级 | 补充项 | 具体范围与验收 | 状态 |
| --- | --- | --- | --- |
| P0 | 字体、表单标签、选择器、工具栏 | 文字尺度、混排、数字、长文本、箭头留白；标签关联、原生键盘 | V1.3已实现 |
| P0 | 统一状态矩阵 | 默认/悬停/按下/焦点/禁用/选中/只读/加载/错误，按适用范围验收；信息不可只靠颜色 | 规则已补；完整逐组件辅助技术审计待做 |
| P1 | 数据展示组合 | Metric、KeyValue、DataTable、Pagination；未知/零、刷新加载/失败、窄窗局部滚动；请求明细业务组合由页面负责 | V1.4已实现，待业务接入 |
| P1 | 链接、功能图标、图标按钮 | 16/20px统一图标网格、明确名称、44px操作目标、禁用与focus；链接跳转和按钮动作区分 | V1.4已实现Link/Icon/IconButton/CopyButton |
| P1 | 表单Field公共结构 | 输入/Select统一label/hint/error，必填和只读；多字段失败时焦点与错误汇总 | 现有TextField/Select满足单字段；多字段流程出现后提取 |
| P1 | 完整主题语义 | 表面、文字、边界、选中、焦点、错误与图表在深色下成对校验 | 未实现完整深色模式；不能只反转颜色 |
| P1 | 焦点与原生平台验收 | WebView、VoiceOver/Narrator、纯键盘、纯文本缩放、系统高对比与字体差异 | 浏览器证据不能替代原生验证 |
| P2 | Dialog/ConfirmDialog/Popover/Tooltip/Menu | Escape、焦点进入/归还、遮罩、滚动、层级和减少动态一起处理 | V1.4采用Radix无样式基础并提供真实展台 |
| P2 | Toast与通知组合 | 短暂成功可自动消失；警告错误持久；hover/focus/隐藏暂停 | V1.4单条Toast已实现，不建全局队列 |
| P2 | 搜索、Checkbox/Radio/Switch、Textarea、Combobox | 原生表单习惯、受控值、IME保护；Switch不混同选择账号 | V1.4已实现；查询与过期响应仍由业务层处理 |
| P2 | Divider/Stack/Inline/Grid | 同源间距、自适应网格、换行与缩放 | V1.4已用于展台布局 |

常用组件补齐后，下一步按用户授权先改页面设计稿，再将同一组件接入正式App。剩余明确缺口是完整深色主题、多字段错误汇总及原生辅助技术验收；不因Logo支持深色而标记整套主题完成。40个组件存在不等于正式业务页已迁移。

## 状态与交互补充规范

| 状态/场景 | 设计与行为规则 |
| --- | --- |
| 默认、hover、press | 布局稳定；只有可操作项有交互反馈；hover不承载必要信息 |
| focus-visible | 即时可见，不能被overflow裁掉；顺序与阅读顺序一致，不用正tabindex |
| disabled与busy | 禁用不可操作并给出原因；异步busy保留焦点、防止重复操作，内容仍可识别 |
| selected | 文字/边界与ARIA状态同步；选择、正在浏览与已生效配置区分 |
| readonly | 值可选择/复制，解释不可编辑原因；不要伪装成disabled；未提供对应能力的控件不杜撰readonly |
| invalid | 与字段关联的错误说明，不抖动、不仅变红；提交失败时保留输入 |
| loading/empty/error | 首次加载、刷新旧数据、无记录、无权限、错误分开；刷新失败不把旧值变成0 |
| 长文本/缩放 | 允许换行，关键状态不截断，200%缩放不丢信息；400%重排作为进一步无障碍目标 |
| 浮层 | modal需限制焦点并归还触发点；非modal不要阻断页面；Escape只关闭最上层可关闭浮层 |
| 业务列表 | 搜索/筛选/排序/分页以服务端结果为准；不为UI便利拉取全量本地过滤 |

关于逻辑标题、焦点和缩放的参考为 [Fluent Accessibility](https://fluent2.microsoft.design/accessibility)。本项目仍需独立验证，不能继承参考库的合规结论。

## 消融与范围

- 不增加侧栏、面包屑、命令面板、日期选择器、拖拽、富文本编辑器：现有两个主功能无对应任务入口。
- 不引入动画框架、主题生成器或整体UI库。V1.4用户已授权完整浮层能力，采用Radix的5个无样式primitive包处理焦点/键盘/边缘避让；视觉和动效仍使用ToD-AI CSS。
- 不把每种视觉模式封装成组件：先出现稳定复用，再抽取；业务数据契约与服务端状态继续保留在调用方。
