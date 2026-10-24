# 0.9.0 背景与筛选验收

基线：v0.8.0；目标：#17、#19。2026-10-24 Asia/Shanghai，macOS Chromium，固定 Vite production preview。展示记录均为 synthetic，无业务 API；不宣称 Gateway 生产权限、查询或部署已验证。

- `npm run check`：31 文件、245 测试、TypeScript 与构建通过。
- `scripts/check-background-filters.js`：三主题 × 400/520/880px × 1/2 CSS zoom × 三类列表，共54组；主筛选上限、摘要清除、焦点归还、加载/错误/空态/禁用；背景三主题 ×400/520/880/1280px ×1/2 CSS zoom，共24组，文字避让、不透明表单、无控件/边框、容器断点和输入/Canvas节点保留。
- `scripts/check-filter-native-date.js`：真实日期分段键盘五项，删除片段不扩大已接受范围、补全年份、初始空值的 keyup-only 片段、清空及同值预设恢复。
- `scripts/check-background-motion.js`：Three.js实际像素变化，手动/系统减少动态、恢复、零尺寸、离屏、模拟 document.hidden、卸载停帧/观察器清理，Canvas不可用时三主题静态几何与实际画布一致。自动化 Chromium 的标签切换不产生真实 document.hidden，保留该限制；不以事件模拟冒充真实后台切换。GPU内部共享资源由renderer.dispose/forceContextLoss收口，不能仅以独立delete调用数量判泄漏。

独立复核修复：有效日期被宿主拒绝时保持受控值；展台窗口断点改为容器查询；提供宽艺术栏/窄全页的同节点入口组合；仅剩非聚焦字段摘要时，清除后焦点落在筛选区域。首轮浏览器脚本在Drawer动画未结束/焦点恢复前断言，稳定状态复核已修正；原始失败记录与修正后证据保留在根仓库 `.local/artifacts/rhine-design-v0.9.0/`。

运行脚本前用 `npm run build`，将 dist 固定服务到127.0.0.1:18484。动效脚本须新浏览器会话，防止旧 addInitScript instrumentation 重复注册。公开脚本不包含认证或业务数据。
