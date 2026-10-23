# 监控组件：Ant Design / MUI 对照

查阅：2026-10-24。对象为 issue #6 的 StatusTimeline 详情、TrendChart、StackedBar。Ant Design 的 Timeline 是事件序列，不能直接等同可拖动的健康历史；其图表由独立的 Ant Design Charts 提供。此处分别对照 Slider + Popover、Charts，避免把相近名称当作相同控件。

## 官方依据

- [Ant Design Slider](https://ant.design/components/slider/)：value/defaultValue、onChange、disabled 与键盘。
- [Ant Design Popover](https://ant.design/components/popover/)：open/defaultOpen/onOpenChange、触发方式与避让。
- [Ant Design Timeline](https://ant.design/components/timeline/)：items、方向与事件内容；仅用于确认语义差异。
- [Ant Design Charts 官方 Line 示例](https://charts.ant.design/options/plots/style/)、[Axis](https://charts.ant.design/en/options/plots/axis/)、[Bar](https://ant-design-charts.antgroup.com/en/components/plots/bar)：数据字段、轴、交互、堆叠和百分比。
- [MUI Slider API](https://mui.com/material-ui/api/slider/)：受控状态、可访问值描述与禁用。
- [MUI X Charts 键盘](https://mui.com/x/react-charts/accessibility/)：图形焦点、左右键、Home/End。
- [MUI X Lines](https://mui.com/x/react-charts/lines/)：null、缺失断线及可选连接；[Tooltip](https://mui.com/x/react-charts/tooltip/)：数值格式化。

## 逐项核对

| 组件 / 项目 | 原实现 | 本轮结果 / 验收 |
| --- | --- | --- |
| StatusTimeline 选中状态 | 仅内部数组下标 | 新增 `activeId/defaultActiveId/onActiveChange`；插入、重排按稳定 ID 保留，移除时回到最新时段；不回写宿主 |
| 详情开关 | 仅内部 open | 新增 `open/defaultOpen/onOpenChange`；受控模式仅回传意图，父组件决定是否打开/关闭 |
| 禁用 | 仅空数组时禁用 | 新增 `disabled`，禁用时不显示详情，也不接受鼠标选择 |
| 键盘 | range 方向键；Escape | 保留原生方向键/Home/End；Enter/Space 进入详情关闭按钮；关闭焦点回健康条且不重新打开 |
| 浮层定位 / 叠层 | 已使用 Radix Portal、碰撞检测 | 保留同主题根、视口 12px 避让、内部滚动、非模态、不抢悬停焦点 |
| 可访问关联 | aria-valuetext/details | 增加展开状态、dialog 类型与 controls；同一份结构化详情供键盘/触屏/鼠标读取 |
| 业务证据 | 零/未知、原因、统计口径 | 保留；没有证据时不生成成功率或健康评分 |
| TrendChart 数值格式 | 固定 String | 新增 `valueFormatter(value)`，缺失与非有限值统一传 null；刻度和逐点详情采用格式化，原始数据表保留精确数值 |
| 逐点交互 | 仅 SVG title + 展开数据表 | 图形可 Tab 聚焦；左右/Home/End、悬停/轻触查看同一个 HTML 数值区；包括零与缺失桶 |
| 选中同步 | 无 | 新增 `activePointId/defaultActivePointId/onActivePointChange`，受控变化不越过宿主；按 ID 保留，不按数组位置漂移 |
| 断线 | null/nonfinite 不补零 | 保留缺失断线；没有增加 connectNulls，以免掩盖监控采集缺口 |
| 坐标 | 大幅正负数相减可能溢出 | 先按数值幅度归一化再映射，有限极值不产生 NaN/Infinity SVG 坐标 |
| StackedBar 零分段 | flex gap 为零值留下空隙 | 零不绘制色段，文字仍列 0 与 0.0% |
| 小数分段宽度 | flex-grow 原始计数总和小于 1 时色带无法填满 | 使用归一化权重分配全宽；0.1 / 0.2 与文字 33.3% / 66.7% 一致 |
| 分类数值格式 | 固定 String | 同样支持 valueFormatter；计数与比例计算仍使用原始值 |
| 未知/负数/总和溢出 | 不绘制百分比 | 保留；不复制图表引擎对缺失项的默认归一化行为 |
| 陈旧 / 错误 / 空 | 保留数据并说明 | 保留，loading 不清空已有数据；空数组和全未知不同文案 |
| 主题 / 动效 / 大量数据 | 同源 CSS tokens、无动画 | 保留；桶排序/聚合/限量在宿主，不新增图表引擎和网络层 |

## 保留差异

只提供单序列柱/折线及一组互斥分类的占比。多坐标轴、图例筛选、多序列、brush、缩放、导出和数据引擎属于另一个扩展范围；不把 MUI X / Ant Design Charts 的全部 API 套到运维轻图表。StatusTimeline 继续表达时段证据，不改成事件轴。受控/非受控模式应在组件生命周期内保持一致。

## 证据

`tests/MonitoringParity.test.tsx`：9 个新增行为回归，覆盖受控意图、稳定 ID、键盘、Enter 进入/关闭归还、格式化与原始值、有限极值、零/小数占比及禁用。与既有 Monitoring、StatusTimeline 测试共 14 项通过。真实浏览器矩阵及最终全量结果统一记录于 [ISSUE_VALIDATION](../ISSUE_VALIDATION.md)，不以 JSDOM 代替定位或读屏验收。
