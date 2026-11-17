import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Dialog, Inline, Notice, Select, Stack, Surface, Text, TextField, Tree, type BrowseNode, type TreeMoveProposal } from '../components';
const initial:BrowseNode[]=[{id:'root',label:'研究组织',selectable:false,description:'编号01，继承中',children:[{id:'a',label:'资源甲',description:'编号A-01，可移动'},{id:'b',label:'资源乙（此节点不可选择，但仍可浏览子项）',disabled:true,description:'只读资源',children:[{id:'nested',label:'嵌套资料',description:'编号B-01'}]}]},{id:'other',label:'协作组织与一段用于窄容器验证的很长名称',selectable:false,description:'编号02，独立策略',children:[{id:'c',label:'资源丙',description:'编号C-01'}]}];
const contains=(node:BrowseNode,id:string):boolean=>node.id===id||!!node.children?.some(child=>contains(child,id));
function applyMove(nodes:readonly BrowseNode[],proposal:TreeMoveProposal):BrowseNode[]|null {
 let moved:BrowseNode|undefined;const find=(items:readonly BrowseNode[],id:string):BrowseNode|undefined=>{for(const node of items){if(node.id===id)return node;const child=find(node.children??[],id);if(child)return child;}};
 const source=find(nodes,proposal.sourceId),target=find(nodes,proposal.targetId);if(!source||!target||source.disabled||target.disabled||contains(source,target.id))return null;
 const remove=(items:readonly BrowseNode[]):BrowseNode[]=>items.flatMap(node=>{if(node.id===source.id){moved=node;return [];}return [{...node,children:node.children?remove(node.children):undefined}];});
 const detached=remove(nodes);if(!moved)return null;
 const insert=(items:readonly BrowseNode[]):BrowseNode[]=>items.flatMap(node=>{if(node.id===target.id){if(proposal.position==='inside')return [{...node,children:[...(node.children??[]),moved!]}];return proposal.position==='before'?[moved!,node]:[node,moved!];}return [{...node,children:node.children?insert(node.children):undefined}];});
 return insert(detached);
}
export function ControlledTreeGallery() {
 const [nodes,setNodes]=useState<BrowseNode[]>(initial),[selected,setSelected]=useState('a'),[expanded,setExpanded]=useState(['root','other']),[query,setQuery]=useState(''),[mode,setMode]=useState('normal'),[outcome,setOutcome]=useState('accept');
 const [proposal,setProposal]=useState<(TreeMoveProposal&{revision:number})|null>(null),[open,setOpen]=useState(false),[status,setStatus]=useState('idle'),[revision,setRevision]=useState(1);
 const epoch=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),attempts=useRef(0),latest=useRef({nodes,revision,mode});latest.current={nodes,revision,mode};
 const cancel=()=>{epoch.current++;clearTimeout(timer.current);setOpen(false);setStatus(current=>current==='success'?current:'cancelled');};
 useEffect(()=>()=>{epoch.current++;clearTimeout(timer.current);},[]);
 useEffect(()=>{if(mode!=='normal'){epoch.current++;clearTimeout(timer.current);setOpen(false);setStatus('cancelled');}},[mode]);
 const offer=(next:TreeMoveProposal)=>{attempts.current=0;setProposal({...next,revision:revision});setStatus('ready');setOpen(true);};
 const confirm=()=>{
  if(!proposal||!['ready','failed'].includes(status)||latest.current.mode!=='normal'||proposal.revision!==latest.current.revision)return;
  const request=++epoch.current,modeAtStart=outcome;attempts.current++;setStatus('pending');
  timer.current=setTimeout(()=>{
   if(request!==epoch.current||proposal.revision!==latest.current.revision||latest.current.mode!=='normal')return;
   if(modeAtStart==='unknown'){setStatus('unknown');return;}
   if(modeAtStart==='fail'&&attempts.current===1){setStatus('failed');return;}
   const next=applyMove(latest.current.nodes,proposal);if(!next){setStatus('failed');return;}
   setNodes(next);setRevision(value=>value+1);setStatus('success');
  },300);
 };
 const refresh=()=>{epoch.current++;clearTimeout(timer.current);setNodes(current=>current.map(node=>({...node})));setRevision(value=>value+1);setStatus('expired');};
 const highlight=(label:string)=>{const index=query?label.indexOf(query):-1;return index<0?label:<>{label.slice(0,index)}<mark>{label.slice(index,index+query.length)}</mark>{label.slice(index+query.length)}</>;};
 return <Stack gap={4}>
  <Text>公开Tree与TreeSelect复用同一树引擎；搜索只标记，不删选择或展开。移动只提出意图，下面的确认、合成延迟、失败与revision由宿主演示负责。</Text>
  <Inline><Select label="组织树状态" value={mode} onChange={event=>setMode(event.target.value)}>{[['normal','正常'],['readonly','只读'],['disabled','禁用'],['empty','空树'],['error','读取失败'],['loading','正在读取']].map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select><Select label="移动确认结果" value={outcome} onChange={event=>setOutcome(event.target.value)}><option value="accept">确认成功</option><option value="fail">首次失败、重试恢复</option><option value="unknown">结果未知、不改树</option></Select></Inline>
  <TextField label="标记节点名称" value={query} onChange={event=>setQuery(event.target.value)}/>
  <Surface><Tree label="组织管理树" nodes={mode==='empty'?[]:nodes} selected={selected} onSelect={setSelected} expandedKeys={expanded} onExpandedChange={setExpanded} readOnly={mode==='readonly'} disabled={mode==='disabled'} loading={mode==='loading'} error={mode==='error'?'合成读取失败，保留上次树。':undefined} onRetry={()=>setMode('normal')} onMove={offer} renderNode={node=><Stack gap={1}><Text as="span">{highlight(node.label)}</Text><Text as="span" variant="caption" tone="muted">{node.description}</Text><span><Badge tone={node.disabled?'warning':'neutral'}>{node.disabled?'不可选择':'可浏览'}</Badge></span></Stack>}/></Surface>
  <Inline><Button variant="secondary" onClick={refresh}>刷新树并使旧提案失效</Button><Dialog title="宿主确认移动" open={open} onOpenChange={next=>{if(next&&proposal)setOpen(true);else if(!next)cancel();}} trigger={<Button variant="secondary" disabled={!proposal}>查看最近移动提案</Button>}>
   <Stack gap={3}><Text>{proposal?proposal.sourceId+' → '+proposal.targetId+' / '+proposal.position+'；提案revision '+proposal.revision:'暂无提案'}</Text>
    {status==='ready'&&<Notice title="尚未移动">确认前不会变更节点。可取消或关闭。</Notice>}
    {status==='pending'&&<Text role="status">正在处理合成移动，关闭会使本次回读失效。</Text>}
    {status==='failed'&&<Notice title="移动未完成" tone="error">树与选择保留；可以重试相同提案。</Notice>}
    {status==='unknown'&&<Notice title="移动结果未知" tone="warning">未修改本地树，也不宣称成功。关闭后刷新使旧提案失效。</Notice>}
    {status==='success'&&<Notice title="合成移动已确认">仅当前演示树更新；不是后端持久化。</Notice>}
    {(status==='expired'||status==='cancelled')&&<Text role="status">此提案已取消或失效，不能再次确认。</Text>}
    <Inline><Button busy={status==='pending'} disabled={!['ready','failed','pending'].includes(status)||proposal?.revision!==revision} onClick={confirm}>{status==='failed'?'重试移动':'确认移动'}</Button><Button variant="secondary" onClick={cancel}>取消提案</Button></Inline>
   </Stack>
  </Dialog></Inline>
  <Text role="status">树revision：{revision}；选择：{selected}；展开：{expanded.join('、')||'无'}；移动状态：{status}</Text>
 </Stack>;
}
