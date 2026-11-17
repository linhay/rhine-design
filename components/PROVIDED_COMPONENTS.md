# 总览对应能力（0.14.0发行范围）

本页约束 2026-11-14 总览对齐中新增的组件，以及本次交互补强。它们使用 Rhine 自身的命名、状态所有权与视觉，不是 Ant Design 的 API 兼容层。菜单“已有”表示存在以下范围内的实际能力，不代表上游每个模式都已复制。原有公开接口继续可用，安装版本以实际包为准。

后续未发布#219–#223不属于上方0.14.0发行范围：[图标](../docs/ICONS.md)、[平台标记](../docs/PLATFORM_MARKS.md)、[受控Tree与移动提案](../docs/TREE.md)、[安全只读富文本](../docs/RICH_TEXT.md)、[紧凑趋势](../docs/COMPACT_TREND.md)分别按新契约核对。Tree与TreeSelect共用引擎，原调用保留；RichText为可选正文渲染，不改变MessageContent表面或宿主数据归属。

## 浮层、焦点与键盘

新浮层复用现有 Radix 层栈、主题 Portal 与 CSS zoom 修正；不另设一套全局 Escape/点击监听。

| 组件 | 输入与所有权 | 交互边界 |
| --- | --- | --- |
| Dropdown | label、items（id/label/disabled）、onSelect | 复用命令 Menu；方向键/Home/End/typeahead 跳过禁用项，选择或 Escape 关闭并归焦。不是导航、远程搜索或保存。 |
| AutoComplete | label、受控 value/onChange、字符串 options、可选 onSelect | 复用 Combobox，保留任意自定义文本；方向键/Enter 选择，Escape 只收起候选，Tab 离开。不发远程请求；输入法组合保护沿用 Combobox。 |
| Cascader | label、options、受控 value/onChange、disabled | 节点为 value/label/disabled/children；任意深度逐层进入、返回上级；只在叶子回传完整路径，展开中间节点不提交。上下/Home/End 移焦，右键进入、左键返回；Escape/外部点击退出不改值。 |
| Mentions | label、受控 value/onChange、options、disabled | 光标前的空白或行首 @ 查询本地候选；首次下键从首项、首次上键从末项开始，之后循环移焦；Enter 插入并保留其余文本，组合输入期间不提交候选，Escape/Tab 退出保留草稿。光标和插入点属于文本输入；不发送消息或识别账号权限。 |
| Image | alt、可选 src/caption | 原生按钮打开实际图片 Dialog；无 src 明确说明未提供，不伪装已加载。复用模态焦点约束、关闭按钮和 Escape；关闭返回触发按钮。不是资产解码器、图片组或编辑器。 |
| Popconfirm | label、title、onConfirm | 复用非模态 Popover，初始焦点在取消；确认才回调，取消/外部点击/Escape 不执行。仅同步意图；需要异步失败/忙态锁定的破坏性流程使用既有 ConfirmDialog。 |
| Tour | title/description、受控 step/total、onNext/onPrevious/onClose | 非模态说明层，下一步/上一步不保存业务；关闭、完成或 Escape 退出并在原入口仍存在且宿主未主动移交焦点时返回。不会限制宿主必须读完。 |

嵌套层的首个 Escape 只关当前层，再次 Escape 才关父 Dialog。关闭内容卸载，不进入实际 Tab 顺序。外部点击尊重外部目标获得焦点，不额外抢回触发处。退出、卸载与快速重开均按现有浮层规则处理；不更改已选动效参数。`#dropdown` 提供同一个 Dialog 内的命令、补全、级联、提及、确认与嵌套图片预览。

## 可操作布局与选择

| 组件 | 契约 |
| --- | --- |
| Splitter | label、受控百分比 value/onChange、start/end、disabled=false。钳制20–80；左右方向键每次5，PageUp/Down每次10，Home/End到边界。44px分隔命中区、细线视觉；主指针捕获支持拖拽，pointercancel/lost capture停止，卸载无全局拖动监听。RTL按逻辑起始侧计算。比例不持久化。 |
| Transfer | label、source（id/label/disabled?）、受控 target/onChange、disabled=false。两边独立的原生复选项，移动只作用于来源边已勾选且可用的项。上下/Home/End移动焦点，Space沿用原生复选，Ctrl/Meta+A切换该边可用项，左右键移动该边勾选项或当前项。同次提交中被宿主接受的项才清勾选并归焦目的边；明确拒绝保留勾选，部分接受只清接受项。每次意图只消费一次；后续异步接受/同值数组刷新不恢复旧焦点，宿主主动交焦优先。未知 target id 保留，不冒充服务端数据。 |
| Calendar | label、日期字符串 value/onChange、disabled=false。使用本地日历日期，不做 UTC 时间戳换算；七列、周一开头、必要的4–6周；输入合法日期时跟随外部月份更新。方向键按日/周，Home/End到本周边界，PageUp/Down换月（Shift换年）并保留可用日期；只移焦不选中，Enter/Space或点击才选。不是日程编辑器。 |
| TreeSelect | 原有 nodes/value/onValueChange、expandedKeys/onExpandedChange、multiple/loading/error/readOnly/disabled/name 均保留；新增 presentation='inline'（默认）或 'dropdown'。下拉复用原树键盘，单选后关闭、多选以“完成选择”退出；关闭后隐藏表单值仍存在。业务树、展开和选中由宿主持有。 |
| NavigationMenu | label、items（id/label/href/disabled/children）、受控 currentId、orientation='horizontal'或'vertical'、可选 onNavigate。原生 nav/a，无伪装 menubar 的命令语义；Tab与浏览器链接行为保留，方向键/Home/End辅助移焦，跳过禁用祖先及后代，不因移焦改变当前路由。已有命令 Menu/SideNav 不改名、不替换。 |

## 真实二维码

`QRCode({ label, value })`：QR Model 2，UTF-8 ECI（26）、byte模式、M级纠错、自动选版本1–5，**上限78 UTF-8字节**，不是78个字符。超长显示明确 alert，不截短原文。编码包含格式 BCH、定位/分隔/时序/对齐图案、Reed–Solomon纠错与分块交织、八掩码评分；SVG有4模块静区和不透明黑白色，不继承主题反转。不会自动打开码内地址。

验证使用独立 `jsQR@1.4.0` 开发期解码器（不进入组件运行依赖），覆盖每个0–78字节容量、中文/emoji、长链接、数据模块损坏与全毁反例。浏览器另对实际 SVG 光栅化解码。此范围证明生成符号可由该独立实现解码，**不宣称所有手机相机、屏幕、距离或印刷条件通过**，也不把组件自己的反向解析当作扫码验收。

## 局部配置与纯工具

- `ConfigProvider density='regular' | 'compact'`（默认regular），`useConfig()`无Provider时regular；嵌套regular可复位。作用于Button水平内距（16→10）、字段水平内距（12→8）、字段间距（8→4）、Surface内距（24→16）及新增Card/Popover内距（16→12）。标准控件仍至少44px，large按钮保留原尺寸；不缩字体、不改全局space tokens、不修改页面数据或主题。React配置透传到Dialog/Menu/Popover/Tooltip/Combobox的主题Portal，动态改变密度不卸载草稿。
- `Util.classNames(...(string | false | null | undefined)[])`过滤空值并用空格连接；`Util.clamp(value,min,max)`钳制数值，NaN返回min，非有限边界或min>max抛RangeError。无DOM、网络、存储或全局副作用；不承诺Ant工具命名空间兼容。
- Flex/Columns/Column保留与既有Stack/Inline/Grid的不同契约，不做破坏性合并；Columns按24栏，Column span钳制为整数1–24。

## 其余新增导出的范围

- FloatButton：命名动作，可fixed或contained；Masonry：按列排子项，不虚拟化或更改DOM阅读顺序；Anchor：原生页内链接和可见标题指示。
- Rate/Slider/TimePicker：受控原生选择；ColorPicker：原生色盘与6位十六进制文本输入，不写主题；Upload：仅本地文件选择/移除，不上传。
- Avatar：图片失败显示名称首字；Carousel：受控已有内容切换、不自动播放；VirtualList：等高行窗口化；Tag：文字与可选移除。
- Form：只交接提交，不接管校验或清空字段；Card/Descriptions/List/EventTimeline：标题、事实或事件序列，不加载数据。Collapse管理局部展开且关闭内容卸载；Tree复用TreeSelect的层级键盘而非给普通按钮虚标tree。
- CountBadge：可见数量与名称；Message/Notification由宿主放置和移除，无全局提示队列；Result/Spin展示显式状态；Watermark/BorderBeam只是装饰；Affix在本滚动容器粘住；App仅命名区域。
- Spin/BorderBeam仍遵循系统与手动减少动态，既有动画参数不增加。业务数据、权限、异步成功与保存始终属于宿主。

## 展台与验证

总览73个官方查找项及旧hash继续可达；新增目录搜索支持中文/英文/分类与Chat子项，搜索不切换章节、不清除正文草稿。无结果可清空；Escape先清查询，再在窄屏关闭目录并归焦。窄屏目录关闭时，搜索与链接都退出Tab。

单元测试：`tests/ProvidedBoundaries.test.tsx`、`tests/ProvidedComponents.test.tsx`、`tests/ParityComponents.test.tsx`、`tests/ProvidedInteractions.test.tsx`、`tests/QRCode.test.tsx`、`tests/GalleryShell.test.tsx`。类型与全库命令见[贡献指南](../CONTRIBUTING.md)。浏览器检查覆盖实际生产构建、相关主题/宽度/CSS zoom、嵌套关闭、键盘、草稿与指针动作；JSDOM不代替真实布局/焦点，CSS zoom不宣称原生网页缩放，DOM/AX不宣称读屏语音。


## 边界修复（2026-11-15，源码候选）

这些变化修正先前12个反例，不改变原有默认签名或视觉动效，不等于上游全模式兼容。

- **VirtualList**：新增可选`getItemKey(item,index)`及`VirtualListProps<T>`。未提供时依次采用可用的`id/key`、原始值或对象身份；相同值的重复条目没有独立身份，动态编辑数据应提供唯一稳定key。重排时挂载中的输入草稿归属原条目；持焦行因重排移出窗口时暂留挂载并滚动到新位置，主动滚动不会被抢回，行被移除时只在确实丢失焦点的情况下交给列表。源缩短会钳制滚动范围，非法尺寸回退44/220；列表项提供`aria-posinset/setsize`。真正卸载的离屏行草稿仍归宿主持有，不做隐式全量缓存。实现位于[VirtualList](VirtualList.tsx)，仍可从原入口导入。
- **Carousel**：空列表显示0/0与空说明；0/1张时导航禁用。非有限、越界或小数索引只安全规范呈现，不在渲染时伪造onChange。富内容内部拥有自己的光标/键盘，轮播区域和导航按钮才处理左右切页；不自动播放。
- **Upload / Rate / Avatar**：Upload.disabled覆盖选择、移除和变更回调；已接受的移除若卸载持焦按钮则回到文件选择入口，拒绝/迟到变更和宿主主动交焦不补旧焦点；Rate原生分组使用每实例独立身份，label仍用于命名。Avatar失败状态随src实例重建，切到新地址或离开后返回旧地址可重试，不进行后台自动重试。
- **Collapse**：初始普通模式展开已有项；运行中切到手风琴时优先保留持焦面板，无面板持焦则保留第一展开项。删除项及时清理展开状态，切回普通模式不复活已收起项；后加项不自动展开，关闭内容仍卸载，草稿由宿主提供。
- **ColorPicker**：原生色盘和显式type=text字段共享错误描述与aria-invalid；两种目标都至少44px。非法草稿保留原文和上次有效色盘，首次无合法值时使用默认色盘但不伪装成有效值；修正后清理错误关系。颜色仍不写入主题。
- **Anchor**：新增可选`getHref(id)`供宿主路由映射，默认仍为原生`#id`。展台使用`#anchor::anchor-a`等章节/定位格式，并兼容旧`#anchor-a/#anchor-b`；片段变化不卸载章节草稿，前进/返回仍由原生history处理。显示状态使用Observer保留的各目标可见记录，不把单次增量通知误当成全量快照。

`#avatar/#rate/#carousel/#listy/#upload/#collapse/#transfer/#mentions/#color-picker/#anchor`提供可操作的对应状态。拒绝、延迟和部分接受是明确标记的本地宿主模拟，不冒充业务服务；损坏头像使用合成数据，不发送外部图片请求。


浏览器复验入口为[边界检查脚本](../scripts/check-provided-boundaries.js)，接受ego-browser的Page并返回完整`pass/samples/failures`。只在对应生产展台运行，保存源码/构建摘要与JSON；正常、系统和手动减少动态分别取证。评分在窄框换行而不缩小标签命中区，本地文件输入按真实容器收缩，不能仅用document无横溢推定原生控件没有被内框裁剪。


## 接入补全 · 第一阶段（2026-11-16，源码候选）

本节说明字段/读取状态范围；图片与目标引导及固定制品生产验收见后文。分阶段测试不冒充全局源码等价或所有浏览器兼容。

- Rate、Slider、TimePicker、ColorPicker、Mentions新增可选消费方id/name/form、readOnly与hint/error；原默认调用保留。Rate使用显式name时遵循原生分组，独立组应给不同name；未提供name仍按实例分组。Slider只读由事件守卫和aria-readonly表达，不假装HTML range支持原生readonly/required。TimePicker透传min/max/step/required，时区和业务解释归宿主。ColorPicker的消费方id指向可填写/可复制的十六进制文本，色盘使用内部id；只读时色盘禁用、文本保持原生只读并可序列化。
- AutoComplete透传底层Combobox的关键禁用/只读与读取状态；error表示字段校验，optionsError表示候选读取失败，后者才阻断候选并提供onRetry。name/form/required及长度/pattern等通过受限query-input属性传到真实输入，不用选中标签假装用户正文。基础Combobox新增inputProps只表达原生查询输入属性，默认不改变原选项序列化责任。
- Form支持原生表单属性（如id/noValidate）并把提交事件传给宿主，仍阻止默认网络提交；原零参数回调继续可用。ErrorSummary可使用消费方id定位，业务校验、保存和快照归宿主。
- Upload支持id/name/form、accept/multiple、readOnly、hint/error与按受控File[]判断的required。输入选择后仍清空picker以允许再选同一文件；不以清空后的原生picker冒充已有文件。提供name时通过所属form的标准formdata事件追加受控File对象，不追加假路径或仅文件名；只读值保留，禁用/fieldset禁用值排除。固定tarball生产消费者已在Chromium/WebKit验证真实File字节与只读/禁用排除；JSDOM仍只验证事件处理，不宣称它自动实现formdata事件。组件不发送上传请求。
- Cascader支持id/name/form、readOnly、hint/字段error；name按路径顺序重复序列化片段，必选/业务有效性仍由宿主校验。loading/loadError/onRetry与字段error分开；节点可声明isLeaf=false、loading/loadError，进入未提供子项的节点只发onExpand意图而不提前提交。动态选项失效时回退到仍有效的导航路径，受控已选原值保留并提示。数据请求/版本及过期响应判断归宿主，没有内置请求或缓存。
- Transfer支持id/name/form、readOnly、hint/字段error及loading/loadError/onRetry/emptyText。name只重复序列化已选id，不提交临时勾选。加载/失败不清空已有勾选，不把未知可选数显示成确定0；值已知但详情缺失时明确提示。读取不可用时阻止变更，重试只发意图；首次读取、缓存数据、部分接受和迟到值依旧由宿主管理。
- Masonry把每个直接子节点包成listitem（复杂复合节点仍由宿主定义条目边界），不改视觉列序；Tree默认展台已接入实际受控选择，不再用未声明的空回调伪装可操作。

真实组合入口为`#form-integration`。它使用已有Fieldset/ErrorSummary/反馈组件，明确标记本地读取状态和提交快照，不请求业务服务。只读与禁用的提交区别、错误摘要定位、分支读取/重试和失效路径均可在同一页演示。


## 图片与目标引导 · 第二阶段（2026-11-16，源码候选）

- `Image`原有alt/src/caption保持兼容；缩略图和预览各自呈现loading/loaded/error/empty。失败显示明确说明，手动重试只重建当前浏览器资源，不制造业务请求、超时成功或后台自动重试；loading期间不并发重复重试。src每次实际切换使用独立资源实例，旧节点的迟到事件不覆盖新资源。重试按钮保持挂载，忙态与成功切换不丢焦；来源被移除导致持焦控件卸载时回到本资源上下文，宿主主动交焦优先。仍使用原Dialog关闭/嵌套层栈。
- `TourProps.target`可选为同document的HTMLElement/null或纯getter（不可用时返回null）。未传target保持原步骤说明行为；显式传null表示目标缺失。side默认bottom，targetPadding默认8 CSS px。高亮不接收pointer事件，使用现有Dialog层级，不加页面遮挡或新的全局浮层栈。
- 目标模式在首次可用/切步时滚动定位，并跟随scroll/resize、DOM可见性与布局变化；不为用户主动滚离视口持续抢滚动。空间不足时说明面板限制到可用视口/侧向空间并可滚动，不缩小控件。目标应有可测量的可见区域；透明原生定制输入优先采用关联的可见label测量，不把真正hidden的控件误判为可用。祖先transform/contain的限制沿用主题Portal契约，不宣称任意CSS动画/跨document目标支持。
- 真实目标关联到实际渲染的Dialog描述id；结束或换目标只移除本组件加的描述token/临时tabindex，保留宿主修改。初次进入说明获得焦点；显式“转到目标”才移交，目标内编辑/宿主主动交焦不会被后续重绘抢回；目标被移除且确实失焦时回到说明。步骤变化重置面板阅读起点。
- 缺失/隐藏目标不自动前进、不假报完成，禁用下一步/完成并提供返回/关闭与重新查找。onTargetMissing按步骤/状态变化通知一次；onTargetRetry只发恢复意图，宿主负责重建目标或刷新，getter及DOM更新可使本步恢复。目标只是移出视口时可重新定位；禁用目标允许阅读说明，不擅自执行动作。
- `#image/#tour`原章节已增加真实坏资源、换源、空来源、目标移除/隐藏/恢复和旧说明模式。开发smoke与下面固定制品/生产跨引擎证据分开记录，不相互冒充。

类型入口为ImageProps、TourProps，值导出路径不变。当前项目仍未提交/发布；浏览器原生资源解码不等于业务资产服务，DOM关联不等于实际读屏语音。


## 固定制品与有限兼容验收（2026-11-16）

本节保留候选阶段的验证范围；0.14.0发行状态以[发行记录](../docs/releases/0.14.0.md)和registry回读为准。相同package.version不代表相同制品；所有结论绑定具体tarball SHA-256、lockfile integrity、安装文件和生产构建摘要，不把旧版本或工作区依赖当作新发行的证明。

| 维度 | 本增量已验证的范围 | 不外推的范围 |
| --- | --- | --- |
| 构建 | Node24.21.0、React/ReactDOM19.3.1、TypeScript5.9.3、Vite8.3.4及React插件6.1.2 | 其他构建器、SSR/服务端直接执行TSX |
| Chromium | HeadlessChrome/157，独立安装制品的生产页 | 所有Chromium版本、系统WebView |
| WebKit | Playwright WebKit端口，UA Version26.4 / WebKit605.1.15 | 原生Safari App、iOS设备或VoiceOver |
| Firefox | N/A：Firefox 未纳入本轮支持范围，未运行兼容矩阵 | 不从 Chromium/WebKit 结果推导 Firefox 兼容性；后续若纳入范围再单独验证 |
| 尺寸 | 五主题×400/520/880宽度×CSS zoom1/2×五类消费者场景，每引擎150布局；880/100%与400/200%的10个实际交互场景 | 原生网页缩放、手机平台承诺或任意容器/内容 |
| 动态 | 每引擎正常/系统减少/宿主手动减少三条资源与引导路径，真实挂起资源后释放 | 仅静态截图代替动画/焦点生命周期 |

消费者创建在仓库外，安装脚本禁用，所有安装文件与tarball解包文件逐字哈希匹配；React/ReactDOM从宿主和库侧解析到同一实体。公开入口和新Props类型独立typecheck/build，SVG、theme、review与Node review/vite入口分别验证。另有只导入主入口、不引入theme或显式CSS的单独构建，验证样式自动加载；关闭样式表的反例必须被尺寸检查识别。

真实File/FormData包括外部form关联、原生秒级time、路径/已选id、只读保留和禁用排除；实际失败摘要回字段不改路由，Cascader未读取分支不冒充叶子，读取失败/重试不改业务值，Transfer加载不丢临时勾选，Tree响应受控选择，Masonry提供列表项。图片测试使用独立的慢速/损坏/可恢复SVG资源；目标引导测试包含输入、移除、恢复、描述清理、CSS zoom坐标。测试服务器仅是本地资源/静态文件夹具，不进入库业务协议。

复验工具为[隔离制品检查](../scripts/verify-packaged-consumer.mjs)、[已安装产物服务器](../scripts/serve-packaged-consumer.mjs)和[跨引擎消费者检查](../scripts/check-packaged-consumer-browser.js)。后者接受相应引擎Page适配器，必须核对返回pass/failures并保留部分结果，不把CLI退出0当成功。最终仅声明以上可独立验证范围，不包含真实业务服务、上传、OS文件选择器、实体扫码或读屏语音；也没有自动升级真实消费方。
