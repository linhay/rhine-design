import {useMemo, useState, type FormEvent} from 'react';
import {Badge, Button, Divider, Notice, Surface, Text, Textarea} from '../components';
import './chat-foundation.css';

type Agent={id:string;name:string;role:string;preview:string;initial:string;color:string;status:'working'|'ready'|'offline'};
type ChatMessage={id:string;author:string;initial:string;time:string;kind:'agent'|'person';body:string;quote?:string};

const agents:Agent[]=[
 {id:'chief',name:'Chief of Staff',role:'协调团队与重点工作',preview:'正在整理今天的工作重点',initial:'C',color:'#e77f61',status:'working'},
 {id:'research',name:'Research',role:'研究与资料核对',preview:'资料 v2 已准备好',initial:'R',color:'#6b9df0',status:'ready'},
 {id:'writer',name:'Writer',role:'写作与内容整理',preview:'可以继续修改发布稿',initial:'W',color:'#9b88df',status:'ready'},
 {id:'browser',name:'Browser',role:'浏览器与网页任务',preview:'需要重新连接浏览器',initial:'B',color:'#6ebea2',status:'offline'},
];
const messages:ChatMessage[]=[
 {id:'1',author:'Chief of Staff',initial:'C',time:'09:42',kind:'agent',body:'早上好。今天有三个工作值得继续：\n\n• 核对资料 v2 的新增条件\n• 整理研究结论和未决问题\n• 准备下午的发布草稿'},
 {id:'2',author:'你',initial:'你',time:'09:44',kind:'person',body:'先从资料 v2 开始，告诉我哪些结论需要重新确认。'},
 {id:'3',author:'Chief of Staff',initial:'C',time:'09:44',kind:'agent',body:'收到。我会让 Research 逐条比较旧版和 v2，并把依据与未知部分分开。'},
 {id:'4',author:'Research',initial:'R',time:'09:51',kind:'agent',body:'我发现一处变化：',quote:'条件 C 只在样本 A 上有依据，其他样本仍未知。\n\n建议保留旧结论，同时标注适用范围。'},
];
function Avatar({agent,large=false}:{agent:Pick<Agent,'initial'|'color'>;large?:boolean}){return <span className={`rhine-chat-avatar${large?' rhine-chat-avatar--large':''}`} style={{'--rhine-chat-avatar':agent.color} as React.CSSProperties}>{agent.initial}</span>}
function MessageBody({text}:{text:string}){return <>{text.split('\n\n').map((part,index)=><Text key={index}>{part.startsWith('•')?part.split('\n').map(line=><span className="rhine-chat-list-line" key={line}>{line}</span>):part}</Text>)}</>}
export function ChatFoundationGallery(){
 const [selectedId,setSelectedId]=useState('chief');
 const [query,setQuery]=useState('');
 const [draft,setDraft]=useState('');
 const [inspector,setInspector]=useState(true);
 const selected=agents.find(agent=>agent.id===selectedId)??agents[0];
 const visible=useMemo(()=>agents.filter(agent=>`${agent.name} ${agent.role} ${agent.preview}`.toLowerCase().includes(query.toLowerCase())),[query]);
 const send=(event:FormEvent)=>{event.preventDefault();if(!draft.trim())return;setDraft('');};
 return <section className="rhine-chat-foundation" aria-label="Chat Foundation 基石提案">
  <div className="rhine-chat-foundation-intro"><Text variant="overline">APPLICATION PATTERN / CHAT FOUNDATION</Text><Text as="h2" variant="title">Agent Chat 工作区</Text><Text tone="muted">把工作区、Agent 列表、聊天正文、输入和上下文检查拆成可组合的 Chat 基础能力。这里展示完整工作流，数据和动作由宿主控制。</Text><div className="rhine-chat-foundation-tags"><Badge>只读展示</Badge><Badge tone="neutral">可插拔状态</Badge><Badge tone="success">键盘友好</Badge></div></div>
  <div className="rhine-chat-demo">
   <aside className="rhine-chat-rail" aria-label="工作区导航"><div className="rhine-chat-mark">R</div><Button variant="secondary" aria-label="聊天">⌁</Button><Button variant="quiet" aria-label="自动化">◷</Button><Button variant="quiet" aria-label="文件">▤</Button><span className="rhine-chat-rail-spacer"/><Button variant="quiet" aria-label="设置">⚙</Button><span className="rhine-chat-user">你</span></aside>
   <aside className="rhine-chat-agents" aria-label="Agent 列表"><div className="rhine-chat-agents-head"><div><Text as="strong" variant="heading">你的团队</Text><Text variant="caption" tone="muted">{agents.length} 个 Agent</Text></div><Button variant="quiet" aria-label="新建 Agent">＋</Button></div><label className="rhine-chat-search"><span aria-hidden="true">⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索 Agent" aria-label="搜索 Agent" /></label><nav>{visible.map(agent=><button type="button" key={agent.id} className={`rhine-chat-agent-row${selected.id===agent.id?' is-selected':''}`} onClick={()=>setSelectedId(agent.id)} aria-current={selected.id===agent.id?'page':undefined}><Avatar agent={agent}/><span><Text as="strong" variant="label">{agent.name}</Text><Text variant="caption" tone="muted">{agent.preview}</Text></span><i className={`rhine-chat-status rhine-chat-status--${agent.status}`} /></button>)}</nav><Button variant="quiet" className="rhine-chat-new">＋ 新建对话 <kbd>⌘ K</kbd></Button></aside>
   <div className="rhine-chat-main"><header className="rhine-chat-header"><div className="rhine-chat-title"><Avatar agent={selected} large/><div><Text as="h3" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role} · {selected.status==='working'?'正在工作':'随时可以开始'}</Text></div></div><div className="rhine-chat-actions"><Button variant="quiet">模型</Button><Button variant="quiet" aria-label="更多操作">•••</Button><Button variant="secondary" onClick={()=>setInspector(value=>!value)}>{inspector?'隐藏详情':'显示详情'}</Button></div></header><div className="rhine-chat-columns"><div className="rhine-chat-transcript" role="log" aria-label="聊天记录"><div className="rhine-chat-day"><Divider/><Text variant="caption" tone="muted">今天</Text><Divider/></div>{messages.map(message=><article className={`rhine-chat-message rhine-chat-message--${message.kind}`} key={message.id}><Avatar agent={{initial:message.initial,color:message.kind==='person'?'#2d3543':selected.color}}/><div className="rhine-chat-message-copy"><div className="rhine-chat-meta"><Text as="strong" variant="label">{message.author}</Text><Text variant="caption" tone="muted">{message.time}</Text></div><div className="rhine-chat-bubble"><MessageBody text={message.body}/>{message.quote&&<blockquote>{message.quote}</blockquote>}</div>{message.kind==='agent'&&<div className="rhine-chat-message-actions"><Button variant="quiet">复制</Button><Button variant="quiet">朗读</Button><Button variant="quiet">···</Button></div>}</div></article>)}<div className="rhine-chat-working"><span>•••</span><Text variant="caption" tone="muted">{selected.name} 正在准备回复</Text></div></div>{inspector&&<aside className="rhine-chat-inspector" aria-label="Agent 信息"><div className="rhine-chat-inspector-head"><Text variant="overline">AGENT 信息</Text><Button variant="quiet" aria-label="关闭详情" onClick={()=>setInspector(false)}>×</Button></div><div className="rhine-chat-profile"><Avatar agent={selected} large/><Text as="strong" variant="heading">{selected.name}</Text><Text variant="caption" tone="muted">{selected.role}</Text></div><dl><div><dt>模型</dt><dd>Claude · Sonnet</dd></div><div><dt>工作电脑</dt><dd>本地电脑</dd></div><div><dt>权限</dt><dd>每次询问</dd></div><div><dt>记忆</dt><dd>已启用</dd></div></dl><Button variant="secondary">打开设置</Button></aside>}</div><form className="rhine-chat-composer" onSubmit={send}><Textarea label="消息" value={draft} onChange={event=>setDraft(event.target.value)} placeholder={`给 ${selected.name} 发消息…`} rows={2}/><div><Text variant="caption" tone="muted">Enter 发送 · Shift+Enter 换行</Text><Button type="submit" disabled={!draft.trim()}>↑</Button></div></form></div>
  </div>
  <div className="rhine-chat-foundation-contract"><Surface><Text as="h3" variant="heading">建议拆解为公开能力</Text><div className="rhine-chat-contract-grid">{[['ChatShell','工作区布局、Rail、侧栏与正文列'],['AgentList','搜索、选中、状态、空结果'],['ChatHeader','身份、模型、详情入口'],['MessageList','日期分隔、消息、加载/错误/未知'],['MessageBubble','作者、正文、引用、操作'],['Composer','文本输入、附件、发送/忙碌/失败'],['Inspector','Agent 摘要、配置、权限与关闭']].map(([name,description])=><div key={name}><Text as="strong" variant="label">{name}</Text><Text variant="caption" tone="muted">{description}</Text></div>)}</div><Notice tone="warning" title="提案边界">这是一套组合展台与契约草案，不把 Bot、成员、线程、权限或事件状态写入组件库；组件只呈现宿主传入的状态和回调。</Notice></Surface></div>
 </section>;
}
