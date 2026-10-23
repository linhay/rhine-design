# 背景与应用外壳契约

对应 issue [#4](https://github.com/linhay/rhine-design/issues/4)。Background 与组合展台所需的 AppShell 已进入源码，npm 0.4.0 不包含这些能力；计划随下一发布窗口的 0.5.0 候选交付，最终版本以 registry 为准。发布前不要使用尚不存在的 npm 版本。

兼容范围：React 19 + Vite；其他构建器、SSR、原生 WebView 需消费项目另行验证。组件从主入口导出，ThemeProvider 从 theme 子入口导出。

## 背景层级

| 区域 | token / API | 规则 |
| --- | --- | --- |
| 应用画布 | `--rhine-canvas-bg`，`roleTone="canvas"` | 整体底色，允许主题纹理 |
| 正文区域 | `--rhine-content-bg`，`roleTone="content"`（默认） | 默认纯色；显式 `decoration="theme"` 可启用主题纹理 |
| 全局 / 上下文 / 辅助侧栏 | `--rhine-sidebar-bg`，`roleTone="sidebar"` | 不透明纯色，边界使用 `--rhine-line` |
| 卡片 / 表单 | `--rhine-surface-bg`，`roleTone="surface"` | 不透明阅读表面，默认无纹理 |
| 弹窗 / 浮层 | `--rhine-overlay-bg`，`roleTone="overlay"` | 默认无纹理，遮罩独立使用 `--rhine-backdrop-bg` |
| 图片 / 视频 | `--rhine-media-bg`，`roleTone="media"` | 中性深色底与配套浅色文字，默认无纹理 |

纸面默认无纹理；战术终端使用 32px 低对比网格；橙趣使用 14px 点阵。主题统一提供 `--rhine-background-texture`、`--rhine-background-scale`、`--rhine-background-mark`，无需消费者复制渐变。`decoration="auto"` 为默认值，仅 canvas 使用主题纹理，正文和 AppShell 默认纯色。`theme` 显式启用主题纹理，`none` 关闭本区域装饰，主题切换不会重新启用它。Background 另提供 surface/overlay/media 场景及局部 appearance 覆盖，完整六场景配置见[主题契约](THEMING.md#场景背景未发布)。

`decoration` 默认 `auto`，仅画布默认跟随主题纹理，AppShell 正文默认纯色。`appearance` 支持局部底色、文字色、纹理与尺寸覆盖，完整变量及优先级见[场景背景配置](THEMING.md#场景背景未发布)。展台 `#backgrounds` 仅展示当前主题，随右上角选择器同步切换。

```tsx
import { Background, Surface } from '@linhey/rhine-design';
import { ThemeProvider } from '@linhey/rhine-design/theme';

<ThemeProvider defaultTheme="neo-brutalism">
  {/* 用 Background 替换原本 background: var(--rhine-bg) 的正文 div。 */}
  <Background roleTone="content" decoration="theme">
    <Surface>不透明的内容卡片</Surface>
  </Background>
</ThemeProvider>
```

背景直接绘制在元素上，无伪元素、无点击拦截层、无 transform/contain/position 副作用。纹理从该区域左上角开始，`background-attachment: scroll` 固定在滚动容器的框上：滚动其内部内容时图案不重置、不跟随内容漂移；外层移动整个区域时背景随框移动。各独立区域拥有独立原点，不承诺跨两个元素接缝完全对齐。使用 CSS 默认背景裁剪；内容和焦点在背景上方，裁剪、滚动和 Portal 不受 Background 改变。背景无动画，也无需嵌套 ThemeProvider。

## 三种外壳布局

`AppShell` 接收 `layout="single" | "double-left" | "left-right"`；`navigation` 必填、`secondary` 在后两种布局可选。面板形状为 `{ label, content, open, onOpenChange }`；`header` 放当前任务操作、`children` 为正文，`decoration` 控制正文背景。

| 方案 | 用途 | 顺序 |
| --- | --- | --- |
| single | 简单管理或设置工具 | 全局导航 + 正文 |
| double-left | 目录、列表与编辑任务 | 全局导航 + 上下文目录 + 正文 |
| left-right | 检查器、对象属性与预览 | 全局导航 + 正文 + 辅助详情 |

全局栏宽 224px，次栏宽 256px，正文伸展，三栏同时展开时至少留约 638px 正文空间。判断依据是外壳容器宽度，适用于嵌入展台或桌面应用：小于 1120px 先将次栏转为 Drawer，小于 760px 再将全局栏转为 Drawer。抽屉初始关闭；桌面 `open` 偏好保留，回到宽窗后恢复。已经打开的 Drawer 在扩宽窗口时保持到用户关闭，避免中断操作；不会自动丢弃正文或选中项。

外壳需要父级提供明确高度（例如 `height: 100dvh`，展台用固定高度）。header 是不滚动的同级区域，body 填满余高；导航、次栏和正文各自 `overflow:auto`。宿主不应再给这些区域内的整页容器设置第二个垂直滚动。表格的局部横向/有限高度滚动是显式例外。没有拖拽宽度、持久化或停靠管理器。

```tsx
const [navigationOpen, setNavigationOpen] = useState(true);
const [detailsOpen, setDetailsOpen] = useState(true);
// currentId、draft 等业务状态放在 AppShell 的上层。
<div style={{ height: '100dvh' }}>
  <AppShell layout="left-right"
    navigation={{ label: '全局导航', open: navigationOpen,
      onOpenChange: setNavigationOpen, content: <SideNav {...navigationProps} /> }}
    secondary={{ label: '辅助详情', open: detailsOpen,
      onOpenChange: setDetailsOpen, content: <ObjectDetails value={object} /> }}
    header={<Button onClick={save}>保存</Button>}>
    <Editor value={draft} onChange={setDraft} />
  </AppShell>
</div>
```

SideNav 继续负责当前项、长名称和 aria-current；Drawer 继续负责 Tab、Escape 和触发器焦点归还。正文不因切换布局或主题重建。面板在抽屉与内联之间转换时可能重新挂载，因此选中、展开、输入和请求状态必须提升到宿主；不要在面板 render 时启动不可取消的副作用。主题切换不改变 React key。切换或隐藏面板时将位于其中的焦点送回对应操作按钮。

## 展台

- `/#backgrounds`：六类背景与局部覆盖，跟随右上角主题选择器。
- `/#app-shell`：独立正文背景、Surface、固定顶部操作、侧栏和 Dialog；可切换三主题与纯色模式。

发布时按 [发布流程](RELEASING.md) 完成固定版本安装和消费验证，再关闭 #4。
