import { useEffect, useRef, useState } from 'react';
import {
  Badge, Button, Checkbox, DateRangePicker, EmptyState, Inline, ListFilterBar,
  Select, Skeleton, Stack, Surface, Text, type DateRange,
} from '../components';

type PreviewState = 'normal' | 'loading' | 'empty' | 'error' | 'disabled';
const records = [
  { id: 'design-review', title: '核对页面设计与窄屏布局', person: '示例成员', state: 'done', reviewed: true, date: '2026-10-24' },
  { id: 'component-review', title: '整理共享组件与交互规则', person: '组件维护者', state: 'running', reviewed: false, date: '2026-10-23' },
];
const dateLabel = ({ start, end }: DateRange) => start || end ? `${start || '不限开始'} — ${end || '不限结束'}` : undefined;

function usePreviewRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return {
    refreshing,
    refresh: () => {
      if (timer.current) clearTimeout(timer.current);
      setRefreshing(true);
      timer.current = setTimeout(() => setRefreshing(false), 600);
    },
  };
}

function SessionListExample({ mode, embedded = false }: { mode: PreviewState; embedded?: boolean }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState('all');
  const [sort, setSort] = useState('newest');
  const [person, setPerson] = useState('all');
  const [reviewed, setReviewed] = useState(false);
  const [range, setRange] = useState<DateRange>({ start: '', end: '' });
  const [exportCount, setExportCount] = useState(0);
  const { refreshing, refresh } = usePreviewRefresh();
  const disabled = mode === 'disabled';
  const pending = mode === 'loading' || refreshing;
  const label = embedded ? '人员会话筛选' : '录制会话筛选';
  const reset = () => { setQuery(''); setState('all'); setSort('newest'); setPerson('all'); setReviewed(false); setRange({ start: '', end: '' }); };
  // Gallery records are synthetic; production hosts send these values to their own query service.
  const rows = mode === 'empty' ? [] : records.filter(row =>
    (state === 'all' || row.state === state) &&
    (person === 'all' || row.person === person) &&
    (!reviewed || row.reviewed) &&
    (!range.start || row.date >= range.start) && (!range.end || row.date <= range.end) &&
    `${row.title} ${row.person} ${row.id}`.includes(query.trim()),
  ).slice().sort((a, b) => sort === 'oldest' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id));
  const common = [
    {
      id: 'status', label: '会话状态', activeLabel: state === 'all' ? undefined : state === 'done' ? '已完成' : '进行中',
      onClear: disabled ? undefined : () => setState('all'),
      control: <Select label="会话状态" value={state} disabled={disabled} onChange={event => setState(event.target.value)}>
        <option value="all">全部状态</option><option value="running">进行中</option><option value="done">已完成</option>
      </Select>,
    },
    {
      id: 'sort', label: '排序', activeLabel: sort === 'newest' ? undefined : '最早事件优先',
      onClear: disabled ? undefined : () => setSort('newest'),
      control: <Select label="排序" value={sort} disabled={disabled} onChange={event => setSort(event.target.value)}>
        <option value="newest">最后事件最新</option><option value="oldest">最早事件优先</option>
      </Select>,
    },
  ];
  const reviewField = {
    id: 'reviewed', label: '审查', activeLabel: reviewed ? '只看已审查' : undefined,
    onClear: disabled ? undefined : () => setReviewed(false),
    control: <Checkbox label="只看已审查" checked={reviewed} disabled={disabled} onChange={event => setReviewed(event.target.checked)} />,
  };
  return <Stack gap={4} style={embedded ? { maxWidth: 420, width: '100%' } : undefined}>
    <ListFilterBar label={label}
      search={{ label: '搜索会话', placeholder: '搜索消息或会话 ID', value: query, disabled, onChange: event => setQuery(event.target.value) }}
      primary={embedded ? common : [...common, reviewField]}
      filters={[
        ...(embedded ? [reviewField] : []),
        {
          id: 'person', label: '人员', activeLabel: person === 'all' ? undefined : person,
          onClear: disabled ? undefined : () => setPerson('all'),
          control: <Select label="人员" value={person} disabled={disabled} onChange={event => setPerson(event.target.value)}>
            <option value="all">全部人员</option><option>示例成员</option><option>组件维护者</option>
          </Select>,
        },
        {
          id: 'date', label: '最后事件日期', activeLabel: dateLabel(range),
          onClear: disabled ? undefined : () => setRange({ start: '', end: '' }),
          control: <DateRangePicker label="最后事件日期" value={range} onValueChange={setRange} disabled={disabled}
            presets={[{ label: '今天', value: { start: '2026-10-24', end: '2026-10-24' } }]} />,
        },
      ]}
      onReset={disabled ? undefined : reset}
      refresh={{ onClick: refresh, busy: pending, disabled }}
      action={embedded ? undefined : <Button variant="secondary" disabled={disabled || pending} onClick={() => setExportCount(count => count + 1)}>导出示例</Button>}
      result={pending ? undefined : `${rows.length} 条结果`}
      pending={pending}
      error={mode === 'error' ? '读取失败，当前保留上次结果。请刷新重试。' : undefined}
    />
    {pending ? <Skeleton label="正在读取会话" lines={3} /> : rows.length ? rows.map(row => <Surface key={row.id}>
      <Stack gap={2}>
        <Inline gap={2}><Text as="h4" variant="label">{row.person}</Text><Badge>{row.state === 'done' ? '已完成' : '进行中'}</Badge></Inline>
        <Text>{row.title}</Text><Text variant="caption" tone="muted">{row.id}</Text>
      </Stack>
    </Surface>) : <EmptyState title="没有匹配的会话" description="试试其他条件。" action={!disabled ? <Button variant="secondary" onClick={reset}>清除筛选</Button> : undefined} />}
    {!!exportCount && <Text role="status" variant="caption" tone="muted">已触发 {exportCount} 次示例操作；展台不生成或下载文件。</Text>}
  </Stack>;
}

function StatisticsExample({ mode }: { mode: PreviewState }) {
  const [scope, setScope] = useState('all');
  const [platform, setPlatform] = useState('all');
  const [metric, setMetric] = useState('cost');
  const [range, setRange] = useState<DateRange>({ start: '2026-10-24', end: '2026-10-24' });
  const { refreshing, refresh } = usePreviewRefresh();
  const disabled = mode === 'disabled';
  const pending = mode === 'loading' || refreshing;
  const reset = () => { setScope('all'); setPlatform('all'); setMetric('cost'); setRange({ start: '2026-10-24', end: '2026-10-24' }); };
  return <Stack gap={4}>
    <ListFilterBar label="部门用量筛选"
      primary={[
        { id: 'platform', label: '平台', activeLabel: platform === 'all' ? undefined : platform, onClear: disabled ? undefined : () => setPlatform('all'),
          control: <Select label="平台" value={platform} disabled={disabled} onChange={event => setPlatform(event.target.value)}><option value="all">全部平台</option><option>OpenAI</option></Select> },
        { id: 'metric', label: '排行依据', activeLabel: metric === 'cost' ? undefined : 'Token 排行', onClear: disabled ? undefined : () => setMetric('cost'),
          control: <Select label="排行依据" value={metric} disabled={disabled} onChange={event => setMetric(event.target.value)}><option value="cost">消费排行</option><option value="tokens">Token 排行</option></Select> },
      ]}
      filters={[
        { id: 'scope', label: '统计范围', activeLabel: scope === 'all' ? undefined : scope, onClear: disabled ? undefined : () => setScope('all'),
          control: <Select label="统计范围" value={scope} disabled={disabled} onChange={event => setScope(event.target.value)}><option value="all">所有可见部门</option><option>示例团队 / 跨部门体验与可访问性协作小组</option></Select> },
        { id: 'range', label: '统计日期', activeLabel: range.start === '2026-10-24' && range.end === '2026-10-24' ? undefined : dateLabel(range),
          onClear: disabled ? undefined : () => setRange({ start: '2026-10-24', end: '2026-10-24' }),
          control: <DateRangePicker label="统计日期" value={range} onValueChange={setRange} disabled={disabled} clearable={false} /> },
      ]}
      onReset={disabled ? undefined : reset} refresh={{ onClick: refresh, busy: pending, disabled }} pending={pending}
      result={pending ? undefined : mode === 'empty' ? '当前范围无用量' : `${dateLabel(range)} · ${scope === 'all' ? '所有可见部门' : scope}`}
      error={mode === 'error' ? '统计读取失败，暂不能确认当前范围结果。' : undefined}
    />
    {pending ? <Skeleton label="正在读取用量" lines={2} /> : mode === 'empty' ? <EmptyState title="当前范围没有用量" description="可更改范围或日期后重试。" /> : <Surface><Stack gap={2}>
      <Text as="h4" variant="label">示例统计结果</Text><Text variant="caption" tone="muted">统计范围、日期与排行方式由宿主控制；此处仅展示合成数据。</Text>
      <Text numeric>{metric === 'cost' ? '$ 8.42' : '1,400,000 Token'}</Text>
    </Stack></Surface>}
  </Stack>;
}

export function ListFilterBarGallery() {
  const [mode, setMode] = useState<PreviewState>('normal');
  return <section id="list-filter-bar">
    <div className="ds-section-title"><span>FILTERS</span><h2>列表筛选 · 限制常显复杂度</h2></div>
    <p className="ds-caption">搜索、最多两个常显条件和一个业务操作；其他条件按需展开。对应 Rhine #19，查询与权限由宿主管理。</p>
    <Stack gap={6}>
      <Select label="示例状态" value={mode} onChange={event => setMode(event.target.value as PreviewState)}>
        <option value="normal">正常 / 有数据</option><option value="loading">加载中</option><option value="empty">无结果</option><option value="error">读取失败</option><option value="disabled">条件不可修改</option>
      </Select>
      <Stack gap={3}>
        <Text as="h3" variant="heading">独立列表</Text>
        <Text variant="caption" tone="muted">传入的第三个常显条件“审查”自动归入更多筛选；不会继续增加顶部行数。</Text>
        <SessionListExample mode={mode} />
      </Stack>
      <Stack gap={3}>
        <Text as="h3" variant="heading">嵌入人员详情 · 420px 容器</Text>
        <Text variant="caption" tone="muted">同一组件随实际容器重排，窄区域仍保留结果、刷新和退出筛选的入口。</Text>
        <SessionListExample mode={mode} embedded />
      </Stack>
      <Stack gap={3}>
        <Text as="h3" variant="heading">统计范围 · 无搜索框</Text>
        <StatisticsExample mode={mode} />
      </Stack>
      <Text variant="caption" tone="muted">筛选即时改变宿主状态，关闭抽屉不撤销条件。加载、错误和结果在抽屉内同样可见；用 Escape 关闭并返回入口。</Text>
    </Stack>
  </section>;
}
