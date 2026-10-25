import { useState } from 'react';
import { Checkbox, Stack, Text } from '../components';

const choices = [
  { id: 'a', label: '示例项目 A', hint: '内存卡 · 14 项' },
  { id: 'b', label: '跨团队拍摄与素材整理的较长示例项目名称', hint: '移动设备 · 128 项，包含待整理素材' },
  { id: 'c', label: 'Archive_With_A_Very_Long_Unbroken_Synthetic_Project_Name' },
  { id: 'd', label: '其他来源' },
];
export function CheckboxRowGallery() {
  const [selected, setSelected] = useState(['a']);
  const [width, setWidth] = useState('240');
  return <Stack gap={4}>
    <Text as="h2" variant="heading">侧栏双行多选</Text>
    <Text tone="muted">纯合成项目。整行、说明和留白均可选择；长名称自然换行。</Text>
    <label>侧栏宽度 <select value={width} onChange={event => setWidth(event.target.value)}>{['160', '240', '320'].map(value => <option key={value} value={value}>{value}px</option>)}</select></label>
    <div data-checkbox-rows style={{ width: Number(width), maxWidth: '100%' }}><Stack gap={2}>
      <Checkbox layout="row" label="全部项目" hint="选择四个示例项目" checked={selected.length === choices.length} indeterminate={selected.length > 0 && selected.length < choices.length} onChange={event => setSelected(event.target.checked ? choices.map(item => item.id) : [])} />
      {choices.map(item => <Checkbox key={item.id} layout="row" label={item.label} hint={item.hint} checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />)}
      <Checkbox layout="row" label="不可用项目" hint="当前无法读取" disabled />
      <Checkbox layout="row" label="已选但不可用" hint="等待重新连接" disabled checked />
    </Stack></div>
    <Text variant="caption">已选 {selected.length} 项</Text>
    <Checkbox label="默认表单布局" hint="保留旧表单说明的位置和命中范围。" />
  </Stack>;
}
