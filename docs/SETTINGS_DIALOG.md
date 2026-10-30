# 设置导航 Dialog

`navigation` 自 0.8.0 提供，对应 #18。下例的 `height/footer`、可省略 `description` 类型及固定头尾修复自 **0.11.2** 正式提供，0.11.1 不包含；不要据展台推断已安装包。默认 Dialog、Drawer 和 `sidePanel` 用法保持兼容。

```tsx
<Dialog title="设置" height={640} open={open} onOpenChange={setOpen} trigger={<Button>设置</Button>}
  footer={<><Button variant="secondary" onClick={undo}>撤销</Button>
    <Button variant="secondary" onClick={() => setOpen(false)}>关闭</Button>
    <Button busy={saving} onClick={save}>保存</Button></>}
  navigation={<SideNav aria-label="设置导航" currentId={section} groups={groups}
    onNavigate={(item, event) => { event.preventDefault(); setSection(item.id); }} />}>
  <SettingsSection section={section} />
</Dialog>
```

`navigation?: ReactNode` 专门承载左侧导航，`children` 为任务内容；不与辅助 `sidePanel` 同时使用，两者同时提供会抛出明确错误。Drawer 不提供此插槽。

标题和关闭动作在同一头部。`description?: ReactNode` 可真正省略（包括 undefined/null/false/空串）；此时不生成说明节点、空白占位或 `aria-describedby`。仅在帮助决策时提供说明；不重复字段/导航已经表达的操作，也不加无决策必要的全局人数或规则摘要。错误、保存中、未保存和冲突反馈必须保留。内容实际宽度达到 560 CSS px 时分成约 1:3 两栏，否则导航在上、任务内容在下；容器查询会响应宿主宽度和 CSS zoom，而不是仅判断窗口宽度。自然高度模式的长内容在弹窗内滚动；显式有界模式如下。settings 根选择器的优先级高于基础 Dialog，不依赖生产 CSS 发出顺序；不让消费者用私有类覆盖宽度。保留原字体和点击目标。

应用拥有栏目、数据、权限、请求、草稿、保存和取消。库不改变 URL、不自动保存、也不会因为异步数据变化而关闭弹窗。需要保留切换栏目期间的草稿时，将状态提升到 Dialog 的宿主；关闭后的重置也由宿主明确执行。不要给 Dialog 或 ThemeProvider 使用随栏目/主题变化的 key。

嵌套编辑继续使用 Radix 的焦点陷阱和焦点归还；Dialog 在布局阶段按焦点所属弹窗接管 Escape，避免快速打开内层时旧监听误关外层：先关闭内层并归还其触发器，外层仍保持打开。`onCloseAutoFocus` 仍可处理触发器已被宿主删除的场景。

展台 `#settings-dialog` / `?fixture=settings-dialog` 包含账号草稿、异步保存、撤销、失败/冲突、30行成员、异步栏目、长导航/长操作文案、嵌套搜索多选和编辑 Dialog，以及项目加载/错误/空态。短动作保留完整可访问名称；主题切换保持草稿与节点。宿主例允许保存中关闭，迟到成功只更新已提交值，不覆盖重新打开后的新编辑；计时器在卸载清理。

## 稳定预览与底部操作区（#41，0.11.2）

`Dialog.height?: CSSProperties['height']` 显式指定实例期望高度，数字按CSS px解释，默认不指定、保持原内容自适应行为；实际高度受可用视口减32px限制。`footer?: ReactNode` 是独立操作区，不参与内容滚动；单独提供footer也启用有界滚动，不强迫固定高度。两者不能作为全库560px默认，560仅为展台比较参数。

提供height或footer时，主体使用有界内部滚动。普通单栏和 navigation 模式的标题/关闭行位于正文滚动区外，footer固定在 Dialog 内部底部；均不使用绑定浏览器的 position:fixed。navigation 宽屏左右各自滚动，窄容器上下排列仍分别滚动：导航有界，正文保留剩余空间。正文 region可聚焦并用键盘滚动；无导航的有界纯文本正文也有唯一的命名region Tab入口。辅助 sidePanel 沿用 #41 的宽屏独立双栏滚动、窄屏共用滚动区及 sticky 标题策略，不把设置布局强加给它。根保持主题、焦点陷阱、Escape与onCloseAutoFocus，宿主仍拥有草稿和保存状态。短内容、末页、空组、未选择、预览加载/失败、保存中/成功/失败不改变同一视口的外框高度/位置；视口或缩放改变时可响应调整。

`#compact-selection` 显式保存组合保留预览侧栏，底部保存不与说明或内容混排。保存期间宿主通过受控onOpenChange拒绝关闭，使用请求锁防重，并在卸载清理计时器。height/footer本轮限定Dialog；Drawer与既有navigation/sidePanel默认行为保持。

## 设置页组合（#53，未发布）

`Icon name="settings"` 使用20px滑杆几何，沿用1.5px线宽、currentColor、装饰性SVG；SideNav通过文字命名，独立IconButton必须提供label。省略号仍只表示更多操作。

关于卡片用 `Inline` 可换行排列产品身份和更新 `Stack`：两列均设 `minWidth:0`，更新列 `alignItems:'flex-end'`、`textAlign:'end'`，长文 `overflowWrap:'anywhere'`。状态与按钮共享逻辑末端；检查中保留busy反馈，失败保留重试。更新请求和安装由宿主负责，不新增产品更新组件。

仅含操作的 `AppShell` 显式设置 `collapseEmptyContentHeader`（默认false，保留既有头部），`contentHeader` 直接传Fragment，里面放 `AppShellToggle placement="content"` 与按实际权限/状态条件渲染的动作，不套空Inline/nav。共享样式在所有直接子元素均有hidden或没有元素时收起整个头部（含背景、内距和分隔线）；不能以React节点或DOM节点存在代替可见动作。这个有限规则不检测任意深层包装或display:none；自定义组合须条件省略整个包装，文字标题应放入元素。隐藏的恢复控件保持挂载；侧栏收起或窄窗时恢复控件出现，头部随之恢复，焦点沿用AppShell。

真实展台 `#settings-composition` / `?fixture=settings-composition` 包含长文、更新四态、可选顶部动作、侧栏与重置。此能力自 0.11.2 提供，不修改 0.11.1 冻结制品。


## 操作区与短屏（#18，0.11.2）

`footer` 默认是右对齐、可换行的 flex 操作区；直接传按钮或 Fragment，避免再套整宽、不换行的包装。设置展台使用「撤销 / 关闭 / 保存」，通过 aria-label 保留完整动作名。窄容器收紧间距和横向按钮内距，字号不变、目标至少44×44 CSS px；长可见文案可由宿主在窄容器替换为明确短标签。操作区预留焦点环/主题硬阴影空间。

期望高度受视口限制；导航占用有界空间，不随正文滚动。极端长操作区自身可滚（指定高度时：普通单栏最高60%，settings/split最高40%；自动高度时最高可用视口40%，按祖先CSS zoom换算），不采用裁剪遮盖按钮；调用方仍须对实际动作数量/文案/短屏测试，不能承诺任意内容在任意小窗口同时完整可见。规范矩阵400px、200% CSS zoom、648px短屏下，示例三个动作可同时完整显示且正文至少可完整容纳一个44px控件及上下操作空间（本轮短屏矩阵物理高度至少128px）。基础短 Dialog不启用固定高度，Drawer没有height/footer/navigation。

## 生产与固定制品回归

- `scripts/check-settings-bounded.js`：57组（三主题×400/520/880/1280×100/200%×900/648高，加390×680、889×480、1440×900的100%），量测正文和长导航滚动前后标题/关闭/footer及按钮rect、末项可达、非零正文、44px目标、横向/操作区溢出和列数。
- `scripts/check-settings-interactions.js`：24组主题/宽度/缩放的保存、撤销、失败/冲突、异步栏目、嵌套搜索多选/编辑、快速Tab/ShiftTab、Escape、归焦、宿主URL/查询/草稿及主题节点保留；系统/手动减少动态独立检查。
- `scripts/prepare-settings-consumer.mjs <tarball> <new-directory> [--late-css]`：从固定tarball全新安装、构建合成消费者。后置公共 `styles.css?late` 真实构建可重现旧基线480px覆盖，修复候选须在同一条件通过；普通导入构建也要检查。启动该目录的vite preview后，前两脚本使用当前页面origin。

以上是CSS zoom与Chromium行为，不外推原生网页缩放、其他引擎或真实业务服务。历史0.11.2发布保持不变。本轮新增修复尚未发布；固定候选的原消费验收与对应适配删除仍是重新打开的 #18 关闭条件，不要求或暗示新增npm发布授权。

- `scripts/check-dialog-scroll-boundaries.js`：三主题×400/880×100/200%、648px短屏，验证无height的长footer有界且末项可达，以及纯文本有界正文的Tab/End滚动。自动高度footer监听视口及祖先zoom/主题变化，卸载时清理。

## 多栏目工作区与导航轨道（#18 新增修复，未发布）

短任务默认自然高度；多栏目设置/编辑推荐显式 `height + footer + navigation`，具体期望高度由宿主决定，不统一硬编码760px。`#settings-dialog` 的「打开稳定工作区」以760px合成示例覆盖三栏目、空模板、八行编辑、加载/错误/重试和三项直接footer动作；栏目切换保留模板名称草稿，不重建Dialog。错误/未保存/冲突等必要反馈不能因为简化说明而删除。

窄容器导航轨道改为 `fit-content(25%)`，按实际导航内容收缩，通常最多占网格可用空间的四分之一，并为44px点击目标及常见两行导航文案保留至少64 CSS px；导航不再另外设置与轨道脱节的64px上限。剩余空间属于正文，导航末项通过自身滚动到达，导航底部与正文顶部仅保留设计gap。宽屏仍为左右两栏。标题上滚轮不驱动正文属于独立滚动边界，不因此退回整窗滚动，也不增加通用wheel转发。

`check-settings-workspace.js`补充正常/648px短屏三主题四宽度两缩放的48组：量测轨道间距、正文至少128物理px、状态切换外框不动、八行末项、导航末项、头尾固定、三动作44px、键盘和草稿。128px是该合成矩阵的最低验收门槛，不是任意标题/动作/视口的通用保证；实际消费仍须验证自己的文案和状态。

## 对象上下文（#78，未发布组合）

单对象入口将固定身份放在Dialog整体，不重复对象搜索/多选。批量入口保持独立对象栏，跨功能保留目标和草稿，确认期间锁定目标；只选一个对象仍保留该栏。当前无需新增插槽：保留navigation作为功能导航，在children中用现有RemoteMultiSelect与正文组合，宽屏分列、窄屏堆叠，共用正文滚动和固定footer。navigation与sidePanel仍互斥。详见[对象上下文组合](TEMPLATE_SETTINGS.md#对象上下文与最小组合)。

## 响应式功能导航（#18 新增，未发布）

在 `Dialog.navigation` 放入 `SettingsNavigation`：`items: readonly {id,label,disabled?}[]`、受控 `currentId`、`onNavigate(item)`，可选整组 `disabled` 和可访问 `label`（默认“设置栏目”）。共享同一组选项与回调，宽屏复用 SideNav，Dialog 内容盒不足560 CSS px时使用满宽原生 Select。下拉 label 只作可访问命名，不额外占一行；被隐藏的一种导航以 display:none 移出 Tab 与可访问树。缺失 currentId 显示禁用占位，不自动选择第一项。SideNav 的 `NavItem.disabled` 同步阻止导航及行操作。

仅响应实际 Dialog 容器，不按窗口宽度判断；响应式切换不重挂正文，草稿属于宿主。焦点落在变为隐藏的导航控件时转到可见的当前项/Select，正文已有焦点不被夺走。短屏的导航轨道只占 Select 实际高度，保留44px命中；旧任意navigation内容仍沿用原有有界滚动。单对象身份可直接合并到 Dialog 标题，不强制独立说明行。只读栏目由宿主过滤；确认或提交期间传 disabled，不能让隐藏导航绕过锁定。

`TemplateSettingsGallery` 使用该公开组合，覆盖单/批量身份、栏目草稿、保存锁定、只读隐藏管理项。原生方向键须以实际系统菜单验证，selectOption 与键入选择仅各自证明其路径，不能替代方向键。原消费仍暂缓升级，待固定制品验收后删除局部导航适配；npm0.11.3不包含该新增API。

## 固定底部的保存反馈

长表单的失败摘要和成功反馈应与固定 footer 动作一起可见，使用 Fragment：Notice/Toast 的提示包装独占一行，按钮作为 Dialog footer 直接子元素，保留组件的窄屏自适应。不要用 Stack/Inline 包住整组按钮。空白/重名及跨页签错误可提交校验并定位字段；未修改明确反馈“无需保存”且不写入。失败保留草稿和已保存值，重试成功后才更新；再次编辑清除旧成功提示。完整合成示例及输入策略见[紧凑标签与模板保存](COMPACT_TEMPLATE.md)。

2026-10-29 评论 6497842246 取代此前“整组 Stack/Inline footer”建议。普通有界 Dialog 同样建立实际容器查询，让原有 ≤300px 直接动作规则生效；不新增插槽或消费 CSS。

## #89 短屏设置反馈修正（取代原设置 footer 一律 40% 的边界）

真实设置导航、长对象标题及完整保存反馈与单栏表单预算不同。视口高度不超过700px时，有界设置对话框外框上下各保留4px，内距8px；实际内容容器不超过559 CSS px时，反馈 Notice/Toast 使用4px纵向、8px横向内距，正文/导航/底部间距4px，footer后备上限为50%减8px，给超长反馈的滚动状态保留正文余量。按钮完整命中区不缩小，主题边框和关闭按钮保留。显式 `--rhine-dialog-footer-limit` 优先，自动高度的测量值仍优先；普通单栏、分栏和700px以上窗口保持既有规则。

`?fixture=compact-template&settings=1` 使用设置导航、对象标题和完整失败/无改动文案；加 `auto=1` 检查自动高度。三主题、400/520/880、100/200% CSS zoom、648px短屏检查整个按钮、反馈文字与正文至少44 CSS px；超长错误继续通过独立footer滚动访问，不能据有限合成文案声称无限长度始终同屏。无业务CSS或新通知组件。

## 同一对象的低频设置分区（#18，宿主组合）

在资源卡片的低频分配配置场景，可把分配与模型、调度放在同一对象设置 Dialog 的功能导航中，不再与“对象设置”并列为卡片动作。这是[该产品的信息架构偏好](https://github.com/linhay/rhine-design/issues/18#issuecomment-6519086168)，不要求所有产品合并入口。复用现有 `Dialog.navigation`、`SettingsNavigation`、`footer`，无新 Dialog API。

- 固定对象标题与外框；各分区草稿由宿主持有或保持挂载，隐藏分区须退出可访问树与 Tab 顺序。导航切换保留草稿；分区独立保存，只确认本次请求的结果，不能包装成跨接口原子事务。退出检查所有分区的真实 dirty；忙态及退出确认期间锁导航和关闭。放弃只丢未保存部分，独立保存结果保留。
- 批量/只读入口过滤不支持的分配管理栏目，不能仅禁用卡片动作而留下可达入口。权限与请求结果继续由宿主判断。
- 表单下拉复用 `RemoteMultiSelect` / `Select` 的同一浮层体系，不引入全局 Escape 监听或第三方浮层补丁。展开候选时第一下 Escape 只关候选，第二下才进入设置退出流程，最终归还对象设置入口；dirty 时按宿主确认策略处理。
- 子表单向父层报告 `ready/dirty/busy` 时，须在相应成功界面可见前完成同步。可在同一状态所有者处理，或在子表单 layout 阶段通知父层并同步更新关闭守卫 ref；不能仅依赖 passive effect，使成功提示已经出现而父层仍按旧 busy 拦截立即 Escape。此处是[宿主组合修正](https://github.com/linhay/rhine-design/issues/18#issuecomment-6519625460)，不增加组件 API。

真实合成示例已扩展 `#settings-dialog`，隔离入口 `?fixture=settings-dialog&object=1`：分配子表单、模型/调度草稿、独立保存、失败保留、退出确认、外部动作短时锁定、只读/批量过滤和嵌套候选。合成设置 100ms、通知 2000ms、保存 350ms 仅用于可交互状态窗口，不是性能目标或真实服务测量。紧凑卡片及读取边界见[紧凑配方](COMPACT_ACCOUNT_PATTERNS.md#紧凑元信息与额度槽位116)与[设置读取配方](ASYNC_SNAPSHOT_RECIPES.md#对象设置与人员目录读取)。
