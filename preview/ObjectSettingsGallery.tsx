import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Checkbox, Dialog, Inline, Notice, RemoteMultiSelect, Select, SettingsNavigation, Skeleton, Stack, Surface, Text, TextField, type Choice } from '../components';
import './object-settings-gallery.css';

type Section = 'allocation' | 'model' | 'schedule';
type FormState = { ready: boolean; dirty: boolean; busy: boolean };
const sections: { id: Section; label: string }[] = [{ id:'allocation',label:'分配' },{ id:'model',label:'模型' },{ id:'schedule',label:'调度' }];
const initial = { allocation:[{ value:'synthetic-a',label:'合成人员甲' }] as Choice[],model:'合成模型 A',schedule:'daily' };
const idle: FormState = { ready:false,dirty:false,busy:false };

// The child reports in layout, before its completion feedback can be painted.
function AllocationForm({ value, ready, failure, onSaved, report }: { value:Choice[]; ready:boolean; failure:boolean; onSaved:(value:Choice[])=>void; report:(state:FormState)=>void }) {
  const [draft, setDraft] = useState(value), [saved, setSaved] = useState(value);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(false), [query, setQuery] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), pending = useRef(false);
  const failNext = useRef(failure);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useLayoutEffect(() => report({ ready,dirty,busy }), [report,ready,dirty,busy]);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <form id="rhine-object-allocation" onSubmit={event => {
    event.preventDefault(); if (!ready || !dirty || pending.current) return;
    pending.current = true; setBusy(true); setMessage(''); setError(false); const submitted = draft;
    timer.current = setTimeout(() => {
      if (failNext.current) { failNext.current = false; setError(true); setMessage('分配保存失败，草稿已保留'); }
      else { setSaved(submitted); onSaved(submitted); setMessage('分配已保存（合成）'); }
      pending.current = false; setBusy(false);
    }, 350);
  }}><Stack gap={2}>
    {!ready ? <Skeleton label="正在读取对象设置与已选姓名" /> : <RemoteMultiSelect label="分配人员" value={draft} query={query} onQueryChange={setQuery} disabled={busy}
      options={[...initial.allocation,{value:'synthetic-b',label:'合成人员乙'}].filter(item=>item.label.includes(query))}
      onValueChange={value=>{setDraft(value);setMessage('');}} />}
    {dirty && <Text role="status">分配有未保存修改</Text>}
    {message && (error ? <Notice tone="error" title={message} /> : <Text role="status" data-allocation-success>{message}</Text>)}
  </Stack></form>;
}

export function ObjectSettingsGallery() {
  const [open, setOpen] = useState(false), [section, setSection] = useState<Section>('allocation'), [confirm, setConfirm] = useState(false);
  const [bulk, setBulk] = useState(false), [readonly, setReadonly] = useState(false), [failure, setFailure] = useState(false), [readFailure, setReadFailure] = useState(false), [external, setExternal] = useState(false);
  const [long, setLong] = useState(false), [quotaLoading, setQuotaLoading] = useState(false);
  const [ready, setReady] = useState(false), [readError, setReadError] = useState(false), [notification, setNotification] = useState('未读取');
  const [allocation, setAllocation] = useState(initial.allocation), [allocationState, setAllocationState] = useState<FormState>(idle);
  const allocationRef = useRef(idle), closeOrigin = useRef<HTMLElement | null>(null);
  const [model, setModel] = useState(initial.model), [savedModel, setSavedModel] = useState(initial.model);
  const [schedule, setSchedule] = useState(initial.schedule), [savedSchedule, setSavedSchedule] = useState(initial.schedule);
  const [message, setMessage] = useState('');
  const externalTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const readTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), notificationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(readTimer.current); clearTimeout(notificationTimer.current); clearTimeout(externalTimer.current); }, []);
  const report = useCallback((state:FormState) => { allocationRef.current = state; setAllocationState(state); }, []);
  const supportsAllocation = !bulk && !readonly;
  const busy = external || allocationState.busy;
  const dirty = allocationState.dirty || model !== savedModel || schedule !== savedSchedule;
  const close = () => {
    clearTimeout(readTimer.current); clearTimeout(notificationTimer.current); clearTimeout(externalTimer.current);
    setNotification(current=>current.startsWith('读取中') ? '当前读取已取消（合成）' : current);
    setOpen(false);
  };
  const requestClose = () => {
    if (external || allocationRef.current.busy) return;
    if (allocationRef.current.dirty || model !== savedModel || schedule !== savedSchedule) { closeOrigin.current = document.activeElement as HTMLElement; setConfirm(true); }
    else close();
  };
  const enter = () => {
    clearTimeout(externalTimer.current);
    if (external) externalTimer.current = setTimeout(() => setExternal(false), 700);
    setSection(supportsAllocation ? 'allocation' : 'model'); setOpen(true); setReady(false); setReadError(false); setMessage('');
    allocationRef.current = idle; setAllocationState(idle); setModel(savedModel); setSchedule(savedSchedule);
    clearTimeout(readTimer.current); clearTimeout(notificationTimer.current); setNotification('读取中（合成慢请求）');
    // Independent reads: the unrelated notification never gates form readiness.
    readTimer.current = setTimeout(() => { setReadError(readFailure); setReady(!readFailure); }, 100);
    notificationTimer.current = setTimeout(() => setNotification('读取失败（合成），不影响对象设置'), 2000);
  };
  return <Stack gap={3} data-object-settings-gallery>
    <Text as="h2" variant="section">同一对象的设置分区</Text>
    <Text tone="muted">合成内存示例；姓名随设置返回，候选仅模拟查询，不访问真实目录或服务。</Text>
    <Inline gap={2}>
      <Checkbox label="批量入口" checked={bulk} onChange={e=>setBulk(e.target.checked)} />
      <Checkbox label="只读入口" checked={readonly} onChange={e=>setReadonly(e.target.checked)} />
      <Checkbox label="模拟分配首次保存失败" checked={failure} onChange={e=>setFailure(e.target.checked)} />
      <Checkbox label="模拟设置读取失败" checked={readFailure} onChange={e=>setReadFailure(e.target.checked)} />
      <Checkbox label="外部动作执行中" checked={external} onChange={e=>setExternal(e.target.checked)} />
      <Checkbox label="跨年日期与长异常状态" checked={long} onChange={e=>setLong(e.target.checked)} />
      <Checkbox label="额度加载占位" checked={quotaLoading} onChange={e=>setQuotaLoading(e.target.checked)} />
    </Inline>
    <Surface><Stack gap={2}>
      <Text as="h3" variant="heading">合成资源 A</Text>
      <div className="rhine-object-metadata" role="region" aria-label="资源日期与分发状态" tabIndex={0}>
        <Inline gap={2} style={{ flexWrap:'nowrap',width:'max-content' }}>
          <Text title="创建 2025-12-31 · 更新 2026-01-02 · 上海时间"><span aria-hidden="true">2025-12-31 → 2026-01-02</span><span className="rhine-sr-only">创建于2025年12月31日，更新于2026年1月2日，上海时间</span></Text>
          <Text title={long ? '分发异常：目录成员已变化，部分接收人权限待重新确认' : '分发状态：已分配'}><span aria-hidden="true">{long ? '分发异常：目录成员已变化，部分接收人权限待重新确认' : '已分配'}</span><span className="rhine-sr-only">{long ? '分发异常：目录成员已变化，部分接收人权限待重新确认' : '分发状态：已分配'}</span></Text>
        </Inline>
      </div>
      <div className="rhine-object-quota" aria-busy={quotaLoading || undefined} data-object-quota>
        <Stack gap={1} aria-hidden={quotaLoading || undefined} inert={quotaLoading || undefined} style={{gridArea:'1 / 1',visibility:quotaLoading ? 'hidden' : undefined}}><Text>可用额度</Text><Text>128.00 USD</Text></Stack>
        {quotaLoading && <div style={{gridArea:'1 / 1'}}><Skeleton lines={2} label="正在读取可用额度" /></div>}
      </div>
      <Text tone="muted">已保存分配：{allocation.map(item=>item.label).join('、') || '未分配'} · 模型：{savedModel} · 调度：{savedSchedule === 'daily' ? '每日' : '手动'}</Text>
      <Dialog title={bulk ? '批量资源设置' : '合成资源 A · 设置'} height={640} open={open} onOpenChange={next=>{if(next) enter();else requestClose();}} trigger={<Button variant="secondary">对象设置</Button>}
        navigation={<SettingsNavigation label="对象设置栏目" currentId={section} items={sections.filter(item=>supportsAllocation || item.id!=='allocation')} disabled={busy || confirm} onNavigate={item=>{setSection(item.id as Section);setMessage('');}} />}
        footer={<>
          <Button variant="secondary" disabled={busy} onClick={requestClose}>关闭</Button>
          {!readonly && <Button type={section==='allocation' ? 'submit' : 'button'} form={section==='allocation' ? 'rhine-object-allocation' : undefined} busy={busy} disabled={!ready || !(section==='allocation' ? allocationState.dirty : section==='model' ? model!==savedModel : schedule!==savedSchedule)} onClick={()=>{
            if (section==='allocation' || busy) return;
            if(section==='model') setSavedModel(model);else setSavedSchedule(schedule);
            setMessage(`${section==='model'?'模型':'调度'}已保存（合成）`);
          }}>保存当前分区</Button>}
        </>}>
        <Dialog title="放弃未保存修改？" onCloseAutoFocus={event=>{event.preventDefault();if(open) closeOrigin.current?.focus();}} open={confirm} onOpenChange={setConfirm} trigger={<span hidden />} footer={<><Button variant="secondary" onClick={()=>setConfirm(false)}>继续编辑</Button><Button variant="danger" onClick={()=>{setConfirm(false);close();}}>放弃并关闭</Button></>}><Text>已独立保存的分区不受影响。</Text></Dialog>
        <Stack gap={2}>
          {readError && <Notice tone="error" title="对象设置读取失败" action={<Button variant="secondary" onClick={enter}>重试读取设置</Button>}>未确认的设置不能编辑或显示为读取成功。</Notice>}
          {supportsAllocation && <div hidden={section!=='allocation' || readError} inert={section!=='allocation' || undefined}><AllocationForm value={allocation} ready={ready} failure={failure} onSaved={setAllocation} report={report} /></div>}
          {!ready && !readError && section!=='allocation' && <Skeleton label="正在读取对象设置" />}
          <div hidden={section!=='model' || !ready} inert={section!=='model' || undefined}><TextField label="模型名称" value={model} disabled={!ready || busy} readOnly={readonly} onChange={e=>{setModel(e.target.value);setMessage('');}} /></div>
          <div hidden={section!=='schedule' || !ready} inert={section!=='schedule' || undefined}><Select label="执行调度" value={schedule} disabled={!ready || busy || readonly} onChange={e=>{setSchedule(e.target.value);setMessage('');}}><option value="daily">每日</option><option value="manual">手动</option></Select></div>
          {message && <Text role="status">{message}</Text>}
          {busy && <Text role="status">正在执行，请稍候</Text>}
          {dirty && <Text tone="muted">有未保存修改</Text>}
        </Stack>
      </Dialog>
    </Stack></Surface>
    <Text role="status" data-notification-read>无关通知：{notification}</Text>
  </Stack>;
}
