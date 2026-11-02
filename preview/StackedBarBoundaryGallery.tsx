import { useState } from 'react';
import { Select, Stack, StackedBar, Surface } from '../components';

const examples = [
  { id: 'tiny', label: '万分之一', values: [1, 9999] },
  { id: 'extreme', label: '十万分之一', values: [1, 99999] },
  { id: 'zero', label: '真零与全量', values: [0, 10000] },
  { id: 'third', label: '三分之一', values: [1, 2] },
  { id: 'unknown', label: '总量未知', values: [null, 10] },
  { id: 'negative', label: '含负数', values: [-1, 10] },
  { id: 'all-zero', label: '全零', values: [0, 0] },
  { id: 'nonfinite', label: '非有限输入', values: [Infinity, 10] },
];
export function StackedBarBoundaryGallery() {
  const [selected, setSelected] = useState('tiny');
  const example = examples.find(item => item.id === selected)!;
  return <Surface className="ds-gap-top"><Stack gap={4}>
    <h3>小份额与全量边界</h3>
    <Select label="占比边界场景" value={selected} onChange={event => setSelected(event.target.value)}>
      {examples.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
    </Select>
    <StackedBar label="合成互斥结果构成" unit="次" rangeLabel="合成观察窗口" description="小份额保持真实比例，数量与占比始终列在图例中。" valueFormatter={value => value === null ? '未知' : value.toLocaleString('en-US')}
      parts={[{ id: 'small', label: '需要人工复核的极小份额与完整长名称', value: example.values[0], tone: 2 }, { id: 'rest', label: '其余已确认结果', value: example.values[1], tone: 1 }]} />
  </Stack></Surface>;
}
