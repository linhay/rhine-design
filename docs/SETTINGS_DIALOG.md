# 设置导航 Dialog

自 0.8.0 提供，对应 #18。默认 Dialog、Drawer 和 `sidePanel` 用法保持兼容。

```tsx
<Dialog title="设置" description="管理工作区偏好" trigger={<Button>设置</Button>}
  navigation={<SideNav aria-label="设置导航" currentId={section} groups={groups}
    onNavigate={(item, event) => { event.preventDefault(); setSection(item.id); }} />}>
  <SettingsSection section={section} />
</Dialog>
```

`navigation?: ReactNode` 专门承载左侧导航，`children` 为任务内容；不与辅助 `sidePanel` 同时使用，两者同时提供会抛出明确错误。Drawer 不提供此插槽。

标题、说明和关闭动作在同一头部。内容实际宽度达到 560 CSS px 时分成约 1:3 两栏，否则导航在上、任务内容在下；容器查询会响应宿主宽度和 CSS zoom，而不是仅判断窗口宽度。长内容在弹窗内滚动，保留原字体和点击目标。

应用拥有栏目、数据、权限、请求、草稿、保存和取消。库不改变 URL、不自动保存、也不会因为异步数据变化而关闭弹窗。需要保留切换栏目期间的草稿时，将状态提升到 Dialog 的宿主；关闭后的重置也由宿主明确执行。不要给 Dialog 或 ThemeProvider 使用随栏目/主题变化的 key。

嵌套编辑继续使用 Radix 的焦点陷阱和焦点归还；Dialog 在布局阶段按焦点所属弹窗接管 Escape，避免快速打开内层时旧监听误关外层：先关闭内层并归还其触发器，外层仍保持打开。`onCloseAutoFocus` 仍可处理触发器已被宿主删除的场景。

展台 `#settings-dialog` 包含账号草稿/异步保存/取消、长用户列表、嵌套编辑，以及项目加载/错误/空态。浏览器回归在 `scripts/check-settings-theme.js`，覆盖三主题、400/520/880/1440px、100%/200% CSS zoom、实际按钮边界、嵌套 Escape、焦点与宿主查询/URL 保持。

## 稳定预览与底部操作区（#41，未发布）

`Dialog.height?: CSSProperties['height']` 显式指定实例期望高度，数字按CSS px解释，默认不指定、保持原内容自适应行为；实际高度受可用视口减32px限制。`footer?: ReactNode` 是独立操作区，不参与内容滚动；单独提供footer也启用有界滚动，不强迫固定高度。两者不能作为全库560px默认，560仅为展台比较参数。

提供height或footer时，主体使用有界内部滚动。双栏宽屏可独立滚动，窄屏上下排列在同一内容滚动区；主标题/关闭行在其滚动区顶端保持可达，footer持续固定在下方。根保持主题、焦点陷阱、Escape与onCloseAutoFocus，宿主仍拥有草稿和保存状态。短内容、末页、空组、未选择、预览加载/失败、保存中/成功/失败不改变同一视口的外框高度/位置；视口或缩放改变时可响应调整。

`#compact-selection` 显式保存组合保留预览侧栏，底部保存不与说明或内容混排。保存期间宿主通过受控onOpenChange拒绝关闭，使用请求锁防重，并在卸载清理计时器。height/footer本轮限定Dialog；Drawer与既有navigation/sidePanel默认行为保持。

## 设置页组合（#53，未发布）

`Icon name="settings"` 使用20px滑杆几何，沿用1.5px线宽、currentColor、装饰性SVG；SideNav通过文字命名，独立IconButton必须提供label。省略号仍只表示更多操作。

关于卡片用 `Inline` 可换行排列产品身份和更新 `Stack`：两列均设 `minWidth:0`，更新列 `alignItems:'flex-end'`、`textAlign:'end'`，长文 `overflowWrap:'anywhere'`。状态与按钮共享逻辑末端；检查中保留busy反馈，失败保留重试。更新请求和安装由宿主负责，不新增产品更新组件。

仅含操作的 `AppShell` 显式设置 `collapseEmptyContentHeader`（默认false，保留既有头部），`contentHeader` 直接传Fragment，里面放 `AppShellToggle placement="content"` 与按实际权限/状态条件渲染的动作，不套空Inline/nav。共享样式在所有直接子元素均有hidden或没有元素时收起整个头部（含背景、内距和分隔线）；不能以React节点或DOM节点存在代替可见动作。这个有限规则不检测任意深层包装或display:none；自定义组合须条件省略整个包装，文字标题应放入元素。隐藏的恢复控件保持挂载；侧栏收起或窄窗时恢复控件出现，头部随之恢复，焦点沿用AppShell。

真实展台 `#settings-composition` / `?fixture=settings-composition` 包含长文、更新四态、可选顶部动作、侧栏与重置。此能力未进入npm版本，不修改0.11.1冻结制品。
