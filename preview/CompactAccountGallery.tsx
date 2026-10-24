import { useState } from 'react';
import {
  Badge, Button, ButtonLink, Checkbox, Disclosure, Divider, Inline, KeyValue,
  Notice, Progress, Select, Skeleton, Stack, StatusTimelineList, Surface, Text,
  TextField, TimelineLegend, Tooltip, type TimelineSegment, type TimelineStatus,
} from '../components';

type AccountState = 'normal' | 'zero' | 'unknown' | 'long';
type SubscriptionState = 'ready' | 'loading' | 'error' | 'no-link';

export const compactAccountLegend = [
  { status: 'healthy', label: '有输出', description: '有已确认输出，且此时段未见异常；历史记录不保证账号当前可用。' },
  { status: 'recovered', label: '已恢复', description: '此时段发生过异常或重试，后续已有确认输出，且没有最终失败。' },
  { status: 'degraded', label: '待确认', description: '此时段出现异常，但最终输出或恢复结果尚未确认；不能视作成功。' },
  { status: 'failed', label: '失败', description: '此时段存在已确认的最终失败；其他请求有输出也不会覆盖失败证据。' },
  { status: 'unknown', label: '未知', description: '没有可用记录、记录不完整或结果未知；未知不等于零，也不等于健康。' },
] satisfies { status: TimelineStatus; label: string; description: string }[];

const segments: TimelineSegment[] = Array.from({ length: 96 }, (_, index) => {
  const status = compactAccountLegend[index % 13 === 0 ? 3 : index % 11 === 0 ? 2 : index % 7 === 0 ? 1 : index % 5 === 0 ? 4 : 0];
  const start = `${String(Math.floor(index / 4)).padStart(2, '0')}:${String(index % 4 * 15).padStart(2, '0')}`;
  const end = `${String(Math.floor((index + 1) / 4) % 24).padStart(2, '0')}:${String((index + 1) % 4 * 15).padStart(2, '0')}`;
  return {
    id: String(index), label: `10/23 ${start} · UTC+8`, status: status.status,
    detail: {
      start: `2026-10-23 ${start} · UTC+8`, end: `2026-10-${index === 95 ? '24' : '23'} ${end} · UTC+8`, reason: status.description,
      counts: [{ id: 'output', label: '确认输出', value: status.status === 'unknown' ? null : status.status === 'failed' ? 0 : 12, unit: '次' }],
      methodology: '按 15 分钟聚合的合成记录；缺失值保留未知，不计算健康分数。',
    },
  };
});

export function CompactAccountExample({ state = 'normal' }: { state?: AccountState }) {
  const unknown = state === 'unknown', zero = state === 'zero', long = state === 'long';
  return <Surface data-testid="compact-account-card"><Stack gap={4}>
    <Inline gap={2} style={{ justifyContent: 'space-between' }}>
      <Text as="h3" variant="heading">{long ? '跨区域协作工作空间 · LongResourceNameForWrappingAndReview' : '研究资源 A'}</Text>
      <Badge tone={unknown ? 'warning' : 'success'}>{unknown ? '状态未知' : '可调度'}</Badge>
    </Inline>
    <Stack gap={2} data-testid="compact-quota">
      {unknown ? <Text variant="caption">7D 剩余 — · 额度暂不可用</Text> : <Progress label="7D 剩余" value={zero ? 0 : 78} />}
      <Text variant="caption" tone="muted">重置 {unknown ? '—' : '10/27 08:30 · 上海'}</Text>
      <Divider />
      <Text variant="caption" tone="muted">预测暂不可用</Text>
    </Stack>
    <Stack gap={1}>
      <StatusTimelineList label="资源用量与异常记录" items={[{
        id: 'resource-a', title: '用量与异常记录',
        note: unknown ? '历史记录不完整，仅展示已确认的时段。' : undefined,
        timeline: { startLabel: '10/23 00:00 · 上海', endLabel: '10/24 00:00 · 上海', segments: unknown ? segments.slice(0, 48) : segments },
      }]} />
      <TimelineLegend compact label="历史状态图例" items={compactAccountLegend} />
    </Stack>
    <Stack gap={2} data-testid="compact-account-facts">
      <Inline gap={4}>
        <Tooltip content="数值越小，调度优先级越高；这不是健康评分。"><Text as="span" variant="caption" tabIndex={0}>优先级 <strong>0</strong></Text></Tooltip>
        <Text as="span" variant="caption">API-Key <strong>{unknown ? '—' : zero ? '0' : '3'}</strong></Text>
      </Inline>
      <KeyValue items={[
        { key: 'expires', label: '到期', value: long ? '2027-10-24 23:59 · 上海（运营设置的账号期限）' : '未设置' },
        ...(long ? [{ key: 'subscription-expires', label: '订阅到期', value: '2026-11-24 08:30 · 上海（当前服务套餐期限）' }] : []),
      ]} />
      <Inline gap={4} className="compact-gallery-fact-pair">
        <Text as="span" variant="caption">今日消费 <strong>{unknown ? '—' : zero ? '$0.00' : long ? '$12,345.67 / $24,691.34' : '$2.40'}</strong></Text>
        <Text as="span" variant="caption">本周期 <strong>{unknown ? '—' : zero ? '$0.00' : long ? '$123,456.78 / $246,913.56' : '$18.50'}</strong></Text>
      </Inline>
      <Inline gap={4} className="compact-gallery-fact-pair">
        <Text as="span" variant="caption">今日生图 <strong>{unknown ? '—' : zero ? '0' : '8'}</strong></Text>
        <Text as="span" variant="caption">本周期生图 <strong>{unknown ? '—' : zero ? '0' : '24'}</strong></Text>
      </Inline>
    </Stack>
  </Stack></Surface>;
}

// Deliberately inert sample address and harmless download content: no service or credential is involved.
const demoAddress = 'https://example.invalid/subscriptions/demo';
const demoDownload = 'data:application/json;charset=utf-8,%7B%22demo%22%3Atrue%7D';

export function CompactSubscriptionExample({ initialState = 'ready', showHistory = false, longValue = false }: {
  initialState?: SubscriptionState; showHistory?: boolean; longValue?: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [revision, setRevision] = useState(1);
  const [history, setHistory] = useState(showHistory ? ['2026-10-22 08:30 · 上海'] : []);
  const [feedback, setFeedback] = useState('');
  const [copyError, setCopyError] = useState(false);
  const address = `${demoAddress}/${longValue ? 'cross-region-research-workspace-with-a-long-resource-name/' : ''}${revision}`;
  const busy = state === 'loading';
  const ready = state === 'ready';
  function create() {
    if (busy) return;
    if (ready) setHistory(previous => ['2026-10-24 08:30 · 上海', ...previous]);
    setRevision(previous => previous + 1); setState('ready'); setCopyError(false);
    setFeedback(ready ? '已重置演示链接，旧链接失效。' : '已生成演示链接。');
  }
  async function copy() {
    if (!ready) return;
    try { await navigator.clipboard.writeText(address); setCopyError(false); setFeedback('已复制演示链接。'); }
    catch { setCopyError(true); setFeedback('未能复制，请选择链接后手动复制。'); }
  }
  return <Surface data-testid="compact-subscription"><Stack gap={3}>
    <Inline gap={2}><Text as="h3" variant="heading">我的订阅</Text><Badge>研究资源 A</Badge></Inline>
    <Text variant="caption" tone="muted">链接可下载凭证，请勿分享。</Text>
    {busy ? <Skeleton label="正在读取订阅链接" lines={2} /> : state === 'error' ?
      <Notice tone="error" title="订阅链接读取失败" action={<Button variant="secondary" onClick={() => { setState('ready'); setFeedback('已重新读取演示链接。'); }}>重试</Button>} /> :
      ready ? <TextField label="订阅链接" readOnly value={address} onFocus={event => event.currentTarget.select()} /> :
        <Text>尚未生成订阅链接</Text>}
    <Inline gap={2}>
      {state === 'no-link' ? <Button onClick={create}>获取订阅链接</Button> : <>
        <Button disabled={!ready} onClick={copy}>复制链接</Button>
        <ButtonLink href={demoDownload} download="rhine-demo.json" rel="noreferrer" variant="secondary" disabled={!ready}>下载文件</ButtonLink>
      </>}
    </Inline>
    {ready && <Stack gap={1}>
      <Inline gap={2}>
        <Button variant="quiet" onClick={create}>重置链接</Button>
        <Button variant="quiet" onClick={() => { setHistory(previous => ['2026-10-24 08:30 · 上海', ...previous]); setState('no-link'); setCopyError(false); setFeedback('演示链接已撤销。'); }}>撤销链接</Button>
      </Inline>
      <Text variant="caption" tone="muted">重置或撤销后，旧链接失效。</Text>
    </Stack>}
    {!!history.length && <Disclosure title={`历史链接（${history.length}）`}>
      <Stack gap={3}>{history.map((date, index) => <Stack gap={1} key={`${date}-${index}`}>
        <Text variant="caption" tone="muted">{date} · 已失效</Text>
        <Text variant="code">{demoAddress}/retired-{index + 1}</Text>
      </Stack>)}</Stack>
    </Disclosure>}
    {feedback && <Text variant="caption" tone={copyError ? 'error' : 'success'} role={copyError ? 'alert' : 'status'}>{feedback}</Text>}
  </Stack></Surface>;
}

export function CompactAccountGallery() {
  const [accountState, setAccountState] = useState<AccountState>('normal');
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>('ready');
  const [history, setHistory] = useState(false);
  const [longValue, setLongValue] = useState(false);
  const [width, setWidth] = useState('880');
  const [zoom, setZoom] = useState('1');
  return <div id="compact-account" className="compact-gallery"><Stack gap={6}>
    <Stack gap={2}>
      <Text as="h2" variant="section">紧凑账号摘要与凭证操作</Text>
      <Text tone="muted">去掉重复边框和说明，保留判断与操作所需的事实。所有内容均为合成数据。</Text>
    </Stack>
    <Surface><Stack gap={3}>
      <Inline gap={3}>
        <Select label="账号读数" value={accountState} onChange={event => setAccountState(event.target.value as AccountState)}>
          <option value="normal">正常</option><option value="zero">有效零值</option><option value="unknown">未知 / 不完整</option><option value="long">长名称 / 双成本 / 两种到期</option>
        </Select>
        <Select label="订阅状态" value={subscriptionState} onChange={event => setSubscriptionState(event.target.value as SubscriptionState)}>
          <option value="ready">有链接</option><option value="loading">读取中</option><option value="error">读取失败</option><option value="no-link">尚未生成</option>
        </Select>
        <Select label="样机宽度" value={width} onChange={event => setWidth(event.target.value)}>
          <option value="400">400px</option><option value="520">520px</option><option value="880">880px</option>
        </Select>
        <Select label="内容缩放" value={zoom} onChange={event => setZoom(event.target.value)}><option value="1">100%</option><option value="2">200%</option></Select>
      </Inline>
      <Inline gap={4}>
        <Checkbox label="包含历史链接" checked={history} onChange={event => setHistory(event.target.checked)} />
        <Checkbox label="长订阅链接" checked={longValue} onChange={event => setLongValue(event.target.checked)} />
      </Inline>
    </Stack></Surface>
    <div className="compact-gallery-stage" style={{ width: Number(width) }} data-testid="compact-stage">
      <div className="compact-gallery-examples" style={{ zoom: Number(zoom) }}>
        <CompactAccountExample state={accountState} />
        <CompactSubscriptionExample key={`${subscriptionState}-${history}-${longValue}`} initialState={subscriptionState} showHistory={history} longValue={longValue} />
      </div>
    </div>
    <Disclosure title="按钮式链接状态"><Inline gap={3} data-testid="compact-link-states">
      <ButtonLink href={demoDownload} download="rhine-demo.json" busy busyLabel="正在准备演示文件">准备中的下载</ButtonLink>
      <ButtonLink href={demoDownload} download="rhine-demo.json" disabled variant="secondary">不可用的下载</ButtonLink>
      <ButtonLink href="#compact-account" target="_blank" rel="noreferrer" variant="secondary">在新标签页打开样机</ButtonLink>
    </Inline></Disclosure>
    <Disclosure title="跨卡历史交互"><Stack gap={6} data-testid="compact-independent-timelines">
      {['独立卡片 A', '独立卡片 B'].map(title => <Surface key={title}><StatusTimelineList label={`${title}历史`} items={[{
        id: title, title, timeline: { startLabel: '10/23 00:00', endLabel: '10/24 00:00', segments },
      }]} /></Surface>)}
    </Stack></Disclosure>
  </Stack></div>;
}
