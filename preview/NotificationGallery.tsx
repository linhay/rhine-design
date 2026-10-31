import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Dialog, Disclosure, EmptyState, Fieldset, Inline, ListFilterBar, Notice, RemoteMultiSelect, Select, Stack, Surface, Tabs, Text, TextField } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { accessFor, channels, events, identities, initialRules, objects, permitted, restrictRule, sameDraft, syntheticTransport, type Access, type Draft, type Identity, type Member, type Operation, type Rule, type Transport } from './notificationRecipe';
import './notifications.css';

function ObjectPicker({ draft, access, change, transport, error, long, readOnly }: { draft: Draft; access: Access; change: (draft: Draft) => void; transport: Transport; error: string; long: boolean; readOnly: boolean }) {
  const [query, setQuery] = useState(''), [page, setPage] = useState(1), [result, setResult] = useState<string[]>([]), [pending, setPending] = useState(true), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const label = (id: string) => `${objects.find(item => item.value === id)!.label}${long ? ' · 长期联合研究与设计验证的合成对象 Synthetic resource with a complete long name' : ''}`;
  useEffect(() => {
    const controller = new AbortController(), request = ++generation.current;
    setPending(true); setResult([]); setFailed(false);
    void transport('catalog', controller.signal).then(() => {
      if (request !== generation.current || controller.signal.aborted) return;
      setResult(objects.filter(item => access.objects.includes(item.value) && item.label.toLowerCase().includes(query.toLowerCase())).slice(0, page * 2).map(item => item.value));
    }).catch(() => { if (!controller.signal.aborted && request === generation.current) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted && request === generation.current) setPending(false); });
    return () => { generation.current++; controller.abort(); };
  }, [query, page, access, transport, retry]);
  const matches = objects.filter(item => access.objects.includes(item.value) && item.label.toLowerCase().includes(query.toLowerCase()));
  return <RemoteMultiSelect label="事件对象" readOnly={readOnly} query={query} onQueryChange={value => { setQuery(value); setPage(1); }}
    value={draft.objects.filter(id => access.objects.includes(id)).map(value => ({ value, label: label(value) }))}
    onValueChange={value => change({ ...draft, objects: value.map(item => item.value) })}
    options={result.filter(id => access.objects.includes(id)).map(value => ({ value, label: label(value) }))}
    loading={pending} error={failed ? '候选读取失败，请重试。' : undefined} onRetry={() => setRetry(value => value + 1)} validationError={error || undefined}
    hasMore={!pending && result.length < matches.length} onLoadMore={() => setPage(value => value + 1)}
    hint={access.objects.length ? '仅显示当前身份可查看的对象；选择不会保存。' : '没有可选对象；可保留停用草稿。'} />;
}

function RuleCard({ initial, access, transport, long, controls }: { initial: Rule; access: Access; transport: Transport; long: boolean; controls: React.ReactNode }) {
  const [stored, setStored] = useState(() => restrictRule(initial, access)), [seenAccess, setSeenAccess] = useState(access), [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Operation | null>(null), [message, setMessage] = useState(''), [error, setError] = useState(''), [preview, setPreview] = useState(false), [validate, setValidate] = useState(false);
  const request = useRef<{ id: number; controller?: AbortController }>({ id: 0 });
  const actions = useRef<HTMLDivElement>(null), restoreFocus = useRef(false);
  const form = useRef<HTMLDivElement>(null), [validationAttempt, setValidationAttempt] = useState(0);
  useEffect(() => { if (!pending && restoreFocus.current) { restoreFocus.current = false; actions.current?.querySelector('button')?.focus(); } }, [pending]);
  useEffect(() => { if (validationAttempt) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); }, [validationAttempt]);
  // Remove restricted values before rendering children, including closed Dialog content and previews.
  const rule = seenAccess === access ? stored : restrictRule(stored, access);
  if (seenAccess !== access) { setSeenAccess(access); setStored(rule); setPreview(false); setError(''); setMessage('权限已更新，请核对当前可选范围。'); }
  useEffect(() => {
    request.current.id++; request.current.controller?.abort(); request.current.controller = undefined; setPending(null);
    return () => { request.current.id++; request.current.controller?.abort(); };
  }, [access]);
  const currentAccess = useRef(access); currentAccess.current = access;
  const change = (draft: Draft) => { setStored(value => ({ ...value, draft: permitted(draft, access) })); setPreview(false); setError(''); setMessage('草稿尚未保存。'); };
  const dirty = !sameDraft(rule.draft, rule.saved) || rule.review;
  const objectError = validate && !rule.draft.objects.length ? '启用需要至少一个当前可查看的对象。' : '';
  const channelError = validate && !rule.draft.channel ? '没有可用接收渠道，无法启用；可保存停用草稿。' : '';
  const cancel = () => {
    request.current.id++; request.current.controller?.abort(); request.current.controller = undefined; setPending(null); setPreview(false);
    setMessage('已取消等待，未确认结果；草稿保留。'); restoreFocus.current = true;
  };
  const run = async (operation: Operation) => {
    if (request.current.controller) return;
    if (operation === 'enable') {
      setValidate(true);
      if (!rule.draft.objects.length || !rule.draft.channel) { setValidationAttempt(value => value + 1); return; }
      if (dirty) { setError('请先保存当前草稿，再明确启用。'); return; }
    }
    const controller = new AbortController(), id = ++request.current.id, scope = access;
    request.current.controller = controller; setPending(operation); setError('');
    const current = () => request.current.id === id && !controller.signal.aborted && currentAccess.current === scope;
    try {
      await transport(operation, controller.signal);
      if (!current()) return;
      if (operation === 'save') { setStored(value => ({ ...value, saved: structuredClone(value.draft), enabled: false, review: false, revision: value.revision + 1 })); setMessage('已保存停用草稿；尚未启用。'); }
      if (operation === 'enable') { setStored(value => ({ ...value, enabled: true })); setMessage('已确认启用意图；不代表已投递或已读。'); }
      if (operation === 'preview') { setPreview(true); setMessage('示例已生成，没有发送消息。'); }
    } catch (reason) { if (current()) setError(reason instanceof Error ? reason.message : '操作未确认，草稿保留。'); }
    finally { if (current()) { restoreFocus.current = document.activeElement === actions.current?.querySelectorAll('button')[3]; request.current.controller = undefined; setPending(null); } }
  };
  const chosenChannel = channels.find(item => item.value === rule.draft.channel);
  const scopeText = (draft: Draft) => draft.objects.filter(id => access.objects.includes(id)).map(id => objects.find(item => item.value === id)!.label).join('、') || '未选择可用对象';
  return <Surface data-notification-rule={rule.id} data-enabled={rule.enabled} data-pending={pending || 'idle'}>
    <Stack gap={3}>
      <Inline gap={2}><Text as="h3" variant="heading">{rule.title}{long ? ' · 跨区域长期资料协作与运行结果通知' : ''}</Text><Badge tone="neutral">{rule.enabled ? '启用意图已确认' : rule.review ? '已暂停，待重新确认' : '停用草稿'}</Badge></Inline>
      <Text>{events[rule.saved.event]} · {scopeText(rule.saved)}</Text>
      <Text variant="caption">配置版本 {rule.revision} · 合成记录</Text>
      {rule.review && <Notice title="部分范围不再可用">旧名称与详情已移除。仍有效的选择及其他草稿保留；本例暂停执行，需重新保存并明确启用。</Notice>}
      <Dialog title={rule.title} open={open} onOpenChange={next => { if (!next) { request.current.id++; request.current.controller?.abort(); request.current.controller = undefined; setPending(null); setPreview(false); } setOpen(next); }}
        description="保存停用草稿、查看示例与启用是独立操作。示例不会发送通知。"
        trigger={<Button variant="secondary">编辑{rule.title}</Button>}>
        <div ref={form}><Stack gap={4}>
          <Select label="事件" value={rule.draft.event} disabled={!!pending} onChange={event => change({ ...rule.draft, event: event.target.value as Draft['event'] })}>{Object.entries(events).map(([value, title]) => <option key={value} value={value}>{title}</option>)}</Select>
          {rule.draft.event === 'changed' && <TextField label="条件说明" value={rule.draft.condition} readOnly={!!pending} onChange={event => change({ ...rule.draft, condition: event.target.value })} hint="合成条件，仅用于此事件。" />}
          <ObjectPicker key={access.revision} draft={rule.draft} access={access} change={change} transport={transport} error={objectError} long={long} readOnly={!!pending} />
          <Select label="接收渠道" value={rule.draft.channel} disabled={!!pending} error={channelError || undefined} onChange={event => change({ ...rule.draft, channel: event.target.value })}>
            <option value="">未选择渠道</option>{channels.filter(item => access.channels.includes(item.value)).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
          {!access.channels.length && <Notice title="暂无可用渠道">可保存停用草稿；启用前需选择已授权且可用的渠道。</Notice>}
          <Stack gap={1} data-notification-audience><Text>对象可见范围：{scopeText(rule.draft)}</Text><Text>对象详情：{rule.draft.objects.filter(id => access.objects.includes(id)).map(id => objects.find(item => item.value === id)!.detail).join('、') || '没有可展示的对象详情'}</Text><Text>渠道可用性：{chosenChannel ? '当前可用' : '尚无可用选择'}</Text><Text>实际受众：{chosenChannel?.audience || '未确认'}</Text>{chosenChannel && <Text>{chosenChannel.message}</Text>}</Stack>
          {preview && <div data-notification-preview><Notice title="示例 · 未发送">{chosenChannel?.value === 'group' ? '你关注的事件有新动态，请登录后查看详情。' : `${events[rule.draft.event]}：${scopeText(rule.draft)}。`}</Notice></div>}
          {rule.review && <Notice title="需要重新确认">部分范围不再可用；有效选择和条件草稿已保留，恢复权限不会恢复旧选择或自动启用。</Notice>}
          {error && <Notice tone="error" title="操作未完成">{error}</Notice>}
          <Text role="status">{pending ? '正在等待合成响应，结果尚未确认。' : message || '当前配置尚未发送通知。'}</Text>
          <div ref={actions}><Inline gap={2}>
            <Button busy={pending === 'save'} aria-disabled={!!pending} onClick={() => void run('save')}>保存停用草稿</Button>
            <Button variant="secondary" busy={pending === 'preview'} aria-disabled={!!pending} onClick={() => void run('preview')}>查看示例</Button>
            <Button variant="secondary" busy={pending === 'enable'} aria-disabled={!!pending || rule.enabled} onClick={() => void run('enable')}>启用订阅</Button>
            <Button variant="quiet" disabled={!pending} onClick={cancel}>取消等待</Button>
          </Inline></div>
          <Disclosure title="合成情境控制">{controls}</Disclosure>
        </Stack></div>
      </Dialog>
    </Stack>
  </Surface>;
}

function DeliveryRecord({ transport, member }: { transport: Transport; member: Member }) {
  const [accepted, setAccepted] = useState(false), [uncertain, setUncertain] = useState(true), [pending, setPending] = useState(false), [error, setError] = useState('');
  const request = useRef<{ id: number; controller?: AbortController }>({ id: 0 });
  const actions = useRef<HTMLDivElement>(null), restoreFocus = useRef(false);
  useEffect(() => { if (!pending && restoreFocus.current) { restoreFocus.current = false; actions.current?.querySelector('button')?.focus(); } }, [pending]);
  useEffect(() => () => { request.current.id++; request.current.controller?.abort(); }, []);
  const read = async () => {
    if (request.current.controller) return;
    const controller = new AbortController(), id = ++request.current.id; request.current.controller = controller; setPending(true); setUncertain(true);
    try { await transport('delivery-read', controller.signal); if (id === request.current.id && !controller.signal.aborted) { setAccepted(true); setUncertain(false); setError(''); } }
    catch { if (id === request.current.id && !controller.signal.aborted) setError('读取失败，投递结果仍未知。'); }
    finally { if (id === request.current.id && !controller.signal.aborted) { restoreFocus.current = document.activeElement === actions.current?.querySelectorAll('button')[1]; request.current.controller = undefined; setPending(false); } }
  };
  return <Surface data-delivery-record data-pending={pending}><Stack gap={3}>
    <Text as="h3" variant="heading">{identities[member]}的合成通知记录</Text>
    <Text>示例记录 · 2026-10-31 09:00 UTC（合成）</Text>
    <Notice title={accepted && !uncertain ? '渠道已受理，未确认已读' : '投递结果未知'}>{accepted && !uncertain ? '受理只证明渠道接收请求，不证明收件人已读。' : '当前投递状态尚未确认。请读取状态；恢复读取不会重新投递。'}</Notice>
    {accepted && uncertain && <Text>上次确认：渠道已受理，2026-10-31 09:01 UTC（合成）；本次状态尚未确认。</Text>}
    {error && <Notice tone="error" title="状态读取失败">{error}</Notice>}
    <div ref={actions}><Inline gap={2}><Button variant="secondary" busy={pending} busyLabel="正在读取投递状态" onClick={() => void read()}>读取投递状态</Button><Button variant="quiet" disabled={!pending} onClick={() => { request.current.id++; request.current.controller?.abort(); request.current.controller = undefined; setPending(false); restoreFocus.current = true; }}>取消读取</Button></Inline></div>
  </Stack></Surface>;
}

export function NotificationWorkspace({ member, access, transport, long = false, controls }: { member: Member; access: Access; transport: Transport; long?: boolean; controls?: React.ReactNode }) {
  const [tab, setTab] = useState('subscriptions'), [filter, setFilter] = useState('all');
  const rules = useRef(initialRules(member));
  return <Tabs label="个人事件通知" value={tab} onValueChange={setTab} fullWidth items={[
    { value: 'subscriptions', label: '我的订阅', content: <Stack gap={4}>
      <ListFilterBar label="订阅筛选" primary={[{ id: 'rule', label: '订阅', control: <Select label="订阅筛选" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">全部订阅</option>{rules.current.map(rule => <option key={rule.id} value={rule.id}>{rule.title}</option>)}</Select> }]} />
      {rules.current.map(rule => <div key={rule.id} hidden={filter !== 'all' && rule.id !== filter}><RuleCard initial={rule} access={access} transport={transport} long={long} controls={controls} /></div>)}
    </Stack> },
    { value: 'records', label: '通知记录', content: <DeliveryRecord transport={transport} member={member} /> },
  ]} />;
}

export function NotificationGallery() {
  const [identity, setIdentity] = useState<Identity>('alpha'), [access, setAccess] = useState<Access>(accessFor('alpha')), [long, setLong] = useState(false), [conflict, setConflict] = useState(false), [readFailure, setReadFailure] = useState(false), [mounted, setMounted] = useState(true);
  const flags = useRef({ conflict, readFailure }); flags.current = { conflict, readFailure };
  const stableTransport = useRef<Transport>((operation, signal) => syntheticTransport(flags.current.conflict, flags.current.readFailure)(operation, signal));
  const identityActions = useRef<HTMLDivElement>(null), identityFocus = useRef(false);
  useEffect(() => { if (identityFocus.current) { identityFocus.current = false; identityActions.current?.querySelector('select')?.focus(); } }, [identity]);
  const changeIdentity = (next: Identity) => { identityFocus.current = true; setIdentity(next); setAccess(accessFor(next === 'admin' ? 'alpha' : next)); setConflict(false); setReadFailure(false); };
  const identityControl = (label: string) => <Select label={label} value={identity} onChange={event => changeIdentity(event.target.value as Identity)}>{Object.entries(identities).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>;
  const controls = <Fieldset legend="合成权限与响应"><Stack gap={3}>
    <Inline gap={2}><Button variant="quiet" onClick={() => setAccess(value => ({ ...value, objects: value.objects.slice(1), revision: value.revision + 1 }))}>撤销一个对象</Button><Button variant="quiet" onClick={() => setAccess(value => ({ ...value, objects: [], revision: value.revision + 1 }))}>撤销全部对象</Button><Button variant="quiet" onClick={() => setAccess(value => ({ ...value, channels: [], revision: value.revision + 1 }))}>停用全部渠道</Button><Button variant="quiet" onClick={() => setAccess(value => ({ ...accessFor(identity === 'admin' ? 'alpha' : identity), revision: value.revision + 1 }))}>恢复可选范围</Button></Inline>
    <Checkbox label="模拟保存冲突" checked={conflict} onChange={event => setConflict(event.target.checked)} />
    <Checkbox label="模拟投递读取失败" checked={readFailure} onChange={event => setReadFailure(event.target.checked)} />
    {identityControl('切换合成身份')}
  </Stack></Fieldset>;
  return <section id="personal-notifications"><Stack gap={4}>
    <Text as="h2" variant="title">个人事件通知</Text>
    <Text tone="muted">合成示例。导航、群消息级别与恢复方式是本例的可评审选择，真实权限和投递策略由消费产品确定。</Text>
    <div ref={identityActions}><Inline gap={3}>{identityControl('当前身份')}<Checkbox label="通知长文" checked={long} onChange={event => setLong(event.target.checked)} /><Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '卸载通知场景' : '重新挂载通知场景'}</Button></Inline></div>
    {identity === 'admin' ? <Stack gap={4}><Surface><Text as="h3" variant="heading">管理员全局规则</Text><Text>合成全局运维提醒 · 停用。与成员个人订阅独立。</Text></Surface><Surface><Text as="h3" variant="heading">渠道管理</Text><Text>合成个人通知箱与协作群；可用渠道不等于所有受众都有对象权限。</Text></Surface></Stack> : mounted ? <NotificationWorkspace key={identity} member={identity} access={access} transport={stableTransport.current} long={long} controls={controls} /> : <EmptyState title="通知场景已卸载" description="合成等待已取消。" />}
    {identity !== 'admin' && <Disclosure title="场景控制">{controls}</Disclosure>}
  </Stack></section>;
}
export function NotificationFixture() {
  const params = new URLSearchParams(location.search);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}><main className="rhine-notification-fixture"><NotificationGallery /></main></ThemeProvider>;
}
