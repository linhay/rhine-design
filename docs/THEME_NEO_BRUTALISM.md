# 橙趣 · 粗描边

可选主题，标识 `neo-brutalism`。从包含本文件的源码版本导入 `@linhey/rhine-design/theme-neo-brutalism.css`，置于组件样式之后，再给 `.rhine-theme` 添加 `data-rhine-theme="neo-brutalism"`。自 0.4.0 提供，npm 0.3.0 不包含此主题。

React 接入推荐使用 `@linhey/rhine-design/theme` 的 `<ThemeProvider defaultTheme="neo-brutalism">`，它自动加载样式并管理主题根；子组件可通过 `useTheme().setTheme()` 切换。详见[主题 API](THEMING.md)。展台专属布局装饰位于 `preview/theme-neo-brutalism.css`，不包含在公共主题入口中。

## 视觉规则

| 元素 | 规范 |
| --- | --- |
| 背景 | `#EAF0F4` 浅灰蓝，14px 间距细点阵；不穿入卡片 |
| 卡片 | `#FFFDF5` 米白，2px `#202323` 描边，22px 圆角，`5px 5px 0` 硬阴影 |
| 弹窗 | 同色同描边，24px 圆角，`8px 8px 0` 硬阴影；遮罩无模糊 |
| 按钮 | 主操作 `#FF8B3D` 橙底黑字，次操作白底黑框，12px 圆角，`3px 3px 0` 硬阴影 |
| 文字 | 深色系统无衬线，辅助 `#59616A`，标题加粗，指标 36/44px；金额等宽数字 |
| 类型标签 | 绿色 `#DCEBD7`、橙色 `#FCE0C4`、蓝紫色 `#E3E0F7`，均配黑字与类型名称 |
| 状态 | 成功仍为绿色，警告与失败保留独立语义色和文字，不以橙色主操作代替成功状态 |

主题变量均限定在主题根。既有 `--rhine-*` 尺寸、字体、语义色覆盖见 CSS；新增 `--rhine-hard-shadow`、`--rhine-tag-green`、`--rhine-tag-orange`、`--rhine-tag-violet` 可由宿主调整。

类型标签使用通用样式，不给 Badge 增加产品特定枚举：

```html
<span class="rhine-type-tag" data-color="green">GPT100</span>
<span class="rhine-type-tag" data-color="orange">GPT200</span>
<span class="rhine-type-tag" data-color="violet">Grok</span>
```

## 布局与交互

单页内容先展示数量、金额与状态，再以卡片和表格展开。主题 CSS 不强制业务布局；展台 `#subscriptions` 使用静态演示数据呈现此组合，类型、价格和文案由宿主定义，不代表实际产品报价。

详情卡片使用原生 button 作为 Dialog trigger；不将静态 Surface 或带 checkbox 的 SelectionCard 改成伪按钮。卡片内不再嵌套操作，次要管理命令放右上角 Menu。Dialog 保留关闭按钮、Escape、焦点限制与关闭后归还焦点；Portal 继承主题根。主题根不能使用 transform、contain 或裁剪。

按钮按下向右下移动 3px 并收起阴影，松开恢复；禁用与忙碌状态不响应按压。系统减少动态与 `data-rhine-motion="reduced"` 均禁用位移和过渡，反馈保留颜色与阴影变化。键盘焦点为明显黑色轮廓。

卡片按可用空间自动换列，说明自然换行。表格仅在自身区域横向滚动，不让整页超宽；弹窗内容随视口约束纵向滚动。桌面展台目录用于浏览组件，订阅示例自身保持单页，不增加业务路由。
