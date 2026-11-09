import { useState } from 'react';
import { Button, Checkbox, DataTable, Select, Stack, Surface, type DataColumn } from '../components';
import { ThemeProvider, themes } from '../components/theme';

const rows = [
  { id: 'A001', owner: '北区', name: '跨区域协作资料与长期归档记录—完整名称在窄容器仍可横向阅读', count: '12,345', status: '已归档' },
  { id: 'A002', owner: '南区', name: 'WorkspaceArchiveUnbrokenIdentifierABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', count: '98,765', status: '待整理' },
];
type Row = typeof rows[number];

export function TableStickyGallery() {
  const [layout, setLayout] = useState('both');
  const [width, setWidth] = useState('auto');
  const [state, setState] = useState('ready');
  const [keys, setKeys] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [auxiliary, setAuxiliary] = useState(true);
  const [message, setMessage] = useState('尚未打开记录');
  const fixed = (key: string): 'left' | 'right' | undefined => {
    if (layout === 'all') return ['id', 'owner'].includes(key) ? 'left' : 'right';
    if (key === 'id' && ['left', 'both', 'multi', 'offset'].includes(layout)) return 'left';
    if (key === 'owner' && ['multi', 'offset'].includes(layout)) return 'left';
    if (key === 'action' && layout !== 'left') return 'right';
    if (key === 'status' && ['multi', 'offset'].includes(layout)) return 'right';
  };
  const baseColumns: DataColumn<Row>[] = [
    { key: 'id', header: '标识', width: 80, render: row => row.id },
    { key: 'owner', header: '归属', width: 96, render: row => row.owner },
    { key: 'name', header: '完整名称', width: 300, rowHeader: true, render: row => <Stack gap={1}><span>{row.name}</span><Button style={{ alignSelf: 'flex-start' }} variant="quiet" onClick={() => setMessage(`已打开 ${row.id}`)}>打开记录</Button></Stack> },
    { key: 'count', header: '条目数', width: 160, align: 'right', render: row => row.count },
    { key: 'status', header: '状态', width: 80, render: row => row.status },
    { key: 'action', header: '操作', width: 112, render: row => <Button variant="secondary" onClick={() => setMessage(`已查看 ${row.id}`)}>查看记录</Button> },
  ];
  const columns = baseColumns.map(column => ({ ...column, sticky: fixed(column.key), stickyOffset: layout === 'offset' ? ({ id: 16, owner: 110, action: 12, status: 124 } as Record<string, number>)[column.key] : undefined }));
  return <section aria-label="固定列容器适配" className="ds-gap-top">
    <h3>固定列与实际容器</h3>
    <div className="ds-extension-controls">
      <Select label="固定列组合" value={layout} onChange={event => setLayout(event.target.value)}>
        <option value="left">单侧左固定</option><option value="right">单侧右固定</option><option value="both">双侧固定</option>
        <option value="multi">左右各两列</option><option value="offset">显式偏移</option><option value="all">全部业务列固定</option>
      </Select>
      <Select label="表格容器宽度" value={width} onChange={event => setWidth(event.target.value)}>
        <option value="auto">随宿主</option><option value="800">800px</option><option value="560">560px</option><option value="320">320px</option><option value="110">110px</option>
      </Select>
      <Select label="固定列表格状态" value={state} onChange={event => setState(event.target.value)}>
        <option value="ready">默认</option><option value="loading">刷新旧记录</option><option value="error">失败保留旧记录</option>
      </Select>
      <Checkbox label="选择与详情列" checked={auxiliary} onChange={event => setAuxiliary(event.target.checked)} />
    </div>
    <p className="ds-caption">固定列与一个完整正文列无法同时放入时，全部列改为横向滚动；容器恢复后重新固定。记录、选择和焦点保留。</p>
    <div style={{ width: '100%', maxWidth: width === 'auto' ? undefined : Number(width) }}>
      <Surface padding="none"><DataTable caption="容器适配记录" rows={rows} columns={columns} rowKey={row => row.id} rowLabel={row => row.name}
        loading={state === 'loading'} error={state === 'error' ? '连接失败，保留旧记录。' : undefined} onRetry={() => setState('ready')}
        selection={auxiliary ? { keys, onChange: setKeys } : undefined}
        expansion={auxiliary ? { keys: expanded, onChange: setExpanded, renderDetail: row => <p>{row.name} · 合成详情</p> } : undefined}
        stickyHeader maxHeight={320} /></Surface>
    </div>
    <p role="status">{message}；已选 {keys.join(', ') || '无'}</p>
  </section>;
}

export function TableStickyFixture() {
  const requested = new URLSearchParams(location.search).get('theme');
  const theme = themes.find(item => item.name === requested)?.name ?? 'rhine';
  return <ThemeProvider theme={theme}><main style={{ padding: 24 }}><Stack gap={4}><TableStickyGallery /></Stack></main></ThemeProvider>;
}
