# 公共组件文字配对复核（#31）

2026-10-26。未发布源码修复，npm 0.9.1 尚不包含。范围为 `components/*.css` 中的字号声明及对应真实组件，重点检查组件从正文切换到 caption/heading 后是否仍依赖父级行高或浏览器默认字重；不全局重写 strong、p 或所有字体。

| 组件位置 | 本轮处理 |
| --- | --- |
| MediaViewer header 说明、操作标签 | caption 12/18/400，长说明自然换行 |
| EmptyState 标题 | heading 16/24，显式块级行框与自然换行 |
| MediaViewer header 标题 | section 18/26，显式主题标题字重 |
| MediaCard 加载/空/错误文案 | body 14/22/400，符号标记继续独立 |
| CopyButton 反馈、Steps 说明、Fieldset 提示 | caption 12/18/400 |
| ErrorSummary 标题 | heading 16/24 与主题标题字重 |
| ThemePicker 状态、ThemePreview 加载/失败文案 | caption 12/18/400，保留最小区域高度 |

标题字重使用 `--rhine-weight-heading`：莱茵与战术 600，橙趣主题已有覆盖为 750。这里保留主题语义，不强制全部主题变成 600。辅助说明使用 `--rhine-weight-regular`，避免宿主强调字重泄入。

## 保留与排除

- Text、Checkbox row、表格 caption、媒体卡片 caption、导航、筛选反馈等已有字号/行高配对，保持不变。
- Badge、Notice 说明、图表辅助说明的既有 12/20、表格普通文本的既有密度，以及主题表格/表单标签覆盖不机械统一。正文同层的分段控件与 Notice 标题没有切换到 caption/heading，不在本次跨层级修复中重设字重。
- Metric 单位属于指标与辅助字号的行内混排；整行由指标控制，不把整体压成 caption 高度。状态符号、编号、Logo 等图形/品牌表达不当作正文。
- 消费应用自己的标题与辅助文字组合不在设计库修复范围；不迁移业务页面、不发布 npm。

## 复现与回归

真实展台 `#component-typography` 使用纯合成内容，覆盖上述规则。复制动作使用异步空实现，不访问剪贴板；主题预览使用故意损坏的内嵌图片验证失败文案，不请求外部资源。

先运行 `npm run check`，然后在一个终端保持预览运行：

```sh
npx vite preview --host 127.0.0.1 --port 18531 --strictPort
```

另一终端执行：

```sh
playwright-cli -s=component-type open 'http://127.0.0.1:18531/#component-typography'
mkdir -p output/playwright/issue-31
playwright-cli -s=component-type run-code --filename=scripts/check-component-typography.js
```

回归直接断言计算字号、行高与字重，并改变宿主行高/字重确认局部配对；检查三主题、400/520/880px、100%/200% CSS zoom、长文、44px 操作区域、关闭与焦点归还。不将 CSS zoom 外推为原生菜单缩放或所有浏览器覆盖。

本轮结果：259 项组件测试、类型检查与生产构建通过；上述 18 组 Chromium 场景通过，无页面异常。另人工复核三主题在 400px、200% CSS zoom 下的空状态与媒体头部截图，长文和操作仍完整可读。
