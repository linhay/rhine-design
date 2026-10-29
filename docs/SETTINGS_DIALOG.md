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

期望高度受视口限制；导航占用有界空间，不随正文滚动。极端长操作区自身可滚（指定高度时最高40%；自动高度时最高可用视口40%，按祖先CSS zoom换算），不采用裁剪遮盖按钮；调用方仍须对实际动作数量/文案/短屏测试，不能承诺任意内容在任意小窗口同时完整可见。规范矩阵400px、200% CSS zoom、648px短屏下，示例三个动作可同时完整显示且正文至少可完整容纳一个44px控件及上下操作空间（本轮短屏矩阵物理高度至少128px）。基础短 Dialog不启用固定高度，Drawer没有height/footer/navigation。

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
