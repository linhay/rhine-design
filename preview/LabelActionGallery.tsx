import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Dialog, Inline, RemoteMultiSelect, Select, Stack, Text, TextField, type Choice } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

const directory: Choice[] = Array.from({ length: 8 }, (_, i) => ({ value: `item-${i}`, label: `合成目录对象 ${i + 1}` }));
export const directoryLabel = '可授权的合成目录对象与跨团队长期协作计划';
export const directoryAction = '获取候选目录与最新可用对象';

export function LabelActionExample() {
  const [scenario, setScenario] = useState('success'), [query, setQuery] = useState('');
  const [options, setOptions] = useState(directory.slice(0, 3)), [value, setValue] = useState(directory.slice(0, 1));
  const [draft, setDraft] = useState('保留的合成草稿'), [limit, setLimit] = useState(3);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('尚未获取目录');
  const [disabled, setDisabled] = useState(false), [readOnly, setReadOnly] = useState(false);
  const revision = useRef(0), pending = useRef(false), abort = useRef<AbortController | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>()), failed = useRef(false);
  const cancel = () => { revision.current++; abort.current?.abort(); pending.current = false; setBusy(false); };
  useEffect(() => () => { revision.current++; abort.current?.abort(); timers.current.forEach(clearTimeout); timers.current.clear(); }, []);
  useEffect(() => { if (disabled || readOnly) { cancel(); setMessage('目录操作不可用，已有选择与草稿保留'); } }, [disabled, readOnly]);
  const fetchDirectory = () => {
    if (pending.current || disabled || readOnly) return;
    pending.current = true; setBusy(true); setMessage('正在获取目录');
    const generation = ++revision.current, controller = new AbortController(); abort.current = controller;
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (generation !== revision.current || controller.signal.aborted) return;
      pending.current = false; setBusy(false);
      if (scenario === 'failure' && !failed.current) { failed.current = true; setMessage('获取失败，已有候选、选择与草稿保留；可重试'); return; }
      setOptions(scenario === 'empty' ? [] : directory); setLimit(3);
      setMessage(scenario === 'empty' ? '目录为空，已有选择与草稿保留' : '目录已更新，未改变选择与草稿');
    }, scenario === 'late' ? 1200 : 500);
    timers.current.add(timer);
    // The late scenario deliberately ignores transport cancellation; generation still rejects it.
    controller.signal.addEventListener('abort', () => { if (scenario !== 'late') { clearTimeout(timer); timers.current.delete(timer); } }, { once: true });
  };
  const matches = options.filter(item => item.label.includes(query));
  return <form onSubmit={event => { event.preventDefault(); setMessage('表单已显式提交'); }}><Stack gap={2}>
    <Select label="目录响应" value={scenario} onChange={event => { cancel(); failed.current = false; setScenario(event.target.value); setMessage('已切换合成响应，已有草稿保留'); }}>
      <option value="success">成功</option><option value="failure">失败一次后重试</option><option value="empty">空目录</option><option value="late">忽略取消的慢响应</option>
    </Select>
    <Inline><Checkbox label="禁用目录字段" checked={disabled} onChange={event => setDisabled(event.target.checked)}/><Checkbox label="只读目录字段" checked={readOnly} onChange={event => setReadOnly(event.target.checked)}/></Inline>
    <RemoteMultiSelect label={directoryLabel} labelAction={<Button variant="secondary" busy={busy} busyLabel="正在获取目录" disabled={disabled || readOnly} onClick={fetchDirectory}>{directoryAction}</Button>}
      value={value} onValueChange={setValue} query={query} onQueryChange={next => { setQuery(next); setLimit(3); }} options={matches.slice(0, limit)}
      disabled={disabled} readOnly={readOnly} hasMore={limit < matches.length} onLoadMore={() => setLimit(current => current + 3)} />
    <Text role="status" aria-label="目录获取结果">{message}</Text>
    <Button variant="quiet" disabled={!busy} onClick={() => { cancel(); setMessage('已取消获取，已有候选、选择与草稿保留'); }}>取消获取目录</Button>
    <TextField label="目录对象草稿" value={draft} onChange={event => setDraft(event.target.value)}/>
    <Dialog title="检查目录草稿" trigger={<Button variant="secondary">检查草稿</Button>}><Text>{draft}</Text><Button>继续检查</Button></Dialog>
    <Button type="submit" variant="secondary">显式提交合成表单</Button>
  </Stack></form>;
}

export function LabelActionGallery() {
  const [mounted, setMounted] = useState(true);
  return <Stack gap={3}><Text as="h2" variant="heading">字段标题附属动作</Text><Text tone="muted">未发布源码示例；合成目录由宿主获取，只更新候选，保留已有选择和草稿。</Text>
    <Checkbox label="挂载目录示例" checked={mounted} onChange={event => setMounted(event.target.checked)}/>
    {mounted && <LabelActionExample/>}
    <Dialog title="目录配置工作区" trigger={<Button variant="secondary">打开目录工作区</Button>}><LabelActionExample/></Dialog>
  </Stack>;
}
export function LabelActionFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'system'}><div style={{ padding: 12 }}><LabelActionGallery/></div></ThemeProvider>;
}
