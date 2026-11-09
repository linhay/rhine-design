import { useState } from 'react';
import { Button, Dialog, Inline, Stack, StatusTimeline, StatusTimelineList, Surface, Text, TimelineLegend, type TimelineCompositionSegment, type TimelineStatusLabels } from '../components';

const labels: TimelineStatusLabels = { healthy: '低于 5%', recovered: '已恢复', degraded: '5% 至 20%', failed: '至少 20%', unknown: '证据不足' };
const bucket = (id: string, label: string, direct: number, retried: number, failed: number, unknown = 0): TimelineCompositionSegment => ({
  id, label, composition: { total: direct + retried + failed + unknown, coverage: 'complete', counts: { direct, retried, failed, unknown } },
  detail: { start: `${id} 开始 · UTC+8`, end: `${id} 结束 · UTC+8`, methodology: '合成请求按 ID 去重，最终结果互斥分类；扩大桶先求各类计数之和，再除以总数。' },
});
export const compositionExamples = [
  bucket('direct', '全部直接成功', 100, 0, 0), bucket('retry', '全部重试成功', 0, 100, 0),
  bucket('failed', '全部最终失败', 0, 0, 100), bucket('unknown', '全部结果未知', 0, 0, 0, 100),
  bucket('mixed', '三色混合', 70, 20, 10), bucket('partial-result', '总数完整含未知', 60, 20, 10, 10),
  bucket('tiny', '微小失败份额', 99999, 0, 1), bucket('weighted', '加权聚合：1/1 与 0/99', 1, 0, 99),
  bucket('zero', '无请求', 0, 0, 0),
  { ...bucket('partial', '采集不完整', 5, 2, 1), composition: { ...bucket('', '', 5, 2, 1).composition, coverage: 'partial' as const, reason: '部分采集区间尚未返回，不能用已知样本补齐占比。' } },
  { ...bucket('missing', '缺失采集', 0, 0, 0), composition: { ...bucket('', '', 0, 0, 0).composition, coverage: 'missing' as const } },
  { ...bucket('invalid', '无效总数', 5, 2, 1), composition: { ...bucket('', '', 5, 2, 1).composition, total: 10 } },
];

export function TimelineCompositionGallery() {
  const [updated, setUpdated] = useState(false);
  const segments = updated ? compositionExamples.map(item => item.id === 'mixed' ? bucket('mixed', '三色混合 · 已更新', 50, 30, 20) : item) : compositionExamples;
  return <Surface className="ds-gap-top"><Stack gap={4}>
    <Text as="h3" variant="section">请求结果构成</Text>
    <Text>每桶等高。底到顶为直接成功、重试后成功、最终失败、结果未知；颜色只表示结果类别。小份额不放大，详情保留数量与占比。</Text>
    <StatusTimeline mode="composition" label="结果构成历史" startLabel="合成时段开始" endLabel="合成时段结束" segments={segments} defaultActiveId="mixed" />
    <TimelineLegend mode="composition" compact items={[
      { status: 'healthy', label: '直接成功', description: '首次尝试成功，未经历重试。' },
      { status: 'recovered', label: '重试后成功', description: '经历重试后最终成功，按一个请求计数。' },
      { status: 'failed', label: '最终失败', description: '最终结果失败，不包括重试后成功。' },
      { status: 'unknown', label: '结果未知', description: '请求总数完整，部分结果未知时显示灰色份额；采集不全或无请求整桶灰色。' },
    ]} />
    <Inline><Button variant="secondary" onClick={() => setUpdated(value => !value)}>更新合成计数</Button>
      <Dialog title="构成详情焦点检查" trigger={<Button variant="secondary">在弹窗中查看构成</Button>}>
        <StatusTimeline mode="composition" compact label="弹窗结果构成" segments={segments} startLabel="开始" endLabel="结束" />
      </Dialog>
    </Inline>
    <StatusTimelineList label="紧凑构成列表" items={[{ id: 'sample', title: '合成资源', timeline: { mode: 'composition', segments, startLabel: '开始', endLabel: '结束' } }]} />
    <StatusTimeline mode="composition" label="空构成历史" segments={[]} startLabel="开始" endLabel="结束" />
    <StatusTimeline mode="composition" disabled label="禁用构成历史" segments={segments} startLabel="开始" endLabel="结束" />
    <Text as="h4">独立单状态语义</Text><Text>下方仅演示宿主风险标签，风险阈值不会用于上方结果构成。</Text>
    <StatusTimeline compact label="自定义风险历史" statusLabels={labels} segments={[{ id: 'risk', label: '低比例失败', status: 'healthy' }]} startLabel="开始" endLabel="结束" />
    <TimelineLegend statusLabels={labels} />
  </Stack></Surface>;
}
