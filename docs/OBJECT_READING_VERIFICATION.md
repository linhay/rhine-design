# 对象阅读组合验收（#61）

采集日期：2026-10-28，Asia/Shanghai。仅合成文件、笔记、目标与对话。

- 实现源码：`3783ec0c543d9f1ff9f06242fb92c9bc58a6994e`；后续验收文档提交不改变运行实现。
- 固定本地包 SHA-256：`d6bc4909a5d95d91540bae9a09f037586b54b63a0ab68d3fe545fab82a8c1bc4`。包字段为 0.11.1，**不是 registry 0.11.1，未发布 npm**。
- 环境：macOS、Node 24.21.0、Vite 8.3.4、React 19.3.1、Chromium 155.0.8059.85、Playwright CLI 0.1.22。
- 生产展台 `#object-reading` 与独立 fixture；合成消费者仅改导入为包公开主入口和 `/theme`，另后置导入公开 `/styles.css`。安装目录 310 个文件逐项与 tarball 一致，未修改 node_modules。

| 验证 | 结果 | 证明范围 |
| --- | --- | --- |
| Node 24 `npm run check` | PASS | 44 文件、346 项测试，类型、展台生产 build、两个 review build、CSS/SVG 和包入口检查；新增对象阅读测试 11 项 |
| 展台阅读闭环 | PASS | 三主题 × 400/520/880 × 100/200% CSS zoom，共18组；单居中 Dialog、唯一关闭、长标题/路径/正文、末段及关闭可达、Enter/Tab/ShiftTab/Escape、目标/对话交接与返回 |
| 阅读位置与上下文 | PASS | 每组实际记录并比较 scrollTop，查询/类型/目录/对象/页签保留；末尾切页签聚焦可见“关联”页签，返回列表聚焦原入口 |
| 展台状态 | PASS | 每组空目录、无结果及7类加载/异常，共162个状态；受限正文不渲染，不可用来源/关联无绕过链接，错误可重试；阅读不修改合成版本与收件状态 |
| 减少动态 | PASS | 每主题分别系统 reduce 与系统 no-preference + 手动 reduced，共6组；Dialog/Skeleton 均0s，关闭和焦点行为保留 |
| 工作空间入口边界 | PASS | 同18组合检查页面和两条阅读入口无水平溢出；检查长文截图；场景指南的阅读链接可进入真实展台 |
| 固定包公开 API 消费 | PASS | 全新安装/生产 build，同18组闭环 +162状态 +6减少动态复验通过；源码目录成功未代替此项 |
| 原生网页缩放、屏幕阅读器、Firefox/WebKit | SKIPPED | 本次为 Chromium 与明确要求的 CSS zoom；不外推其他浏览器或辅助技术 |
| 真实文件/模型/权限/已读服务、iOS、消费产品升级 | N/A | 本任务只做通用合成组合 |
| npm 发布 | N/A | 未授权且非本 issue 完成前置；只完成源码 |

已整合 #18 / PR #62 的主线提交 `539bdce203b61b4310e4aaa132d4f025c1cfaa55`，上述整套展台与固定包矩阵均在整合后重跑。普通 Dialog 仍整体滚动，本组合未调用其有界 height/footer。早期独立候选 `eb8917f` 的335项检查与旧制品证据单独保留，不替代此整合结果。

CodeRabbit 与 Copilot 自动审阅均因配额不足未执行（SKIPPED），其状态不表示已审阅代码；已检查实际讨论、逐文件自审和最新 head 的 CI，未发现未处理的代码意见。

## 失败与修正

- 首轮新增代码/测试使用了不支持的类型选项，类型检查 FAIL；改用真实 Button API 与 Testing Library 选项后通过。首次浏览器启动早于生产构建完成返回404，属于准备失败，未计为通过。
- 复核发现正文末尾“查看关联”隐藏自身后焦点仍留在 hidden panel。旧断言只检查 Dialog 包含焦点，会漏报。已修正组合焦点交接并新增可见页签断言；上述最终源码和固定制品已完整复验，旧结果不能代替修正后证据。
- 隔离消费服务首次端口被占用，启动 FAIL，错误端口试验已中止；改用系统分配端口后确认实际合成页面再运行。没有停止或修改占用端口的服务。消费者缺少 favicon 的404不影响组件资源加载，单独保留。
- 构建仍有既有 bundle 大小提示；本次不借阅读组合扩大为全库分包工作。

## 复现

使用 Node 24 安装并执行 `npm run check`，将 `dist` 放到独立 loopback 静态服务，先确认端口与页面确属本任务。打开 `/?fixture=object-reading&theme=rhine` 后，在独立 Playwright CLI 会话依次执行：

```sh
playwright-cli -s=reading run-code --filename scripts/check-object-reading-browser.js
playwright-cli -s=reading run-code --filename scripts/check-object-reading-states.js
```

再对 arknights、neo-brutalism 重复。脚本返回逐组 PASS，任何抛错或缺少 Result 均不是通过；截图在 `output/playwright/`。原始日志、前轮失败、截图、制品与恢复包保留在本地证据目录，公开摘要仅保留合成结论和精确身份。
