# 单输入搜索（#42，未发布）

只有一个查询条件时直接组合 TextField，不增加 Surface、重复可见标题、默认帮助段落、搜索按钮或常驻重置行。需要提交按钮时使用 SearchField；多条件筛选仍使用 ListFilterBar，不绕过它的层级约束。

```tsx
<TextField label="搜索条目" labelVisibility="hidden" type="search"
  placeholder="搜索名称或关键词" value={query}
  onChange={event => setQuery(event.target.value)} />
```

`labelVisibility` 默认 `visible`，`hidden` 仅视觉隐藏关联 label。`label` 必须是非空文本，空白值会报错；placeholder 不是 accessible name。原生 input 属性继续透传，有效 aria-label / aria-labelledby 仍遵循原生优先级；空白 aria-label 不会遮蔽 label，宿主须确保 aria-labelledby 指向存在且非空的内容。`hint` / `error` 与外部 aria-describedby 合并，禁用和错误语义不变。`className` 仍落在字段容器，原生 style 落在 input。

输入和 placeholder 采用正文 token（14px / 22px / 400），44px 最小命中；大尺寸可通过原生 style 的 minHeight、padding 配置，不能用标题字号制造“大搜索”。保持主题提供的背景、边框和焦点，不覆盖内部 CSS。

默认只显示输入。查询中、无结果、错误及必要摘要放在关联结果区，使用稳定的 aria-live 容器、按需 aria-describedby；不能删掉失败反馈。没有查询时不播报重复说明。

数据请求、防抖、IME、取消、过期响应保护和清空策略属于宿主。`#single-search` 合成展台在 composition 期间不查询，提交组合输入后等待250ms，再模拟500ms响应；Escape在非组合输入时清空并保持输入焦点，原生搜索清空按 change 处理。更改查询、禁用或卸载取消旧定时器；真实服务应同时用 AbortSignal 和请求序号防护。TextField不隐式提交、请求或过滤。

验收区分 DOM composition 事件回归与真实操作系统输入法；前者不能证明中文候选窗行为。CSS zoom 与浏览器原生缩放分别记录。展台只用合成数据。
