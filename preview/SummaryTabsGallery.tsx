import { useState } from 'react';
import { Badge, KeyValue, Select, Stack, Surface, Tabs, Text, TextField, Toolbar } from '../components';

export function SummaryTabsGallery() {
  const [width, setWidth] = useState('520');
  const [scenario, setScenario] = useState('normal');
  const [selected, setSelected] = useState('primary');
  const pending = scenario === 'loading', failed = scenario === 'error';
  return <section id="summary-tabs"><Stack gap={6}>
    <Toolbar title="带摘要的页签" description="名称与状态在同一组，身份摘要紧随；每个对象的状态始终可见。">
      <Select label="局部容器宽度" value={width} onChange={event => setWidth(event.target.value)}>
        <option value="320">320px · 窄容器</option><option value="520">520px · 标准</option><option value="100%">自适应</option>
      </Select>
      <Select label="摘要页签场景" value={scenario} onChange={event => {setScenario(event.target.value); if(event.target.value === 'disabled') setSelected('primary');}}>
        <option value="normal">正常</option><option value="loading">读取中</option><option value="error">读取失败</option><option value="disabled">禁用</option><option value="long">长身份与名称</option>
      </Select>
    </Toolbar>
    <Surface><Stack gap={6}>
      <div style={{width: width === '100%' ? width : `${width}px`, maxWidth:'100%'}}>
        <Tabs label="摘要页签规范示例" value={selected} onValueChange={setSelected} items={[
          {value:'primary',label:scenario === 'long' ? '跨部门联合研究工作区' : '主工作区',description:pending ? '尚未读取当前身份' : scenario === 'long' ? '研究项目 · 跨区域联合研发与长期设计验证团队' : '研发 · 研究项目',
            status:<Badge tone={failed ? 'error' : pending ? 'neutral' : 'success'}>{failed ? '读取失败' : pending ? '读取中' : '同步中'}</Badge>,
            content:<Stack gap={4}><Text>主工作区内容</Text><TextField label="主工作区草稿" placeholder="切换后保留已输入内容"/></Stack>},
          {value:'team',label:'协作工作区',description:'协作 · 设计项目',disabled:scenario === 'disabled',status:<Badge>{scenario === 'disabled' ? '暂不可用' : '已停止'}</Badge>,
            content:<Stack gap={4}><Text>协作工作区内容</Text><TextField label="协作工作区草稿" placeholder="与另一页签独立"/></Stack>},
        ]}/>
      </div>
      <Text variant="caption" tone="muted">先输入草稿，再使用左右方向键或 Home / End 切换。场景与主题变化不清空面板。</Text>
    </Stack></Surface>
    <Surface><Stack gap={4}><Text as="h2" variant="heading">尺寸与层级</Text><KeyValue items={[
      {key:'title',label:'名称',value:'14 / 22 · 600'}, {key:'description',label:'身份摘要',value:'12 / 18 · 400'},
      {key:'padding',label:'上下内距',value:'12px / 12px'}, {key:'status',label:'名称到状态',value:'8px'},
      {key:'identity',label:'名称组到摘要',value:'4px'}, {key:'tabs',label:'页签之间',value:'16px'},
      {key:'panel',label:'分隔线到面板',value:'24px'}, {key:'selected',label:'选中指示线',value:'2px，覆盖当前页签宽度'},
    ]}/><Text variant="caption" tone="muted">状态复用 Badge，各主题保留自己的文字与边框；不固定总高度。</Text></Stack></Surface>
  </Stack></section>;
}
