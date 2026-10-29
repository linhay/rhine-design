# 时间线语义与请求结果构成（未发布，#97）

此能力随源码展台提供；npm 0.11.3 不包含 `statusLabels` 或 `mode="composition"`。消费方必须固定经过验证的后续制品，并自行删除临时标签替换/构成实现；源码合并不等于消费迁移完成。

## 单状态标签

默认 `StatusTimeline` 的 `TimelineSegment`、五种状态、颜色、键盘与既有标签保持兼容。可选 `statusLabels: Partial<Record<TimelineStatus, string>>` 覆盖对应标签；未提供或空白项回退默认。将同一对象传给 `StatusTimeline` 和 `TimelineLegend`，会同步摘要、`aria-valuetext`、详情标题及图例名称。图例有 `items` 时，显式 `statusLabels` 优先于对应 item.label，description 仍由宿主提供。`StatusTimelineList` 的 timeline 输入也透传该属性。

```tsx
const statusLabels = { healthy: '低于 5%', degraded: '5% 至 20%', failed: '至少 20%', unknown: '证据不足' };
<StatusTimeline statusLabels={statusLabels} label="风险历史" segments={riskBuckets} startLabel="开始" endLabel="结束" />
<TimelineLegend statusLabels={statusLabels} />
```

阈值、分子分母、分级和风险摘要属于宿主。这组示例不用于结果构成模式，也不能把有失败的绿色桶称为未见异常。

## 等高请求结果构成

`StatusTimeline mode="composition"` 使用 `TimelineCompositionSegment[]`，没有单状态字段，不接受 statusLabels。每个段为 `{ id, label, composition, detail? }`，composition 为：

- `total`：按请求 ID 去重后的请求总数，包括结果未知的请求。
- `counts: { direct, retried, failed, unknown }`：四类互斥的最终结果数量，分别为直接成功、重试后成功、最终失败、结果未知。不得将一次请求的多次尝试重复计数。
- `coverage: 'complete' | 'partial' | 'missing'`：请求总数与区间的采集完整性；结果未知并不等于采集不完整。
- `reason?`：宿主补充原因，与组件检查结果一同显示和朗读。

```tsx
const segments = [{ id: 'bucket-a', label: '10:00–10:10 UTC+8', composition: {
  total: 100, coverage: 'complete' as const,
  counts: { direct: 60, retried: 20, failed: 10, unknown: 10 },
} }];
<StatusTimeline mode="composition" label="请求结果" segments={segments} startLabel="10:00" endLabel="10:10" />
<TimelineLegend mode="composition" />
```

`StatusTimelineList` 同样支持此输入。`TimelineLegend mode="composition"` 固定四类顺序和语义，可从 items 中按 healthy/recovered/failed/unknown 读取 description；忽略 items.label/statusLabels，避免与固定结果分类冲突。重试成功在此模式使用黄色（health-degraded token），不是单状态 recovered 的青色纹理。

所有桶（包括当前选中桶）高度一致，从底到顶为绿、黄、红、灰。选中只描边，不改变高度。色段直接按 `count / total * 100` 绘制，没有最小高度、段间隙或占比动画；零份额为零，100% 占满。微小份额可能小于设备像素而不可分辨，不能人为放大。文字保留确切数量，占比最多两位小数；正值不足 0.01% 显示 `<0.01%`，不足100%而高于99.99%显示 `>99.99%`，避免舍入成零或全量。文字四舍五入之和不保证精确100%，绘图使用未舍入值。

校验要求 total 和四类计数均为非负安全整数，四类之和必须等于 total。完整且 total>0 时才显示比例。总数完整但有未知结果时，灰色只占未知份额。缺失、采集不完整或非法计数时整桶灰色，全部数量/总数标记未知，比例不适用并给出原因；完整的零请求桶也整桶灰色，但数量明确为0、比例不适用。这些灰色占位不是“100%请求结果未知”的统计结论。空数组显示暂无记录并禁用滑块。

宿主负责去重、互斥分类、时间排序、缺失桶补齐、时区和陈旧说明；组件不能仅凭计数验证去重是否真实。扩大桶必须先将每类数量求和，再除以新 total。例如两桶直接成功率为1/1和0/99，汇总应为1/100=1%，不得平均为50%。合并范围中任一桶缺失/采集不全，合并桶必须保留该覆盖缺口。

`detail` 可补充开始/结束、原因与口径；构成模式的数量完全取自 composition，忽略 detail.counts，避免两套相互冲突的数值。可见详情、滑块 `aria-valuetext` 与摘要读取同一数量/比例；鼠标 hover、触屏点按、方向键/Home/End 均选择同一段。Enter 进入详情关闭按钮，Escape 只关闭当前详情并按原焦点所有权归还；禁用和受控 open/activeId 行为保持原契约。原有紧凑图例的混合输入与 Escape 保护继续适用。

真实展台：`/#monitoring` 的“请求结果构成”，包含四种纯色、三色/含灰混合、微小份额、加权聚合、零、缺失、不完整、无效总数、空与禁用、动态更新、紧凑列表和嵌套 Dialog。验收脚本 `scripts/check-timeline-composition.js`；固定制品与验证边界见 PR 记录。
