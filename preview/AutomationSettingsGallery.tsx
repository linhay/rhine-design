import { useMemo, useState } from 'react';
import { Button, Checkbox, Dialog, IconButton, Inline, Notice, Popover, Select, Stack, Surface, Switch, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { initialAutomation, outcomeLabels, runtimeLabels, syntheticAutomation, useAutomationRecipe, type AutomationSnapshot, type AutomationTransport, type Outcome } from './automationSettingsRecipe';
import './automation-settings.css';

export function AutomationCard({ name, transport, initial = initialAutomation, readOnly = false, admin = true }: { name: string; transport: AutomationTransport; initial?: AutomationSnapshot; readOnly?: boolean; admin?: boolean }) {
  const state = useAutomationRecipe(transport, initial);
  const [log, setLog] = useState(false);
  const locked = !admin || readOnly;
  return <Surface data-automation-card={name} data-pending={state.pending || 'idle'} data-write-unknown={state.unknown}>
    <Stack gap={4}>
      <div className="rhine-automation-heading"><Text as="h3" variant="heading">{name}</Text><Switch label={`${name}启用意图`} labelVisibility="hidden" checked={state.snapshot.enabled} readOnly={locked || !!state.pending || state.unknown || state.snapshot.runtime === 'unavailable'} onCheckedChange={state.write} /></div>
      <Text variant="caption" tone="muted">启用后持续接管；停用后保留已有设置，等待本轮操作收尾。</Text>
      {locked && <Text>{admin ? '只读：可查看，不能修改启用意图。' : '非管理员：仅可查看，不能修改启用意图。'}</Text>}
      <Stack gap={2} data-automation-facts>
        <Text>已确认意图：{state.snapshot.enabled ? '启用' : '停用'}{state.unknown ? '（上次记录）' : ''}</Text>
        <Text>运行事实：{runtimeLabels[state.snapshot.runtime]}{state.error || state.unknown ? '（上次记录）' : ''}</Text>
        <Text>最近执行：{outcomeLabels[state.snapshot.outcome]}</Text>
        <Text variant="caption" tone="muted">观测时间：{state.snapshot.observedAt}</Text>
      </Stack>
      {state.snapshot.runtime === 'draining' && <Notice tone="warning" title="停用意图已保存，仍在收尾">外部操作尚未排空，不能据此宣告已停止。</Notice>}
      {state.snapshot.runtime === 'unavailable' && <Notice tone="warning" title="当前不可用">请恢复服务后读取确认；启用意图不代表实际运行。</Notice>}
      {state.snapshot.outcome === 'failed' && <Notice tone="error" title="最近执行失败">本轮未完成；保留已有设置，可查看日志。</Notice>}
      {state.snapshot.outcome === 'unknown' && <Notice tone="warning" title="执行结果待确认">尚无已确认计数；不以零项或成功代替未知。</Notice>}
      {state.unknown && <Notice tone="warning" title="写入结果未知">请求意图：{state.requested ? '启用' : '停用'}。开关保留上次确认值；重新读取前不允许重复写入。</Notice>}
      {state.error && <Notice tone="error" title="此卡片读取失败">{state.error}</Notice>}
      <Text role="status" data-automation-message>{state.message || '可独立读取此卡片。'}</Text>
      <Inline gap={2} role="group" aria-label={`${name}操作`}>
        <Button variant="secondary" busy={state.pending === 'read'} busyLabel={`正在读取${name}`} disabled={state.pending === 'write'} onClick={state.read}>读取状态</Button>
        <Button variant="quiet" disabled={!state.pending} onClick={state.cancel}>取消等待</Button>
        <Popover title={`${name}接管细则`} trigger={<IconButton icon="info" label={`${name}接管细则`} />}><Text>持续接管按已保存意图执行。停用保留已有设置仅适用于本例；取消等待不会撤销外部操作。</Text></Popover>
        <Dialog open={log} onOpenChange={setLog} title={`${name}执行日志`} description="合成记录；读取日志不会执行任务或更改启用意图。" trigger={<Button variant="quiet">查看日志</Button>}>
          <Stack gap={3}><Text>观测时间：{state.snapshot.observedAt}</Text><Text>最近执行：{outcomeLabels[state.snapshot.outcome]}</Text><Text>运行事实：{runtimeLabels[state.snapshot.runtime]}</Text></Stack>
        </Dialog>
      </Inline>
    </Stack>
  </Surface>;
}

function SyntheticCard({ name, scenario, outcome, readOnly, admin }: { name: string; scenario: string; outcome: Outcome; readOnly: boolean; admin: boolean }) {
  const transport = useMemo(() => syntheticAutomation(scenario, outcome), [scenario, outcome]);
  const initial: AutomationSnapshot = { ...initialAutomation, outcome, enabled:scenario === 'draining', runtime:scenario === 'draining' ? 'running' : scenario === 'unavailable' ? 'unavailable' : 'stopped' };
  return <AutomationCard {...{ name, transport, initial, readOnly, admin }} />;
}

export function AutomationSettingsGallery() {
  const [scenario, setScenario] = useState('normal'), [outcome, setOutcome] = useState<Outcome>('unchanged');
  const [readOnly, setReadOnly] = useState(false), [admin, setAdmin] = useState(true), [long, setLong] = useState(false), [mounted, setMounted] = useState(true);
  return <section id="automation-settings"><Stack gap={4}>
    <Text as="h2" variant="section">周期自动化设置</Text>
    <Text tone="muted">双卡片组合；使用合成数据与可取消计时器，不访问业务服务；场景、结果与权限控制仅作用于首卡。</Text>
    <Inline gap={3}>
      <Select label="自动化场景" value={scenario} onChange={e => setScenario(e.target.value)}>{[['normal','正常启停'],['draining','运行后停用收尾'],['lost','写响应丢失后回读'],['unknown','写未知且首次回读失败'],['read-error','局部读取失败'],['unavailable','局部不可用']].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</Select>
      <Select label="最近执行结果" value={outcome} onChange={e => setOutcome(e.target.value as Outcome)}>{(Object.keys(outcomeLabels) as Outcome[]).map(value => <option key={value} value={value}>{outcomeLabels[value]}</option>)}</Select>
      <Checkbox label="首卡只读" checked={readOnly} onChange={e => setReadOnly(e.target.checked)} /><Checkbox label="首卡管理员" checked={admin} onChange={e => setAdmin(e.target.checked)} /><Checkbox label="自动化长名称" checked={long} onChange={e => setLong(e.target.checked)} />
      <Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '卸载卡片' : '重新挂载卡片'}</Button>
    </Inline>
    {mounted && <div className="rhine-automation-cards" key={`${scenario}/${outcome}`}>
      <SyntheticCard name={long ? '自动归档 · 跨区域长期研究资料与联合设计验证项目 Synthetic complete automation identity' : '自动归档'} scenario={scenario} outcome={outcome} readOnly={readOnly} admin={admin} />
      <SyntheticCard name="周期整理" scenario="normal" outcome="updated" readOnly={false} admin={true} />
    </div>}
  </Stack></section>;
}

export function AutomationSettingsFixture() {
  const params = new URLSearchParams(location.search);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}><main className="rhine-automation-fixture"><AutomationSettingsGallery /></main></ThemeProvider>;
}
