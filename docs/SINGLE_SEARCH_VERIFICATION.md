# #42 候选验收 · 2026-10-27（Asia/Shanghai）

初始运行候选 `7607c5c`，基于 `fa2e6bc`；Node 24 / React 19.3.1 / Vite 8.3.4，macOS Chromium 155。所有内容为合成数据。证据位于忽略的 `output/playwright/`。

- PASS：38文件291测试；类型、主展台/两评审示例生产构建、CSS/SVG与包入口检查。
- PASS：最终生产目录，三主题 × 400/520/880局部容器 × 100/200% CSS zoom，共18组；14/22/400正文及placeholder、44px或46px主题命中、长查询、Escape清空/焦点、加载/无结果/错误/禁用、系统及手动减少动态。脚本 `scripts/check-single-search.js`。
- PASS：独立持久Chrome配置通过设置页选择原生200%，CSS zoom保持1、innerWidth600、devicePixelRatio4；三主题 × 三容器，共9组查询与清空/焦点/边界通过。并非每个容器都能在600 CSS px视口保持声明宽度，max-width按可用空间约束。
- PASS：Chromium CDP `Input.imeSetComposition` 与 `Input.insertText` 真实引擎输入路径，组合时不查询，提交“中文”后查询；定向测试另覆盖防抖、过期响应取消、禁用/卸载清理。
- PASS（用户人工验收）：2026-10-27用户在最终本地展台实际使用系统中文输入法，确认选词期间不搜索、提交“中文”后出现结果、Escape清空且输入框保持焦点。此证据来自用户明确回复，区别于CDP引擎测试。
- FAIL（保留）：首轮脚本误将Toolbar strong当heading，等待30秒超时；修正搜索框定位后18组PASS。一次隔离context不能打开Chrome设置页，改用独立持久profile后原生缩放PASS；未触碰其他会话浏览器。
- N/A：npm发布、真实服务和消费产品迁移。本候选不进入已冻结0.11.0制品；发布回合已结束，源码合并限制解除；npm登录不再阻塞本issue。

后续对齐主线：在`791cf2c`重跑291项检查和18组生产矩阵PASS；在#45合并后再次合入最新main，待最终CI回读。系统输入法补证尝试：独立macOS Chrome148中通过CUA按键只能取得拉丁输入，未出现中文候选窗；输入菜单agent读取超时，未将这些尝试记为IME通过。后由用户在`be164aed16588b19ba20803d3d8459e7980f777a`构建的展台补齐真实系统输入法三项，全部PASS。

最终集成候选`be164aed`基于main`2c2edaa`（含#43/#45），全量检查通过；本文后续提交仅更新人工证据，不改运行源码。浏览器构建制品对应该候选，数据全为合成。
