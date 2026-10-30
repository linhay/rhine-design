import { useState } from 'react';
import { Badge, Button, Dialog, IconButton, Inline, KeyValue, Select, Stack, Surface, Tabs, Text, TextField, Toolbar } from '../components';

export function SummaryTabsGallery() {
  const [layout, setLayout] = useState<'content' | 'full' | 'fill'>('content');
  const [single, setSingle] = useState(false);
  const [width, setWidth] = useState('520');
  const [scenario, setScenario] = useState('normal');
  const [selected, setSelected] = useState('primary');
  const [actionTab, setActionTab] = useState('projects');
  const [created, setCreated] = useState(2);
  const [refreshes, setRefreshes] = useState(0);
  const [actionDetails, setActionDetails] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const pending = scenario === 'loading', failed = scenario === 'error';
  return <section id="summary-tabs"><Stack gap={6}>
    <Toolbar title="带摘要的页签" description="名称与状态在同一组，身份摘要紧随；每个对象的状态始终可见。">
      <Select label="摘要布局" value={layout} onChange={e=>setLayout(e.target.value as 'content'|'full'|'fill')}><option value="content">内容宽度左对齐</option><option value="full">满栏内容靠左</option><option value="fill">均分铺满</option></Select>
      <Select label="摘要行数" value={single?'single':'double'} onChange={e=>setSingle(e.target.value==='single')}><option value="single">名称与短状态</option><option value="double">双行摘要</option></Select>
      <Select label="局部容器宽度" value={width} onChange={event => setWidth(event.target.value)}>
        <option value="320">320px · 窄容器</option><option value="520">520px · 标准</option><option value="100%">自适应</option>
      </Select>
      <Select label="摘要页签场景" value={scenario} onChange={event => {setScenario(event.target.value); if(event.target.value === 'disabled') setSelected('primary');}}>
        <option value="normal">正常</option><option value="loading">读取中</option><option value="error">读取失败</option><option value="disabled">禁用</option><option value="long">长身份与名称</option>
      </Select>
    </Toolbar>
    <TabsLayoutComparison />
    <Surface><Stack gap={6}>
      <div style={{width: width === '100%' ? width : `${width}px`, maxWidth:'100%'}}>
        <Tabs layout={layout === 'full' ? 'content' : layout} fullWidth={layout === 'full'} label="摘要页签规范示例" value={selected} onValueChange={setSelected} items={[
          {value:'primary',label:scenario === 'long' ? '跨部门联合研究工作区' : '主工作区',description:single ? undefined : pending ? '尚未读取当前身份' : scenario === 'long' ? '研究项目 · 跨区域联合研发与长期设计验证团队' : '研发 · 研究项目',
            status:<Badge tone={failed ? 'error' : pending ? 'neutral' : 'success'}>{failed ? '读取失败' : pending ? '读取中' : '同步中'}</Badge>,
            content:<Stack gap={4}><Text>主工作区内容</Text><TextField label="主工作区草稿" placeholder="切换后保留已输入内容"/></Stack>},
          {value:'team',label:'协作工作区',description:single ? undefined : '协作 · 设计项目',disabled:scenario === 'disabled',status:<Badge>{scenario === 'disabled' ? '暂不可用' : '已停止'}</Badge>,
            content:<Stack gap={4}><Text>协作工作区内容</Text><TextField label="协作工作区草稿" placeholder="与另一页签独立"/></Stack>},
        ]}/>
      </div>
      <Text variant="caption" tone="muted">先输入草稿，再使用左右方向键或 Home / End 切换。场景与主题变化不清空面板。</Text>
    </Stack></Surface>
    <Surface><Stack gap={4}><Text as="h2" variant="heading">页签栏内部操作</Text>
      <Select label="操作页签样式" value={actionDetails ? 'detailed' : 'plain'} onChange={event => setActionDetails(event.target.value === 'detailed')}><option value="detailed">摘要页签</option><option value="plain">普通页签</option></Select>
      <Text variant="caption" tone="muted">分隔线贯穿整栏；图标保留44px点击区，相邻透明命中范围不重叠。操作不属于tablist，方向键只切换页签。</Text>
      <div style={{ width: width === '100%' ? width : `${width}px`, maxWidth: '100%' }}>
        <Tabs label="栏内操作示例" fullWidth value={actionTab} onValueChange={setActionTab} actions={<Inline style={{ gap: 0 }}><Dialog open={createOpen} onOpenChange={setCreateOpen} title="新增项目示例" description="仅使用本地合成数据。关闭后返回新增按钮。" trigger={<IconButton label="新增示例" title="新增示例" icon="plus" disabled={scenario === 'disabled'}/>}><Stack gap={4}><TextField label="新项目名称"/><Button onClick={() => { setCreated(value => value + 1); setCreateOpen(false); }}>确认新增示例</Button></Stack></Dialog><IconButton label="刷新示例" title="刷新示例" icon="refresh" busy={pending} disabled={scenario === 'disabled'} onClick={() => setRefreshes(value => value + 1)}/></Inline>} items={[
          { value: 'projects', label: scenario === 'long' ? '跨区域长期协作项目' : '项目', description: actionDetails ? (scenario === 'long' ? '跨区域研究与设计协作的长期项目身份' : '研究与设计') : undefined, status: actionDetails ? <Text as="span" variant="caption" numeric>{created}</Text> : undefined, content: <Stack gap={4}><TextField label="项目操作草稿"/><Text>本地项目 {created} 个；已模拟刷新 {refreshes} 次</Text></Stack> },
          { value: 'teams', label: '协作', disabled: scenario === 'disabled', content: <TextField label="协作操作草稿"/> },
        ]}/>
      </div>
    </Stack></Surface>
    <Surface><Stack gap={4}><Text as="h2" variant="heading">尺寸与层级</Text><KeyValue items={[
      {key:'title',label:'名称',value:'14 / 22 · 600'}, {key:'description',label:'身份摘要',value:'12 / 18 · 400'},
      {key:'padding',label:'上下内距',value:'12px / 12px'}, {key:'status',label:'名称到状态',value:'8px'},
      {key:'identity',label:'名称组到摘要',value:'4px'}, {key:'tabs',label:'页签之间',value:'16px'},
      {key:'panel',label:'分隔线到面板',value:'24px'}, {key:'selected',label:'选中指示线',value:'2px，覆盖当前页签宽度'},
    ]}/><Text variant="caption" tone="muted">状态复用 Badge，各主题保留自己的文字与边框；不固定总高度。</Text></Stack></Surface>
  </Stack></section>;
}


const tabLayouts = [
  { id: 'content', title: '内容宽度', description: '栏与选项随内容收缩。', layout: 'content', fullWidth: false },
  { id: 'full', title: '满栏靠左', description: '整栏铺满正文，文字与指示线按内容靠左。', layout: 'content', fullWidth: true },
  { id: 'fill', title: '等分铺满', description: '选项均分栏宽；简洁标签居中。', layout: 'fill', fullWidth: false },
] as const;

function TabsLayoutComparison() {
  const [long, setLong] = useState(false);
  const [selected, setSelected] = useState('current');
  return <Surface><Stack gap={4}>
    <Toolbar title="三种页签布局" description="栏宽、选项分配、文字对齐和指示线范围分别判断；满栏不意味着等分。">
      <Select label="布局对比标签" value={long ? 'long' : 'normal'} onChange={event => setLong(event.target.value === 'long')}>
        <option value="normal">简洁标签</option><option value="long">长标签</option>
      </Select>
    </Toolbar>
    <div className="ds-tabs-layout-comparison">
      {tabLayouts.map(example => <section key={example.id} data-tabs-layout={example.id}>
        <Stack gap={3}>
          <Text as="h3" variant="heading">{example.title}</Text>
          <Text variant="caption" tone="muted">{example.description}</Text>
          <Tabs label={example.title} layout={example.layout} fullWidth={example.fullWidth} value={selected} onValueChange={setSelected} items={[
            { value: 'current', label: '当前对象', content: <TextField label={`${example.title}草稿`} placeholder="切换后仍保留" /> },
            { value: 'disabled', label: '暂不可用', disabled: true, content: null },
            { value: 'custom', label: long ? '自定义权限范围与跨部门联合协作设置ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '自定义范围', content: <Text>自定义范围正文；仅使用合成内容。</Text> },
          ]} />
        </Stack>
      </section>)}
    </div>
    <Text variant="caption" tone="muted">三组由同一受控值同步切换，草稿分别保留。方向键与 Home / End 跳过禁用项；窄屏自然换行。</Text>
  </Stack></Surface>;
}
