import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import {AgentInspector, AgentList, Badge, Button, ChatHeader, ChatShell, Composer, MessageList, Notice, Surface, Text, WorkspaceRail} from '../components';
import './chat-foundation.css';

type Agent={id:string;name:string;role:string;preview:string;initial:string;color:string;status:'working'|'ready'|'offline'};
const agents:Agent[]=[
 {id:'chief',name:'Chief of Staff',role:'协调团队与重点工作',preview:'正在整理今天的工作重点',initial:'C',color:'#e77f61',status:'working'},
 {id:'research',name:'Research',role:'研究与资料核对',preview:'资料 v2 已准备好',initial:'R',color:'#6b9df0',status:'ready'},
 {id:'writer',name:'Writer',role:'写作与内容整理',preview:'可以继续修改发布稿',initial:'W',color:'#9b88df',status:'ready'},
 {id:'browser',name:'Browser',role:'浏览器与网页任务',preview:'需要重新连接浏览器',initial:'B',color:'#6ebea2',status:'offline'},
];
const messages=[
 {id:'1',author:'Chief of Staff',initial:'C',time:'09:42',kind:'agent' as const,day:'今天',body:'早上好。今天有三个工作值得继续：\n\n• 核对资料 v2 的新增条件\n• 整理研究结论和未决问题\n• 准备下午的发布草稿'},
 {id:'2',author:'你',initial:'你',time:'09:44',kind:'person' as const,day:'今天',body:'先从资料 v2 开始，告诉我哪些结论需要重新确认。'},
 {id:'3',author:'Chief of Staff',initial:'C',time:'09:44',kind:'agent' as const,day:'今天',body:'收到。我会逐条比较旧版和 v2，并把依据与未知部分分开。'},
 {id:'4',author:'Research',initial:'R',time:'09:51',kind:'agent' as const,day:'今天',body:'我发现一处变化：',quote:'条件 C 只在样本 A 上有依据，其他样本仍未知。\n\n建议保留旧结论，同时标注适用范围。'},
];
const statusLabels:Record<Agent['status'],string>={working:'正在工作',ready:'准备就绪',offline:'离线'};
function Avatar({agent,large=false}:{agent:Pick<Agent,'initial'|'color'>;large?:boolean}){return <span className={`rhine-chat-avatar${large?' rhine-chat-avatar--large':''}`} style={{'--rhine-chat-avatar':agent.color} as CSSProperties}>{agent.initial}</span>}
function MessageBody({text}:{text:string}){return <>{text.split('\n\n').map((part,index)=><Text key={index}>{part.startsWith('•')?part.split('\n').map(line=><span className="rhine-chat-list-line" key={line}>{line}</span>):part}</Text>)}</>}

export function ChatFoundationGallery(){
 const [selectedId,setSelectedId]=useState('chief');
 const [query,setQuery]=useState('');
 const [draft,setDraft]=useState('');
 const [inspector,setInspector]=useState(true);
 const [sendError,setSendError]=useState('');
 const [simulateFailure,setSimulateFailure]=useState(false);
 const [submitted,setSubmitted]=useState('');
 const selected=agents.find(agent=>agent.id===selectedId)??agents[0];
 const selectedMessages=useMemo(()=>messages.map(message=>({...message,author:message.kind==='agent'?selected.name:message.author,initial:message.kind==='agent'?selected.initial:message.initial,avatar:<Avatar agent={{initial:message.kind==='person'?'你':selected.initial,color:message.kind==='person'?'#2d3543':selected.color}}/>,children:<MessageBody text={message.body}/>,actions:message.kind==='agent'&&<><Button variant="quiet">复制</Button><Button variant="quiet">朗读</Button><Button variant="quiet">···</Button></>})),[selected]);
 const send=(value:string)=>{const next=value.trim();if(!next)return;if(simulateFailure){setSendError('演示提交失败，草稿已保留。');return;}setSubmitted(next);setSendError('');setDraft('');};
 useEffect(()=>{if(!inspector) document.querySelector<HTMLButtonElement>('[data-rhine-chat-inspector-toggle="true"]')?.focus();},[inspector]);
 const rail=<WorkspaceRail className="rhine-chat-rail" items={[{id:'chat',label:'聊天',icon:'⌁'},{id:'automation',label:'自动化',icon:'◷'},{id:'files',label:'文件',icon:'▤'}]} activeId="chat" footer={<><Button variant="quiet" aria-label="设置">⚙</Button><span className="rhine-chat-user">你</span></>} />;
 const sidebar=<div className="rhine-chat-agents"><div className="rhine-chat-agents-head"><Button variant="quiet" aria-label="新建 Agent">＋</Button></div><AgentList className="rhine-chat-agents" agents={agents.map(agent=>({id:agent.id,searchText:`${agent.name} ${agent.role} ${agent.preview}`,identity:<><Avatar agent={agent}/><Text as="strong" variant="label">{agent.name}</Text></>,preview:agent.preview,status:agent.status}))} selectedId={selected.id} query={query} onQueryChange={setQuery} onSelect={setSelectedId} statusLabels={statusLabels} /></div>;
 const header=<ChatHeader className="rhine-chat-header" identity={<><Avatar agent={selected} large/><span><Text as="h3" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role} · {statusLabels[selected.status]}</Text></span></>} actions={<><Button variant="quiet">模型</Button><Button variant="quiet" aria-label="更多操作">•••</Button><label className="rhine-chat-mobile-picker"><span>选择 Agent</span><select value={selected.id} onChange={event=>setSelectedId(event.target.value)} aria-label="选择 Agent">{agents.map(agent=><option key={agent.id} value={agent.id}>{agent.name} · {statusLabels[agent.status]}</option>)}</select></label></>} inspectorAction={<Button variant="secondary" data-rhine-chat-inspector-toggle="true" aria-expanded={inspector} aria-controls="rhine-chat-inspector" onClick={()=>setInspector(value=>!value)}>{inspector?'隐藏详情':'显示详情'}</Button>} />;
 const content=<div className="rhine-chat-main"><div className="rhine-chat-shell__header">{header}</div><MessageList className="rhine-chat-transcript" messages={selectedMessages} working={selected.status==='working'?<><span aria-hidden="true">•••</span> {selected.name} 正在准备回复</>:<>{selected.name} · {statusLabels[selected.status]}</>} loading="正在读取历史消息" error="暂时无法读取消息" unknown="消息状态未知" /><Composer label="消息" value={draft} onChange={event=>{setDraft(event.target.value);setSendError('');}} onSubmit={send} error={sendError} hint={submitted?`本地演示：已提交“${submitted}”，未发送给 Agent。`:'Enter 发送 · Shift+Enter 换行'} placeholder={`给 ${selected.name} 发消息…`} actions={<Button variant="quiet" type="button" onClick={()=>{setSimulateFailure(value=>!value);setSendError('');}}>{simulateFailure?'模拟成功':'模拟失败'}</Button>} /> </div>;
 const inspectorPanel=<AgentInspector className="rhine-chat-inspector" id="rhine-chat-inspector" aria-label="Agent 信息" identity={<><Avatar agent={selected} large/><Text as="strong" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role}</Text></>} facts={[{label:'模型',value:'Claude · Sonnet'},{label:'工作电脑',value:'本地电脑'},{label:'权限',value:'每次询问'},{label:'记忆',value:'已启用'}]} actions={<Button variant="secondary">打开设置</Button>} onClose={()=>setInspector(false)} />;
 return <section className="rhine-chat-foundation" aria-label="Chat Foundation 基石提案">
  <div className="rhine-chat-foundation-intro"><Text variant="overline">APPLICATION PATTERN / CHAT FOUNDATION</Text><Text as="h2" variant="title">Agent Chat 工作区</Text><Text tone="muted">把工作区、Agent 列表、聊天正文、输入和上下文检查拆成可组合的 Chat 基础能力。这里展示完整工作流，数据和动作由宿主控制。</Text><div className="rhine-chat-foundation-tags"><Badge>只读展示</Badge><Badge tone="neutral">可插拔状态</Badge><Badge tone="success">键盘友好</Badge></div></div>
  <ChatShell className="rhine-chat-demo" rail={rail} sidebar={sidebar} content={content} inspector={inspectorPanel} inspectorOpen={inspector} />
  <div className="rhine-chat-foundation-contract"><Surface><Text as="h3" variant="heading">已提取的公开能力</Text><div className="rhine-chat-contract-grid">{[['ChatShell','工作区布局、Rail、侧栏与正文列'],['WorkspaceRail','当前项、禁用项、Tooltip、键盘导航'],['AgentList / AgentRow','搜索、选中、状态、空结果'],['ChatHeader','身份、状态和详情入口'],['MessageList / MessageBubble','日期分隔、消息、加载/错误/未知'],['Composer','文本输入、附件、发送/忙碌/失败'],['AgentInspector','Agent 摘要、配置、权限与关闭']].map(([name,description])=><div key={name}><Text as="strong" variant="label">{name}</Text><Text variant="caption" tone="muted">{description}</Text></div>)}</div><Notice tone="warning" title="提案边界">组件只呈现宿主传入的状态和回调，不连接 Bot、线程、权限、事件或消息服务。</Notice></Surface></div>
 </section>;
}
