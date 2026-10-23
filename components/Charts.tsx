import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { DataTable } from './Data';
import { EmptyState, Notice } from './components';

export interface ChartPoint { id: string; label: string; value: number | null }
interface ChartContext { label: string; unit: string; rangeLabel: string; description: string; stale?: string; error?: string; loading?: boolean; valueFormatter?: (value: number | null) => string }
export interface TrendChartProps extends ChartContext {
  points: ChartPoint[]; kind?: 'bar' | 'line';
  activePointId?: string | null; defaultActivePointId?: string; onActivePointChange?: (id: string | null) => void;
}
const known = (value: number | null): value is number => value !== null && Number.isFinite(value);

function ChartFrame({ label, unit, rangeLabel, description, stale, error, loading, children }: ChartContext & { children: ReactNode }) {
  return <figure className="rhine-chart" aria-label={label} aria-busy={loading}>
    <figcaption><strong>{label}</strong><span>{rangeLabel} · 单位：{unit}</span><p>{description}</p></figcaption>
    {error && <Notice title="图表读取失败" tone="error">{error} · 已有数据仅供参考。</Notice>}
    {stale && <Notice title="数据已陈旧" tone="warning">{stale}</Notice>}
    {loading && <p role="status">正在读取，保留已有数据。</p>}{children}
  </figure>;
}

/** The host provides bucket order, timestamps, units, and aggregation semantics. */
export function TrendChart({ points, kind = 'bar', activePointId, defaultActivePointId, onActivePointChange, ...context }: TrendChartProps) {
  const id = useId(), finite = points.map(point => point.value).filter(known);
  const [localActive, setLocalActive] = useState<string | null>(defaultActivePointId ?? null);
  const [focused, setFocused] = useState(false);
  const active = activePointId === undefined ? localActive : activePointId;
  const activeIndex = points.findIndex(point => point.id === active), activePoint = points[activeIndex];
  const select = (next: string | null) => { if (activePointId === undefined) setLocalActive(next); if (next !== active) onActivePointChange?.(next); };
  const format = (value: number | null) => context.valueFormatter ? context.valueFormatter(known(value) ? value : null) : known(value) ? String(value) : '未知';
  const minimum = finite.reduce((min, value) => Math.min(min, value), 0), maximum = finite.reduce((max, value) => Math.max(max, value), 0);
  // Normalize first so opposite finite extremes cannot overflow the coordinate span.
  const magnitude = Math.max(Math.abs(minimum), Math.abs(maximum), 1), span = (maximum / magnitude - minimum / magnitude) || 1;
  const x = (index: number) => (index + 0.5) * 600 / Math.max(1, points.length);
  const y = (value: number) => 170 - (value / magnitude - minimum / magnitude) / span * 160;
  let connected = false;
  const path = points.map((point, index) => {
    if (!known(point.value)) { connected = false; return ''; }
    const command = connected ? 'L' : 'M'; connected = true;
    return `${command}${x(index)},${y(point.value)}`;
  }).join(' ');
  return <ChartFrame {...context}>
    {!finite.length ? <EmptyState title={points.length ? '所有采样值均未知' : '暂无采样'} description="缺失值不会补零。" /> : <>
      <div className="rhine-chart__scale"><span>{format(maximum)} {context.unit}</span><span>{format(minimum)} {context.unit}</span></div>
      <svg className="rhine-chart__plot" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title ${id}-description`} aria-describedby={`${id}-inspection`} tabIndex={0}
        onFocus={() => { setFocused(true); if (!activePoint) select(points[0]?.id ?? null); }} onBlur={() => setFocused(false)}
        onKeyDown={event => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : event.key === 'ArrowLeft' ? Math.max(0, activeIndex - 1) : event.key === 'ArrowRight' ? Math.min(points.length - 1, activeIndex + 1) : undefined;
          if (next !== undefined) { event.preventDefault(); select(points[next]?.id ?? null); }
        }}
        onPointerMove={event => {
          if (event.pointerType !== 'mouse' && !event.buttons) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (rect.width) select(points[Math.max(0, Math.min(points.length - 1, Math.floor((event.clientX - rect.left) / rect.width * points.length)))]?.id ?? null);
        }}
        onPointerLeave={() => { if (!focused) select(null); }}
        onClick={event => {
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.focus();
          if (rect.width) select(points[Math.max(0, Math.min(points.length - 1, Math.floor((event.clientX - rect.left) / rect.width * points.length)))]?.id ?? null);
        }}>
        <title id={`${id}-title`}>{context.label} · {kind === 'bar' ? '柱形趋势' : '历史折线'}</title>
        <desc id={`${id}-description`}>{context.description}；{points.length} 个时段，{points.length - finite.length} 个未知值。完整标签与数值见下方数据表。</desc>
        <path className="rhine-chart__grid" d={`M0,${y(0)}H600 M0,10H600 M0,170H600`} />
        {activePoint && <rect className="rhine-chart__highlight" x={activeIndex * 600 / points.length} y={0} width={600 / points.length} height={180} />}
        {kind === 'line' && <path className="rhine-chart__line" d={path} vectorEffect="non-scaling-stroke" />}
        {points.map((point, index) => !known(point.value) ? <path key={point.id} className="rhine-chart__missing" d={`M${x(index) - 3},174l6,6m0,-6l-6,6`} vectorEffect="non-scaling-stroke" /> : kind === 'bar' ?
          <rect key={point.id} className="rhine-chart__bar" x={x(index) - 210 / points.length} y={Math.min(y(0), y(point.value))} width={420 / points.length} height={Math.abs(y(point.value) - y(0))}><title>{point.label}：{point.value} {context.unit}</title></rect> :
          <circle key={point.id} className="rhine-chart__point" cx={x(index)} cy={y(point.value)} r={3}><title>{point.label}：{point.value} {context.unit}</title></circle>)}
      </svg>
      <div className="rhine-chart__range"><span>{points[0]?.label}</span><span>{points.at(-1)?.label}</span></div>
      <p className="rhine-chart__legend"><span aria-hidden="true" />{context.label} · × 表示缺失；折线在缺失处断开。</p>
    </>}
    <p id={`${id}-inspection`} className="rhine-chart__inspection" aria-live="polite" aria-atomic="true">{activePoint ? `${activePoint.label}：${format(activePoint.value)}${known(activePoint.value) ? ` ${context.unit}` : ''}` : '聚焦图形后用左右键、Home / End 查看采样；也可悬停或轻触。'}</p>
    <details className="rhine-chart__data"><summary>查看{context.label}数据表</summary><DataTable caption={`${context.label}原始采样`} rows={points} rowKey={point => point.id} columns={[
      { key: 'label', header: '时段', render: point => point.label }, { key: 'value', header: `值（${context.unit}）`, render: point => known(point.value) ? point.value : '未知' },
    ]} /></details>
  </ChartFrame>;
}

export interface ChartPart extends ChartPoint { tone?: 1 | 2 | 3 | 4 }
export interface StackedBarProps extends ChartContext { parts: ChartPart[] }
export function StackedBar({ parts, ...context }: StackedBarProps) {
  const incomplete = parts.some(part => !known(part.value)), invalid = parts.some(part => known(part.value) && part.value < 0);
  const total = parts.reduce((sum, part) => sum + (known(part.value) ? part.value : 0), 0);
  const complete = parts.length > 0 && !incomplete && !invalid && Number.isFinite(total) && total > 0;
  return <ChartFrame {...context}>
    {complete ? <div className="rhine-chart__stack" role="img" aria-label={`${context.label}：${parts.map(part => `${part.label} ${part.value} ${context.unit}`).join('；')}。完整比例见图例。`}>
      {parts.map((part, index) => part.value! > 0 && <span key={part.id} data-tone={part.tone ?? index % 4 + 1} style={{ flexGrow: part.value! / total } as CSSProperties} />)}
    </div> : <p role="status">{invalid ? '包含负数，无法绘制占比。' : incomplete ? '总量未知，不计算占比。' : total === 0 && parts.length ? '已知总量为 0，无占比。' : '暂无可绘制的占比。'}</p>}
    <ul className="rhine-chart__parts" aria-label={`${context.label}图例`}>{parts.map((part, index) => <li key={part.id}><span aria-hidden="true" data-tone={part.tone ?? index % 4 + 1} />{part.label}：{context.valueFormatter ? context.valueFormatter(known(part.value) ? part.value : null) : known(part.value) ? part.value : '未知'}{known(part.value) ? ` ${context.unit}` : ''}{complete ? `（${(part.value! / total * 100).toFixed(1)}%）` : ''}</li>)}</ul>
  </ChartFrame>;
}
