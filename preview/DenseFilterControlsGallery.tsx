import { useState } from 'react';
import { Button, DateRangePicker, Dialog, Inline, RemoteMultiSelect, Stack, Surface, Text, type Choice, type DateRange } from '../components';

const departments: Choice[] = Array.from({ length: 100 }, (_, i) => ({ value: `synthetic-${i}`, label: `合成部门 ${i + 1}${i % 8 === 0 ? ' · 跨团队协作与长期计划' : ''}` }));

export function DenseFilterControlsGallery() {
  const [selected, setSelected] = useState(departments.slice(0, 90));
  const [query, setQuery] = useState('');
  const [date, setDate] = useState<DateRange>({ start: '2026-10-01', end: '2026-10-24' });
  const [error, setError] = useState<string | null>(null);
  // Fixture filtering is local; production hosts keep server-side query ownership.
  const options = departments.filter(item => item.label.includes(query));
  return <Surface><Stack gap={4}>
    <Text as="h2" variant="heading">密集筛选控件</Text>
    <Text tone="muted">100 个合成部门、90 个已选项；可搜索、再次点选取消、完成选择收起、展开移除或清空。日期保留原生键盘和日历。</Text>
    <Inline gap={2}><Button variant="secondary" onClick={() => setSelected(departments)}>全选部门</Button><Button variant="quiet" onClick={() => setSelected([])}>清空部门</Button></Inline>
    <RemoteMultiSelect label="部门" query={query} onQueryChange={setQuery} value={selected} onValueChange={setSelected} options={options} maxVisibleTags={2} placeholder="搜索部门" />
    <Dialog trigger={<Button variant="secondary">在弹窗内选择</Button>} title="搜索多选" description="再次点击已选项可取消；完成选择只收起列表，不提交表单。">
      <RemoteMultiSelect label="弹窗部门" query={query} onQueryChange={setQuery} value={selected} onValueChange={setSelected} options={options} maxVisibleTags={2}/>
    </Dialog>
    <DateRangePicker compact label="日期区间" value={date} onValueChange={setDate} min="2026-01-01" max="2026-12-31" clearable={false} required onValidationChange={setError} />
    <Text variant="caption" tone="muted">{error || `${date.start} 至 ${date.end}`}</Text>
  </Stack></Surface>;
}
