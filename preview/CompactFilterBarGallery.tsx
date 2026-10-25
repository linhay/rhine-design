import { useState } from 'react';
import { Button, Inline, ListFilterBar, SegmentedControl, Select, Stack, Text } from '../components';

export function CompactFilterBarGallery() {
  const [range, setRange] = useState('today');
  const [feedback, setFeedback] = useState('normal');
  return <Stack gap={4}>
    <Text>筛选抽屉仅保留必要字段；进行中与失败仍然可见。</Text>
    <Inline gap={2}>
      {['normal', 'pending', 'error'].map(state => <Button key={state} variant="secondary" aria-pressed={feedback === state} onClick={() => setFeedback(state)}>{({ normal: '正常', pending: '加载', error: '失败' })[state]}</Button>)}
    </Inline>
    <ListFilterBar label="紧凑筛选示例" result="120 条合成记录" drawerDescription={null} drawerResult={null}
      pending={feedback === 'pending'} error={feedback === 'error' ? '暂时无法更新合成结果，请重试。' : undefined}
      primary={[{ id: 'platform', label: '平台', control: <Select label="平台" defaultValue="all"><option value="all">全部平台</option></Select> }]}
      filters={[{ id: 'range', label: '时间快捷', control: <SegmentedControl fullWidth label="时间快捷" value={range} onValueChange={setRange} items={[{ value: 'today', label: '今天' }, { value: 'yesterday', label: '昨天' }, { value: 'week', label: '本周' }]} /> }]}
    />
    <SegmentedControl fullWidth label="等宽长文本与禁用示例" value="first" onValueChange={() => {}} items={[{ value: 'first', label: '较长的第一个范围' }, { value: 'second', label: '第二范围' }, { value: 'third', label: '不可选择', disabled: true }]} />
  </Stack>;
}
