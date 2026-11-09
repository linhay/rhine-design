# 列表分类与只读归属配方

对应 [#113](https://github.com/linhay/rhine-design/issues/113)、[#114](https://github.com/linhay/rhine-design/issues/114)；真实源码展台 `/#list-card-recipes`，隔离生产入口 `/?fixture=list-card-recipes`。本页是账号/资源列表的局部组合建议，不是所有列表的默认布局，也没有新增公共 API。展台合入不表示 npm 发布或消费方升级。

## 分类与批量动作

复用公开 `Tabs` 和 `Button`。宿主只传当前授权的分类，并管理受控 value；移除当前分类时同步选择一个仍可用的分类。批量入口仅在有权限且当前范围的真实读取已就绪、有可操作结果时出现；首次请求、切换范围读取、加载、有效空态和错误均无批量动作，不能只检查演示状态字符串。无批量动作仍保留分类；若入口消失时持有焦点，回退到当前分类。平台仍可作为独立筛选维度。

配方先渲染浮动的动作包装，再渲染 Tabs；内容包装 `clear: both`。桌面可同排，空间不足自然换行，不定位覆盖、不修改组件私有选择器。默认 Tabs 项按内容分配，保持 44px 操作高度。页面 DOM 中批量动作先于 Tabs；视觉与键盘顺序需要按实际任务评估。

结果必须作为每个 item 的 `content` 进入真实 tabpanel，保留 `aria-controls` / `aria-labelledby`。不得造空面板后在外部呈现不相关结果。非活动面板排除实际 Tab 顺序；方向键、Home/End 切换后焦点可见。实际服务端过滤、loading/有效空态/error、权限和请求取消/迟到保护属于宿主。展台仅用可清理的合成定时器模拟读取，不证明后端。

异步快照、Tab 过渡及模块级加载见[异步数据配方](ASYNC_SNAPSHOT_RECIPES.md)，它补充请求与旧摘要归属，不改变这里的分类/动作契约。

## 只读标签单行滚动

```tsx
<Inline role="region" aria-label="归属分组（可左右滚动查看完整标签）" tabIndex={0}
  style={{ flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%', padding: 'var(--rhine-space-1)' }}>
  {labels.map(label => <span key={label} style={{ flex: '0 0 auto', whiteSpace: 'nowrap' }}>
    <Badge>{label}</Badge>
  </span>)}
</Inline>
```

使用公开 `style.flexWrap` 避免与 Inline 默认 wrap 的 CSS 加载顺序竞争。包装不可收缩，保留完整文字与字号，不使用 ellipsis、clip 或隐藏末项。区域有可见焦点，原生 ArrowLeft/ArrowRight、触控板/触摸滚动；不拦截方向键，也不把只读标签改为按钮。超长单标签大于视口时可分段完整滚过，不要求同屏全部可见。滚到末端核对最后字符和内框，而非只看页面不溢出。无标签显示独立空态。

## 内容区紧凑时间摘要

吸收 closed [#23 的局部偏好](https://github.com/linhay/rhine-design/issues/23#issuecomment-6513628950)：更新当日显示时分、跨日显示日期；账号与订阅到期分别标明，跨年保留年份。元信息在相关内容区，常规宽度同排，极窄/200% 允许按字段换行；不缩字号、不裁字、不合并到期语义。完整时间同时提供可访问名称、title 和可点击帮助 Dialog，触屏入口不依赖悬停。实际时区、跨午夜、未知/过期含义由宿主决定；本展台时间为明确标注的上海时间合成值。

## 验收

生产构建三主题 × 400/520/880 × 100/200% CSS zoom；量真实内框、分类/动作不重叠、44px 命中区、长文与区域末项；键盘 Home/End、Tab/Shift+Tab 排除非活动面板，取消批量权限仍保留分类。标签须整组单行、原生 ArrowRight 产生滚动、首尾字符可达、焦点可见；定向移除 nowrap 的反例应被检出。正常/系统与手动减少动态完成同一路径。CSS zoom 不代替原生浏览器缩放，合成 UI 不证明读屏、触摸硬件或真实服务。
