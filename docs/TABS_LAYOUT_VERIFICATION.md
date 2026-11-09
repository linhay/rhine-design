# Tabs 满栏内容布局验收 · #76

日期：2026-10-28（Asia/Shanghai）。实现与接入见[页签规范](SUMMARY_TABS.md#满栏靠左76未发布)。该记录只覆盖本次源码候选；npm 0.11.3 不含 `fullWidth`，不表示原消费产品已迁移。

## 环境与复验入口

Node 24.21.0、React 19.3.1、Vite 8.3.4；Chromium 155、WebKit 26.6。全部内容为合成资料。以候选提交构建 `npm run check`，生产展台 `#summary-tabs` 上运行 `scripts/check-tabs-layout.js`。制品通过 `npm pack` 冻结，再用 `scripts/prepare-tabs-consumer.mjs` 在新目录安装；该消费者只从公开主入口和 `/theme` 导入，不修改 node_modules 或覆写 Tabs 样式。

源码提交、tarball SHA-256、包文件逐一比对、精确安装 lockfile 和浏览器结果随 PR 交付。候选包的 package.json 仍为源码版本0.11.3，身份必须同时用提交与摘要区分，不能用该数字将候选误认为 registry 正式包。预验包不作为最终交付包。

## 结果

| 项目 | 结果与范围 |
| --- | --- |
| 全量检查 | PASS：360项测试、类型、生产展台、两个评审示例构建和CSS/SVG/包入口检查 |
| 三布局真实展台 | PASS：Chromium、WebKit各18组（三主题×400/520/880视口×100/200%外层CSS zoom），简洁/长标签、禁用、方向键循环及Home/End、点击切换、受控联动、面板关联与草稿保留 |
| 几何断言 | PASS：满栏与面板宽差小于1px，首项起点偏移小于1px，简洁按钮保持固有内容宽度；fill仍等分；下划线宽度等于当前按钮，选中/非选中的transform状态正确 |
| 长摘要 | PASS：三主题400px视口/200% CSS zoom，满栏长摘要不溢出；禁用项可见且跳过，不能把“可达”解释成允许聚焦或激活禁用项 |
| 减少动态 | PASS：系统reduce与手动reduced分别启用，另一来源关闭；panel动画为none、指示线transition为0s |
| 固定制品合成消费 | PASS：新目录全新安装、公开入口构建、逐文件摘要一致及同一浏览器矩阵；原产品验收另列 |
| 原消费项目删除临时覆盖 | SKIPPED：由消费任务在受授权的维护候选上验证后执行；上游main含其他未发布变化，不能直接整体迁移 |
| iframe内缩放 | N/A：本组件展台及合成消费者无iframe；本轮设置documentElement CSS zoom，不能外推评审画布URL缩放或嵌套外壳 |
| 原生网页缩放、Firefox、读屏语音 | SKIPPED：本增量未测，不从CSS zoom、DOM语义或其他引擎推定通过 |
| npm发布 | N/A：本任务未发布新版本 |

本轮首轮及后续扩展的浏览器量测均保留；无组件断言失败。通过不取代对实际截图的检查：400px/200%长标签自然换行、下划线和正文保持左缘一致，无横向裁剪。原消费验收完成并移除临时覆盖前，issue #76保持OPEN。
