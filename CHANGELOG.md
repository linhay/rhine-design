# 版本记录

## 0.11.1（2026-10-27）

- 修复 Combobox / RemoteMultiSelect 在祖先 CSS zoom 下的候选浮层定位与视口边界，复用既有浮层缩放处理；保留主题 Portal、搜索、多选与键盘行为。
- RemoteMultiSelect 可再次点击或方向键+Enter取消已选项，保留真正禁用/锁定项；“完成选择”只收起候选并归焦，不提交宿主表单；清空后保持收起，无可移除项时隐藏清空按钮。
- `#compact-filters` 补充弹窗内多选与真实浏览器回归；参见[浮层契约](docs/FLOATING_OVERLAYS.md)。
- 补丁制品从 `v0.11.0` 回补上述修复，主入口仍为67项；main 后续未发布新功能不包含在0.11.1中。消费方固定版本并提交 registry lockfile。

## 0.11.0（2026-10-27）

本版本新增产品评审工具及以下已合并能力；npm 0.10.0 不包含这些新增 API。组件主入口仍为 67 项，默认行为保持兼容；消费方固定 0.11.0 并提交 lockfile。实际发布可用性以 registry 为准。

- #40：新增 `/review`、`/review/vite` 产品评审工具，提供场景协议、目录/控件、URL 状态、合成 iframe、生命周期、独立静态构建与正式包排除检查；附 HTTP 与平台 client 两类例子，静态资源支持项目型站点的嵌套部署路径；补充连接/清理超时恢复、持久错误反馈、折叠高级设置与实际画布尺寸。已在两类真实 App 的隔离副本试用，消费迁移按产品分别验证，见[契约](docs/REVIEW_TOOL.md)。

- `Tabs` / `TabItem` 新增 `description`、`status`，提供带身份摘要与只读状态的页签；契约见[Summary Tabs](docs/SUMMARY_TABS.md)，展台为 `#summary-tabs`。
- `Toast` 新增 `placement="floating"`，通过主题根 Portal 呈现浮动通知；默认 inline 保持兼容，见[通知契约](components/COMMON_COMPONENTS.md)。
- `SegmentedControl` 新增 `size="compact"`，支持卡片局部指标切换；见[间距规范](components/SPACING.md)。0.10.0 已有的 `fullWidth` 不受影响。
- 相邻 `Disclosure` 共用分隔线；补充上下文帮助与主题背景/文字配对规范。
- 修复 `Disclosure` 在生产 CSS 将 `200ms` 压缩为 `.2s` 时误用 0.2ms 动画的问题；按单位换算为毫秒，保持 200ms 开合、快速反向和减少动态行为。
- 展台首页和页脚按当前主入口统一为 67 个组件，源码包版本改从 `package.json` 读取；修正轨道主题艺术的版本标记及文档中的旧数量、候选状态。

## 0.10.0（2026-10-26）

- #31：MediaViewer 说明补齐 caption 12/18/400，EmptyState 标题采用 heading 16/24 与主题标题字重；同类复制反馈、步骤/表单组说明、错误摘要和主题预览状态补齐语义配对，保留既有密度例外。真实回归入口 `#component-typography`。
- #29：Checkbox 新增可选 `layout="row"` 与公开 `CheckboxProps`，提供窄侧栏双行文字对齐、对称内距、整行原生点击和主题选择/焦点，保留默认表单布局；展台见 `#checkbox-rows`。
- #27：SegmentedControl 新增等宽 `fullWidth`；ListFilterBar 支持用 `drawerDescription` / `drawerResult` 省略重复说明与摘要，保留加载和错误反馈。
- DateRangePicker 新增 `compact` 一体日期边框，窄容器内部重排；RemoteMultiSelect 新增 `maxVisibleTags`、总数与有界展开，保留完整表单值和键盘移除，极窄容器标签换行，清空后重新选择恢复折叠。
- 新增 `#compact-filters` 真实组件展台与回归。上述能力自 0.10.0 提供，默认行为保持兼容，无需迁移；启用新选项需升级。修复分别见 [PR #28](https://github.com/linhay/rhine-design/pull/28)、[PR #30](https://github.com/linhay/rhine-design/pull/30) 和 [PR #32](https://github.com/linhay/rhine-design/pull/32)。

## 0.9.1（2026-10-25）

- #23：移除 StatusTimelineList 末项重复留白，保留 44px 命中区；紧凑账号展台的基础信息与今日/本周期读数按稳定列对齐，窄容器自然换行。
- #24：Surface 新增 `padding="default" | "none"` 和公开 `SurfaceProps`；纯表格可取消外围内距，默认 24px、单元格间距与浮层/焦点行为保持不变。
- #25：DateRangePicker 按实际容器宽度取消窄容器重复横向内距，DateField 收紧窄编辑区内距并保留 Inline 中的固有宽度；增加 150/200/280 CSS px 的范围与独立日期展台，保留原生日期、日历入口和受控草稿语义。
- 修正固定合成历史的摘要为“24小时窗口”，避免将 2026-10-23～24 的示例误解为当前最近一天。以上修复见 [PR #26](https://github.com/linhay/rhine-design/pull/26)。
- 默认 API 行为保持兼容，无需迁移；使用 `Surface padding="none"` 需升级至 0.9.1。验证范围与重跑步骤见[紧凑布局回归](docs/COMPACT_LAYOUT_VERIFICATION.md)。

## 0.9.0（2026-10-24）

- #17：OrbitBackdrop 新增 controls、composition 和 framed；背景画布与静态降级同置右下角，新增按容器宽度重排的入口组合，保留输入和减少动态。
- #19：新增 ListFilterBar，最多两个主筛选，超出进入 Drawer；保留可见搜索标签，统一条件摘要、清除、重置、刷新和请求反馈，业务查询与权限由宿主管理。
- 修复原生日期未完成片段被当作空值提交的问题；DateRangePicker 清空和同值预设可恢复本地草稿；有效输入继续服从宿主受控值。展台整体重置清除同值日期的未完成草稿。清除最后一个不可聚焦字段的摘要后，焦点保留在筛选区域。
- 独立验收覆盖三主题、窄容器与 200% CSS zoom、抽屉焦点、日期键盘、真实 GPU 播放与动态偏好、静态降级及卸载清理。

## 0.8.0（2026-10-24）

- 审查修复：保留 Tooltip 与嵌套 Dialog 的 Escape 层级；主题元数据独立于可选 CSS；设置示例保存中重开时同步已保存值并保留后续编辑。
- 对应 #18：Dialog 新增 `navigation` 插槽，提供按实际容器宽度重排的设置导航布局，保留嵌套焦点、草稿与宿主状态，并修复快速打开内层后 Escape 误关外层。
- 对应 #20：新增受控原生单选 `ThemePicker` 和静态 `ThemePreview`；三套官方组件缩略图随包提供，覆盖加载/失败/禁用，主题切换不重挂载业务子树。

- 修复 #16：Popover、Menu、Tooltip 和时间轴共用浮层 CSS zoom 归一化；保留文字与点击目标放大，并在边缘限制实际浮层边界。新增文档/主题根/正文缩放的独立文档展台。

### 承接未发布的 0.7.0 候选

0.7.0 未成功发布至 npm；下列已接受功能随 0.8.0 一并交付，历史候选制品保持不变。

- 橙趣草莓甜甜圈增强为按需加载的 Three.js 艺术：立体糖霜、程序烘焙纹理、280 根糖针、110 颗糖珠、100 根环绕糖粒与 460 颗糖尘；共用原版倾角、62%/57%中心与缩放，校准主体尺寸，保留环面旋转、共享暂停与减少动态时钟，并提供 Canvas2D 降级和 GPU 清理。
- OrbitBackdrop 新增 `appearance="theme" | "original"`：莱茵为折纸鸟（578 个三角折面、扇形褶皱与叠层双翼、暖白纸纹、弧线飞行和随行纸屑），战术为源石晶簇（倒角晶面、矿物纹理、琥珀裂纹和漂浮碎片），橙趣为草莓甜甜圈。三套物品均按需加载 Three.js；窄屏也可播放，共用暂停、减少动态和可见性时钟，切换主题复用已创建的绘制器。WebGL 失败回退 Canvas2D，Canvas 不可用时展示本地 SVG。`original` 保留初版完整深色轨道。
- 莱茵纸鸟在同一组折面上连续变形成四瓣纸蝴蝶：单程 14 秒，依次收翼、松折、展平停顿、重新折叠，翼根至翼尖错开动作；全周期 42 秒。变形中暂缓扑翼，暂停或减少动态冻结当前形态，恢复后接续；WebGL 与 Canvas2D 共用几何、变形和飞行姿态，静态 SVG 保留初始纸鸟。
- 新增 `StatusTimelineList` 多条健康历史组合；与 `AppShellToggle`、`NeutronStarBackdrop`、`ButtonLink` 一起将公共组件增至 64。
- AppShell 新增可选 `contentHeader` 导航插槽，位于正文滚动区外；展台按应用栏模式组合当前页、侧栏入口与上下文操作，窄窗使用菜单入口，保留草稿和焦点。三主题边界同步；默认 header 模式保持兼容。
- 重做媒体卡片与查看器：卡片边框、类型标签、选中态及独立操作区跟随三套主题；查看器仅画布保持中性深色，工具栏和信息栏使用宿主主题。展台改为自适应资源网格并单列异常状态，修复 CSS zoom 下查看器高度重复放大。
- 补齐 Neo Brutalism 的 Badge 墨色描边与字重，中性标签使用主题文字色。

- 对应 [#14](https://github.com/linhay/rhine-design/issues/14)：新增原生 anchor 语义的 `ButtonLink`，复用 Button 视觉及 busy/disabled；移交 `StatusTimelineList` 稳定行/互斥详情组合，并扩展 `TimelineLegend compact/items` 为一行短标签与悬停、键盘、触屏规则详情。无参图例保持兼容。
- 时间轴与图例详情在祖先 CSS zoom 下归一化定位包装层，保留正文放大与视口内滚动；鼠标离开跨卡详情延迟关闭，移入浮层可继续阅读，不更改键盘或触屏入口。
- 新增[紧凑摘要与凭证操作](docs/COMPACT_ACCOUNT_PATTERNS.md)及 `#compact-account` 真实样机：无框额度摘要、配对事实、短必要提示、按需历史；消融不减小业务字体、不隐藏未知/失败或混淆不同成本与到期。以上能力随 0.8.0 提供。

- AppShell 新增可选 inline 控制模式与 AppShellToggle：侧栏品牌区收起、正文导航区展开/打开抽屉，不再强制独立顶部横栏；默认 header 模式保持兼容。补充焦点迁移、断点和 Escape 回归及真实展台。
- 对应 [#12](https://github.com/linhay/rhine-design/issues/12)：新增 `NeutronStarBackdrop`，承接完整中子星艺术：28 条磁场线、560 个流动粒子、700 颗星尘、极向喷流与星核；星系以 28 秒有效播放时间完成一轮深度公转，镜头固定。默认跟随现有主题 tokens，`appearance="original"` 保留原始深空；主题切换不重置时间，正文与实体控件保持清晰。
- Three.js 绘制按需加载，内置暂停 / 继续，系统、显式、祖先减少动态及隐藏 / 离屏 / 零尺寸停帧，恢复不追赶。SSR 安全结构、异步卸载保护、GPU 资源清理与静态降级；无 WebGL、导入失败和 context lost 不影响内容，context restored 按当前偏好恢复。
- 外层流粒与对应磁场线对齐，避免使用生成参数的错误边界裁剪粒子；暂停控件的焦点框绘制于按钮内部，保持原始深空下的键盘焦点可见。
- 修复长页窄屏中星核随公转移出画幅：艺术层独立限高并渐隐，窄画幅由库内相机取景适配；保留原始几何与时间公式，正文和控件布局不受艺术高度限制。
- 新增艺术优先的 `#neutron-star` 真实展台，演示控制与内容组合默认折叠；重播不丢表单草稿。[组件契约](docs/NEUTRON_STAR_BACKDROP.md)、API / 任务索引及回归测试同步。此 API 自 0.8.0 提供。
- 对应 [#10](https://github.com/linhay/rhine-design/issues/10)：新增[日期筛选组合规范](docs/DATE_RANGE_FILTER.md)与 `#date-range-filter` 真实展台；复用 0.6.0 已发布的 SegmentedControl、Button、Popover、DateRangePicker 和布局组件。快捷项共用分段边界，日期持续可见，预设即时应用、自定义确认后应用，取消和关闭不提交。包含跨年、长标签、禁用、键盘和三主题验证；仅组合已有 API，不新增独立日期筛选组件。

## 0.6.0（2026-10-24）

- 对应 [#8](https://github.com/linhay/rhine-design/issues/8)：新增 `OrbitBackdrop`，将授权移交的轨道艺术维护为公共组件，保留 420 个环节点、185 条空间曲线、箭头、光晕与透视；公共组件增至 60 个，无新增运行时依赖。
- 内置暂停 / 继续，遵循系统、显式及祖先减少动态偏好；窄窗、页面隐藏、离屏与零尺寸停帧，恢复沿冻结时间继续，卸载清理资源；Canvas 不可用时保留静态艺术与内容。逻辑尺寸使用 client size，保持 CSS 缩放后的描线和静态重绘一致。
- 固定深色艺术仅调整继承文字和 Logo，不覆写宿主控件的主题 tokens；表单、按钮及 Surface 保持各主题前景与背景成对。新增 `#orbit` 真实展台、[轨道背景契约](docs/ORBIT_BACKDROP.md)、生命周期测试与三主题组合示例。
- 保留 0.5.0 的全部应用组件、受控状态与 Ant Design / MUI 契约改进。`OrbitBackdrop` 自 0.6.0 提供，0.5.0 及以前不包含此组件；建议固定精确版本并提交 lockfile。

## 0.5.0（2026-10-24）

- 完成 [Ant Design / MUI 逐项对标](docs/ANTD_MUI_AUDIT.md)：补齐表单只读/校验/键盘、连续多选、树字符导航、数据表单选/排序清除/自动固定列、分页首末页/边界焦点、受控左右抽屉、媒体方向键/首尾焦点、图表受控逐点查看与格式化、健康历史稳定 ID 与受控详情。RemoteMultiSelect 默认连续选择，`closeOnSelect=true` 可恢复选完关闭；原单选 Combobox 默认不变。无新增运行时依赖。
- 发布审阅修正：数字未编辑时不重复提交，未指定 precision 时保留输入精度；加载中的媒体预览保持挂载以接收原生加载/失败事件；空图表不显示不可操作提示，时间轴移除不适用的 ARIA 属性；修正橙趣表格密度/表头主题变量、行悬停底色及仅 CSS 主题根的派生变量。

- 对应 #1–#6：新增 Background/AppShell、MediaCard/MediaViewer、DateField/DateRangePicker/NumberField/TreeSelect/RemoteMultiSelect，加上 TrendChart/StackedBar，共 11 个公共组件。
- DataTable 增加受控跨页选择、禁选/混合态、层级展开与详情、密度和固定表头/列；Pagination 增加页大小意图。
- 新增三主题背景、表单、数据与中性媒体 tokens；提供六组真实 React 展台及[应用组件契约](docs/APPLICATION_COMPONENTS.md)。宿主继续负责请求、时区、导出、下载、虚拟列表和持久化。
- StatusTimeline 增加开始/结束、原因、计数及统计口径的结构化详情，使用可避让视口的 Popover；新增柱形趋势、缺失断线和堆叠占比，未知值不补零，配套文字替代与空/陈旧/错误状态。
- 本节 API 自 0.5.0 提供；0.4.0 不含这些能力。建议固定版本并提交 lockfile。

- 补齐 Background 六类场景的底色、文字与纹理配置，新增局部 `appearance` 覆盖。`decoration` 默认 `auto`，仅画布使用主题纹理；正文与 AppShell 默认纯色，原有显式 `theme` / `none` 保留。Surface / Fieldset 与主要浮层接入语义底色，遮罩独立配置。新增展台 `#backgrounds`，包含实际弹窗、局部覆盖与纹理切换，仅展示当前主题的场景效果，跟随主题选择器更新。已有正文需要纹理时显式传 `decoration="theme"`。

## 0.4.0

- 新增 `@linhey/rhine-design/theme`：`ThemeProvider`、`useTheme`、`themes`、`ThemeName` 与 `ThemeProviderProps`，自动加载三套内置主题，支持受控/非受控切换及并列 Provider；嵌套覆盖暂不支持。切换保留组件、表单与浮层状态，偏好存储由宿主管理。展台复用公共 API；主题 CSS 中的展台布局和 HUD/扫描/开机装饰移至 `preview/theme-*.css`。补齐接入文档及 API/展台回归测试。

- 新增「橙趣 · 粗描边」主题 `theme-neo-brutalism.css`：浅灰蓝点阵、米白大圆角、黑色粗描边、无模糊硬阴影、橙色主操作与低饱和类型标签。展台主题切换器支持选择与记忆，`?theme=neo-brutalism#subscriptions` 可直达单页订阅示例；复用 Dialog/Menu/DataTable 展示卡片详情、管理菜单和可更新的演示数量与金额。可单独导入。

- 新增明日方舟·战术终端主题 `theme-arknights.css`：暗色舱底、平行四边形按钮、信号黄高亮、坐标网格与警示斜纹，附 HUD 取景框、终端读数与扫描/开机装饰动效；仅覆盖变量与装饰层，不改组件 API 与交互契约，减少动态下装饰动效全部关闭。展台右上角可切换主题并记忆选择。

- 将密集任务浮层经验整理为通用规范：自然高度/单层滚动、导航行、渐进展示、视觉与命中区分离，以及选择即保存的适用边界；补充临界溢出和末条详情验收要求。本项仅整理文档，不代表发布新API。

- compact健康条将20px视觉高度与44px命中区分开，避免列表重复叠加空白；间距规范补充标题8px、分隔线两侧16px及操作区避让规则。

- Dialog的sidePanel支持渲染函数，将传入的唯一关闭按钮与侧栏标题、说明组合成顶部导航；取消额外关闭行，左右标题对齐，展台同步示例。

- 健康时间轴使用独立明亮health色；新增compact模式，重复列表隐藏常驻日期/详情，悬停与键盘聚焦时查看，保留44px操作区和aria-valuetext。规范补充“选择即保存”的忙碌/确认/失败契约，默认与紧凑展台同步更新。

- 新增 StatusTimeline / TimelineLegend，源码组件增至48个。五类历史证据、44px键盘/指针操作区、时间文字与图例；不计算健康评分，不对未知补绿色，不播放装饰动画。监控场景展台可交互查看。
- Dialog新增可选sidePanel：左侧主任务、右侧关联预览，最大960px、24px分栏间距，720px及以下上下排列；保留同一个模态焦点范围、关闭与减少动态规则。展台提供左右分栏预览。

- SideNav支持可选20px线性图标（Icon新增connection/chart），移除当前项的外链箭头；采用44px最小操作行、14/22文字、4px行间距与3px圆角，选中状态保留苔绿底/左侧细边界和aria-current。导航展台同步示例；已有不带图标用法继续可用。

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
