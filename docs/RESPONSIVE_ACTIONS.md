# 容器自适应动作组（#96，未发布）

`ResponsiveActions` 依次呈现完整文字+图标、整组图标、竖向三点菜单。它测量实际容器及两种完整动作组的自然宽度，不按 viewport 断点猜测，不逐项丢弃动作。`Icon name="moreVertical"` 是新增竖点；原 more 横点保持不变。npm 0.11.3 不包含此能力。

```tsx
<ResponsiveActions label="对象操作" items={[
  { id:'refresh', label:'刷新', icon:'refresh', busy, onSelect:refresh },
  { id:'copy', label:'复制', icon:'copy', disabled:!canCopy, onSelect:copy },
  { id:'manage', label:'管理', icon:'settings', hidden:!canManage, onSelect:manage },
]}/>
```

## 输入与布局

- `label` 是动作组名称；`items` 是保持顺序的动作，稳定 `id`、完整 `label`、`icon` 和 `onSelect` 必填；可选 `disabled/busy/hidden/variant`。默认 variant 为 secondary，保留 Button 的操作语义。`moreLabel` 默认“更多操作”，`className` 只用于宿主布局定位。
- 宿主拥有权限、请求、防重入、结果、重试和动作清单；hidden 动作从按钮、测量和菜单都移除。组件另行拒绝 disabled/busy 的触发。更新日期等内容元信息放在相关内容区，不混入动作组。
- 文字与图标组的全部目标至少44×44 CSS px。容器必须能容纳最小44px菜单入口；不能通过缩字、缩目标或删除动作适配更窄的容器。文字、字体、动作数量、主题、容器和缩放变化重新测量，空间恢复时可逆恢复。
- 测量副本在 inert、aria-hidden 的零尺寸裁剪壳中，内层使用 max-content；没有额外 Tab 停靠点，不制造祖先横向滚动。ResizeObserver 监视实际容器及两个副本，字体加载与主题变化补充触发，同帧合并且只在模式改变时更新状态。模式不影响测量副本宽度，避免自我反馈造成振荡。卸载取消观察器、事件与动画帧。

## 键盘与连续性

文字/图标模式保留同一个 Button DOM 节点，图标模式用 Tooltip 提供 hover/focus 说明，按钮始终保留完整可访问名称。Tab 按宿主数组顺序；Enter/Space 调用同一个动作。busy 保留焦点并拒绝重复触发；菜单以“动作名（处理中）”和禁用状态表达等待。

收进菜单时，正在聚焦的按钮交接到竖点入口。菜单复用 Menu 的方向键、Home/End、Enter、Escape与关闭归焦。打开菜单期间、关闭自动归焦交接完成前或焦点仍在竖点入口时，保留菜单呈现，即使容器变宽也不拆掉当前交互；离开入口/关闭后焦点移到外部时，再恢复最新测量模式。此策略不阻止文字/图标模式在收窄时及时降级。

动态移除当前动作时，焦点移到相邻可用动作；菜单清空会卸载 Portal、清除 open 状态，重新提供动作不会自动打开。整个组移除且原焦点因此丢失时，优先恢复进入组时记录的下一个可见入口（同一 Dialog 内优先），无后续则用之前入口；外部主动移交的焦点不抢回。宿主卸载整个组件仍应按其页面/路由契约交接焦点。

## 展台和验证

`#responsive-actions` / `?fixture=responsive-actions` 使用公开组件，含容器680/440/240/160/56、长文/中英文、动态标签和字体、权限、disabled、700ms合成busy、清空及卸载。`theme`、`zoom`（CSS zoom）、`motion`、`dir` 参数用于验证。

`tests/ResponsiveActions.test.tsx` 覆盖测量契约、稳定按钮节点、焦点、权限/busy、菜单清空恢复和卸载；JSDOM尺寸是测量回调的契约测试，真实布局以 `scripts/check-responsive-actions.js` 的生产浏览器结果为准。三主题400/520/880、100/200% CSS zoom、不同容器、动态内容/字体、减少动态和后置公共CSS的固定制品分别验证。原生网页缩放、读屏语音、实体设备与真实请求不由这些测试证明。

固定制品消费者可用 `node scripts/prepare-responsive-actions-consumer.mjs <tarball> <new-directory>` 创建；所有源码来自新安装包，公共 styles.css 在入口后置加载。`Menu.onCloseAutoFocus` 可选回调跟随底层关闭归焦事件，默认行为不变；ResponsiveActions 用它释放关闭期间的布局锁。
