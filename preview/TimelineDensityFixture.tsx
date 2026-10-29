import { useEffect } from 'react';
import { Stack, StatusTimelineList, Text, TimelineLegend, type TimelineSegment } from '../components';
import { ThemeProvider, type ThemeName } from '../components/theme';
const segments: TimelineSegment[] = ['healthy','failed','unknown'].map((status,index)=>({
 id:String(index),label:`合成时段 ${index+1}`,status:status as TimelineSegment['status'],detail:{start:`${index}:00`,end:`${index+1}:00`,reason:'合成历史记录，仅用于交互验证。',counts:[{id:'output',label:'确认输出',value:index===2?null:index,unit:'次'}]},
}));
const legend=[{status:'healthy' as const,label:'有输出',description:'此时段已有确认输出，历史不代表当前状态。'},{status:'failed' as const,label:'失败',description:'此时段存在已确认失败。'},{status:'unknown' as const,label:'未知',description:'记录缺失不等于零或健康。'}];
export function TimelineDensityFixture() {
 const params=new URLSearchParams(location.search),zoom=Number(params.get('zoom'))||1;
 useEffect(()=>{document.documentElement.style.zoom=String(zoom);return()=>{document.documentElement.style.zoom='';};},[zoom]);
 return <ThemeProvider defaultTheme={(params.get('theme')||'rhine') as ThemeName} data-rhine-motion={params.get('motion')||'reduced'}><div style={{padding:16}}><Stack gap={6}>
  {(['default','compact'] as const).map(density=><section key={density} aria-label={`${density}密度`} style={params.has('narrow')?{maxWidth:152}:undefined}><Text as="h2" variant="heading">{density==='default'?'默认组合':'紧凑组合'}</Text><Stack gap={1}>
   <StatusTimelineList density={density} label={`${density}历史`} items={[{id:'sample',title:'合成长资源名称：用于验证窄容器换行',timeline:{segments,startLabel:'00:00',endLabel:'03:00'}}]} />
   <TimelineLegend compact density={density} label={`${density}图例`} items={legend} />
  </Stack></section>)}
 </Stack></div></ThemeProvider>;
}
