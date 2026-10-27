# #42 候选验收 · 2026-10-27（Asia/Shanghai）

运行候选 `7607c5c`，基于 `fa2e6bc`；Node 24 / React 19.3.1 / Vite 8.3.4，macOS Chromium 155。所有内容为合成数据。证据位于忽略的 `output/playwright/`。

- PASS：38文件291测试；类型、主展台/两评审示例生产构建、CSS/SVG与包入口检查。
- PASS：最终生产目录，三主题 × 400/520/880局部容器 × 100/200% CSS zoom，共18组；14/22/400正文及placeholder、44px或46px主题命中、长查询、Escape清空/焦点、加载/无结果/错误/禁用、系统及手动减少动态。脚本 `scripts/check-single-search.js`。
- PASS：独立持久Chrome配置通过设置页选择原生200%，CSS zoom保持1、innerWidth600、devicePixelRatio4；三主题 × 三容器，共9组查询与清空/焦点/边界通过。并非每个容器都能在600 CSS px视口保持声明宽度，max-width按可用空间约束。
- PASS：Chromium CDP `Input.imeSetComposition` 与 `Input.insertText` 真实引擎输入路径，组合时不查询，提交“中文”后查询；定向测试另覆盖防抖、过期响应取消、禁用/卸载清理。
- SKIPPED：macOS系统中文候选窗与人工选词未测试。上述引擎输入不能外推该边界；issue保持OPEN直到原验收收口。
- FAIL（保留）：首轮脚本误将Toolbar strong当heading，等待30秒超时；修正搜索框定位后18组PASS。一次隔离context不能打开Chrome设置页，改用独立持久profile后原生缩放PASS；未触碰其他会话浏览器。
- N/A：npm发布、真实服务和消费产品迁移。本候选不进入已冻结0.11.0制品；发布回合尚待用户登录，暂不合并。
