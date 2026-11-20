import {useRef,useState} from 'react';
import {AutoComplete,Button,Cascader,Checkbox,Form,Inline,Mentions,Popover,Stack,Surface,Text} from '../components';

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
