# 参与 Rhine Design

欢迎通过 Issue 或 Pull Request 改进组件、设计规范、文档和示例。

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

例如，从所选源码仓根目录，用其 engines 支持的 Node 执行：

```sh
npm test -- tests/SettingsDialog.test.tsx tests/TabsLayout.test.tsx tests/Patterns.test.tsx tests/MotionGallery.test.tsx
npm run build
npx vite preview --host 127.0.0.1 --port 18497 --strictPort
```

在另一个终端、同一源码目录，使用已有 Playwright CLI 打开此生产预览后按相关范围运行：

```sh
mkdir -p output/playwright/issues-23-25
playwright-cli -s=p0-validation open http://127.0.0.1:18497/
playwright-cli -s=p0-validation run-code --filename scripts/check-settings-interactions.js
playwright-cli -s=p0-validation run-code --filename scripts/check-tabs-layout.js
playwright-cli -s=p0-validation run-code --filename scripts/check-settings-bounded.js
playwright-cli -s=p0-validation run-code --filename scripts/check-compact-layouts.js
playwright-cli -s=p0-validation close
```

也可用环境已有的 CLI wrapper；不把 Playwright 或外部检测器新增为运行时依赖。脚本返回结构化结果，必须检查 `pass`、失败列表与页面错误，不能只看 shell 退出码。保存本轮脚本/源码差异与构建摘要、浏览器版本和原始失败；测试结束关闭自己启动的预览服务。

新增断言用正常场景与有针对性的破坏对照证明能抓到目标问题。反例只在隔离测试页面或临时浏览器状态中注入，不改正式组件来迎合检查。`npm run check` 包含 JSDOM、类型与构建，不自动运行上述真实浏览器矩阵；CSS zoom 不等于浏览器原生缩放。完整库变更仍按原流程运行 `npm run check`，制品发布/消费仍需固定 tarball 独立验收。

## 文档与 AI skill

README 面向首次接触项目的开发者，优先解释用途、安装、示例、兼容性和文档入口。维护者操作放在专门文档中。

组件 API 变更时，更新契约、示例以及 skill 的 `references/API_MAP.md` 或 `TASK_MAP.md`。索引指向真实源码，不复制第二份 API 定义；skill 的版本信息随包版本更新。

skill 会被单独复制安装，Markdown 相对链接必须留在 `skills/rhine-design/` 内。包根路径使用代码格式；在线契约链接固定提交或版本，并说明与已安装包的关系。运行 `npm test -- tests/SkillInstallation.test.tsx`，在仓库外的临时空目录验证 README 复制安装与独立 skill 安装，检查内部文件/标题链接、越界路径及浮动源码链接。此检查不发网络请求，新增在线快照仍需核对对应远端文件可访问。

展台包版本由 `preview/packageInfo.ts` 从 `package.json` 读取；组件数量只统计 `components/index.ts` 的公开组件，不计类型与独立主题入口。新增导出时同步该数量、README 完整清单与组件入口。发布后的源码新增能力写入 CHANGELOG 的“未发布”部分，并在相关契约标明旧包不包含；不要因为源码仍使用同一版本字段，就将新能力归入已发布版本。历史版本介绍与验收记录保留原时点。

## 提交 Pull Request

说明解决的问题、变更后的行为，以及已执行的验证。涉及视觉或动效时附上截图或录屏；涉及破坏性 API 变更时提供迁移说明并更新 [CHANGELOG](CHANGELOG.md)。

问题反馈请提供包版本、组件名、预期与实际行为、最小复现。删除复现中的私人数据和凭据。

维护者发布步骤见 [RELEASING](docs/RELEASING.md)。项目采用 [Apache-2.0](LICENSE) 许可证。

## 在线展台

[GitHub Pages](https://linhay.github.io/rhine-design/) 展示 `main` 的组件与演示。现有 CI 先执行 `npm run check`，成功后只上传 `dist/` 并部署；Pull Request 运行检查，不发布站点。工作流也支持在 `main` 手动重跑。

Vite 使用相对资源路径，兼容 `/rhine-design/` 子路径。调整构建或静态资源时，检查在线页面、CSS、JS 和 Logo SVG 均能正常加载，以及 `#motion`、`#startup` 直接访问和重播。
