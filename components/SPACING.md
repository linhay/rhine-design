# 间距与组合

间距表达信息关系：同组紧、组间松、区域之间留白。颜色和边框不能代替分组。此规范适用于所有消费项目，真实示例见展台 `#spacing`。

## 尺度与用途

唯一尺寸来源是 [tokens.css](tokens.css)。`Stack / Inline / Grid` 的 `gap` 是 token 后缀，不是 px：`gap={4}` 表示16px。

| Token / gap | 尺寸 | 默认用途 |
| --- | --- | --- |
| `--rhine-space-1` / 1 | 4px | 标签与紧随其后的短提示、图标微间隔 |
| `--rhine-space-2` / 2 | 8px | 标题与说明、字段标签与控件、同组按钮 |
| `--rhine-space-3` / 3 | 12px | 同组信息行、密集工具栏项目 |
| `--rhine-space-4` / 4 | 16px | 内容与操作、表单字段、普通列表/网格项 |
| `--rhine-space-6` / 6 | 24px | Surface内边距、卡片之间、模块内部的独立信息组 |
| `--rhine-space-8` / 8 | 32px | 页面主要章节之间、宽屏页面边距 |
| `--rhine-space-12` / 12 | 48px | 独立大区域或品牌留白，不用于普通表单 |

0只表示无间隔，不新增token。1px边线、控件高度、焦点环偏移不属于间距尺度。宿主既有窄窗20px边距可作为明确记录的布局例外，不能变成随处使用的新gap。

## 默认卡片配方：24 / 8 / 16

- 外层 `Surface` 负责24px内边距与边界，不自动给任意子节点添加margin。
- 标题与说明放进 `Stack gap={2}`，保持8px间隔。
- 内容组与操作组放进 `Stack gap={4}`，保持16px间隔。
- 操作组使用 `Inline gap={2}`，按钮间隔8px、允许换行、保持内容宽度。
- 卡片之间用 `Stack gap={6}` 或 `Grid gap={6}`，保持24px间隔。不要同时设置父级gap与子级margin来叠加同一段距离。

```tsx
<Surface>
  <Stack gap={4}>
    <Stack gap={2}>
      <Text as="h2" variant="heading">应用更新</Text>
      <Text tone="muted">当前版本已是最新。</Text>
    </Stack>
    <Inline gap={2}>
      <Button variant="secondary" onClick={checkUpdate}>检查更新</Button>
    </Inline>
  </Stack>
</Surface>
```

页面已有h1时卡片通常用h2；标题等级由结构决定，不能用字号决定。不要为布局引入空Text、空段落或连续br。

## 常见组合

| 场景 | 内部 | 组间 / 区域 | 组件选择 |
| --- | --- | --- | --- |
| 信息与设置卡片 | 标题/说明8px | 内容/动作16px；卡片24px | Surface +嵌套Stack +Inline |
| 表单 | 标签/控件由字段组件负责 | 字段16px；字段组24px；提交区24px | TextField/Fieldset +Stack |
| 工具栏 | 同组按钮8px | 独立组16px，窄屏换行 | Toolbar/Inline |
| 数据列表 | 同项说明4–8px | 列表项16px；筛选/表格/分页16–24px | Stack +DataTable/Pagination |
| 浮层 | 标题/说明由浮层组件负责 | 正文组16px；操作区24px | Dialog/Drawer +Stack/Inline |
| 反馈 | 提示内部由Notice负责 | 与前后内容16px | Notice放入Stack，不覆盖其内部样式 |

这些是组合默认值，不重新覆盖现有组件内部的padding、gap或状态样式。要改变组件密度，先在库中定义并验证，不能在业务页用后代选择器临时压缩。

## 长文本、窄窗与状态变化

保持8/16/24的关系，不因窄屏把所有间距归零。长文本自然换行、卡片随内容增高；多列转单列，按钮换行，不缩小字号或点击区域。保持至少44px操作目标及焦点环空间。

加载保留已有文案和按钮位置，只改变真实状态；额外进度或错误信息作为独立组加入16px间距。错误文案常驻直至处理，不用固定卡高或裁剪限制。状态元素移除后不保留空白占位组；不要用空的Inline或Stack充当spacer。

间距本身不动画。状态变化复用现有组件动效，不为留白增加缩放、弹跳或循环；减少动态保留同样布局与操作。

## 验收

检查默认、加载、错误、长文案；400/520/880px及200%等效重排；文字、焦点与按钮不裁切；不存在父gap叠加子margin或按钮意外撑满。以真实边界间距为准，行高内部的字形留白不当成额外margin测量。

本规范与展台随main更新；现有gap API在npm0.3.0可用，文档章节不代表已发布新版本。
