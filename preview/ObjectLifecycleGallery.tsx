import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Checkbox, EmptyState, Inline, Notice, Select, Skeleton, Stack, Surface, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { completeOriginalObservation, lifecycleObservation, originalTargets, syntheticLifecycleRead, syntheticNow, type LifecycleObservation, type LifecycleRead } from './objectLifecycleRecipe';
import './object-lifecycle.css';

// Keep the no-history branch outside the reading component: no snapshot/runtime dependency is mounted.
export function ObjectLifecycle({ retainHistory, ...props }: { retainHistory: boolean; read: LifecycleRead; now: number; initial?: LifecycleObservation; long?: boolean }) {
  return retainHistory ? <LifecycleHistory {...props} /> : <EmptyState title="此功能已退役" description="没有需要继续查看的对象历史。" />;
}

function LifecycleHistory({ read, now, initial, long = false }: { read: LifecycleRead; now: number; initial?: LifecycleObservation; long?: boolean }) {
  const [snapshot, setSnapshot] = useState(initial && completeOriginalObservation(initial) ? initial : undefined);
  const [pending, setPending] = useState(!initial || !completeOriginalObservation(initial)), [error, setError] = useState(''), [message, setMessage] = useState('');
  const request = useRef<{ generation: number; controller?: AbortController }>({ generation: 0 });
  const actions = useRef<HTMLDivElement>(null);
  const run = async () => {
    request.current.controller?.abort();
    const generation = ++request.current.generation, controller = new AbortController();
    request.current.controller = controller;
    setPending(true); setMessage('正在读取原目标状态。');
    const current = () => generation === request.current.generation && !controller.signal.aborted;
    try {
      const value = await read(controller.signal);
      if (!current()) return;
      if (!completeOriginalObservation(value)) throw new Error('原目标观测不完整，不能确认对象已移除。');
      setSnapshot(value); setError(''); setMessage('已读取原目标的完整记录。');
    } catch (reason) {
      if (current()) { setError(reason instanceof Error ? reason.message : '读取失败，当前状态尚未确认。'); setMessage('可重新读取原目标状态。'); }
    } finally { if (current()) setPending(false); }
  };
  useEffect(() => {
    if (!initial || !completeOriginalObservation(initial)) void run();
    return () => { request.current.generation++; request.current.controller?.abort(); };
    // The gallery remounts the host when its synthetic transport/scenario changes.
  }, [read]);
  const cancel = () => {
    request.current.generation++; request.current.controller?.abort();
    // The cancel action becomes disabled; hand keyboard focus to a stable action first.
    actions.current?.querySelector('button')?.focus(); setPending(false);
    setMessage(snapshot ? '已取消等待，保留上次记录。' : '已取消等待；尚无完整记录，当前状态未知。');
  };
  const fresh = !!snapshot && Number.isFinite(now) && now >= snapshot.observedAt && now < snapshot.expiresAt;
  const known = fresh && !error;
  const allRemoved = !!snapshot && snapshot.objects.every(row => row.state === 'removed');
  const status = known ? `${pending ? '上次记录：' : ''}${allRemoved ? '已结束' : '仍有对象'}` : '未知';
  const last = !!snapshot && (!known || pending);
  const formatTime = (value: number) => new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC（合成）');
  return <Surface data-lifecycle-card data-pending={pending}>
    <Stack gap={4}>
      <Inline gap={3}><Text as="h3" variant="heading">{long ? '原目标 A–E · 跨区域长期研究资料与联合设计验证项目 Synthetic original target history' : '原目标 A–E'}</Text><span data-lifecycle-summary><Badge tone="neutral">{status}</Badge></span></Inline>
      <Text>自动管理：已停止</Text>
      <Text variant="caption" tone="muted">停止自动管理不代表对象已移除。</Text>
      {pending && !snapshot && <Skeleton label="正在读取对象状态" lines={2} />}
      <ul className="rhine-lifecycle-objects" aria-label="原目标状态">
        {originalTargets.map(id => {
          const row = snapshot?.objects.find(item => item.id === id);
          const label = row?.state === 'removed' ? '已移除' : '仍存在';
          return <li key={id} data-lifecycle-object={id}><Text>{long ? `资源 ${id} · 长期保留的合成对象名称及完整身份 Synthetic retained resource ${id}` : `资源 ${id}`}</Text><Badge tone="neutral">{known && !pending ? label : '未知'}</Badge>{last && row && <Text variant="caption">上次记录：{label}</Text>}</li>;
        })}
      </ul>
      {snapshot && <Stack gap={1} data-lifecycle-times><Text variant="caption">{last ? '上次记录' : '观测时间'}：{formatTime(snapshot.observedAt)}</Text><Text variant="caption">有效期至：{formatTime(snapshot.expiresAt)}</Text></Stack>}
      {snapshot && !fresh && <Notice title="观测已过期或时钟尚未确认">当前状态未知；上次移除记录也不能继续证明已结束。请重新读取确认。</Notice>}
      {error && <Notice tone="error" title="读取未确认">{error}{snapshot ? ' 保留上次完整记录及原观测时间。' : ' 尚无完整记录，当前状态未知。'}</Notice>}
      <Text role="status" data-lifecycle-message>{message || '保留对象历史，按需读取。'}</Text>
      <div ref={actions}><Inline gap={2}><Button variant="secondary" busy={pending} busyLabel="正在读取状态" onClick={() => void run()}>读取状态</Button><Button variant="quiet" disabled={!pending} onClick={cancel}>取消等待</Button></Inline></div>
    </Stack>
  </Surface>;
}

const scenarios = { removed: '全部明确移除', stopped: '停止管理但对象仍在', partial: '部分观测失败', timeout: '读取超时', denied: '没有读取权限', replacement: '仅返回替代对象 F–K', 'cold-error': '无记录读取失败' };
export function ObjectLifecycleGallery() {
  const [retain, setRetain] = useState(false), [scenario, setScenario] = useState('removed'), [long, setLong] = useState(false), [mounted, setMounted] = useState(true);
  const [now, setNow] = useState(syntheticNow + 1000);
  const serviceObservedAt = useRef(syntheticNow);
  const [serviceUpdated, setServiceUpdated] = useState(false);
  const read = useMemo(() => syntheticLifecycleRead(scenario, () => serviceObservedAt.current), [scenario]);
  const initial = ['partial', 'timeout', 'denied', 'replacement'].includes(scenario) ? lifecycleObservation() : undefined;
  return <section id="object-lifecycle"><Stack gap={4}>
    <Text as="h2" variant="title">对象生命周期与观测</Text>
    <Text tone="muted">合成展台：完全退役且无历史需求时展示空态。只有仍需呈现历史时才挂载状态卡片。</Text>
    <Inline gap={3}>
      <Checkbox label="保留对象历史" checked={retain} onChange={event => setRetain(event.target.checked)} />
      <Checkbox label="生命周期长文" checked={long} onChange={event => setLong(event.target.checked)} />
      <Select label="生命周期场景" value={scenario} onChange={event => { serviceObservedAt.current = syntheticNow; setServiceUpdated(false); setScenario(event.target.value); setNow(syntheticNow + 1000); }}>{Object.entries(scenarios).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Button variant="quiet" onClick={() => setNow(serviceObservedAt.current + 60000)}>推进合成时钟至过期</Button>
      <Button variant="quiet" onClick={() => { serviceObservedAt.current = now; setServiceUpdated(true); }}>服务提供新观测</Button>
      <Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '卸载场景' : '重新挂载场景'}</Button>
    </Inline>
    <Text variant="caption" tone="muted">读取为一次 650ms 合成响应，无轮询；时间由上方合成时钟控制。{serviceUpdated ? '合成服务已有新观测，显式读取后才能接受。' : '合成服务仍返回原观测，重试不会延长有效期。'}替代对象 F–K 不属于原目标。</Text>
    {mounted && <ObjectLifecycle key={scenario} retainHistory={retain} read={read} now={now} initial={initial} long={long} />}
  </Stack></section>;
}
export function ObjectLifecycleFixture() {
  const params = new URLSearchParams(location.search);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}><main className="rhine-lifecycle-fixture"><ObjectLifecycleGallery /></main></ThemeProvider>;
}
