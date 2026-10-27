# 导航行操作（#45，未发布）

`NavItem.actions?: readonly NavAction[]` 为可选命令列表，复用 Menu 和常显 IconButton。每项提供 id、label、disabled、danger 和 `onSelect(trigger: HTMLButtonElement)`。缺省或空数组不渲染按钮、包装或空白；调用方过滤不可见动作，库不判断身份或权限。

链接和菜单触发器处于同一 li 的兄弟分支，没有嵌套 button/link。长标题自然换行，尾部按钮保持44px命中；更多默认可见，不依赖 hover。导航与菜单分别进入 Tab 顺序，Enter/Space 打开菜单，方向键选择，Escape 关闭；菜单关闭由 Radix 归焦。

菜单项打开受控 Dialog 时，宿主保存 `onSelect` 收到的 trigger。Dialog 的 `onCloseAutoFocus` 中 preventDefault，再聚焦该按钮。若宿主删除原行，需改为已存在的导航或内容入口。详情使用 Dialog 语义，不将路由挂在更多按钮上。真实组合见 `#nav-actions` / `preview/NavActionsGallery.tsx`。

此能力未进入冻结的0.11.0制品；合并源码不代表发布。消费方继续固定已验证版本。
