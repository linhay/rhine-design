import { flushSync } from 'react-dom';
import { useMemo, useRef, useState } from 'react';
import { Badge, Button, Checkbox, Disclosure, Inline, Link, Notice, Select, Stack, Surface, Text } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { dailyReports, evidenceCoverage, reportPeriods, sourceHref, sourceRecords, syntheticReportTransport, usePeriodicReport, type Period, type ReportStatus } from './periodicReportRecipe';
import './periodic-report.css';

const scenarios = [['completed', '完成·证据不足'], ['idle', '尚未生成'], ['empty', '已确认空日报'], ['queued', '排队'], ['generating', '生成中'], ['failed', '生成失败'], ['unknown', '结果待核对'], ['invalid', '非法模型引用'], ['read-error', '状态读取失败'], ['response-lost', '生成响应丢失']] as const;
function Report({ period, person, scenario, long }: { period: Period; person: string; scenario: string; long: boolean }) {
  const range = reportPeriods[period], days = dailyReports(period, scenario === 'empty'), coverage = evidenceCoverage(days);
  const transport = useMemo(() => syntheticReportTransport(scenario), [scenario]);
  const initial: ReportStatus = ['idle', 'queued', 'generating', 'failed', 'unknown'].includes(scenario) ? scenario as ReportStatus : scenario === 'response-lost' ? 'idle' : 'completed';
  const state = usePeriodicReport(`${person}:${period}`, initial, transport);
  const root = useRef<HTMLDivElement>(null);
  const busy = state.pending === 'generate';
  const generationBlocked = ['queued', 'generating', 'unknown'].includes(state.status);
  const statusLabels = { idle: '尚未生成', queued: '排队中', generating: '生成中', completed: 'AI 生成完成', failed: '生成失败', unknown: '结果待核对' };
  const references = scenario === 'invalid' ? ['day-19', 'javascript:alert(1)', 'outside-period'] : ['day-19', 'day-20'];
  const invalid = scenario !== 'empty' && references.some(id => !sourceHref(id, days));
  return <Surface data-report data-scope={`${person}:${period}`} data-generation-count={state.generations} data-report-status={state.status}>
    <Stack gap={4}>
      <Stack gap={2}>
        <Text as="h3" variant="heading">{person} · {range.label}</Text>
        <Text data-period-boundary>范围：{range.start} 00:00 +08:00（含）至 {range.end} 00:00 +08:00（不含）</Text>
        <Text>时区：Asia/Shanghai · 周一为周起点</Text>
        <Text>计划：{range.plan} · 示例下次计划：{range.next}</Text>
        <Text tone="muted">计划信息由宿主提供；本展台不运行自动计划。</Text>
      </Stack>
      <div ref={root}><Inline gap={2}>
        <Button data-generate busy={busy} disabled={state.reading} aria-disabled={!busy && generationBlocked} busyLabel={statusLabels[state.status]} onClick={() => void state.run('generate')}>生成当前对象报告</Button>
        <Button data-read variant="secondary" busy={state.reading} disabled={busy} busyLabel="读取现有状态中" onClick={() => void state.run('read')}>刷新状态</Button>
        {state.pending && <Button variant="quiet" onClick={event => { const returnFocus = document.activeElement === event.currentTarget; flushSync(state.cancel); if (returnFocus) root.current?.querySelector<HTMLButtonElement>('[data-read]')?.focus(); }}>停止等待</Button>}
      </Inline></div>
      <div data-generation-status><Badge tone={state.status === 'failed' ? 'error' : state.status === 'unknown' ? 'warning' : 'neutral'}>{statusLabels[state.status]}</Badge></div>
      <Text role="status" data-report-feedback>{state.feedback || 'AI 生成状态不代表工作完成情况。'}</Text>
      {state.status === 'failed' && <Notice tone="error" title="生成失败，每日资料已保留">可显式重试生成；刷新只读取现有状态。</Notice>}
      {state.status === 'unknown' && <Notice tone="warning" title="生成结果待核对">先刷新状态；不能据此宣告成功或再次自动生成。</Notice>}
      {state.readError && <Notice tone="error" title="状态读取失败">保留上次生成状态与每日资料；可再次刷新。</Notice>}
      <Stack gap={2} data-coverage>
        <Text as="h4" variant="heading">证据覆盖</Text>
        <Text>{coverage.missing ? `${coverage.missing} 天日报缺失，不能视为空日报。` : '本周期日报均已确认。'} 已确认空日报 {days.filter(day => day.state === 'empty').length} 天。</Text>
        <Text>{coverage.percent === null ? '无待核对材料，覆盖率不适用（不是 100%）。' : `已核对 ${coverage.verified} / ${coverage.total} 条材料（${coverage.percent}%）；仅统计已收到材料，缺失日期未纳入分母。`}</Text>
        {!!coverage.missing && <Disclosure title="查看缺失日期"><Text>{days.filter(day => day.state === 'missing').map(day => day.date).join('、')}</Text></Disclosure>}
      </Stack>
      {state.summary && <Stack gap={3} data-summary>
        <Text as="h4" variant="heading">{state.status === 'completed' ? '活动摘要' : '上次活动摘要（保留）'}</Text>
        <Text>{scenario === 'empty' ? '本周期每日均确认无活动，未生成合并事项。' : `围绕报告结构进行了跨日讨论；现有材料不足以确认工作全部完成。${long ? '讨论覆盖跨团队协作、长周期材料核对、遗留问题跟进与结果追溯；所有待确认内容保持原有含义，不因摘要压缩而变成已完成。'.repeat(4) : ''}`}</Text>
        {scenario !== 'empty' && <>
          <Text as="h4" variant="heading">合并事项 · 报告结构讨论</Text>
          <Text>来源日期：2026-10-19、2026-10-20 · 工作状态：待核对</Text>
          {invalid && <Notice tone="warning" title="部分引用未通过校验">无法确认的引用不生成链接；不能视为已验证证据。</Notice>}
          <Disclosure title="展开合并事项的每日来源"><Stack gap={3}>{references.map(id => {
            const href = sourceHref(id, days), source = sourceRecords[id as keyof typeof sourceRecords];
            return href && source ? <Stack gap={2} key={id}><Text>{source.date} · {source.text}</Text><Link href={href} target="_blank" rel="noopener noreferrer">查看 {source.date} 合成来源（新标签页）</Link></Stack> : <Text key={id} tone="warning">未验证引用（无链接）</Text>;
          })}</Stack></Disclosure>
        </>}
      </Stack>}
      <Disclosure title={`每日资料 · ${days.length} 天`}><Stack gap={3}>{days.map(day => <div key={day.date} data-daily={day.state}><Text>{day.date} · {day.state === 'missing' ? '日报缺失，活动未知' : day.state === 'empty' ? '已确认空日报' : day.activity}</Text>{day.source && <Link href={sourceHref(day.source, days)!} target="_blank" rel="noopener noreferrer">查看 {day.date} 原始材料（新标签页）</Link>}</div>)}</Stack></Disclosure>
    </Stack>
  </Surface>;
}
export function PeriodicReportGallery() {
  const [period, setPeriod] = useState<Period>('week'), [person, setPerson] = useState('示例人员 A');
  const [scenario, setScenario] = useState('completed'), [long, setLong] = useState(false), [mounted, setMounted] = useState(true);
  return <Stack gap={4} className="rhine-periodic-report">
    <Text as="h2" variant="section">周期报告与跨日来源</Text>
    <Text tone="muted">合成资料与计时器演示；没有真实模型、生产计划或工作完成判断。</Text>
    <div className="rhine-periodic-controls">
      <Select label="报告周期" value={period} onChange={event => setPeriod(event.target.value as Period)}><option value="week">自然周</option><option value="month">自然月</option></Select>
      <Select label="报告对象" value={person} onChange={event => setPerson(event.target.value)}><option>示例人员 A</option><option>示例人员 B</option></Select>
      <Select label="报告合成场景" value={scenario} onChange={event => setScenario(event.target.value)}>{scenarios.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select>
    </div>
    <Inline gap={2}><Checkbox label="报告长中文" checked={long} onChange={event => setLong(event.target.checked)} /><Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '卸载报告演示' : '挂载报告演示'}</Button></Inline>
    {mounted && <Report key={`${person}:${period}:${scenario}`} period={period} person={person} scenario={scenario} long={long} />}
  </Stack>;
}
export function PeriodicReportFixture() {
  const params = new URLSearchParams(location.search), id = params.get('source');
  const source = id && Object.hasOwn(sourceRecords, id) ? sourceRecords[id as keyof typeof sourceRecords] : undefined;
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}>
    <main className="rhine-periodic-fixture">{id ? <Stack gap={3}><Text as="h1" variant="section">{source ? `${source.date} 合成来源` : '来源不可用'}</Text><Text>{source?.text || '没有可验证的来源，不提供绕过链接。'}</Text></Stack> : <PeriodicReportGallery />}</main>
  </ThemeProvider>;
}
