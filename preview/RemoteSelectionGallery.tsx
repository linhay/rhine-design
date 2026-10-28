import { useEffect, useRef, useState } from 'react';
import { Button, Checkbox, Dialog, Inline, RemoteMultiSelect, Select, Stack, Text, TextField, type Choice } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';

const choices: Choice[] = Array.from({ length: 12 }, (_, i) => ({ value: String(i), label: `合成人员 ${i + 1}${i === 0 ? ' · 跨团队长期协作与研究计划的详细名称' : ''}` }));

export function RemoteSelectionGallery() {
  const [scenario, setScenario] = useState('page-error');
  const [mounted, setMounted] = useState(true);
  return <Stack gap={3}>
    <Text as="h2" variant="heading">已选对象与远程分页</Text>
    <Text tone="muted">未发布主线示例；全部为合成数据，宿主负责查询、游标、取消和独立草稿。</Text>
    <Select label="模拟响应" value={scenario} onChange={event => setScenario(event.target.value)}>
      <option value="normal">正常分页</option><option value="first-error">首次失败</option><option value="page-error">下一页失败一次</option><option value="slow">慢响应与取消</option><option value="late">忽略取消的迟到响应</option>
    </Select>
    <Checkbox label="挂载选择器" checked={mounted} onChange={event => setMounted(event.target.checked)}/>
    {mounted && <RemoteSelectionExample key={scenario} scenario={scenario}/>}
    <Dialog trigger={<Button variant="secondary">弹窗分页</Button>} title="合成对象配置">
      <RemoteSelectionExample scenario={scenario}/>
    </Dialog>
  </Stack>;
}

export function RemoteSelectionExample({ scenario }: { scenario: string }) {
  const [query, setQuery] = useState(''), [options, setOptions] = useState<Choice[]>([]);
  const [selected, setSelected] = useState(choices.slice(0, 3)), [active, setActive] = useState('0');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [disabled, setDisabled] = useState(false), [readOnly, setReadOnly] = useState(false);
  const [loading, setLoading] = useState(false), [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string>(), [loadMoreError, setLoadMoreError] = useState<string>();
  const [cursor, setCursor] = useState(0), [hasMore, setHasMore] = useState(false), [requests, setRequests] = useState<string[]>([]);
  const pending = useRef(false), generation = useRef(0), controller = useRef<AbortController | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current.clear(); }, []);
  const attempted = useRef(new Set<string>());
  const request = (start: number) => {
    if (pending.current) return;
    pending.current = true;
    const revision = generation.current, abort = new AbortController(); controller.current = abort;
    setRequests(current => [...current, `${query || '全部'}:${start}`]);
    if (start) { setLoadingMore(true); setLoadMoreError(undefined); } else { setLoading(true); setError(undefined); }
    // This local transport demonstrates a server page, including a response that ignores abort.
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (revision !== generation.current || (abort.signal.aborted && scenario !== 'late')) return;
      const key = `${query}:${start}`;
      const fail = !attempted.current.has(key) && ((scenario === 'first-error' && start === 0) || (scenario === 'page-error' && start > 0));
      attempted.current.add(key); pending.current = false; setLoading(false); setLoadingMore(false);
      if (fail) { (start ? setLoadMoreError : setError)('合成请求失败，请重试'); return; }
      const matches = choices.filter(item => item.label.includes(query)), next = matches.slice(start, start + 5);
      setOptions(current => start ? [...new Map([...current, ...next].map(item => [item.value, item])).values()] : next);
      setCursor(start + next.length); setHasMore(start + next.length < matches.length);
    }, scenario === 'late' ? (query ? 200 : 1200) : scenario === 'slow' ? 900 : 180);
    timers.current.add(timer);
    abort.signal.addEventListener('abort', () => { if (scenario !== 'late') { clearTimeout(timer); timers.current.delete(timer); } }, { once: true });
  };
  useEffect(() => {
    generation.current++; controller.current?.abort(); pending.current = false;
    setOptions([]); setCursor(0); setHasMore(false); setLoadMoreError(undefined); setLoadingMore(false);
    if (!disabled && !readOnly) request(0);
    return () => { generation.current++; controller.current?.abort(); pending.current = false; };
  }, [query, disabled, readOnly]);
  const changeSelection = (next: Choice[]) => { setSelected(next); if (!next.some(item => item.value === active)) setActive(next[0]?.value ?? ''); };
  return <Stack gap={2}>
    <Inline><Checkbox label="禁用选择器" checked={disabled} onChange={event => setDisabled(event.target.checked)}/><Checkbox label="只读选择器" checked={readOnly} onChange={event => setReadOnly(event.target.checked)}/></Inline>
    <RemoteMultiSelect label="合成授权对象" query={query} onQueryChange={setQuery} value={selected} onValueChange={changeSelection} options={options}
      maxVisibleTags={2} activeValue={active} onActivateValue={item => setActive(item.value)} disabled={disabled} readOnly={readOnly}
      loading={loading} error={error} hasMore={hasMore} loadingMore={loadingMore} loadMoreError={loadMoreError}
      onLoadMore={() => request(cursor)} onRetry={() => request(error ? 0 : cursor)}/>
    {active && <TextField label="当前对象草稿" value={drafts[active] ?? ''} onChange={event => setDrafts(current => ({ ...current, [active]: event.target.value }))}/>}
    <Text>当前对象：{active || '无'}</Text><Text>请求记录：{requests.join(' → ')}</Text>
    <Button variant="secondary" onClick={() => setDrafts({})}>重置合成草稿</Button>
  </Stack>;
}

export function RemoteSelectionFixture() {
  const params = new URLSearchParams(location.search), zoom = Number(params.get('zoom')) || 1;
  useEffect(() => { document.documentElement.style.zoom = String(zoom); return () => { document.documentElement.style.zoom = ''; }; }, [zoom]);
  return <ThemeProvider theme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') || 'system'}><div style={{ padding: 12 }}><RemoteSelectionGallery/></div></ThemeProvider>;
}
