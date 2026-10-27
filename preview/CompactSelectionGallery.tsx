import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Dialog, Icon, Inline, Menu, Select, Stack, Surface, Tabs, Text, Toolbar } from '../components';
import './compact-selection.css';

export function CompactSelectionGallery() {
  const [width, setWidth] = useState('880'), [scenario, setScenario] = useState('normal');
  const [selected, setSelected] = useState('a'), [pending, setPending] = useState<string | null>(null), [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState('alpha'), [draft, setDraft] = useState('alpha');
  const [dialogOwner, setDialogOwner] = useState('a');
  const [open, setOpen] = useState(false), [saving, setSaving] = useState(false), [saveError, setSaveError] = useState('');
  const [page, setPage] = useState('two'), [tab, setTab] = useState('one'), [layout, setLayout] = useState<'content' | 'fill'>('content');
  const request = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRequest = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const locked = useRef(false), saveLock = useRef(false);
  useEffect(() => () => { clearTimeout(request.current); clearTimeout(saveRequest.current); }, []);
  const choose = (id: string) => {
    if (locked.current || id === selected) return;
    locked.current = true; setPending(id); setError('');
    request.current = setTimeout(() => {
      if (scenario === 'error') setError('切换失败，保留最后确认项。'); else setSelected(id);
      locked.current = false; setPending(null);
    }, 700);
  };
  const changeOpen = (next: boolean) => {
    if (saveLock.current) return;
    setOpen(next); setDraft(confirmed); setSaveError(''); setPage('two');
  };
  const save = () => {
    if (saveLock.current || draft === confirmed) return;
    saveLock.current = true; setSaving(true); setSaveError('');
    saveRequest.current = setTimeout(() => {
      if (scenario === 'error') setSaveError('保存失败，请重试；确认值未改变。'); else setConfirmed(draft);
      saveLock.current = false; setSaving(false);
    }, 700);
  };
  const groupName = (value: string) => ({alpha:'示例组',beta:'联合研究组',none:'未绑定',unknown:'未知组'})[value] || value || '未选择';
  useEffect(() => { if (page !== 'loading') return; const timer = setTimeout(() => setPage('two'), 600); return () => clearTimeout(timer); }, [page]);
  const count = page === 'four' ? 4 : page === 'two' ? 2 : page === 'last' ? 1 : 0;
  const items = [
    { id:'a', name: scenario === 'long' ? '跨区域联合研究与长期设计验证的合成对象名称' : '合成对象 A', menu:false },
    { id:'b', name: scenario === 'long' ? '跨区域联合研究与长期设计验证的合成备用对象' : '合成对象 B', menu:true },
  ];
  return <section id="compact-selection"><Stack gap={6}>
    <Toolbar title="紧凑选择与预览保存" description="正文配对、稳定状态位和动作列；选择先预览，保存后才确认。">
      <Select label="组合宽度" value={width} onChange={e=>setWidth(e.target.value)}>{['400','520','880'].map(v=><option key={v}>{v}</option>)}</Select>
      <Select label="组合场景" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="normal">正常</option><option value="long">长名称与多行标签</option><option value="error">失败</option><option value="unbound">未绑定</option><option value="unknown">未知</option><option value="disabled">只读</option><option value="loading">加载</option></Select>
      <Select label="页签布局" value={layout} onChange={e=>setLayout(e.target.value as 'content'|'fill')}><option value="content">内容宽度左对齐</option><option value="fill">均分铺满</option></Select>
    </Toolbar>
    <div className="ds-compact-selection" style={{width:`${width}px`,maxWidth:'100%'}}>
      <Tabs label="选择摘要" layout={layout} value={tab} onValueChange={setTab} items={[
        {value:'one',label:'工作区',status:<Badge>{pending?'处理中':'可用'}</Badge>,content:<Text>合成身份完整展示在这里，不在页签重复第二行。</Text>},
        {value:'two',label:'备用区',status:<Badge>已停止</Badge>,content:<Text>备用区身份与说明。</Text>},
      ]}/>
      <div className="ds-compact-selection__cards">{items.map(item=><Surface key={item.id} padding="none" className="ds-choice-card" data-card={item.id}>
        <div className="ds-choice-card__info"><Inline gap={2}><Text as="h3" variant="heading">{item.name}</Text><span className="ds-choice-card__status">{selected===item.id?<Badge tone="success">当前项</Badge>:null}</span></Inline>
          <Text variant="caption" tone="muted">研究类型 · 合成额度 120</Text>
          <div className="ds-inline-choice"><Text variant="body">{scenario==='long'?'授权分组与跨区域研究范围':'授权分组'}</Text>
            <Dialog trigger={<Button variant="secondary" contentAlign="between" disabled={scenario==='disabled'} busy={scenario==='loading'} aria-label={`选择 ${item.name} 的授权分组`} style={{width:180,maxWidth:'100%'}} onClick={()=>{}}>{scenario==='unbound'?'未绑定':scenario==='unknown'?'未知组':groupName(confirmed)}<Icon name="chevronDown" /></Button>}
              title="分组选择" description="选择仅更新预览；保存后生效。" height={560} open={open && item.id===dialogOwner} onOpenChange={next=>{if(next) setDialogOwner(item.id);changeOpen(next);}}
              footer={<Inline style={{justifyContent:'flex-end'}}><Button busy={saving} disabled={draft===confirmed || !draft} onClick={save}>保存</Button></Inline>}
              sidePanel={<Stack gap={3}><Text as="h3" variant="heading">预览：{groupName(draft)}</Text><Text>已确认：{groupName(confirmed)}</Text><Select label="预览内容" value={page} onChange={e=>setPage(e.target.value)}><option value="two">两条</option><option value="four">四条</option><option value="last">末页一条</option><option value="empty">空组</option><option value="loading">异步加载</option><option value="error">读取错误</option></Select>
                {count>0?Array.from({length:count},(_,i)=><Text key={i}>合成记录 {i+1}：用于比较候选内容。{'长详情用于验证内部滚动。'.repeat(5)}</Text>):<Text role="status">{page==='loading'?'正在读取预览…':page==='error'?'预览读取失败，请重试。':'暂无记录'}</Text>}</Stack>}>
              <Stack gap={4}><Select label="候选分组" value={draft} disabled={saving} onChange={e=>setDraft(e.target.value)}><option value="">未选择</option><option value="alpha">示例组</option><option value="beta">联合研究组</option><option value="none">未绑定</option><option value="unknown">未知组</option></Select><Text role="status">{saving?'正在保存…':saveError}</Text></Stack>
            </Dialog>
          </div>
        </div>
        <div className="ds-choice-card__actions"><Dialog trigger={<Button variant="secondary" style={{width:64}}>详情</Button>} title={`${item.name}详情`} description="只读详情在其他写入处理中仍可访问。"><Text>纯合成记录。</Text></Dialog>
          {item.menu?<Menu label={`${item.name}操作`} trigger={<Button variant="secondary" style={{width:112}} disabled={!!pending && pending!==item.id} busy={pending===item.id}>切换操作</Button>} items={[{id:'choose',label:'设为当前项',disabled:!!pending||selected===item.id,onSelect:()=>choose(item.id)}]}/>:<Button style={{width:112}} busy={pending===item.id} disabled={selected===item.id||(!!pending&&pending!==item.id)} onClick={()=>choose(item.id)}>设为当前</Button>}
        </div>
      </Surface>)}</div>
      <Text role="status">{error}</Text>
      <Surface padding="none" className="ds-choice-card"><div><Text as="h3" variant="heading">永久不可用对象</Text><Text>已停用 · 无法切换，详情仍可访问。</Text></div><Dialog trigger={<Button variant="secondary" style={{width:64}}>详情</Button>} title="停用详情" description="原因保留可见。"><Text>合成停用原因。</Text></Dialog></Surface>
      <Surface><Stack gap={2}><Text as="h3" variant="heading">密度反例（不推荐）</Text><Inline><Text variant="caption">授权分组</Text><Button variant="secondary">示例组<Icon name="chevronDown" /></Button><Button variant="secondary">详情</Button></Inline><Text variant="caption">caption 12/18 辅助标签搭配标准按钮，文字份量失配。上方推荐行采用14/22标签和值，标题16/24保留层级，命中均不小于44px。</Text></Stack></Surface>
    </div>
  </Stack></section>;
}
