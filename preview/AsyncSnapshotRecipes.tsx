import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Checkbox, CopyButton, DataTable, EmptyState, Grid, Inline, Notice, Select, Skeleton, Stack, Surface, Tabs, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { accessKinds, CompactDates, OwnershipLabels } from './ListCardRecipes';
import { syntheticRecipeRead, useAsyncSnapshotRecipe, type RecipeSnapshot } from './asyncSnapshotRecipe';
import './async-snapshot-recipes.css';

export const moduleNames = ['身份', '额度', '时间与状态', '历史', '费用', '操作'];

function ModuleSlot({ index, loading, children }: { index: number; loading: boolean; children?: ReactNode }) {
  return <div className={`rhine-async-slot rhine-async-slot--${index}`} data-module={index} aria-busy={loading || undefined}>
    <div className="rhine-async-slot-content" style={loading ? { visibility:'hidden' } : undefined} aria-hidden={loading || undefined} inert={loading || undefined}>{children}</div>
    {loading && <div className="rhine-async-slot-skeleton"><Skeleton label={`正在读取${moduleNames[index]}`} lines={index === 0 ? 3 : 2} /></div>}
  </div>;
}

export function AsyncResourceCard({ kind, loading = 'none', long = false, partial = false, fieldPending = false, first = false }: { kind: string; loading?: string; long?: boolean; partial?: boolean; fieldPending?: boolean; first?: boolean }) {
  const [objectState, setObjectState] = useState('idle');
  const objectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(objectTimer.current), []);
  const busy = (index: number) => first || loading === 'all' || loading === String(index) || (partial && fieldPending && index === 1 && kind !== 'key');
  const update = () => {
    setObjectState('busy');
    clearTimeout(objectTimer.current);
    objectTimer.current = setTimeout(() => setObjectState('done'), 500);
  };
  return <Surface className="rhine-async-card" data-async-card><Stack gap={3}>
    <ModuleSlot index={0} loading={busy(0)}>{!first && <Stack gap={2}><Text as="h3" variant="heading">{long ? '跨区域联合研究与长期设计验证资源 Synthetic complete identity that wraps without clipping' : '合成资源 A'}</Text><OwnershipLabels /></Stack>}</ModuleSlot>
    <ModuleSlot index={1} loading={busy(1)}>{!first && <Stack gap={2}><Text>可用额度</Text><Text>{kind === 'key' ? '此接入方式不提供额度' : partial ? '额度未知，未提供读数' : '128.00 USD'}</Text></Stack>}</ModuleSlot>
    <ModuleSlot index={2} loading={busy(2)}>{!first && <Stack gap={2}><Badge tone="warning">任务已暂停</Badge><CompactDates /></Stack>}</ModuleSlot>
    <ModuleSlot index={3} loading={busy(3)}>{!first && <Stack gap={2}><Text>上次历史：12 次请求 · 2026-10-29</Text>{partial ? <Notice tone="error" title="历史读取失败">保留上次历史；未知时段不作健康判断。</Notice> : <Text tone="muted">最近一次任务已暂停，尚未继续执行。</Text>}</Stack>}</ModuleSlot>
    <ModuleSlot index={4} loading={busy(4)}>{!first && <Grid gap={2} minWidth={80}>
      <Stack gap={2}><Text>今日费用</Text><Text>{long ? '123,456,789.12 USD' : '1.28 USD'}</Text><Text>优先级：正常</Text></Stack>
      <Stack gap={2}><Text>本周期费用</Text>{partial ? <div style={{display:'grid'}}><Text style={{gridArea:'1 / 1',visibility:fieldPending ? 'hidden' : undefined}} aria-hidden={fieldPending || undefined}>费用未知，未提供读数</Text>{fieldPending && <div style={{gridArea:'1 / 1'}}><Skeleton label="本周期费用尚未读取" lines={1} /></div>}</div> : <Text>{long ? '987,654,321.00 USD' : '12.80 USD'}</Text>}<Text>关联 Key：2</Text></Stack>
    </Grid>}</ModuleSlot>
    <ModuleSlot index={5} loading={busy(5)}>{!first && <Stack gap={2}><Inline gap={2}><Button variant="secondary" busy={objectState === 'busy'} busyLabel="正在显式更新此对象" onClick={update}>更新此对象（合成）</Button></Inline><Text role="status">{objectState === 'done' ? '对象更新演示已完成' : '对象更新与列表读取是不同操作'}</Text></Stack>}</ModuleSlot>
  </Stack></Surface>;
}

function ResultReadNotice({ status, old, retry }: { status: string; old: boolean; retry: () => void }) {
  if (status === 'error') return <Notice tone="error" title={old ? '读取失败，保留上次快照' : '读取失败，尚无可用快照'} action={<Button variant="secondary" onClick={retry}>重试读取</Button>}>任务状态与读取错误独立；没有已确认的新结果。</Notice>;
  if (status === 'budget') return <Notice tone={old ? 'neutral' : 'warning'} title="已达到本轮读取预算" action={<Button variant="secondary" onClick={retry}>重试读取</Button>}>{old ? '旧快照仍可读，稍后可重试更新；保留原观测时间，尚无已确认的新结果。' : '已退出忙态；未知结果不显示为零。'}</Notice>;
  if (status === 'paused') return <Notice tone="warning" title="读取已暂停">恢复后重新读取，保留已有快照。</Notice>;
  return null;
}

function SnapshotList({ scenario, loading, long }: { scenario: string; loading: string; long: boolean }) {
  const seed: RecipeSnapshot | undefined = ['first','no-snapshot-error','budget'].includes(scenario) ? undefined : { scope:'all',count:1,observedAt:scenario === 'stale' ? '2026-10-29 14:32 上海时间' : '2026-10-30 14:32 上海时间',task:'paused',stale:scenario === 'stale' };
  const read = useMemo(() => syntheticRecipeRead(scenario), [scenario]);
  const state = useAsyncSnapshotRecipe(read, seed);
  const same = state.snapshot?.scope === state.scope;
  const waiting = state.status === 'loading' || state.status === 'refreshing';
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  return <Stack gap={3} data-snapshot-list data-read-status={state.status}>
    <Inline gap={2}>
      <Button variant="secondary" disabled={state.paused || !state.visible} busy={waiting && state.cause === 'manual'} busyLabel="正在读取现有结果" onClick={state.retry}>读取现有结果</Button>
      <Button variant="quiet" onClick={state.togglePause}>{state.paused ? '恢复读取' : '暂停读取'}</Button>
      <Button variant="quiet" onClick={() => { clearTimeout(searchTimer.current); setSearch('搜索筛选正在读取'); searchTimer.current = setTimeout(() => { setSearch('搜索筛选读取完成（合成）'); setSearchApplied(true); }, 500); }}>演示搜索反馈</Button>
    </Inline>
    <Text role="status" data-search-feedback>{search}</Text>
    <div data-result-summary>
      {state.snapshot ? <Text>上次结果 · {accessKinds.find(item => item.value === state.snapshot!.scope)?.label}：{state.snapshot.count} 条 · {state.snapshot.observedAt ? `观测 ${state.snapshot.observedAt}` : '观测时间未知'}</Text> : <Text>尚无已确认的结果快照</Text>}
    </div>
    {/* Tab transitions retain the previous summary verbatim. No page spinner or update announcement. */}
    {state.cause !== 'tab' && state.status === 'refreshing' && <Text tone="muted">正在后台读取，已有快照仍可读。</Text>}
    {state.snapshot?.stale && <Text tone="warning">快照已过期；以下保留原观测结果。</Text>}
    <ResultReadNotice status={state.status} old={same && !!state.snapshot} retry={state.retry} />
    <Tabs label="异步接入方式" value={state.scope} onValueChange={state.switchScope} items={accessKinds.map(item => ({ ...item, content:
      <div data-async-result={item.value}>
        {state.scope === item.value && <Stack gap={3}>
          {(!same && waiting) ? <AsyncResourceCard kind={item.value} first />
            : same && state.snapshot ? state.snapshot.count === 0 ? <EmptyState title="此范围没有资源" description="读取已完成，这是有效空结果。" /> : <AsyncResourceCard kind={item.value} loading={loading} long={long} partial={scenario === 'partial'} fieldPending={waiting} />
            : <Text>此范围尚无可读快照；{state.status === 'paused' ? '请恢复读取。' : '可重试读取。'}</Text>}
          {searchApplied && <Text tone="muted">搜索反馈仅演示独立请求，不改变合成资源。</Text>}
        </Stack>}
      </div>
    }))} />
  </Stack>;
}

export function DiagnosticSnapshotRecipe() {
  const [empty, setEmpty] = useState(false);
  const [task, setTask] = useState('paused'), [read, setRead] = useState('cached'), [copyFails, setCopyFails] = useState(false);
  const hasSnapshot = read === 'cached' || read === 'error';
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rejectCopy = useRef<((error: Error) => void) | undefined>(undefined);
  useEffect(() => () => { clearTimeout(copyTimer.current); rejectCopy.current?.(new Error('Synthetic copy unmounted')); }, []);
  const copy = () => new Promise<void>((resolve,reject) => {
    rejectCopy.current = reject;
    copyTimer.current = setTimeout(() => { rejectCopy.current = undefined; if (copyFails) reject(new Error('Synthetic copy failure')); else resolve(); }, 350);
  });
  return <Surface data-diagnostic><Stack gap={3}>
    <Text as="h3" variant="heading">只读诊断快照</Text>
    <Text tone="muted">合成评审：复制 Promise 为显式 mock，不访问剪贴板，也不执行命令。真实消费须传入真实复制 Promise。</Text>
    <Inline gap={2}>
      <Select label="诊断任务状态" value={task} onChange={e => setTask(e.target.value)}><option value="paused">paused</option><option value="failed">failed</option></Select>
      <Select label="诊断读取状态" value={read} onChange={e => setRead(e.target.value)}>{[['cached','已读取'],['loading','无快照读取中'],['error','保留旧记录但读取失败'],['no-snapshot-error','无快照读取失败']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Checkbox label="诊断空路径与命令" checked={empty} onChange={e => setEmpty(e.target.checked)} />
      <Checkbox label="合成复制失败" checked={copyFails} onChange={e => setCopyFails(e.target.checked)} />
    </Inline>
    {(read === 'error' || read === 'no-snapshot-error') && <Notice tone="error" title={hasSnapshot ? '读取失败，以下保留上次读取记录' : '读取失败，尚无运行快照'} />}
    {hasSnapshot ? <Stack gap={3}>
      <Text>任务状态：<Badge tone={task === 'failed' ? 'error' : 'warning'}>{task}</Badge></Text>
      <Text>读取状态：{read === 'error' ? '失败（旧快照）' : '已读取'}</Text>
      <Text>覆盖率：未知 · 未提供观测时间</Text>
      <DataTable caption="合成诊断路径（局部横向滚动）" rowKey={row => row.path} columns={[{key:'path',header:'路径',render:row => <Text variant="code">{row.path}</Text>},{key:'result',header:'结果',render:row => row.result}]} emptyTitle="未提供诊断路径" rows={empty ? [] : [{path:'synthetic/complete-diagnostic-path/with-readable-final-segment',result:'未确认'}]} />
      {empty ? <Text>未提供诊断命令</Text> : <><Text variant="code">synthetic-tool inspect --read-only</Text><CopyButton label="复制诊断命令" value="synthetic-tool inspect --read-only" copy={copy} /></>}
    </Stack> : read === 'loading' ? <Skeleton label="正在读取诊断快照" /> : <Text>没有可展示的运行记录；空路径与未知覆盖率不代表健康。</Text>}
  </Stack></Surface>;
}

export function AsyncSnapshotRecipes() {
  const [scenario, setScenario] = useState('cached'), [loading, setLoading] = useState('none'), [long, setLong] = useState(false);
  return <Stack gap={4}>
    <Text as="h2" variant="section">异步快照与模块加载</Text>
    <Text tone="muted">合成数据、可取消计时器与三次读取预算；仅演示宿主状态组合，不访问业务服务。</Text>
    <Inline gap={3}><Select label="异步配方场景" value={scenario} onChange={e => setScenario(e.target.value)}>{[['cached','已有快照'],['first','首次读取'],['error','旧快照读取失败'],['no-snapshot-error','首次读取失败'],['empty','有效空结果'],['budget','无快照预算退出'],['cached-budget','旧快照预算退出'],['partial','部分字段与历史失败'],['stale','过期快照'],['delayed','慢 OAuth 响应']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Select label="模块加载演示" value={loading} onChange={e => setLoading(e.target.value)}><option value="none">全部完成</option><option value="all">首次六模块加载</option>{moduleNames.map((name,index) => <option key={name} value={index}>仅{name}加载</option>)}</Select>
      <Checkbox label="异步长文本" checked={long} onChange={e => setLong(e.target.checked)} />
    </Inline>
    <SnapshotList key={scenario} scenario={scenario} loading={loading} long={long} />
    <DiagnosticSnapshotRecipe />
  </Stack>;
}

export function AsyncSnapshotRecipesFixture() {
  const params = new URLSearchParams(location.search);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}><main style={{padding:16}}><AsyncSnapshotRecipes /></main></ThemeProvider>;
}
