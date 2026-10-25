import { useState } from 'react';
import { Button, DateField, DateRangePicker, Divider, Icon, Inline, Popover, SegmentedControl, Select, Stack, Surface, Text, type DateRange } from '../components';

const quickRanges = [
  { value: 'today', label: '今天', range: { start: '2026-10-24', end: '2026-10-24' } },
  { value: 'yesterday', label: '昨天', range: { start: '2026-10-23', end: '2026-10-23' } },
  { value: 'week', label: '本周', range: { start: '2026-10-19', end: '2026-10-24' } },
];
const moreRanges = [
  { label: '最近 7 天', range: { start: '2026-10-18', end: '2026-10-24' } },
  { label: '最近 30 天', range: { start: '2026-09-25', end: '2026-10-24' } },
  { label: '本月', range: { start: '2026-10-01', end: '2026-10-24' } },
  { label: '上月', range: { start: '2026-09-01', end: '2026-09-30' } },
];
const min = '2025-01-01', max = '2026-12-31';
const rangeLabel = ({ start, end }: DateRange) => `${start} — ${end}`;

// Preview composition only: the host owns presets, calendar boundaries and data queries.
export function DateRangeFilterExample({ label = '时间范围', initialValue = quickRanges[0].range, disabled = false, longLabels = false }: {
  label?: string; initialValue?: DateRange; disabled?: boolean; longLabels?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(0);
  const selected = quickRanges.find(item => item.range.start === value.start && item.range.end === value.end)?.value ?? '';
  const canApply = !disabled && !!draft.start && !!draft.end && draft.start <= draft.end && draft.start >= min && draft.end <= max && !error;
  const commit = (range: DateRange) => {
    if (disabled) return;
    setValue(range); setApplied(count => count + 1); setOpen(false);
  };
  const changeOpen = (next: boolean) => {
    if (next && disabled) return;
    if (next) { setDraft(value); setError(null); }
    setOpen(next);
  };
  return <Stack gap={3}>
    <Inline gap={2} role="group" aria-label={label}>
      <Text variant="caption" tone="muted">{label}</Text>
      <SegmentedControl label={`${label}快捷选择`} items={quickRanges.map(item => ({
        value: item.value, label: longLabels ? `${item.label}的完整自然日范围` : item.label, disabled,
      }))} value={selected} onValueChange={key => {
        const preset = quickRanges.find(item => item.value === key);
        if (preset) commit(preset.range);
      }} />
      <Popover title={`${label}设置`} open={open} onOpenChange={changeOpen} trigger={
        <Button variant="secondary" disabled={disabled} aria-label={`${label}：${rangeLabel(value)}，选择日期`}>
          {rangeLabel(value)} <Icon name="chevronDown" size={16} />
        </Button>
      }>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text variant="caption" tone="muted">选择预设后立即应用</Text>
            <Inline gap={2} aria-label="更多时间预设">
              {moreRanges.map(item => <Button key={item.label} variant="secondary" onClick={() => commit(item.range)}>{item.label}</Button>)}
            </Inline>
          </Stack>
          <Divider />
          <form onSubmit={event => {
            event.preventDefault();
            if (canApply && event.currentTarget.checkValidity()) commit(draft);
          }}>
            <Stack gap={3}>
              <DateRangePicker label="自定义日期" value={draft} onValueChange={setDraft} onValidationChange={setError}
                min={min} max={max} required clearable={false} hint="填写完整日期后，点击应用。" />
              <Inline gap={2}>
                <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
                <Button type="submit" disabled={!canApply}>应用日期</Button>
              </Inline>
            </Stack>
          </form>
        </Stack>
      </Popover>
    </Inline>
    <Text variant="caption" tone="muted" role="status">已应用：{rangeLabel(value)} · 本次操作 {applied} 次</Text>
  </Stack>;
}

export function DateRangeFilterGallery() {
  const [narrowWidth, setNarrowWidth] = useState('150');
  const [narrowRange, setNarrowRange] = useState<DateRange>({ start: '2026-10-24', end: '2026-10-25' });
  const [singleDate, setSingleDate] = useState('2026-10-24');
  const [resetRevision, setResetRevision] = useState(0);
  return <section id="date-range-filter">
    <div className="ds-section-title"><span>RANGE</span><h2>日期筛选 · 快捷选择与自定义</h2></div>
    <p className="ds-caption">常用日期是一组互斥选项；具体日期持续可见。更多预设即选即用，自定义日期在确认后生效。</p>
    <Stack gap={4}>
      <Surface>
        <Stack gap={4}>
          <Text as="h3" variant="heading">日常筛选</Text>
          <DateRangeFilterExample />
          <Text variant="caption" tone="muted">固定演示日期为 2026-10-24。选择只更新本地样例，不请求业务数据。</Text>
        </Stack>
      </Surface>
      <Surface>
        <Stack gap={4}>
          <Text as="h3" variant="heading">跨年范围与长标签</Text>
          <DateRangeFilterExample label="对比时间范围" initialValue={{ start: '2025-12-28', end: '2026-01-06' }} longLabels />
          <Text variant="caption" tone="muted">超出快捷项的日期不冒充任何预设。窄容器允许换行，完整年份和操作保留。</Text>
        </Stack>
      </Surface>
      <Surface>
        <Stack gap={4}>
          <Text as="h3" variant="heading">暂不可更改</Text>
          <DateRangeFilterExample label="归档日期范围" disabled />
          <Text variant="caption" tone="muted">归档结果的统计范围固定，保持日期可读。</Text>
        </Stack>
      </Surface>
      <Stack gap={3}>
        <Text as="h3" variant="heading">窄容器中的完整日期</Text>
        <Text variant="caption" tone="muted">只改变实际容器宽度，不缩小字号。请聚焦日期并编辑最后一段，确认完整年月日与日历入口仍可见；#25 尺寸修复为本地候选。</Text>
        <Select label="日期容器宽度" value={narrowWidth} onChange={event => setNarrowWidth(event.target.value)}>
          <option value="150">150 CSS px</option><option value="200">200 CSS px</option><option value="280">280 CSS px</option>
        </Select>
        <Stack gap={3} style={{ width: Number(narrowWidth), maxWidth: '100%' }}>
          <DateRangePicker key={resetRevision} label="局部日期" value={narrowRange} onValueChange={setNarrowRange} />
          <Inline><DateField key={resetRevision} label="独立日期" value={singleDate} onValueChange={setSingleDate} /></Inline>
          <Button variant="secondary" onClick={() => { setNarrowRange({ start: '2026-10-24', end: '2026-10-25' }); setSingleDate('2026-10-24'); setResetRevision(value => value + 1); }}>重置示例日期</Button>
        </Stack>
        <Text variant="caption" role="status">已接受日期：{narrowRange.start || '不限开始'} — {narrowRange.end || '不限结束'}</Text>
      </Stack>
      <Text variant="caption" tone="muted">方向键切换快捷项；Escape 或取消退出草稿并归还焦点，点击外部控件按原生焦点行为继续。所有主题使用同一组公开组件。</Text>
    </Stack>
  </section>;
}
