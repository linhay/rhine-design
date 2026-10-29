# 参与 Rhine Design

欢迎通过 Issue 或 Pull Request 改进组件、设计规范、文档和示例。

## 消费反馈与设计共建

消费项目在设计讨论、用户纠正、实现和验收中发现的新结论，都可以反馈：规范建议、个人偏好、交互细节、成功实践和验证发现不限于组件缺陷。产品页面、业务契约与原始资料留在消费项目；本库吸收可复用的 Web 规范与能力，不将 Web 结论自动转换为 iOS 要求。

### 从反馈到消费验证

1. **先核对、再查重**：检查实际安装版本或固定制品及其公开能力，未核对写“未知”，不拿 main 展台当作已发布 API。检索 [open/closed issues](https://github.com/linhay/rhine-design/issues?q=is%3Aissue)，同时查阅现有规范、配方和 PR。同类主题在原 issue 补充新增场景、证据或取代决定；无新增信息不重复发帖，不因原 issue 已关闭就另建同题。确无对应议题时再新建。
2. **说明依据与边界**：逐项区分个人偏好、产品约束、通用建议和已验证事实；一个反馈可包含多类，但不能用局部偏好证明全局标准。写明匿名合成场景、设计意图、适用任务与平台、当前与期望行为，以及需保留的视觉和动效。成功实践可记录有效的组合与适用条件，不必虚构故障或缺失组件。
3. **评估适用范围**：维护者对照已有契约，记录接纳、待验证或不采纳为通用默认的理由。能以现有能力表达时优先补规范、组合配方和示例；确有公共能力缺口再评估现有组件参数或新增组件。局部偏好即使不成为默认，也记录可用的替代组合、适用范围和待验证项；取代旧决定时链接原条目并说明变化。
4. **落实并回链**：在原 issue 关联实际受影响的规范、参数契约、组合配方、真实展台、回归验证与 PR，只补相关项。按下方 [P0 验证入口](#p0-验证入口)选择证据；纯文档检查内容和链接即可。布局与密度、文字层级、容器响应式、加载/空/错误、键盘与焦点、动效保留、减少动态及资源清理，按本次变化选取，不把清单变成每次全量验收。
5. **核对发行与消费**：实现合入后关联 [版本记录](CHANGELOG.md)及对应的发行证据（见[发布流程](docs/RELEASING.md)），核对正式版本或固定候选制品的实际能力。消费端保留 issue 关联，在后续相关任务或获授权的版本升级时固定依赖并验证真实入口，补充结果或剩余缺口。任务内主动反馈即可，不要求后台轮询、自动化或额外通知设施。

公开正文、评论、截图、日志和附件均使用合成例子；不附内部文档、真实业务数据、内部地址、凭据、本机路径或可识别用户的信息。验证记录注明源码/制品、环境、场景与证据边界，区分 PASS、FAIL、SKIPPED、N/A；未知与待验证不能写成通过。公开脱敏摘要，消费项目保留原始资料。

### 简短反馈模板

可用于新 issue 或已有 issue 的增量评论；已有内容只引用链接，不重复整份模板。组件名和最小复现仅在相关时填写。

```text
主题：规范 / 偏好 / 细节 / 成功实践 / 验证发现（可多选）
查重：已有 issue、规范/配方或 PR；本次新增什么、取代哪条决定
场景与意图：匿名合成例子；任务、平台、适用范围；需保留的视觉/动效
依据：个人偏好 / 产品约束 / 通用建议 / 已验证事实（逐项标注）
消费基线：实际版本、源码或制品标识；未核对写“未知”
当前 → 期望：行为或有效组合、理由；相关组件/复现（如适用）
证据与缺口：环境、场景、PASS/FAIL/SKIPPED/N/A；证据链接或待验证事项
处理结论：待评估/接纳/不作为通用默认；理由、适用范围或替代组合
落点：规范、参数/配方、展台、回归、PR、版本链接（按实际补充）
进度：已反馈 / 已接纳 / 已实现 / 已发布 / 已消费验证分别注明证据或未完成
```

### 进度分别记录

| 状态 | 可以确认什么 |
| --- | --- |
| 已反馈 | 新增信息已进入对应 issue；不代表已接纳 |
| 已接纳 | 已明确适用范围和处理决定；不代表已实现 |
| 已实现 | 对应文档或代码已合入，关联 PR/修订和相关验证；不代表已发布 |
| 已发布 | 对应能力已在明确的正式版本/制品中回读确认；源码候选和 main 展台不算 npm 发布 |
| 已消费验证 | 消费端已核对实际固定版本/制品及真实入口，记录环境、结果和缺口；不代表所有消费者已升级 |

状态按事实更新，不自动逐级勾选。仅文档或不采纳通用默认的结论，可将不适用的发行/消费项标为 N/A 并说明原因；固定候选的消费验证可先完成，但其正式发布仍未完成。关闭 issue 不表示消费端已升级，也不自动授权发布或消费升级。

已有主题继续原处讨论：[操作区收纳 #96](https://github.com/linhay/rhine-design/issues/96)、[列表筛选层级 #19](https://github.com/linhay/rhine-design/issues/19)、[对象阅读偏好 #61](https://github.com/linhay/rhine-design/issues/61)、[设置密度与确认信息 #89](https://github.com/linhay/rhine-design/issues/89)。这里定义反馈方式，不重复它们的实现需求；流程背景见 [#100](https://github.com/linhay/rhine-design/issues/100)。

## 本地开发

使用 Node 24 与 npm：

```sh
git clone https://github.com/linhay/rhine-design.git
cd rhine-design
npm ci
npm run dev
```

展台地址为 `http://127.0.0.1:18309/`。`components/` 是组件源码与契约，`preview/` 使用同一组件演示交互，`tests/` 验证组件行为，`skills/rhine-design/` 提供 AI 助手的检索入口。

## 修改组件

优先组合已有组件和 tokens。新增能力时，同步更新组件契约与展台示例，展示相关的默认、禁用、加载、错误和长文本状态。使用语义化 HTML，保证键盘操作和焦点行为，并提供减少动态效果。

运行检查：

```sh
npm run check
```

它包含测试、类型检查、展台构建和 CSS/SVG 产物检查，并构建两个独立产品评审示例。产品评审入口、模拟生命周期与浏览器脚本见 [评审工具](docs/REVIEW_TOOL.md) 和 [验收记录](docs/REVIEW_VERIFICATION.md)。视觉变化还需检查 400/520/880 宽度、200% 缩放和相关交互。纯文档修改检查链接与示例即可。

`dist/` 是展台构建结果；包导出源码。修改打包配置时，请在仓库外安装实际 tarball 验证。不要删除入口和 CSS 的 `sideEffects`；Logo 依赖 SVG `?no-inline`。本地链接消费项目时，Vite 使用 `resolve.dedupe: ['react', 'react-dom']` 避免重复 React。

## P0 验证入口

先按[通用设计规范](docs/DESIGN_SYSTEM.md)确认操作、阅读或品牌任务及必须保留的事实/动作。先验功能和恢复，再验视觉与连续性；只选改动相关项，不要求每次运行所有矩阵。系统字体、主题、状态边框、浮层阴影及已选动画继续遵守原契约，不引入外部 Skill 的全量规则。

| 涉及变化 | 原有入口与补充条件 |
| --- | --- |
| 浮层/关闭/动态偏好 | `scripts/check-settings-interactions.js`：关闭前后正反向 Tab 排除隐藏内容，嵌套 Escape/归焦；正常、系统/手动减少动态均完成失败保留输入与成功保存，结果及祖先非隐藏/非透明且结果有非零尺寸（不代表已验证裁剪或遮挡），不能只检查时长为零 |
| Tabs | `tests/TabsLayout.test.tsx` 与 `scripts/check-tabs-layout.js`：禁用项、关系与受控状态；切离含输入面板后实际走 Tab/Shift+Tab，再返回核对草稿，不能只数 hidden/ARIA |
| 表单/错误 | `tests/Patterns.test.tsx`、`tests/SettingsDialog.test.tsx` 和设置交互脚本：失败保留输入，摘要只随失败提交定位、链接回字段不变路由；选择/关闭不等于保存 |
| 有界布局/操作区 | `scripts/check-settings-bounded.js`：真实内框、长导航/操作、末项滚动可达、按钮完整和命中范围；保留 398px iframe 内宽及 CSS zoom 的独立标识 |
| 紧凑数值/长文 | `scripts/check-compact-layouts.js`：正常/零/未知/长文；关键数值的行片段不被 hidden/clip 祖先截断，滚动内容另验滚到后可达；document.scrollWidth 不溢出不能替代 |
| 反馈可读/纠错闭环 | `scripts/check-p0-feedback.js`：三主题、正常/系统/手动减少动态，400×648 下设置失败/成功路径及 CSS zoom 1/2 的逐行滚动、裁剪祖先与遮挡采样；另测 200% 下 ErrorSummary 定位、回字段、保留输入和修正后结果 |
| 交互中断/迟到结果 | `scripts/check-p0-interruptions.js`：三主题、三动态模式，入场中 Escape、保存中关闭重开与新草稿、快速 Home/End、重播/复位/实际路由卸载；观察真实 500/700ms 计时器取消和过期回调，保留过程采样 |

例如，从所选源码仓根目录，用其 engines 支持的 Node 执行：

```sh
npm test -- tests/SettingsDialog.test.tsx tests/TabsLayout.test.tsx tests/Patterns.test.tsx tests/MotionGallery.test.tsx
npm run build
npx vite preview --host 127.0.0.1 --port 18497 --strictPort
```

在另一个终端、同一源码目录，使用已有 Playwright CLI 打开此生产预览后按相关范围运行：

```sh
mkdir -p output/playwright/issues-23-25 output/playwright/p0-feedback
playwright-cli -s=p0-validation open http://127.0.0.1:18497/
playwright-cli -s=p0-validation run-code --filename scripts/check-settings-interactions.js
playwright-cli -s=p0-validation run-code --filename scripts/check-tabs-layout.js
playwright-cli -s=p0-validation run-code --filename scripts/check-settings-bounded.js
playwright-cli -s=p0-validation run-code --filename scripts/check-compact-layouts.js
playwright-cli -s=p0-validation run-code --filename scripts/check-p0-feedback.js
playwright-cli -s=p0-validation run-code --filename scripts/check-p0-interruptions.js
playwright-cli -s=p0-validation close
```

也可用环境已有的 CLI wrapper；不把 Playwright 或外部检测器新增为运行时依赖。脚本返回结构化结果，必须检查 `pass`、失败列表与页面错误，不能只看 shell 退出码。保存本轮脚本/源码差异与构建摘要、浏览器版本和原始失败；测试结束关闭自己启动的预览服务。

两个 P0 补充脚本在同一生产预览上提供浏览器内反例。打开带 `?p0Probe=clip` 或 `?p0Probe=cover` 的 URL 后运行 `check-p0-feedback.js`；带 `?p0Probe=lost-draft`、`inactive-focus` 或 `stale-timer` 后运行 `check-p0-interruptions.js`。正常运行应 `pass:true`；反例应 `pass:false`，且分别命中长反馈裁剪/遮挡、新草稿丢失、非活动面板焦点、旧完成/复位/卸载取消失败。异常、超时或未实际进入中断时间窗不算反例检出成功。保存完整 JSON、初始失败与最终脚本摘要，不能只保存最终绿灯。

可读性检查先等待有限入场，再逐行滚动可滚动祖先及主滚动区；每行检查裁剪边界和三处命中采样；不透明纯色的 `pointer-events:none` 表面在同步测量期间临时参与命中，并立即恢复原样。它覆盖这些固定场景，不证明所有像素、半透明/图片/伪元素遮罩、其他浏览器或读屏。长提示由真实 Notice DOM 中的合成文字扩展而来；保存结果为展台定时器，不代表真实服务。中断检查使用真实时间和 React 生命周期；计时器观察记录也属于证据。设置宿主允许保存中关闭，迟到结果不得覆盖重开后的编辑，不通过禁止关闭来改变原契约。

新增断言用正常场景与有针对性的破坏对照证明能抓到目标问题。反例只在隔离测试页面或临时浏览器状态中注入，不改正式组件来迎合检查。`npm run check` 包含 JSDOM、类型与构建，不自动运行上述真实浏览器矩阵；CSS zoom 不等于浏览器原生缩放。完整库变更仍按原流程运行 `npm run check`，制品发布/消费仍需固定 tarball 独立验收。

## 文档与 AI skill

README 面向首次接触项目的开发者，优先解释用途、安装、示例、兼容性和文档入口。维护者操作放在专门文档中。

组件 API 变更时，更新契约、示例以及 skill 的 `references/API_MAP.md` 或 `TASK_MAP.md`。索引指向真实源码，不复制第二份 API 定义；skill 的版本信息随包版本更新。

skill 会被单独复制安装，Markdown 相对链接必须留在 `skills/rhine-design/` 内。包根路径使用代码格式；在线契约链接固定提交或版本，并说明与已安装包的关系。运行 `npm test -- tests/SkillInstallation.test.tsx`，在仓库外的临时空目录验证 README 复制安装与独立 skill 安装，检查内部文件/标题链接、越界路径及浮动源码链接。此检查不发网络请求，新增在线快照仍需核对对应远端文件可访问。

展台包版本由 `preview/packageInfo.ts` 从 `package.json` 读取；组件数量只统计 `components/index.ts` 的公开组件，不计类型与独立主题入口。新增导出时同步该数量、README 完整清单与组件入口。发布后的源码新增能力写入 CHANGELOG 的“未发布”部分，并在相关契约标明旧包不包含；不要因为源码仍使用同一版本字段，就将新能力归入已发布版本。历史版本介绍与验收记录保留原时点。

## 提交 Pull Request

说明解决的问题、变更后的行为，以及已执行的验证。涉及视觉或动效时附上截图或录屏；涉及破坏性 API 变更时提供迁移说明并更新 [CHANGELOG](CHANGELOG.md)。

问题与设计反馈使用上方[反馈模板](#简短反馈模板)；组件缺陷补充相关组件名和最小复现，偏好与成功实践说明依据和范围即可。

维护者发布步骤见 [RELEASING](docs/RELEASING.md)。项目采用 [Apache-2.0](LICENSE) 许可证。

## 在线展台

[GitHub Pages](https://linhay.github.io/rhine-design/) 展示 `main` 的组件与演示。现有 CI 先执行 `npm run check`，成功后只上传 `dist/` 并部署；Pull Request 运行检查，不发布站点。工作流也支持在 `main` 手动重跑。

Vite 使用相对资源路径，兼容 `/rhine-design/` 子路径。调整构建或静态资源时，检查在线页面、CSS、JS 和 Logo SVG 均能正常加载，以及 `#motion`、`#startup` 直接访问和重播。
