# 浮层的缩放与可达性

未发布修订，对应 #16；已有 npm 版本不因此获得此能力。

Popover、Menu、Tooltip、StatusTimeline 与 TimelineLegend 的 Portal 保留在最近的 `.rhine-theme` 内，继承主题与减少动态偏好。所有这些浮层共用定位缩放修正，不需要消费方覆盖 Radix 包装层或库选择器。

- 文档或主题根的祖先 CSS `zoom`：定位坐标归一化，正文与 44px 点击目标仍按用户设置放大。浮层宽高受视口限制，长内容在内部滚动；左右空间不足时优先改为上下展开，避免菜单首次松开指针时误选；最后以视口边界限制定位，优先保证操作可达。
- 正文局部 CSS `zoom`：锚点按实际像素定位，Portal 内容沿主题根继承缩放，不继承已经离开的正文节点的缩放。
- 浏览器原生缩放：由浏览器改变 CSS 视口处理，不能用 CSS zoom 或截图缩小代替其验收。
- 打开期间变更祖先样式、主题、窗口尺寸会重新测量，不重新挂载内容或清空草稿。Escape、外点关闭、菜单键盘与焦点归还仍由 Radix 管理。
- 不支持把主题根置于 `transform`、`filter` 或 `contain` 创建的固定定位包含块中；这与 CSS zoom 是不同约束。

真实展台 `#overlay-bounds` 使用独立 iframe，提供三主题、400/520/880px、100%/200%、文档/主题根/正文、四角锚点和四个优先方向。账号长文本、日期字段、取消/应用、菜单末项均为合成数据。

浏览器回归入口为 `scripts/check-overlay-bounds.js`，使用 Playwright CLI 的 `run-code --filename`。先运行 `npm run build && npx vite preview --host 127.0.0.1 --port 18480 --strictPort`；脚本固定使用 18480，并非 `npm run dev` 的默认端口。检查实际浮层和操作边界、内部滚动后的真实点击、焦点归还，以及打开期间动态缩放的输入节点与草稿保持；仅 `document.scrollWidth` 无法证明浮层没有越界。
