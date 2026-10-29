import { useState } from 'react';
import { TimelineCompositionGallery } from './TimelineCompositionGallery';
import { TimelineListGallery } from './TimelineListGallery';
import { Select, Stack, StackedBar, StatusTimeline, Surface, TimelineLegend, TrendChart, type ChartPoint, type TimelineSegment } from '../components';

export function MonitoringGallery() {
  const [state, setState] = useState('ready');
  const [activePoint, setActivePoint] = useState<string | null>(null);
  const points: ChartPoint[] = state === 'empty' ? [] : [12, 18, null, 0, 24, 16].map((value, index) => ({ id: String(index), label: `10:${String(index * 10).padStart(2, '0')}`, value }));
  const segments: TimelineSegment[] = state === 'empty' ? [] : ['healthy', 'failed', 'unknown', 'recovered'].map((status, index) => ({
    id: String(index), label: `时段 ${index + 1}`, status: status as TimelineSegment['status'], detail: {
      start: `2026-10-23 10:${String(index * 10).padStart(2, '0')} UTC+8`, end: `2026-10-23 10:${String((index + 1) * 10).padStart(2, '0')} UTC+8`,
      reason: status === 'unknown' ? '此时段没有完整采集证据，不能视为健康。' : status === 'failed' ? '存在宿主确认的最终失败。' : '宿主提供的状态原因，组件不计算健康评分。',
      counts: [{ id: 'success', label: '确认输出', value: status === 'unknown' ? null : 12, unit: '次' }, { id: 'failure', label: '最终失败', value: status === 'failed' ? 2 : 0, unit: '次' }, { id: 'pending', label: '待确认', value: null }],
      methodology: '按请求最终结果归类；重试已恢复与最终失败分开计数，缺失采样保持未知。',
    },
  }));
  const feedback = { stale: state === 'stale' ? '最后采集于 20 分钟前，请核对来源。' : undefined, error: state === 'error' ? '本次读取失败，保留上次采样。' : undefined };
  return <section><div className="ds-section-title"><span>MONITORING</span><h2>看见证据，也看见缺口</h2></div>
    <TimelineCompositionGallery />
    <TimelineListGallery />
    <p className="ds-caption">计数与口径由宿主提供。未知保持未知，折线在缺失处断开；图例与数据表提供文字替代，不生成健康评分。时段详情支持鼠标、键盘、触屏和 Escape，并自动避让视口。</p>
    <Select label="监控演示状态" value={state} onChange={event => setState(event.target.value)}><option value="ready">默认 / 含缺失采样</option><option value="empty">空数据</option><option value="stale">陈旧数据</option><option value="error">错误 / 保留旧数据</option><option value="unknown">占比总量未知</option></Select>
    <Surface className="ds-gap-top"><Stack gap={4}><h3>结构化时段详情</h3><StatusTimeline label="结构化健康历史" startLabel="10:00 UTC+8" endLabel="10:40 UTC+8" segments={segments} /><TimelineLegend /><p>方向键与 Home/End 切换时段；轻触健康条查看同一份完整详情。</p><StatusTimeline compact label="紧凑结构化历史" startLabel="10:00" endLabel="10:40" segments={segments} /></Stack></Surface>
    <div className="ds-extension-grid">
      <Surface><TrendChart label="请求量趋势" unit="次" rangeLabel="2026-10-23 10:00–11:00 UTC+8" description="每 10 分钟一个桶；10:20 未采集，10:30 已确认是零。左右键或轻触可查看，并同步右侧图表时段。" points={points} activePointId={activePoint} onActivePointChange={setActivePoint} valueFormatter={value => value === null ? '未知' : value.toLocaleString('zh-CN')} {...feedback} /></Surface>
      <Surface><TrendChart kind="line" label="资源使用历史" unit="%" rangeLabel="2026-10-23 10:00–11:00 UTC+8" description="宿主采集的资源占用；不插值，不跨越缺失点连线。两个图表按时段 ID 同步查看。" points={points} activePointId={activePoint} onActivePointChange={setActivePoint} {...feedback} /></Surface>
      <Surface><StackedBar label="请求结果分布" unit="次" rangeLabel="2026-10-23 10:00–11:00 UTC+8" description="按宿主互斥分类的计数绘图；包含未知计数时不归一化。" parts={state === 'empty' ? [] : [{ id: 'complete', label: '已完成', value: 32, tone: 1 }, { id: 'retry', label: '重试恢复', value: 8, tone: 3 }, { id: 'failed', label: '最终失败', value: state === 'unknown' ? null : 4, tone: 2 }]} {...feedback} /></Surface>
    </div>
  </section>;
}
