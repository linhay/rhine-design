# 浮层的缩放与可达性

自 0.8.0 提供，对应 #16；旧版本不因此获得此能力。

Popover、Menu、Tooltip、StatusTimeline 与 TimelineLegend 的 Portal 保留在最近的 `.rhine-theme` 内，继承主题与减少动态偏好。所有这些浮层共用定位缩放修正，不需要消费方覆盖 Radix 包装层或库选择器。

- 文档或主题根的祖先 CSS `zoom`：定位坐标归一化，正文与 44px 点击目标仍按用户设置放大。浮层宽高受视口限制，长内容在内部滚动；左右空间不足时优先改为上下展开，避免菜单首次松开指针时误选；最后以视口边界限制定位，优先保证操作可达。
- 正文局部 CSS `zoom`：锚点按实际像素定位，Portal 内容沿主题根继承缩放，不继承已经离开的正文节点的缩放。
- 浏览器原生缩放：由浏览器改变 CSS 视口处理，不能用 CSS zoom 或截图缩小代替其验收。
- 打开期间变更祖先样式、主题、窗口尺寸会重新测量，不重新挂载内容或清空草稿。Escape、外点关闭、菜单键盘与焦点归还仍由 Radix 管理。
- 不支持把主题根置于 `transform`、`filter` 或 `contain` 创建的固定定位包含块中；这与 CSS zoom 是不同约束。

真实展台 `#overlay-bounds` 使用独立 iframe，提供三主题、400/520/880px、100%/200%、文档/主题根/正文、四角锚点和四个优先方向。账号长文本、日期字段、取消/应用、菜单末项均为合成数据。

0.11.1 补丁：Combobox/RemoteMultiSelect也接入同一useFloatingScale，修正0.11.0直接使用Radix Content遗漏坐标归一化的问题。`#compact-filters`增加弹窗内多选，核对400/520/880px与100/200% CSS zoom时列表边界、鼠标选择及Escape。旧0.11.0不包含此修复；产品查询、分页和取消仍由宿主负责。追踪 #16 / #40。回归脚本 `scripts/check-combobox-zoom.js` 使用当前 Playwright 页面 origin，需先打开该版本的构建展台；结果必须 `pass: true`，不能只检查 CLI 退出码。CSS zoom 证据不外推浏览器原生缩放。

浏览器回归入口为 `scripts/check-overlay-bounds.js`，使用 Playwright CLI 的 `run-code --filename`。先运行 `npm run build && npx vite preview --host 127.0.0.1 --port 18480 --strictPort`；脚本固定使用 18480，并非 `npm run dev` 的默认端口。检查实际浮层和操作边界、内部滚动后的真实点击、焦点归还，以及打开期间动态缩放的输入节点与草稿保持；仅 `document.scrollWidth` 无法证明浮层没有越界。

0.11.1 同时保留多选反选、明确完成操作和焦点归还。候选打开期间使用 Radix 的 `updatePositionStrategy="always"` 跟随锚点矩形变化：底层按帧比较矩形，有变化才重算，卸载时清理。此设置用于动态 CSS zoom；默认策略在 WebKit 的200%→100%检查出现 ResizeObserver 告警，改为该策略后定向三主题12组清零。一次将共享hook的ResizeObserver延后到rAF的试验无效，未保留该修改；不把告警无条件过滤掉。

验证记录（2026-10-27）：维护基线292项测试与全量构建/包清单通过。main 首次并行315项中中子星异步初始化用例一次未读到预期标签（loading），此前312项通过；保留首次日志，另以单worker复验，不据此推定根因。WebKit旧候选的36组边界/交互通过但有ResizeObserver告警，rAF试改无效并撤回；原0.11.0的400px动态缩放对照确认浮层越界，未把旧失败算作新版本验收。

最终候选：Chromium 与 WebKit 各36组三主题×400/520/880px×100%/200% CSS zoom×页内/弹窗场景通过，包含打开时动态缩放、鼠标/键盘反选、空结果、长列表完成按钮、焦点/节点/草稿保留、打开/关闭两态清空后不展开，pageerror均0。main单worker315项、类型/全部构建/包清单复验通过；首次异步用例失败仍保留，未修改该用例或推定失败根因。浏览器回归使用 `scripts/check-combobox-zoom.js`，额外完成行为脚本为 `scripts/check-multiselect-completion.js`。
