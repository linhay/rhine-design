import { useState } from 'react';
import { Checkbox,Grid,Select,Stack,Surface,Text,TrendChart,type ChartPoint } from '../components';
export const resourcePoints:ChartPoint[]=[12,18,null,0,24,null].map((value,index)=>({id:'point-'+index,label:index===0||index===4?'重复标签':'10:'+String(index*10).padStart(2,'0'),value}));
export function CompactTrendGallery(){
 const [state,setState]=useState('normal'),[caption,setCaption]=useState(false),[legend,setLegend]=useState(false),[format,setFormat]=useState('number');
 const points=state==='empty'?[]:state==='unknown'?resourcePoints.map(p=>({...p,value:null})):state==='single'?[{id:'single',label:'仅一次',value:0}]:state==='extreme'?[{id:'min',label:'负有限极值',value:-Number.MAX_VALUE},{id:'max',label:'正有限极值',value:Number.MAX_VALUE}]:resourcePoints;
 return <Stack gap={3}>
  <Text as="h3" variant="heading">紧凑资源趋势：同一公开TrendChart</Text><Text>图形内容高度28px，SVG交互目标仍44px；160px局部列不隐藏数据入口。缺失不补零，最近值按实际最后时段，未知不冒充上一个已知值。</Text>
  <Select label="紧凑趋势状态" value={state} onChange={event=>setState(event.target.value)}>{[['normal','含断点/重复标签/末项未知'],['empty','无采样'],['unknown','全未知'],['single','单个零值'],['extreme','有限极值'],['stale','陈旧'],['error','失败保留旧采样'],['loading','读取中保留旧采样']].map(([value,label])=><option value={value} key={value}>{label}</option>)}</Select>
  <Checkbox label="显示紧凑说明" checked={caption} onChange={event=>setCaption(event.target.checked)}/><Checkbox label="显示紧凑图例" checked={legend} onChange={event=>setLegend(event.target.checked)}/>
  <Select label="格式化数值" value={format} onChange={event=>setFormat(event.target.value)}><option value="number">数字，组件附加单位</option><option value="full">完整单位，组件不重复追加</option></Select>
  <Grid minWidth={160} gap={4}>{[['cpu','CPU','%'],['memory','内存','GiB'],['disk','磁盘','MiB/s']].map(([id,label,unit])=><Surface key={id} padding="none"><Stack gap={2}><Text as="h4" variant="heading">{label}</Text><Text variant="caption">当前：未知 · 合成窗口</Text><TrendChart density="compact" caption={caption?'visible':'hidden'} showLegend={legend} kind="line" label={label+'历史'} unit={unit} rangeLabel="合成10:00–10:50" description="保持原顺序；中间和最近时段有未知值。" points={points} valueFormatter={value=>value===null?'未知':format==='full'?value+' '+unit:String(value)} valueFormatterIncludesUnit={format==='full'} stale={state==='stale'?'合成快照已过期。':undefined} error={state==='error'?'合成读取失败，保留旧采样。':undefined} loading={state==='loading'}/></Stack></Surface>)}</Grid>
  <div style={{width:160,maxWidth:'100%'}}><Text variant="caption">固定160px局部资源列</Text><TrendChart density="compact" caption="hidden" label="局部资源历史" unit="%" rangeLabel="合成窗口" description="固定160px，数据与单位不缩小。" kind="line" points={points}/></div>
 </Stack>;
}
