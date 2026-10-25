# 紧凑筛选控件

本地源码能力，尚不代表已发布的 0.9.1 API。真实组件组合为 `preview/CompactFilterBarGallery.tsx`。

统一展台入口 `#compact-filters`，同时运行 `preview/DenseFilterControlsGallery.tsx`：100 个候选、90 个已选项及一体日期区间。`RemoteMultiSelect maxVisibleTags={2}` 默认只显示两个标签与总数，展开后使用有界滚动，不将大量已选项常驻到筛选抽屉。`DateRangePicker compact` 将两端原生日期放在同一边框内，保留无障碍标签、原生日期键盘与错误关联；极窄容器允许内部换行，不能裁切日期。

- `SegmentedControl fullWidth` 占满可用行宽，选项等宽；长标签在所属选项中换行。选中背景和可见文本区域共同撑满 label，文字水平/垂直居中，不把扩大点击区域误认为扩大选中背景。
- 默认 `fullWidth=false` 保持既有按内容布局。原生 radio 的 checked、禁用、Tab 和方向键行为不变；独立实例继续使用独立 name。
- `ListFilterBar drawerDescription={null} drawerResult={null}` 删除可省略说明与重复统计。没有内容时不留下空段落/反馈容器；关闭后仍显示栏内完整摘要。
- 正在更新和错误不是冗余说明，抽屉打开时继续提供反馈。减少文字不能掩盖请求失败或把旧结果解释为当前条件成功。
- `Dialog` / `Drawer` 的 description 接收 ReactNode，`null` 不渲染描述，同时移除 aria-describedby；标题和关闭入口始终保留。

验收三主题、400/520/880px、200% 内容缩放及长标签；检查每个选项的几何宽度和文字中心、整个选中底色的宽度、键盘原生单选、抽屉关闭归焦、无描述时的可访问名称。JSDOM 验证语义与回调，真实浏览器验证几何。
