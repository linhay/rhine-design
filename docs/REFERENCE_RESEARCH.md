# GitHub 与主流设计系统调研

查询日期：2026-10-23（本地日期）。星标来自当次 GitHub API，是关注度快照，不是质量或安全认证。许可证状态也需在实际复制代码时重新核对。

| 项目 / skill | 星标 | 许可 | 本轮采用的原则 |
| --- | ---: | --- | --- |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | 126,213 | MIT | 按任务组织导航、表单、Sheet 等常用能力；用自己的组件 API 与莱茵样式实现，不整套安装皮肤 |
| [Impeccable](https://github.com/pbakaus/impeccable) | 84,840 | Apache-2.0 | 区分操作界面与阅读界面，保留现有设计语言；在真实尺寸检查结果 |
| [Vercel agent-skills](https://github.com/vercel-labs/agent-skills) | 32,820 | API 未返回许可 | web-design-guidelines 的面向实际源码审阅方法；未复制源码或安装其执行入口 |
| [Radix Primitives](https://github.com/radix-ui/primitives) | 19,415 | MIT | Drawer 复用库内已经依赖的 Dialog primitive，统一焦点、Escape、Portal |
| [React Spectrum / React Aria](https://github.com/adobe/react-spectrum) | 15,975 | Apache-2.0 | 语义、标签、输入方式与焦点作为组件契约；没有引入第二套交互基础库 |
| [UI Skills](https://github.com/ibelick/ui-skills) | 10,020 | MIT | fixing-accessibility 与 fixing-motion-performance：原生语义、可访问名称、焦点归还、合成属性优先、停止无期限动画 |
| [Carbon](https://github.com/carbon-design-system/carbon) | 9,572 | Apache-2.0 | 区分组件和任务模式；步骤指示、通知与复杂表单的使用场景 |

已读 skill 文件：[Vercel web-design-guidelines](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md)、[Impeccable](https://github.com/pbakaus/impeccable/blob/main/.agents/skills/impeccable/SKILL.md)、[UI Skills motion](https://github.com/ibelick/ui-skills/blob/main/skills/fixing-motion-performance/SKILL.md)、[UI Skills accessibility](https://github.com/ibelick/ui-skills/blob/main/skills/fixing-accessibility/SKILL.md)。

本轮把外部 skill 作为调研材料，未运行其中的安装脚本、下载二进制或改变 agent 权限。只将适用规则写入本项目的场景规范与现有 rhine-design skill；没有复制第三方实现代码，也未增加运行时依赖。

## 组件行为的官方依据

- [WAI-ARIA Breadcrumb Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)：有名称的导航区与当前页语义，非历史记录。
- [GOV.UK Error summary](https://design-system.service.gov.uk/components/error-summary/)：字段错误之外提供集中定位入口；本库采用失败提交聚焦与原位修正。
- [Carbon Progress indicator](https://www.carbondesignsystem.com/building-blocks/core/components/progress-indicator/guidelines)：区分当前、已完成和未来步骤；不是进度百分比。
- [Carbon Notifications](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications)：依任务上下文选择通知位置和持续性。
- [Carbon Forms](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms)：按任务组织表单层次、标签与反馈。
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)：模态焦点与关闭交互由成熟 primitive 处理。
- [shadcn Sheet](https://ui.shadcn.com/docs/components/base/sheet)：临时侧面板的组件分类参考；当前文档有 Base/Radix 路线，本库继续使用现有 Radix。
- [React Aria Quality](https://react-aria.adobe.com/quality)：键盘、辅助技术、移动与不同输入方式是独立验证项，不能因依赖库具备这些能力就宣称本库合规。

## 莱茵设计的取舍

新增 SideNav、Breadcrumbs、Steps、Drawer、Fieldset、ErrorSummary；增加 14 类场景指南和两组动效示例，六个组件均进入公共导出。侧栏与面包屑已被展台自身复用，不再依赖“原产品只有两个页面”的历史范围判断。

继续保留暖白、苔绿、三角构架、细线和 120–240ms 日常动效。表单错误不抖动，数字不翻转，告警不闪烁，启动不阻塞真实就绪。移除这些效果不会损害任务理解，反而保持文字和操作目标稳定。

暂不加入日历/日期范围、树、拖拽、富文本、图表引擎、全局命令面板：需要先确定数据规模、选择规则和真实使用入口。完整深色语义主题、原生辅助技术和强制颜色模式仍是独立缺口；这次新增组件不意味着覆盖所有设计系统能力。
