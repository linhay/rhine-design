# 版本记录

## 未发布

- SelectionCard统一24px内边距、16/24标题、600字重与8px标题/内容间隔；DataTable标题显式16/24。SideNav分组、Breadcrumbs、Progress标签及KeyValue标签明确12/18，侧栏分组标题后8px。既有真实展台同步展示，不再继承正文行高。

- 补充文字行高、段落与控件规则及可切换行框辅助线的多行展台。沿用现有字号/行高token，按钮、Tab和单行输入同步消费body行高，默认尺寸不变。

- 新增间距规范与`#spacing`真实组合展台：24/8/16卡片配方，默认/加载/错误/长文案；复用Stack/Inline/Grid，公共API和组件数量不变。Surface内边距改为消费既有space-6 token，默认外观不变。

- 新增 SideNav、Breadcrumbs、Steps、Drawer、Fieldset、ErrorSummary，main 公共组件增至46个；展台自身复用导航组件。
- 新增导航与步骤、表单流程、14类场景与交互选型章节，动效实验室增加抽屉与步骤播放/重播，总计12组。
- 参考 GitHub 高星项目与 skills，沉淀组件选择、错误恢复、监控告警、动效与无障碍契约；不增加运行时依赖。

- 在线展台改为侧栏目录与单章节工作区，支持章节深链接、历史导航、当前项高亮、独立滚动与窄屏折叠目录；全局动效偏好跨章节保留，离开的演示卸载。

## 0.3.0

- **破坏性变更：**统一使用莱茵设计的 `rhine-` 命名空间，无旧前缀别名。
- 升级时将主题根 `.tod-theme` 改为 `.rhine-theme`，CSS 变量 `--tod-*` 改为 `--rhine-*`，类名及关键帧 `tod-*` 改为 `rhine-*`，减少动态属性 `data-tod-motion` 改为 `data-rhine-motion`。请同步更新自定义样式、DOM 查询和复制到项目中的 skill。
- 组件、浮层主题挂载、动效展台、文档与测试一起迁移；React 导出与 props、视觉参数保持一致。

## 0.2.0

- 定位为个人通用设计系统 linhay/rhine-design，独立迭代。
- 包名由 @tod-ai/design-kit 改为 @linhey/rhine-design；更新安装记录、导入语句与固定版本，不提供旧名别名。
- 通用规范与演示移除特定产品定位；原产品页面、历史图稿和专属规范移回消费项目，Git历史保留。
- Logo默认字标与可访问名称改为Rhine Design，新增wordmark配置；自定义文字须显式传入。
- 保留三角几何、动画配方与tod-样式命名空间。
- 配置公开 npm 分发，随包提供 rhine-design skill、任务/API 索引与接入指引；发布状态以 registry 为准。
- GitHub 仓库公开，安装文档改用无需认证的 HTTPS 克隆方式。
- 采用 Apache-2.0 许可证，补齐 LICENSE、NOTICE 和贡献指南；README 面向外部开发者组织接入文档。

## 0.1.0

首次独立提取：40组件、字体规范、10组动效与启动演示，独立测试与构建。旧产品专属定位已由0.2.0取代。
