import { useId, useState, type ReactNode } from 'react';
import { Button, Checkbox, DataTable, Dialog, Form, Grid, Inline, KeyValue, Select, Stack, Surface, Text, TextField, type DataColumn } from '../components';
import './spacing-density.css';

type Layout = 'framed' | 'grouped';
type Settings = { name: string; timezone: string; frequency: string; failures: boolean };
const defaultSettings: Settings = {name:'研究工作区',timezone:'shanghai',frequency:'daily',failures:true};

function SettingGroup({title, boxed, children}: {title: string; boxed: boolean; children: ReactNode}) {
  const id = useId();
  return <section className="ds-density-setting-group" data-boxed={boxed} aria-labelledby={id}>
    <Stack gap={3}><Text as="h4" variant="heading" id={id}>{title}</Text>{children}</Stack>
  </section>;
}

function SettingsExample({layout}: {layout: Layout}) {
  const id = useId();
  const [draft,setDraft] = useState(defaultSettings), [saved,setSaved] = useState(defaultSettings);
  const [error,setError] = useState(''), [confirmation,setConfirmation] = useState('');
  const dirty = Object.keys(draft).some(key => draft[key as keyof Settings] !== saved[key as keyof Settings]);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft(current => ({...current,[key]:value}));setConfirmation('');if(key==='name')setError('');
  };
  const save = () => {
    if (!draft.name.trim()) {setError('请输入工作区名称。');setConfirmation('');document.getElementById(id+'-name')?.focus();return;}
    if (!dirty) {setConfirmation('没有需要保存的修改。'); return;}
    setSaved(draft);setError('');setConfirmation('已保存到本地演示。');
  };
  return <section aria-labelledby={id}><Surface><Stack gap={6}>
    <Stack gap={2}><Text id={id} as="h3" variant="section">工作区设置</Text><Text tone="muted">配置工作区身份和通知。只保存演示状态。</Text></Stack>
    <Form label="工作区设置表单" noValidate onSubmit={save}><Stack gap={6}>
      <SettingGroup title="工作区信息" boxed={layout==='framed'}>
        <Grid minWidth={230} gap={4}>
          <TextField id={id+'-name'} label="工作区名称" required value={draft.name} error={error||undefined} onChange={event=>update('name',event.target.value)} />
          <Select label="显示时区" value={draft.timezone} onChange={event=>update('timezone',event.target.value)}><option value="shanghai">上海（UTC+8）</option><option value="utc">协调世界时（UTC）</option></Select>
        </Grid>
      </SettingGroup>
      <SettingGroup title="通知" boxed={layout==='framed'}>
        <Grid minWidth={230} gap={4}>
          <Select label="汇总频率" value={draft.frequency} onChange={event=>update('frequency',event.target.value)}><option value="daily">每天</option><option value="weekly">每周</option></Select>
          <Checkbox label="通知中包含最终失败的记录" checked={draft.failures} onChange={event=>update('failures',event.target.checked)} />
        </Grid>
      </SettingGroup>
      <Stack gap={3}>
        <Text role="status" tone="muted">{confirmation||(dirty?'有未保存的修改。':'无未保存的修改。')}</Text>
        <Inline gap={2}>
          <Button type="submit">保存设置</Button>
          <Button variant="secondary" onClick={()=>{setDraft(saved);setError('');setConfirmation('已恢复上次保存的设置。');}}>撤销修改</Button>
        </Inline>
      </Stack>
    </Stack></Form>
  </Stack></Surface></section>;
}

const sampleRows = [
  { id:'daily', name:'每日同步记录', status:'已核对', requests:128 },
  { id:'cross', name:'跨部门协作与访问权限核对', status:'待复核', requests:42 },
  { id:'weekly', name:'每周用量汇总', status:'已核对', requests:306 },
] as const;
type Row = typeof sampleRows[number];
const columns: DataColumn<Row>[] = [
  {key:'name',header:'记录',rowHeader:true,render:row=>row.name},
  {key:'status',header:'处理状态',render:row=>row.status},
  {key:'requests',header:'请求数',align:'right',render:row=>row.requests.toLocaleString('zh-CN')},
];

function DataExample({layout}: {layout: Layout}) {
  const id = useId(), rowActionId = (row: Row) => id+'-'+row.id;
  const [filter,setFilter] = useState('all'), [selected,setSelected] = useState<string[]>([]);
  const [detail,setDetail] = useState<Row | null>(null), [open,setOpen] = useState(false);
  const rows = sampleRows.filter(row=>filter==='all'||filter===row.status);
  return <section aria-labelledby={id}><Stack gap={6}>
    <Stack gap={2}><Text id={id} as="h3" variant="section">同步记录</Text><Text tone="muted">筛选后仍保留已选项；详情仅供查看。</Text></Stack>
    <Stack gap={4}>
      <Inline gap={3} className="ds-density-filter">
        <Select id={id+'-filter'} label="按状态筛选" value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">全部</option><option value="已核对">已核对</option><option value="待复核">待复核</option></Select>
        <Text role="status" tone="muted">显示 {rows.length} 条 · 已选 {selected.length} 条（含其他状态）</Text>
      </Inline>
      <Surface padding={layout==='framed'?'default':'none'} data-density-table-surface>
        <DataTable caption="同步记录表" captionVisibility="hidden" columns={columns} rows={rows} rowKey={row=>row.id} rowLabel={row=>row.name}
          selection={{keys:selected,onChange:setSelected}} rowAction={{id:rowActionId,label:row=>'查看详情：'+row.name,onActivate:row=>{setDetail(row);setOpen(true);}}}/>
      </Surface>
    </Stack>
    <Dialog title={detail?'记录详情：'+detail.name:'记录详情'} open={open} onOpenChange={setOpen}
      returnFocus={()=>(detail ? document.getElementById(rowActionId(detail)) : null) ?? document.getElementById(id+'-filter')}>
      {detail&&<KeyValue items={[{key:'name',label:'记录',value:detail.name},{key:'status',label:'处理状态',value:detail.status},{key:'requests',label:'请求数',value:String(detail.requests)}]} />}
    </Dialog>
  </Stack></section>;
}

export function SpacingDensityComparison() {
  const [layout,setLayout] = useState<Layout>('grouped');
  return <section aria-labelledby="spacing-density-title" data-density-comparison={layout}><Stack gap={6}>
    <Stack gap={2}>
      <Text as="h2" variant="section" id="spacing-density-title">设置与数据列表 · 布局密度对照</Text>
      <Text tone="muted">默认采用 B，仅调整外框和留白。切到 A 对照时，表单草稿、筛选和已选项会保留；两版不缩字、不缩小操作范围。</Text>
    </Stack>
    <Inline gap={3} className="ds-density-filter">
      <Select label="对照布局" value={layout} onChange={event=>setLayout(event.target.value==='grouped'?'grouped':'framed')}>
        <option value="framed">对照 A · 分组有框</option><option value="grouped">B · 留白分组（默认）</option>
      </Select>
      <Text variant="caption" tone="muted">B 去掉设置内框和表格外围内距，内容、字号及操作相同。</Text>
    </Inline>
    <SettingsExample layout={layout} />
    <DataExample layout={layout} />
  </Stack></section>;
}
