import { useRef,useState } from 'react';
import { Checkbox,Grid,Inline,MessageContent,Notice,RichText,Select,Stack,Surface,Text,TextField } from '../components';
import './rich-text-reading.css';
const tick=String.fromCharCode(96);
const reportComparison=[
 '## 同步记录复核',
 '本次复核包含 128 条合成记录。结论是：可以继续使用已核对的记录；仍有 3 条需要补充来源，不能把它们算作成功或失败。概览保留总量，具体差异在明细说明中展开。',
 '## 结果与边界',
 '将 API v2 与上一版逐条比较后，已确认的记录仍沿用原有单位与时间格式。对来源缺失或尚未回读的条目，界面显示「未知」，而不是 0。打开同一条记录时，返回应继续停在原来的筛选结果。',
 '- 已知值和缺失值分别陈列。\n- 长路径 '+tick+'/reports/v2/snapshots/current'+tick+' 保留原样。\n- 对需要重试的步骤保留原上下文。',
 '本报告只用于比较正文的字号与行高。标题、间隔、颜色和内容相同；不修改表格、工具栏或默认控件字阶。',
].join('\n\n');

function ReadingComparison(){
 return <section aria-labelledby="reading-comparison-title"><Stack gap={3}>
  <Text as="h2" variant="section" id="reading-comparison-title">长报告正文 · 14/22 与 16/28</Text>
  <Text tone="muted">同一原文、同一列宽上限（34rem），只比较正文的字号与行高。宽屏并排，窄屏顺序阅读；16/28 仅用于长报告正文。</Text>
  <Grid minWidth={350} gap={4}>
   <Surface className="ds-reading-comparison__lane"><Stack gap={3}>
    <Text as="h3" variant="heading">14 / 22 · 现行界面字阶</Text>
    <div className="ds-report-measure"><RichText label="14/22 报告正文" source={reportComparison} interactive={false}/></div>
   </Stack></Surface>
   <Surface className="ds-reading-comparison__lane"><Stack gap={3}>
    <Text as="h3" variant="heading">16 / 28 · 长报告正文</Text>
    <div className="ds-report-measure ds-long-report-prose"><RichText label="16/28 报告正文" source={reportComparison} interactive={false}/></div>
   </Stack></Surface>
  </Grid>
 </Stack></section>;
}
export const richTextExampleSource='# 合成只读报告\n\n中文 **跨格式**边界🙂，强调 *只读*，~~旧说法~~；'+tick+'code'+tick+'保留原样。\n\n## 观察事实\n\n- 已知数值为0\n- 未知不是0\n\n1. 核对来源\n2. 再看结果\n\n'+tick.repeat(3)+'text\n  保留两个前导空格\nconst value = "'+('长代码'.repeat(30))+'";\n'+tick.repeat(3)+'\n\n| 名称 | 数值 | 说明 |\n| --- | --- | --- |\n| 资源甲 | 0 | 已知零值 |\n| 资源乙 | 未知 | 尚未采样 |\n\n[合成来源](https://example.com/source)\n\n<img src="https://example.com/never-load" onerror="alert(1)">\n\n![远程图片](https://example.com/never-load.png)\n\n[危险链接](javascript:alert)';
export function RichTextGallery(){
 const [query,setQuery]=useState('跨格式边界🙂'),[kind,setKind]=useState('normal'),[links,setLinks]=useState(false),[copyState,setCopyState]=useState(''),attempt=useRef(0);
 const source=kind==='empty'?'':kind==='long'?Array.from({length:55},(_,i)=>'合成段落'+i+'，中文🙂与**格式**。').join('\n\n'):kind==='large'?'['.repeat(131073):kind==='malformed'?tick.repeat(3)+'text\n未闭合的围栏作为原文显示':richTextExampleSource;
 return <Stack gap={6}>
  <ReadingComparison />
  <Text>有限Markdown原文只读呈现；不执行HTML、脚本或代码，不自动请求图片。搜索与分页源数据由宿主提供。</Text>
  <Inline><Select label="只读内容场景" value={kind} onChange={event=>{setKind(event.target.value);attempt.current=0;setCopyState('');}}><option value="normal">段落/标题/列表/代码/表格/恶意输入</option><option value="empty">空</option><option value="long">长报告（55 段有界展开）</option><option value="large">超出解析上限</option><option value="malformed">坏格式</option></Select><Checkbox label="允许安全http(s)导航" checked={links} onChange={event=>setLinks(event.target.checked)}/></Inline>
  <TextField label="正文搜索高亮" value={query} onChange={event=>setQuery(event.target.value)}/>
  <Surface>{kind==='long'&&<Text variant="caption" tone="muted">长报告：正文 16/28，操作保持原字阶。</Text>}
   <div className={kind==='long'?'ds-report-measure ds-long-report-prose':undefined}>
    <RichText label="只读报告正文" source={source} highlight={query} initialBlocks={6} links={links?'navigate':'source'} copy={async value=>{attempt.current++;if(attempt.current===1)throw new Error('synthetic clipboard rejection');setCopyState(value===source?'原文复制值逐字一致':'复制值不一致');}}/>
   </div>
  </Surface>
  <Text role="status">{copyState||'复制操作第一次合成失败，第二次核对收到的完整原文；不会写入系统剪贴板。'}</Text>
  <Notice title="显示范围">单次最多131072个UTF-16码元；语法和高亮有独立预算。超限明确提示，请宿主分页，不把截断内容当完整报告。</Notice>
  <Text as="h3" variant="heading">气泡表面与正文职责分开</Text><MessageContent><RichText label="合成消息正文" source="简短消息 **只读正文**；不改变消息状态或附件归属。"/></MessageContent>
 </Stack>;
}
