import { useState } from 'react';
import { Badge, Button, Disclosure, Grid, Inline, Metric, Notice, Select, Stack, Surface, Text, type Tone } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
import { periods, scopeNames, syntheticComparisonRead, useComparisonPair, type Mode, type Read, type Scope } from './metricComparisonRecipe';

type Example = { id: string; label: string; current: string | null; baseline: string; unit: string; change: string; assessment: string; tone: Tone; detail: string };
const examples: Example[] = [
  { id:'count', label:'请求次数', current:'120', baseline:'100', unit:'次', change:'较上周增加 20 次（+20%）', assessment:'数量增加，不代表质量改善', tone:'neutral', detail:'原始当前值 120；原始基准值 100。差值 120 − 100 = 20；相对变化 (120 − 100) / 100 = 20%。' },
  { id:'rate', label:'错误率', current:'3', baseline:'2', unit:'%', change:'上升 1 个百分点；相对增加 50%', assessment:'错误率上升，需要关注', tone:'warning', detail:'当前 3 / 100 = 3%；基准 2 / 100 = 2%。3% − 2% = 1 个百分点；(3% − 2%) / 2% = 50%。' },
  { id:'zero', label:'新增记录', current:'12', baseline:'0', unit:'条', change:'从 0 增至 12；相对变化不适用', assessment:'零基准，不计算相对百分比', tone:'neutral', detail:'原始当前值 12；原始基准值 0。绝对变化 +12 条；分母为零，不计算相对变化。' },
  { id:'both-zero', label:'待处理记录', current:'0', baseline:'0', unit:'条', change:'数量无变化；相对百分比不适用', assessment:'已确认的两个零值', tone:'neutral', detail:'原始当前值 0；原始基准值 0。绝对差值为 0；0 / 0 不可计算，不能写作 0% 变化。' },
  { id:'latency', label:'平均延迟', current:'120', baseline:'100', unit:'ms', change:'上升 20 ms（+20%）', assessment:'延迟增加，需要关注', tone:'warning', detail:'原始当前值 120 ms；原始基准值 100 ms。相同口径平均延迟，低值更有利；相对变化 20%。' },
  { id:'throughput', label:'完成吞吐', current:'120', baseline:'100', unit:'次/秒', change:'上升 20 次/秒（+20%）', assessment:'同质量约束下吞吐提升', tone:'success', detail:'原始当前值 120 次/秒；原始基准值 100 次/秒。本例约定相同质量与资源约束，高值更有利。' },
  { id:'unknown', label:'已知当前用量', current:'12', baseline:'未知', unit:'次', change:'无法比较：上周未提供读数', assessment:'基准未知，不能补零', tone:'neutral', detail:'原始当前值 12；基准 null。未知没有参与公式。' },
  { id:'incomparable', label:'部分采集次数', current:'12', baseline:'100', unit:'次', change:'无法比较：本周仅采集 2 天，上周完整 7 天', assessment:'部分采集，口径不同', tone:'warning', detail:'已知当前值 12（10-26 至 10-27）；基准 100（10-19 至 10-25）。周期覆盖不同，不计算相对变化。' },
  { id:'precision', label:'精确累计量', current:'1.2M', baseline:'1,000,000', unit:'次', change:'增加 234,567 次（约 +23.46%）', assessment:'概览缩写，精确值可展开', tone:'neutral', detail:'原始当前值 1,234,567；原始基准值 1,000,000。差值 234,567；相对变化 23.4567%，展示保留两位。计算未解析 1.2M。' },
];

export function ComparisonPairDemo({ read = syntheticComparisonRead }: { read?: Read }) {
  const [mode, setMode] = useState<Mode>('normal');
  const state = useComparisonPair(read), pair = state.pair;
  const stale = !!pair && (pair.scope !== state.scope || state.status !== 'ready');
  return <Surface><Stack data-comparison-pair data-scope={pair?.scope} data-selected-scope={state.scope} data-read-status={state.status}>
    <Text as="h3" variant="heading">成对读取与失败恢复</Text>
    <Inline><Select label="比较工作区" value={state.scope} onChange={event => state.load(event.target.value as Scope, mode)}><option value="north">北区</option><option value="south">南区</option></Select>
      <Select label="合成读取场景" value={mode} onChange={event => setMode(event.target.value as Mode)}><option value="normal">正常</option><option value="baseline-fail">基准失败</option><option value="current-fail">当前失败</option><option value="out-of-order">北区慢、南区快</option></Select></Inline>
    <Text>当前选择：{scopeNames[state.scope]} · {periods.current} 对比 {periods.baseline} · 上海 UTC+8 · 次</Text>
    <Inline><Button variant="secondary" busy={state.status === 'pending'} busyLabel="正在成对读取" onClick={() => state.load(state.scope, mode)}>重新读取比较</Button>
      <Button variant="quiet" disabled={state.status !== 'pending'} onClick={event => { const target = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>('button'); state.cancel(); target?.focus(); }}>取消读取</Button></Inline>
    {state.status === 'pending' && <Text role="status">正在读取当前值和基准值，暂不使用单侧新结果。</Text>}
    {state.status === 'error' && <Notice tone="error" title={state.error}>选择正常场景后重新读取。{pair ? '以下保留上次完整结果及原范围。' : '尚无完整快照，不显示虚构零值。'}</Notice>}
    {state.status === 'cancelled' && <Text>已取消本次读取；没有接受新的比较结果。</Text>}
    {pair && <Stack gap={2} data-accepted-pair>
      <Text>结果范围：{scopeNames[pair.scope]} · {periods.current} 对比 {periods.baseline} · 上海 UTC+8 · 观测 {pair.observedAt}</Text>
      {stale && <Text tone="warning">陈旧快照：保留原范围的完整一对数值，不代表当前选择的新结果。</Text>}
      <Metric label="请求次数" value={pair.current} unit="次" />
      <Text>基准 {pair.baseline} 次 · 较上周增加 {pair.current - pair.baseline} 次（+{(pair.current - pair.baseline) / pair.baseline * 100}%）</Text>
      <Disclosure title="完整数值与查询范围"><Text>当前 {pair.current} 次，基准 {pair.baseline} 次；两侧均属于 {scopeNames[pair.scope]}，同一次比较读取。合成来源：周期汇总；口径为已完成请求总数。</Text></Disclosure>
    </Stack>}
  </Stack></Surface>;
}

export function MetricComparisonGallery() {
  return <Stack gap={4} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
    <Text as="h2" variant="section">指标比较 · 基准与含义</Text>
    <Text>北区共享研究工作区 · 当前 2026-10-26 至 11-01，对比上周 2026-10-19 至 10-25 · 上海 UTC+8。全部为合成算例，例外覆盖范围就近说明。</Text>
    <Grid minWidth={260}>{examples.map(example => <Surface key={example.id} data-comparison-example={example.id}><Stack gap={2}>
      <Metric label={example.label} value={example.current} unit={example.unit} />
      <Text>上周基准：{example.baseline}{example.baseline === '未知' ? '' : ` ${example.unit}`}</Text>
      <Text>{example.change}</Text><Badge tone={example.tone}>{example.assessment}</Badge>
      <Disclosure title="完整数值与公式" ariaLabel={`${example.label} · 完整数值与公式`}><Text>{example.detail}</Text><Text tone="muted">来源：合成周期汇总；计算由宿主提供。</Text></Disclosure>
    </Stack></Surface>)}</Grid>
    <ComparisonPairDemo />
  </Stack>;
}

export function MetricComparisonFixture() {
  const params = new URLSearchParams(location.search), [mounted, setMounted] = useState(true);
  return <ThemeProvider defaultTheme={(params.get('theme') || 'rhine') as ThemeName} data-rhine-motion={params.get('motion') === 'manual' ? 'reduced' : 'system'}><main style={{ padding: 16, minWidth: 0 }}>
    <Button variant="quiet" onClick={() => setMounted(value => !value)}>{mounted ? '退出比较示例' : '进入比较示例'}</Button>
    {mounted && <MetricComparisonGallery />}
  </main></ThemeProvider>;
}
