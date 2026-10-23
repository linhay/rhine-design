# OrbitBackdrop · 轨道背景（未发布）

`OrbitBackdrop` 将授权移交的轨道动画作为通用装饰组件维护：固定深色星空衬底、420 个环节点、185 条曲线、80 个深度桶，以及发射箭头、光晕和透视关系。它适合登录、欢迎等入口区域；不包含产品文案、账号逻辑或网络请求。需求与移交记录见 [Issue #8](https://github.com/linhay/rhine-design/issues/8)。

**版本边界：**这是未发布的源码候选，npm `@linhey/rhine-design@0.4.0` 不包含此组件。采用前核对安装版本与 `components/index.ts`；使用未发布源码时固定 Git commit 并提交 lockfile。组件源于 [OrbitBackdrop.tsx](../components/OrbitBackdrop.tsx)，绘制实现在 [orbitRenderer.ts](../components/orbitRenderer.ts)；后者是内部实现，不作为公共 API 导入。

## 使用与契约

```tsx
import { Logo, OrbitBackdrop, Text } from '@linhey/rhine-design';

// 此示例要求包含 OrbitBackdrop 的源码版本，并放在现有主题根内。
export function WelcomeArtwork() {
  return (
    <OrbitBackdrop className="welcome-artwork" style={{ minHeight: 360 }}>
      <Logo theme="dark" decorative />
      <Text as="h1" variant="title">开始新的工作</Text>
      <Text>从这里进入你的工作空间。</Text>
    </OrbitBackdrop>
  );
}
```

| 输入 | 契约 |
| --- | --- |
| `HTMLAttributes<HTMLDivElement>` | 接收容器原生属性，如 `className`、`style`、`id`；宿主负责尺寸、位置和相邻内容布局 |
| `reducedMotion?: boolean` | `true` 加强减少动态偏好；`false` 或省略均不能覆盖系统、祖先或环境的停帧条件 |
| `children` | 放入 `.rhine-orbit-content` 内容层，可组合 Logo、标题、正文和页脚；宿主 class 控制内容布局，避免遮挡主要艺术或暂停控件 |

组件持有绘制配方、内部类名、样式与暂停状态。宿主不复制 Canvas 实现，不另写同用途动画，不通过覆盖内部样式重建其视觉。没有速度、节点数量、业务进度或主题配色参数；需要新能力时先在设计系统中补契约与展台。

Canvas 绝对定位在内容层下方。内容层继承组件提供的局部浅色 tokens，使文字与深色星空衬底保持可读；不新建或嵌套 `ThemeProvider`。默认内置 Rhine `Button`，在独立控件区域提供“暂停 / 继续”的明确操作。Canvas 为 `aria-hidden` 纯装饰，不接收键盘焦点，不提供进度或业务状态。有效信息仍由普通 HTML 内容表达；动画暂停、减少动态或 Canvas 不可用均不影响内容与业务操作。

## 动效生命周期

下列任一条件成立时停止逐帧调度，保留静态画面：

- 用户主动暂停；
- 系统 `prefers-reduced-motion: reduce`，或 `reducedMotion` 为 `true`；
- 祖先的 `data-rhine-motion="reduced"` 偏好生效（内层跟随系统不覆盖外层减少动态）；
- 当前窗口宽度不超过 760px；
- `document.hidden`、组件离屏或可用绘制尺寸为零。

“继续”只解除用户主动暂停，不越过其他停帧条件。恢复时沿冻结的动画时间继续，不累计隐藏期间的时间，也不追赶错过的帧。偏好或可见性改变时即时重新判断；窗口调整会以当前冻结时间重绘静态画面。设备像素比上限为 2，卸载清理 rAF、监听器和 observers，离开页面不会继续后台绘制。

Canvas 不可用时保留静态艺术 fallback 与 `children`。此降级不表示浏览器或页面业务失败，也不以加载提示掩盖缺失的装饰能力。

## 主题与可读性

轨道采用同一固定深色美术配方；切换 Rhine、Arknights 或 Neo Brutalism 时保留动画构图。内容层使用局部浅色 tokens，独立操作区与外框使用外部主题 tokens，保持控件文字、边界和焦点可读，不用改变艺术本身的颜色来模拟整页主题。宿主应提供足够的布局空间，避免正文与主要曲线重叠，也不能遮住暂停入口。

轨道动画不替代 `Progress`、`Skeleton` 或 `Logo`。登录提交、校验失败、数据刷新不重播动画；动画时间不决定业务何时就绪。仅为重播装饰而更换 key 时，将 key 限于 `OrbitBackdrop`，不能重建表单或其他业务内容。

## 真实组件展台与验收

本地展台 `http://127.0.0.1:18309/#orbit` 复用公开组件，提供暂停 / 继续、局部重播、手动减少动态，以及系统和全局偏好继承。重播只重新挂载装饰组件，不重执行业务动作、不清空外层内容。此条目与 `/#motion` 的 12 组交互配方、`/#startup` 的启动编排分别维护。

验收应覆盖以下行为；本节是验收要求，不代表浏览器检查已执行：

1. 原动画的环节点、曲线、箭头、光晕与透视仍可辨识；采样不同时间的中间帧，不能只检查单张截图。
2. 鼠标与键盘可暂停 / 继续；暂停时画面冻结，恢复不跳过冻结期间的时间。
3. 系统、显式 prop、祖先偏好均可中断动画；将 `reducedMotion` 设为 `false` 不能覆盖系统减少动态。
4. 检查 400 / 520 / 880 宽度、200% 缩放和三套主题，确认窄窗静态呈现、控件可见、焦点可读且无横向溢出。
5. 页面隐藏、离屏、零尺寸时停帧，恢复及 resize 行为一致；卸载无残留调度或监听。
6. Canvas 不可用时仍显示静态艺术和内容；业务表单、请求与路由不依赖动画。

宿主接入后仍需验证自己的页面布局与业务交互；单元测试、展台检查不等于宿主原生平台或完整辅助技术验收。

### 2026-10-24 源码候选验证

`npm ci`、`npm run check` 通过：64 项测试（轨道新增 9 项）、TypeScript 类型检查、展台生产构建及 CSS / SVG 产物检查。轨道测试覆盖完整节点绘制、DPR 上限、暂停时间冻结、系统 / prop / 祖先偏好、隐藏 / 离屏 / 窄窗 / 零尺寸、resize、Strict Mode 清理、Canvas 失败降级和重播保焦点。

本地 Chromium 真实展台通过 19 项检查：跨时间像素采样可见轨道运动；Space 键暂停 / 继续；系统、显式及祖先减少动态与恢复；三主题 × 400 / 520 / 880 宽度的静态 / 播放和无横向溢出；200% CSS 缩放与局部重播。页面错误为 0。该记录为本地组件展台证据，页面隐藏和离屏此轮先由单元测试覆盖，不宣称已验证真实业务入口或原生平台。
