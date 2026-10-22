<p align="center">
  <img src="components/assets/logo.svg" width="96" height="96" alt="Rhine Design 三角构架标志" />
</p>

<h1 align="center">莱茵设计 · Rhine Design</h1>

<p align="center">暖白与苔绿，三角与细线。让界面拥有清晰的秩序与克制的节奏。</p>

<p align="center">
  <a href="#quick-start">快速接入</a> ·
  <a href="#components">组件</a> ·
  <a href="#documentation">设计规范</a> ·
  <a href="#ai-skills">AI Skills</a> ·
  <a href="CHANGELOG.md">版本记录</a>
</p>

Rhine Design 是 linhay 独立维护的通用设计系统。设计规范、React 组件、交互展台和 AI skill 同版本交付，供不同项目复用与持续迭代。

- **一致的视觉语言**：色彩、字体、文字层级、间距、几何与焦点规则。
- **40 个可组合组件**：覆盖布局、表单、数据、导航、浮层和反馈。
- **可验证的动效**：10 组播放 / 重播 / 复位演示，以及三角构架启动编排。
- **组件优先，设计先行**：先在样稿或真实组件展台验证，再接入产品页面。

GitHub 仓库：[`linhay/rhine-design`](https://github.com/linhay/rhine-design) · npm 包：[`@linhey/rhine-design`](https://www.npmjs.com/package/@linhey/rhine-design)。两者账号拼写不同，安装和导入使用 **linhey**。

<a id="quick-start"></a>
## 快速接入

适用于 **React 19 + Vite** 项目；本包导出 TS/TSX 源码，构建器需要支持 CSS 导入与 SVG `?no-inline` 引用。开发建议使用 Node 24。

```sh
npm install @linhey/rhine-design@0.2.0
```

```tsx
import { Button, Stack, Surface, Text } from '@linhey/rhine-design';

export function Welcome() {
  return (
    <div className="tod-theme">
      <Surface>
        <Stack gap={4}>
          <Text as="h1" variant="title">开始新的工作</Text>
          <Text tone="muted">用统一的组件，构建属于你的工作空间。</Text>
          <Button onClick={() => { /* 宿主动作 */ }}>继续</Button>
        </Stack>
      </Surface>
    </div>
  );
}
```

入口自动加载样式。`.tod-theme` 和 `--tod-*` 是保留的样式 API 命名空间；在页面根部包裹主题，不为主题根添加 `transform`、裁剪或 `contain`，以便浮层正确定位和继承变量。

组件负责呈现和交互；宿主负责数据、认证、搜索分页、请求取消及真实操作结果。只消费公开组件入口，不导入展台模拟状态。Logo 可通过 `wordmark` 和 `label` 配置品牌文字。

<a id="components"></a>
## 组件

| 类别 | 组件 |
| --- | --- |
| 品牌与文字 | Logo · Text |
| 操作 | Button · Icon · IconButton · Link · CopyButton |
| 布局 | Surface · Toolbar · Divider · Stack · Inline · Grid |
| 表单与选择 | TextField · Textarea · Select · Checkbox · RadioGroup · Switch · SearchField · Combobox · SelectionCard |
| 导航与展开 | Tabs · SegmentedControl · Disclosure |
| 数据 | Metric · KeyValue · DataTable · Pagination |
| 浮层 | Dialog · ConfirmDialog · Popover · Menu · Tooltip |
| 状态与反馈 | Badge · Notice · Toast · Progress · Skeleton · EmptyState |

具体参数与状态边界见[组件 API](components/README.md)和[常用组件契约](components/COMMON_COMPONENTS.md)。完整深色主题仍在规划中；当前 Logo 的深浅模式不代表全组件主题支持。

<a id="documentation"></a>
## 设计规范与展台

| 主题 | 文档 | 本地展台锚点 |
| --- | --- | --- |
| 视觉基础与组合原则 | [设计规范](docs/DESIGN_SYSTEM.md) | `/#foundation` |
| 字体、文字层级与数值 | [Typography](components/TYPOGRAPHY.md) | `/#typography` |
| 品牌几何与 Logo | [Logo 契约](components/README.md#品牌标志) | `/#brand` |
| 动效、交互与减少动态 | [Motion](components/MOTION.md) | `/#motion` |
| 启动动画与就绪衔接 | [Startup](components/STARTUP.md) | `/#startup` |
| 系统覆盖与演进方向 | [组件系统对照](docs/DESIGN_SYSTEM_AUDIT.md) | — |

展台使用同一份组件源码，提供键盘、长文本、加载、错误及减少动态示例。运行后访问 `http://127.0.0.1:18309/`；暂无独立线上展台。

```sh
git clone https://github.com/linhay/rhine-design.git
cd rhine-design
npm ci
npm run dev
```

<a id="ai-skills"></a>
## AI Skills

参考 SectionKit 的分层检索方式，提供可复制到项目的 [`rhine-design` skill](skills/rhine-design/SKILL.md)。支持读取 `SKILL.md` 的 agent；Codex 可通过 `$rhine-design` 显式调用。

```text
SKILL.md → TASK_MAP / API_MAP → 相关契约与源码 → 设计稿 / 展台 → 产品接入
```

| 文件 | 用途 |
| --- | --- |
| [SKILL.md](skills/rhine-design/SKILL.md) | 使用范围、设计先行流程、版本与源码定位 |
| [TASK_MAP.md](skills/rhine-design/references/TASK_MAP.md) | 按字体、表单、数据、浮层、动效等任务选择规范 |
| [API_MAP.md](skills/rhine-design/references/API_MAP.md) | 按组件名定位真实实现和公开入口 |
| [integration.md](skills/rhine-design/references/integration.md) | 主题、构建、数据所有权与迁移注意事项 |

在已安装 npm 包的项目中安装 skill：

```sh
mkdir -p .agents/skills
cp -R node_modules/@linhey/rhine-design/skills/rhine-design .agents/skills/
```

源码开发者也可从本仓根目录执行 `cp -R skills/rhine-design <项目>/.agents/skills/`。目标目录已有自定义内容时先比较再更新。skill 随包发版，升级组件后同步更新 skill；其 frontmatter 记录适用版本。规范和实现留在已安装的包或源码仓中，skill 按需定位，不维护另一份 API 副本。

示例请求：

> 使用 $rhine-design 设计设置页面，优先复用已有组件。先在设计稿中补齐加载、错误和键盘状态，验证后按本次授权接入应用。

skill 只指导当前任务，不自动发布包、修改其他项目或创建远端 Issue。反馈请提供组件名、版本、最小复现和相关规范路径。

## 独立开发与版本管理

```sh
npm run check
```

检查包含组件测试、类型检查、展台构建和 CSS / SVG 保留验证。视觉变化另验 400 / 520 / 880 宽度、200% 缩放、焦点和减少动态；包发布另验仓库外安装。`dist/` 是展台产物，不是组件包入口。

新增通用能力先更新规范、组件与展台，再迁移消费页面。版本与迁移记录见 [CHANGELOG](CHANGELOG.md)，维护者发布流程见 [RELEASING](docs/RELEASING.md)。消费项目固定版本、自行验收升级。

需要共同修改源码时可使用 Git 子模块，安装本地包；Vite 配置 `resolve.dedupe: ['react', 'react-dom']`，避免链接依赖引入第二份 React。保留入口与 CSS 的 `sideEffects`，确保主题不被裁剪。

GitHub 仓库已公开，可通过 HTTPS 读取和克隆，无需专用读取凭据；公开 npm 安装也无需 GitHub 凭据。当前许可为 `UNLICENSED`，使用授权由所有者提供，仓库可见性不改变许可。
