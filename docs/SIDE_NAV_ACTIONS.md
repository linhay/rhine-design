# 导航行操作（#45，0.11.2）

`NavItem.actions?: readonly NavAction[]` 为可选命令列表，复用 Menu 和常显 IconButton。每项提供 id、label、disabled、danger 和 `onSelect(trigger: HTMLButtonElement)`。缺省或空数组不渲染按钮、包装或空白；调用方过滤不可见动作，库不判断身份或权限。

链接和菜单触发器处于同一 li 的兄弟分支，没有嵌套 button/link。长标题自然换行，尾部按钮保持44px命中；更多默认可见，不依赖 hover。导航与菜单分别进入 Tab 顺序，Enter/Space 打开菜单，方向键选择，Escape 关闭；菜单关闭由 Radix 归焦。

菜单项打开受控 Dialog 时，宿主保存 `onSelect` 收到的 trigger。Dialog 的 `onCloseAutoFocus` 中 preventDefault，再聚焦该按钮。若宿主删除原行，需改为已存在的导航或内容入口。详情使用 Dialog 语义，不将路由挂在更多按钮上。真实组合见 `#nav-actions` / `preview/NavActionsGallery.tsx`。

此能力未进入冻结的0.11.0制品；合并源码不代表发布。消费方继续固定已验证版本。

## 禁用主项（#161，未发布）

`NavItem.disabled` 保留标签、link 角色、`aria-disabled` 与现有 `aria-current`，移除真实 `href`，从 Tab 顺序移出；主点击、修饰键点击及辅助点击不导航、不调用 `onNavigate`，并停止这些激活事件冒泡。不会劫持 `contextmenu`：禁用项没有可供浏览器打开或复制的目的地址。它不是服务端权限边界。

动态禁用保留原 DOM 与当前项；已聚焦项不强制失焦，后续 Tab 离开后不会再次进入。重新启用恢复 href 和默认 Tab 顺序。宿主若移除整行仍需负责焦点交接。尾随动作同时禁用，SettingsNavigation 的宽屏链接与窄屏 option 使用同一状态。

启用项保留原生 href、复制地址、中键/菜单打开和修饰键行为；`onNavigate(item, event)` 维持原契约，宿主接管普通点击时应先排除 `metaKey/ctrlKey/shiftKey/altKey`，不无条件取消这些事件。真实合成 `#nav-actions` 包含禁用/动态切换及响应式设置示例；浏览器原生菜单、系统输入与读屏需单独验收，DOM 派发不能代替。
