import {useEffect,useLayoutEffect,useMemo,useReducer,useRef,useState} from 'react';
import {AgentInspector,AgentList,Badge,Button,ChatHeader,ChatPane,ChatShell,Composer,Dialog,IconButton,Inline,MessageList,Stack,Text,TextField,WorkspaceRail,chatSessionReducer,initialChatSessionState} from '../components';
import {agents,messages,statusLabels,Avatar,MessageBody} from './chat-foundation-fixtures';
import './chat-foundation.css';

const NEW_TASK=':new-task';
const references=[{id:'source',title:'资料 v2'},{id:'meeting',title:'会议纪要'},{id:'outline',title:'研究提纲'}];
type Reference=(typeof references)[number];
type Draft={text:string; attachments:Reference[]; error:string; submitted:string; pending?:number};
const emptyDraft:Draft={text:'',attachments:[],error:'',submitted:''};
type ReferenceSession={scope:string; text:string; start:number; end:number; query:string};
const hasReferenceTrigger=(text:string,position:number)=>position>0&&text[position-1]==='@'&&(position===1||/\s/.test(text[position-2]));

export function ChatFoundationGallery(){
 const [session,dispatch]=useReducer(chatSessionReducer,{...initialChatSessionState,phase:'ready',selectedAgentId:'chief',inspectorOpen:true});
 const {selectedAgentId:selectedId,query,inspectorOpen:inspector}=session;
 const selected=agents.find(agent=>agent.id===selectedId)??agents[0];
 const isNew=selectedId===NEW_TASK, scope=isNew?NEW_TASK:selected.id;
 const [drafts,setDrafts]=useState<Record<string,Draft>>({});
 const draft=drafts[scope]??emptyDraft;
 const update=(key:string, apply:(draft:Draft)=>Draft)=>setDrafts(current=>({...current,[key]:apply(current[key]??emptyDraft)}));
 const [simulateFailure,setSimulateFailure]=useState(false),[simulateAsync,setSimulateAsync]=useState(false);
 const requestSeq=useRef(0), requests=useRef(new Map<string,ReturnType<typeof setTimeout>>());
 useEffect(()=>{const pending=requests.current;return()=>{pending.forEach(clearTimeout);pending.clear();};},[]);
 const send=(value:string)=>{
  const next=value.trim();if(!next||requests.current.has(scope))return;
  const finish=(current:Draft):Draft=>simulateFailure?{...current,error:'演示提交失败，草稿已保留。',pending:undefined}:{...emptyDraft,submitted:next};
  if(!simulateAsync){update(scope,finish);return;}
  const token=++requestSeq.current;
  update(scope,current=>({...current,pending:token,error:''}));
  requests.current.set(scope,setTimeout(()=>{
    requests.current.delete(scope);
    update(scope,current=>current.pending===token?finish(current):current);
  },400));
 };
 const [picker,setPicker]=useState<ReferenceSession|null>(null);
 const pickerOpen=picker!==null;
 const composerRoot=useRef<HTMLDivElement>(null), addButton=useRef<HTMLButtonElement>(null), results=useRef<HTMLDivElement>(null);
 const closeTarget=useRef<'editor'|'button'>('button'), caret=useRef<number|null>(null), inspectorTrigger=useRef<HTMLDivElement>(null);
 const editor=()=>composerRoot.current?.querySelector('textarea')??null;
 useLayoutEffect(()=>{
  if(pickerOpen||caret.current===null)return;
  editor()?.setSelectionRange(caret.current,caret.current);
  caret.current=null;
 },[pickerOpen,draft.text]);
 const navigate=(id:string)=>{setPicker(null);dispatch({type:'agent/select',agentId:id});};
 const setInspector=(value:boolean)=>dispatch({type:'inspector/set',open:value});
 useEffect(()=>{if(!inspector)inspectorTrigger.current?.querySelector('button')?.focus();},[inspector]);
 const openReference=(entry:'editor'|'button',text:string,end:number,start:number)=>{
  if(draft.pending!==undefined)return;
  // When reopening via + at a collapsed caret, consume the same pending
  // token as the typed entry. Do not strip an @ inside ordinary text.
  const replaceFrom=start===end&&hasReferenceTrigger(text,start)?start-1:start;
  closeTarget.current=entry;setPicker({scope,text,start:replaceFrom,end,query:''});
 };
 const visibleReferences=references.filter(item=>item.title.toLowerCase().includes(picker?.query.trim().toLowerCase()??''));
 const choose=(item:Reference)=>{
  if(!picker||picker.scope!==scope||draft.pending!==undefined)return;
  const {text,start,end}=picker, left=text.slice(0,start), right=text.slice(end);
  const prefix=left+(left&&!/\s$/.test(left)?' ':'');
  const insert=prefix+'@'+item.title+(right && /^\s/.test(right)?'':' ');
  caret.current=insert.length;
  update(scope,current=>({...current,text:insert+right,error:'',attachments:current.attachments.some(file=>file.id===item.id)?current.attachments:[...current.attachments,item]}));
  closeTarget.current='editor';setPicker(null);
 };
 const selectedMessages=useMemo(()=>isNew?[]:messages.map(message=>({...message,author:message.kind==='agent'?selected.name:message.author,initial:message.kind==='agent'?selected.initial:message.initial,avatar:<Avatar agent={{initial:message.kind==='person'?'你':selected.initial,color:message.kind==='person'?'#2d3543':selected.color}}/>,children:<MessageBody text={message.body}/>,actions:message.kind==='agent'&&<><Button variant="quiet">复制</Button><Button variant="quiet">朗读</Button><Button variant="quiet">···</Button></>})),[isNew,selected]);
 const rail=<WorkspaceRail className="rhine-chat-rail" items={[{id:'chat',label:'聊天',icon:'⌁'},{id:'automation',label:'自动化',icon:'◷'},{id:'files',label:'文件',icon:'▤'}]} activeId="chat" footer={<><Button variant="quiet" aria-label="设置">⚙</Button><span className="rhine-chat-user">你</span></>} />;
 const sidebar=<div className="rhine-chat-agents"><AgentList className="rhine-chat-agents" agents={agents.map(agent=>({id:agent.id,searchText:
  [agent.name,agent.role,agent.preview].join(' '),identity:<><Avatar agent={agent}/><Text as="strong" variant="label">{agent.name}</Text></>,preview:agent.preview,status:agent.status}))} selectedId={scope} query={query} onQueryChange={query=>dispatch({type:'query/set',query})} onSelect={navigate} statusLabels={statusLabels} /></div>;
 const header=<ChatHeader className="rhine-chat-header" identity={isNew?<Text as="h3" variant="heading">新任务草稿</Text>:<><Avatar agent={selected} large/><span><Text as="h3" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role} · {statusLabels[selected.status]}</Text></span></>} actions={<>
  <Button variant="quiet" onClick={()=>navigate(NEW_TASK)}>新任务</Button>
  <label className="rhine-chat-mobile-picker"><span>选择 Agent</span><select value={scope} onChange={event=>navigate(event.target.value)} aria-label="选择 Agent"><option value={NEW_TASK}>新任务草稿</option>{agents.map(agent=><option key={agent.id} value={agent.id}>{agent.name} · {statusLabels[agent.status]}</option>)}</select></label>
 </>} inspectorAction={!isNew&&<div ref={inspectorTrigger}><Button variant="secondary" aria-expanded={inspector} aria-controls="rhine-chat-inspector" onClick={()=>setInspector(!inspector)}>{inspector?'隐藏详情':'显示详情'}</Button></div>} />;
 const content=<ChatPane className="rhine-chat-main" header={header} messages={<MessageList className="rhine-chat-transcript" messages={selectedMessages} working={!isNew&&selected.status==='working'?<><span aria-hidden="true">•••</span> {selected.name} 正在准备回复</>:null} empty="暂无消息"/>} composer={<div ref={composerRoot} className="rhine-chat-demo-compose">
  <Composer label="消息" value={draft.text} onChange={event=>{
    const node=event.currentTarget,text=node.value,end=node.selectionStart, native=event.nativeEvent as InputEvent;
    // A typed @ at a token boundary opens the same host picker as the button.
    const token=hasReferenceTrigger(text,end);
    update(scope,current=>({...current,text,error:''}));
    if(token&&!native.isComposing&&!native.inputType?.startsWith('delete')&&native.inputType!=='insertFromPaste'&&native.inputType!=='insertFromDrop'&&(native.data==='@'||draft.text[end-1]!=='@'))openReference('editor',text,end,end-1);
  }} onSubmit={send} busy={draft.pending!==undefined} error={draft.error||undefined}
   hint={draft.submitted?'本地演示：已提交“'+draft.submitted+'”，未发送给 Agent。':'Enter 发送 · Shift+Enter 换行'} placeholder={isNew?'写下新任务…':'给 '+selected.name+' 发消息…'}
   attachments={draft.attachments.length>0&&<Inline gap={1}>
    {draft.attachments.map(item=><Button key={item.id} variant="quiet" aria-label={'移除引用：'+item.title} disabled={draft.pending!==undefined} onClick={()=>update(scope,current=>({...current,attachments:current.attachments.filter(ref=>ref.id!==item.id)}))}>{item.title} ×</Button>)}
   </Inline>}
   actions={<IconButton ref={addButton} icon="plus" label="添加引用" title="添加引用，也可输入 @" aria-haspopup="dialog" aria-expanded={pickerOpen} disabled={draft.pending!==undefined} onClick={()=>{
    const node=editor();if(!node)return;openReference('button',draft.text,node.selectionEnd,node.selectionStart);
   }}/>}/>
  <Inline gap={1}><Button variant="quiet" onClick={()=>{setSimulateFailure(value=>!value);update(scope,current=>({...current,error:''}));}}>{simulateFailure?'模拟成功':'模拟失败'}</Button><Button variant="quiet" aria-pressed={simulateAsync} onClick={()=>setSimulateAsync(value=>!value)}>模拟异步</Button></Inline>
 </div>} />;
 const inspectorPanel=<AgentInspector className="rhine-chat-inspector" id="rhine-chat-inspector" aria-label="Agent 信息" identity={<><Avatar agent={selected} large/><span className="rhine-chat-inspector-identity"><Text as="strong" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role}</Text></span></>} facts={[{label:'模型',value:'Claude · Sonnet'},{label:'工作电脑',value:'本地电脑'},{label:'权限',value:'每次询问'},{label:'记忆',value:'已启用'}]} actions={<Button variant="secondary">打开设置</Button>} onClose={()=>setInspector(false)} />;
 return <section className="rhine-chat-foundation" aria-label="Chat Foundation 基石提案">
  <div className="rhine-chat-foundation-intro"><Text variant="overline">APPLICATION PATTERN / CHAT FOUNDATION</Text><Text as="h2" variant="title">Agent Chat 工作区</Text><Text tone="muted">各会话独立保留草稿、引用和提交反馈。所有操作仅使用本地合成数据。</Text><div className="rhine-chat-foundation-tags"><Badge>本地演示</Badge><Badge tone="neutral">可插拔状态</Badge><Badge tone="success">键盘友好</Badge></div></div>
  <ChatShell className="rhine-chat-demo" rail={rail} sidebar={sidebar} content={content} inspector={inspectorPanel} inspectorOpen={inspector&&!isNew} />
  <Dialog title="添加引用" description="选择只填入当前草稿，不发送消息。" open={pickerOpen} onOpenChange={next=>{if(!next)setPicker(null);}} returnFocus={()=>closeTarget.current==='editor'?editor():addButton.current}>
   <Stack gap={3}>
    <TextField label="搜索引用" value={picker?.query??''} onChange={event=>{const query=event.target.value;setPicker(current=>current?{...current,query}:null);}} onKeyDown={event=>{
      if(event.nativeEvent.isComposing)return;
      if(event.key==='ArrowDown'){event.preventDefault();results.current?.querySelector('button')?.focus();}
      if(event.key==='Enter'&&visibleReferences[0]){event.preventDefault();choose(visibleReferences[0]);}
    }}/>
    <div ref={results} role="group" aria-label="引用候选" onKeyDown={event=>{
      if(!['ArrowUp','ArrowDown'].includes(event.key))return;
      const buttons=[...event.currentTarget.querySelectorAll('button')], index=buttons.indexOf(document.activeElement as HTMLButtonElement);
      if(index<0)return;event.preventDefault();buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
    }}><Stack gap={1}>
     {visibleReferences.length?visibleReferences.map(item=><Button key={item.id} variant="quiet" aria-label={'引用：'+item.title} onClick={()=>choose(item)}>{item.title}</Button>):<Text role="status">没有符合条件的引用。</Text>}
    </Stack></div>
   </Stack>
  </Dialog>
 </section>;
}
