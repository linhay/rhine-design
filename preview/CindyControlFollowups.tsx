import {useRef,useState} from 'react';
import {AutoComplete,Button,Cascader,Checkbox,ConfirmDialog,Form,Inline,Mentions,Popover,RangeSlider,Select,Stack,Surface,Text} from '../components';

export function CindyRecoveryExamples(){
 const [subject,setSubject]=useState('甲'),[open,setOpen]=useState(false);
 const [dir,setDir]=useState<'ltr'|'rtl'>('ltr'),[pair,setPair]=useState<[number,number]>([20,80]);
 const launch=(name:string)=>{setSubject(name);setOpen(true);};
 return <section aria-label="确认和范围方向回归"><Stack gap={4}>
  <Surface><Stack gap={3}>
   <Text as="h2" variant="section">受控确认重新打开</Text>
   <Inline gap={2}><Button onClick={()=>launch('甲')}>打开对象甲</Button><Button onClick={()=>launch('乙')}>打开对象乙</Button></Inline>
   <ConfirmDialog title={'确认对象'+subject} description="仅演示反馈，不修改数据。" open={open} onOpenChange={setOpen} resultMode="explicit" onConfirm={()=>({status:'error',message:'对象'+subject+'的合成失败'})}/>
  </Stack></Surface>
  <Surface><Stack gap={3}>
   <Select label="阈值方向" value={dir} onChange={event=>{setDir(event.target.value==='rtl'?'rtl':'ltr');setPair([20,80]);}}>
    <option value="ltr">从左向右</option><option value="rtl">从右向左</option>
   </Select>
   <div dir={dir}><RangeSlider label="方向阈值演示" value={pair} onChange={setPair} minGap={5} thumbLabels={['最低方向阈值','最高方向阈值']} marks={[{value:0,label:'最小值'},{value:50,label:'中间值'},{value:100,label:'最大值'}]}/></div>
   <Text role="status">方向阈值：{pair.join(' / ')}</Text>
  </Stack></Surface>
 </Stack></section>;
}

const initialMentions=['Alpha','Beta','Gamma'];
const branches=[{value:'east',label:'东区',children:[{value:'shared',label:'东区资料'}]},{value:'west',label:'西区',children:[{value:'shared',label:'西区资料'}]}];

export function CindySelectionExamples(){
 const [draft,setDraft]=useState('前文 @'),[options,setOptions]=useState(initialMentions),[limit,setLimit]=useState(false);
 const [scope,setScope]=useState(['east','shared']);
 const [name,setName]=useState('阿'),[submission,setSubmission]=useState<string>();
 const [open,setOpen]=useState(false),[reasons,setReasons]=useState<string[]>([]),vetoed=useRef(false);
 const refresh=(next:string[])=>setOptions(next);
 return <section aria-label="候选与关闭路径回归"><Stack gap={4}>
  <Text as="h2" variant="section">候选和浮层的边界</Text>
  <Surface><Stack gap={3}>
   <div onKeyDownCapture={event=>{
    if(!event.altKey || !['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();
    refresh(event.key==='ArrowRight'?['Beta','Alpha','Gamma']:['Alpha','Gamma']);
   }}><Mentions label="可变提及候选" value={draft} onChange={setDraft} options={options} maxLength={limit?8:undefined}/></div>
   <Text tone="muted">高亮 Beta 后，用 Alt+右键模拟候选重排；Alt+左键模拟候选移除。</Text>
   <Checkbox label="限制提及正文长度" checked={limit} onChange={event=>setLimit(event.target.checked)}/>
   <Inline gap={2}><Button variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>refresh(['Beta','Alpha','Gamma'])}>重排提及候选</Button><Button variant="secondary" onMouseDown={event=>event.preventDefault()} onClick={()=>refresh(['Alpha','Gamma'])}>移除 Beta 候选</Button></Inline>
  </Stack></Surface>
  <Surface><Stack gap={3}>
   <Cascader label="同键分支" options={branches} value={scope} onChange={setScope}/>
   <Text role="status">已接受路径：{scope.join(' / ')}</Text>
  </Stack></Surface>
  <Surface><Stack gap={3}>
   <Form label="限长补全表单" onSubmit={event=>setSubmission(String(new FormData(event.currentTarget).get('name')))}>
    <Stack gap={3}><AutoComplete label="限长名称" name="name" value={name} onChange={setName} maxLength={4} options={['阿尔法长名称','阿尔法组']}/><Button type="submit">读取补全快照</Button></Stack>
   </Form>
   {submission!==undefined&&<Text role="status">收到名称：{submission}</Text>}
  </Stack></Surface>
  <Surface><Stack gap={3}>
   <Popover title="退出原因对照" trigger={<Button>打开退出原因对照</Button>} open={open} onOpenChange={(next,{reason})=>{
    if(next){vetoed.current=false;setReasons([]);}
    else {setReasons(history=>[...history,reason]);if(reason==='escape'&&!vetoed.current){vetoed.current=true;return;}}
    setOpen(next);
   }}><Text>宿主拒绝第一次 Escape；之后可以关闭。</Text></Popover>
   <Text role="status">关闭请求：{reasons.join(' / ')||'无'}</Text>
  </Stack></Surface>
 </Stack></section>;
}
