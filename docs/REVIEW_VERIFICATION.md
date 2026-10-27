# 产品评审工具验收（2026-10-27）

对应 [#40](https://github.com/linhay/rhine-design/issues/40)，验收时为未提交、未发布候选；后续提交进展见关联 issue。验证基于 Web `cfcb400fa213d9905eae1cab5dcb8ab8f817e03f` 加本任务工作区变更。版本字段仍为 0.10.0，不等于 npm 0.10.0 已具有新入口。

## 证据范围

- 合成数据；源码构建/测试使用 Node 24.21.0。源码工作区使用 React 19.3.1、Vite 8.3.4、TypeScript 5.9.3。
- 安装包复验覆盖 React/ReactDOM 19.2.0 + Vite 6.4.5 + plugin-react 4.7.0，以及 React/ReactDOM 19.3.1 + Vite 8.3.4 + plugin-react 6.1.2。后续真实 App 隔离试接另覆盖 React 19.2.0 + Vite 6.4.3。仅声明这些实测组合；Vite 7、其他构建器、SSR 未测。
- Chromium 155 与 WebKit 26.6 完整回归；Firefox 157（Playwright/core 1.64.1，Debian 13 arm64 隔离容器，CLI Node 20.19.2）覆盖静态制品 25 组及故障恢复，未测 Firefox dev。Safari 27.0.1 原生窗口完成草稿/Portal 跨主题保持、保存、400px 画布与 200% CSS zoom smoke。WebKit 引擎结果不冒充 Safari 完整矩阵；CSS zoom 不代表原生浏览器缩放。
- 本地源码文件摘要、候选 tarball SHA-256、安装目录逐文件比对和原始日志保存在管理工作区的忽略证据目录。没有把候选当作正式版本发布。

## 已执行检查

| 项目 | 结果与范围 |
| --- | --- |
| 状态与生命周期 | PASS：URL 多维状态/非法回退，慢 setup 取消、早期资源清理、串行 dispose、reset、异常反馈 |
| HTTP 模拟 | PASS：Request method/body、credentials omit、调用方/场景 signal、未匹配失败、内存存储 reset |
| 构建边界 | PASS：静态 HTML 的真实 CSS 引用、非根 base、preview 目录入口、拒绝业务代理、生产目录精确匹配及官方 runtime 排除 |
| 全库检查 | PASS：287 测试、类型检查、原组件展台构建/CSS/SVG 检查、两个产品评审示例构建 |
| 真实浏览器 | PASS：Chromium、WebKit 分别执行开发/静态 HTTP 交互与 24 组（三主题 × 400/520/880/1280 宽 × 100%/200% CSS zoom），各 26 组，Firefox 另执行同一静态矩阵 25 组；草稿/Portal/DOM 焦点保留、表单保存、键盘关闭与焦点返回、长文、状态/角色、hash 刷新与前进后退 |
| 故障恢复与错误留存 | PASS：Chromium/WebKit/Firefox 注入首次画布请求失败、永不完成的 dispose；10 秒后可显式重建 iframe，评审条件保留且旧上下文不继续 setup；旧请求确认不覆盖新状态，错误跨就绪/主题/重载保留并标记原场景，显式确认才清除 |
| 动效生命周期 | PASS：平台 client 保存、Canvas 播放/暂停/恢复、系统/手动减少动态及系统恢复；切场景旧 Canvas 帧计数停止，慢初始化不覆盖新场景，渲染错误可见且可离开恢复 |
| 网络/导航 | PASS：上述浏览器运行无真实业务请求/外部出站；未实现请求、同源整页链接/下载路径和外链被阻止，当前文档 hash 可用 |
| 固定制品消费 | PASS：两套实际安装包分别构建 HTTP/平台两例；Vite 6 dev/preview 与 Vite 8 preview 中样式、主题切换保留、表单提交、平台保存及暂停通过，console/page error 为零 |
| 真实 App 隔离试接 | PASS：两类真实 App 的固定源码副本安装同一候选，256 个包文件逐一匹配；共 18 组三主题/三宽度渲染与唯一 Provider 检查，另测 Portal/草稿原位保留、模拟保存/reset、产品路由、200% CSS zoom、减少动态与显式重载。178 次请求全为本地静态资源，pageerror 为零；HTTP 产品 619 业务 + 17 设计测试，平台产品 18 项 App/预览测试与类型检查，两者正式/预览构建和生产排除检查通过。仅副本接入，原产品未改；真实产品跨浏览器矩阵未覆盖 |
| 发布与消费迁移 | SKIPPED：未获本轮发布/消费升级授权；没有 npm 发布、Pages 部署或真实产品代码迁移 |
| 原生运行 | N/A：工具为 Web 评审，不能证明桌面原生或 UIKit 行为 |

复验入口：`npm run check`；浏览器启动 HTTP dev（18340），以 Python 静态服务在 18342 提供 dist，再运行 `playwright-cli run-code --filename scripts/check-review.js` 与 `playwright-cli run-code --filename scripts/check-review-recovery.js`。用 CLI `open --browser=chrome` / `--browser=webkit` 选择独立会话。默认源码端口与脚本中的固定回归端口一致，避免误测其他页面。截图在 `output/playwright/review-*.png`（忽略目录）。

## 失败与修正保留

1. 早期开发子路径 404：中间件未正确处理 base，随后 HTML transform 又重复拼接 base。已修正为中间件识别 base、由 Vite 转换单一模块绝对路径。
2. 第一轮静态截图没有样式：生成 HTML 时 CSS 尚未加入 bundle。改为 post generateBundle 后链接最终 CSS，补构建断言、计算样式和实际截图审阅；原交互可运行不能证明视觉通过。
3. 开发模式出现一次 504 Outdated Optimize Dep，以及 CSS 模块引入 Vite client 的 CSP WebSocket 错误。调整独立优化缓存/扫描入口，并提供无连接的样式客户端。修正后浏览器 console error 为零；单次 504 的其他触发条件未穷尽。
4. 第一轮焦点返回采样有 4 项瞬时失败。改为有界等待真实 activeElement 恢复，第二轮通过；未修改 Dialog 行为，也不把瞬时观察写成已定位组件缺陷。
5. 首次 tarball/Vite 6 构建失败，Node 不支持 node_modules 中 TypeScript 插件自动剥离。Vite 入口改为 `.mjs` 运行文件和 `.d.mts` 声明，随后两套制品构建通过。
6. 最终浏览器回归曾在 reset 消息尚未处理时读取旧输入，出现两项采样失败。脚本改为先确认旧会话 DOM 卸载，再检查新输入；保留原结果，不用可见性冒充 reset 已完成。
7. 打包清单检查发现宽泛 examples 目录规则会收入嵌套 Vite 缓存。改为精确源码 glob，并加入包清单检查，最终制品排除 node_modules/缓存；所有早期包都仅留本地，未发布。
8. 首次 `vite preview` 访问目录 URL 404，显式 index.html 可用。将 appType 改为 mpa，补真实 preview HTTP 回归，不用源码 dev 成功代替产物 preview。

9. Firefox 156 在本机 headless 启动报 `Could not find profile folder`，独立 profile 重试仍失败，headed 显示 Profile Missing。与 [Playwright 上游 macOS 27 报告](https://github.com/microsoft/playwright/issues/42768) 的症状一致，尚未独立确认本机根因；未授予额外磁盘访问或更改隐私设置。Safari WebDriver 因远程自动化未启用而拒绝启动，改用原生 UI smoke，未更改该设置。
10. Linux 补验首次安装器与 CLI 的 Playwright core 版本不一致，下载了 Firefox 1555 构建但 CLI 查找 1553，浏览器未启动；统一 Playwright 与 core 到 1.64.1 后重跑，原启动失败保留。
11. 真实消费试接保留了合成时间类型错误、快照漏配导致 ENOENT、定位器/滚动/残留浮层导致的首次脚本失败；修正副本 fixture/必要配置及脚本后最终通过。既有测试警告和开发依赖扫描日志保留，不宣称所有日志为零。

12. Firefox 首轮矩阵有两项脚本失败：同步读取 frame URL 早于 hash 跳转，以及预期合成渲染异常的 console 文本仅为 `Error`。诊断确认 hash 随后完成，Error 参数的 message 为预期合成异常；脚本改为有界等待 hash，并读取实际 Error 参数，未泛化忽略所有 Error。修正后 Firefox 静态 25 组通过；Chromium/WebKit 用同版脚本复核。

## 合并前增量验证

2026-10-27 在 `9f010f7` 基础上核对现有 Pages 工作流，发现示例的绝对 `/review-http/`、`/review-platform/` 资源路径不适用于项目站点 `/rhine-design/`。示例改为构建时使用 `./` 相对资源，dev/preview 保留各自目录前缀；工具运行代码和场景协议未改。构建集成测试同时覆盖绝对嵌套 base 与相对 base，全库 `npm run check` 为 288 项测试及全部构建/包清单 PASS。

最终静态产物放在 `/rhine-design/review-http/`、`/rhine-design/review-platform/` 后，Chromium/WebKit 各 25 组矩阵 PASS：样式、动态模块、主题/Portal/草稿、表单、hash 刷新、动效和无业务出站。该增量验证不把此前固定 tarball 摘要改称新源码的包摘要；尚未重新发布 npm 制品。实际线上部署另以对应主线工作流和真实 URL 复验为准。

## 交付边界

评审接口和通用壳已有本地可运行候选，两个示例无需复制壳、URL 或工具栏。尚不能关闭 #40：固定版本发布、稳定在线部署与真实消费项目迁移仍需各自授权和证据。专用静态源、合成数据、host Provider 所有权、显式动效适配和异步关闭边界见[工具契约](REVIEW_TOOL.md)。

## Issue #66 增量：目录独立滚动（2026-10-28）

本节绑定 Web 隔离检出 `worktrees/web-issue-66` 的实际源码与 `dist/review-platform` 制品；数据为平台示例合成数据。CSS zoom 仍只表示 CSS 等效缩放，不代表浏览器原生缩放。

| 项目 | 结果与范围 |
| --- | --- |
| 外壳布局 | PASS：`review/review.css` 将头部与剩余视口分行，桌面目录与主区设置 `min-height: 0` 和独立 `overflow-y: auto`；目录搜索使用 sticky 定位；短目录不强制产生溢出。 |
| 窄屏目录 | PASS：真实 Chromium 155 与 WebKit 26.4 在 520/400px、900px 高度展开目录；目录有 `max-height: min(70vh, 520px)` 和自身滚动，主区保持独立滚动，Escape 关闭并恢复“场景目录”按钮焦点。 |
| 长目录与定位 | PASS：`scripts/check-review-scroll.js` 在真实平台评审展台运行时加入 36 条合成目录项，验证目录/主区 `scrollTop` 独立、搜索保持可见、当前场景滚动后可定位。 |
| 主题、宽度与缩放回归 | PASS：现有 `scripts/check-review.js` 在 Chromium 155 完成 26 组（开发/静态入口、三主题、400/520/880/1280 宽度、100%/200% CSS zoom），失败项 0；主题、长文、深链、过滤无结果、场景切换、Portal/焦点与无业务出站均通过。 |
| Node/npm 检查 | PASS：Node 24.21.0、npm 11.19.0；`npm run check` 完成 348 项测试、类型检查、主展台构建、两个评审构建与包清单检查。 |
| Firefox | SKIPPED：本增量未重跑 Firefox；既有验证记录保留 Firefox 157 静态矩阵及本机 Firefox 156 启动失败，不把 Chromium/WebKit 结果外推为 Firefox。 |
| iOS、消费迁移、发布 | N/A：本 issue 只改 Web 评审外壳；未修改 iOS、消费项目或 npm/Pages 发布状态。 |

证据脚本使用的浏览器 UA、请求和失败数组均来自本轮真实运行；脚本返回 `failures: []`。首次 Chromium 脚本等待了错误的顶层 heading，修正为 iframe heading 后重跑通过；该首次失败保留在本地命令输出，不以重试覆盖原因边界。
