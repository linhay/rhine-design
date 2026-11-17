import { useId, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from './components';
import { IconButton } from './Actions';
import { Select } from './Select';
import { Stack, Inline } from './Layout';
import { Text } from './Typography';
import { Popover } from './Overlays';
import './tree-view.css';
import type {QueryInputProps} from './field-support';
import type {SelectionChangeReason,SelectionOpenChange} from './selection-lifecycle';
export interface TreeNode { id:string; label:string; description?:string; disabled?:boolean; selectable?:boolean; children?:TreeNode[] }
export interface TreeSelectProps {
 id?:string;inputProps?:QueryInputProps;query?:string;onQueryChange?:(query:string)=>void;searchable?:boolean;maxVisibleTags?:number;clearable?:boolean;hint?:string;validationError?:string;open?:boolean;closeReason?:Exclude<SelectionChangeReason,'open'>;onOpenChange?:(open:boolean,detail:SelectionOpenChange)=>void;onClose?:(reason:SelectionChangeReason)=>void;
 label:string; nodes:TreeNode[]; value:string[]; onValueChange:(value:string[])=>void;
 expandedKeys:string[]; onExpandedChange:(keys:string[])=>void; multiple?:boolean;
 disabled?:boolean; loading?:boolean; error?:string; readOnly?:boolean; name?:string; presentation?:'inline'|'dropdown';
}
export type TreeMovePosition='before'|'inside'|'after';
export interface TreeMoveProposal { sourceId:string; targetId:string; position:TreeMovePosition; via:'drag'|'controls' }
export interface TreeRenderState { selected:boolean; expanded:boolean; disabled:boolean }
export interface TreeViewExtras {
 renderNode?:(node:TreeNode,state:TreeRenderState)=>ReactNode;
 onMove?:(proposal:TreeMoveProposal)=>void; canMove?:(proposal:TreeMoveProposal)=>boolean;
 movable?:boolean|((node:TreeNode)=>boolean); onRetry?:()=>void;
}
const placementText={before:'之前',inside:'内部',after:'之后'} as const;
function MoveAction({node,entries,blocked,allowed,onPropose,onHandoff,onStart,onEnd}:{node:TreeNode;entries:TreeNode[];blocked:boolean;allowed:(proposal:TreeMoveProposal)=>boolean;onPropose:(proposal:TreeMoveProposal)=>void;onHandoff:()=>void;onStart:(event:DragEvent<HTMLButtonElement>)=>void;onEnd:()=>void}) {
 const [open,setOpen]=useState(false),[target,setTarget]=useState(''),[position,setPosition]=useState<TreeMovePosition>('inside');
 const proposal:TreeMoveProposal={sourceId:node.id,targetId:target,position,via:'controls'};
 const valid=!blocked&&allowed(proposal);
 useLayoutEffect(()=>{if(blocked&&open){onHandoff();setOpen(false);}},[blocked,open,onHandoff]);
 return <Popover title={'移动'+node.label} open={open&&!blocked} onOpenChange={next=>{if(!blocked)setOpen(next);}} trigger={<IconButton label={'移动'+node.label} title="提出移动；在节点上按Shift+F10也可打开" icon="move" tabIndex={-1} data-tree-move-handle disabled={blocked} draggable={!blocked} onDragStart={onStart} onDragEnd={onEnd}/> }>
  <form data-tree-move-form onSubmit={event=>{event.preventDefault();if(!valid)return;setOpen(false);onPropose(proposal);}}>
   <Stack gap={3}><Text variant="caption">只提出移动，合法性、确认、请求和最终结果由宿主处理。</Text>
    <Select label="目标节点" value={target} onChange={event=>setTarget(event.target.value)}><option value="">选择目标</option>{entries.map(item=><option key={item.id} value={item.id}>{item.label} [{item.id}]</option>)}</Select>
    <Select label="放置位置" value={position} onChange={event=>setPosition(event.target.value as TreeMovePosition)}><option value="before">之前</option><option value="inside">内部</option><option value="after">之后</option></Select>
    {target&&!valid&&<Text role="status" tone="muted">当前不能提出此移动。请重新选择目标或核对权限。</Text>}
    <Inline><Button type="submit" disabled={!valid}>提出移动</Button><Button type="button" variant="secondary" onClick={()=>setOpen(false)}>取消移动</Button></Inline>
   </Stack>
  </form>
 </Popover>;
}
/** Shared engine for Tree and both TreeSelect presentations; data stays host-owned. */
export function TreeView({id:suppliedId,label,nodes,value,onValueChange,expandedKeys,onExpandedChange,multiple=false,disabled=false,loading,error,readOnly=false,name,showLabel=true,renderNode,onMove,canMove,movable,onRetry}:TreeSelectProps&TreeViewExtras&{showLabel?:boolean}) {
 const root=useRef<HTMLDivElement>(null),tree=useRef<HTMLDivElement>(null),generated=useId(),id=suppliedId||generated;
 const [active,setActive]=useState<string>(),[message,setMessage]=useState(''),[drop,setDrop]=useState<TreeMoveProposal|null>(null);
 const hadFocus=useRef(false),previousParents=useRef(new Map<string,string|undefined>()),focused=useRef<{key:string;element:HTMLElement}|null>(null),pendingFocus=useRef<string|null>(null),dragSource=useRef<string|null>(null),typeahead=useRef({text:'',time:0});
 const visible:{node:TreeNode;parent?:string}[]=[],all:TreeNode[]=[],parents=new Map<string,string|undefined>(),byId=new Map<string,TreeNode>();
 const collect=(items:TreeNode[],parent?:string,shown=true,depth=0)=>{if(depth>100)throw new RangeError('Tree depth exceeds 100.');for(const node of items){if(!node.id||byId.has(node.id))throw new RangeError('Tree requires unique nonempty node ids.');all.push(node);parents.set(node.id,parent);byId.set(node.id,node);if(shown)visible.push({node,parent});collect(node.children??[],node.id,shown&&expandedKeys.includes(node.id),depth+1);}};
 collect(nodes);
 const visibleAncestor=(key:string|undefined)=>{const seen=new Set<string>();while(key&&!visible.some(item=>item.node.id===key)){if(seen.has(key))return undefined;seen.add(key);key=parents.get(key)??previousParents.current.get(key);}return key;};
 const current=visibleAncestor(active)||visible.find(item=>value.includes(item.node.id))?.node.id||visible[0]?.node.id;
 const itemId=(key:string)=>id+'-item-'+encodeURIComponent(key);
 const focus=(key?:string)=>{if(!key)return;setActive(key);document.getElementById(itemId(key))?.focus();};
 useLayoutEffect(()=>{
  const owned=document.activeElement===document.body||document.activeElement===tree.current||!!root.current?.contains(document.activeElement);
  if(pendingFocus.current){const key=pendingFocus.current;pendingFocus.current=null;if(document.activeElement===tree.current){const next=visibleAncestor(key);if(next)focus(next);}}
  else if(hadFocus.current&&owned&&focused.current&&!focused.current.element.isConnected){const next=visibleAncestor(focused.current.key);if(next)focus(next);else tree.current?.focus();}
  previousParents.current=parents;
 });
 const blocked=disabled||!!loading||!!error;
 const expand=(node:TreeNode,next:boolean)=>{if(!blocked)onExpandedChange(next?[...new Set([...expandedKeys,node.id])]:expandedKeys.filter(key=>key!==node.id));};
 const canChoose=(node:TreeNode)=>!blocked&&!readOnly&&!node.disabled&&node.selectable!==false;
 const choose=(node:TreeNode)=>{if(canChoose(node))onValueChange(multiple?value.includes(node.id)?value.filter(key=>key!==node.id):[...value,node.id]:[node.id]);};
 const canStart=(node:TreeNode)=>!!onMove&&!blocked&&!readOnly&&!node.disabled&&(movable===undefined||movable===true||typeof movable==='function'&&movable(node)===true);
 const allowed=(proposal:TreeMoveProposal)=>{const source=byId.get(proposal.sourceId),target=byId.get(proposal.targetId);if(!source||!target||!canStart(source)||target.disabled||source.id===target.id)return false;for(let ancestor=parents.get(target.id);ancestor;ancestor=parents.get(ancestor))if(ancestor===source.id)return false;return !canMove||canMove(proposal)===true;};
 const handoff=(key:string)=>{pendingFocus.current=key;setActive(key);tree.current?.focus();};
 const propose=(proposal:TreeMoveProposal)=>{if(!allowed(proposal))return;handoff(proposal.sourceId);dragSource.current=null;setDrop(null);setMessage('已提出移动，等待宿主确认；尚未移动数据。');onMove?.(proposal);};
 const keyDown=(event:KeyboardEvent<HTMLDivElement>,node:TreeNode)=>{
  if(event.target!==event.currentTarget||event.nativeEvent.isComposing||event.keyCode===229)return;
  const index=visible.findIndex(item=>item.node.id===node.id),expanded=expandedKeys.includes(node.id);
  if(event.shiftKey&&event.key==='F10'&&canStart(node)){event.preventDefault();event.stopPropagation();event.currentTarget.querySelector<HTMLButtonElement>('[data-tree-move-handle]')?.click();return;}
  if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Home','End',' ','Enter'].includes(event.key)){event.preventDefault();event.stopPropagation();}
  if(event.key==='ArrowDown')focus(visible[Math.min(visible.length-1,index+1)]?.node.id);
  if(event.key==='ArrowUp')focus(visible[Math.max(0,index-1)]?.node.id);
  if(event.key==='Home')focus(visible[0]?.node.id);
  if(event.key==='End')focus(visible.at(-1)?.node.id);
  if(event.key==='ArrowRight'&&node.children?.length){if(!expanded)expand(node,true);else focus(node.children[0].id);}
  if(event.key==='ArrowLeft'){if(expanded&&node.children?.length)expand(node,false);else focus(visible[index]?.parent);}
  if(event.key===' '||event.key==='Enter')choose(node);
  if(event.key==='*'&&!blocked){event.preventDefault();event.stopPropagation();onExpandedChange([...new Set([...expandedKeys,...visible.filter(item=>item.parent===visible[index]?.parent&&item.node.children?.length).map(item=>item.node.id)])]);}
  if(multiple&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='a'){event.preventDefault();event.stopPropagation();if(blocked||readOnly)return;const eligible=visible.filter(item=>canChoose(item.node)).map(item=>item.node.id);onValueChange(eligible.every(key=>value.includes(key))?value.filter(key=>!eligible.includes(key)):[...new Set([...value,...eligible])]);}
  else if(event.key.length===1&&![' ','*'].includes(event.key)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.stopPropagation();const now=Date.now(),typed=(now-typeahead.current.time<500?typeahead.current.text:'')+event.key.toLocaleLowerCase();typeahead.current={text:typed,time:now};const search=[...typed].every(c=>c===typed[0])?typed[0]:typed;const match=[...visible.slice(index+1),...visible.slice(0,index+1)].find(item=>item.node.label.toLocaleLowerCase().startsWith(search));if(match){event.preventDefault();focus(match.node.id);}}
 };
 const dropProposal=(event:DragEvent<HTMLDivElement>,node:TreeNode):TreeMoveProposal|null=>{const sourceId=dragSource.current;if(!sourceId)return null;const rect=event.currentTarget.getBoundingClientRect(),ratio=rect.height?(event.clientY-rect.top)/rect.height:.5;return {sourceId,targetId:node.id,position:ratio<1/3?'before':ratio>2/3?'after':'inside',via:'drag'};};
 const renderNodes=(items:TreeNode[]):ReactNode=>items.map(node=>{const expanded=expandedKeys.includes(node.id),selected=value.includes(node.id),moveBlocked=!canStart(node);return <div role="treeitem" key={node.id} id={itemId(node.id)} data-tree-key={node.id} tabIndex={current===node.id?0:-1} aria-label={node.label} aria-description={node.description} aria-expanded={node.children?.length?expanded:undefined} aria-selected={!multiple&&node.selectable!==false?selected:undefined} aria-checked={multiple&&node.selectable!==false?selected:undefined} aria-disabled={blocked||node.disabled||undefined} aria-keyshortcuts={onMove?'Shift+F10':undefined} onFocus={event=>{if(event.target===event.currentTarget)setActive(node.id);}} onKeyDown={event=>keyDown(event,node)}>
  <div className="rhine-tree__row" data-selected={selected} data-drop-position={drop?.targetId===node.id?drop.position:undefined} onClick={event=>{if((event.target as Element).closest('button'))return;focus(node.id);choose(node);}}
   onDragOver={event=>{const proposal=dropProposal(event,node);if(proposal&&allowed(proposal)){event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect='move';setDrop(proposal);}}}
   onDrop={event=>{event.preventDefault();event.stopPropagation();const proposal=dropProposal(event,node);if(proposal)propose(proposal);dragSource.current=null;setDrop(null);}}>
   {node.children?.length?<Button variant="quiet" tabIndex={-1} disabled={blocked} aria-label={(expanded?'收起':'展开')+node.label} onClick={event=>{event.stopPropagation();focus(node.id);expand(node,!expanded);}}>{expanded?'−':'+'}</Button>:<span className="rhine-tree__spacer"/>}
   {node.selectable!==false&&<span aria-hidden="true">{selected?'✓':'○'}</span>}
   <span className="rhine-tree__label" aria-hidden="true" inert>{renderNode?renderNode(node,{selected,expanded,disabled:blocked||!!node.disabled}):node.label}</span>{node.disabled&&<small>不可选</small>}
   {onMove&&<MoveAction node={node} entries={all} blocked={moveBlocked} allowed={allowed} onPropose={propose} onHandoff={()=>handoff(node.id)} onStart={event=>{if(!canStart(node)){event.preventDefault();return;}dragSource.current=node.id;focus(node.id);event.dataTransfer.setData('text/plain',node.id);event.dataTransfer.effectAllowed='move';}} onEnd={()=>{dragSource.current=null;setDrop(null);}}/>}
  </div>{expanded&&!!node.children?.length&&<div role="group">{renderNodes(node.children)}</div>}
 </div>;});
 const isOwned=(target:EventTarget|null)=>target instanceof Element&&(!!root.current?.contains(target)||!!target.closest('[data-tree-move-form]'));
 return <div className="rhine-tree" ref={root} onFocusCapture={event=>{if(!isOwned(event.target))return;hadFocus.current=true;const item=(event.target as Element).closest<HTMLElement>('[data-tree-key]');if(item&&root.current?.contains(item))focused.current={key:item.dataset.treeKey!,element:event.target as HTMLElement};}} onBlurCapture={event=>{if(event.relatedTarget&&!isOwned(event.relatedTarget))hadFocus.current=false;}}>
  {name&&value.map(key=><input key={key} type="hidden" name={name} value={key} disabled={disabled}/>)}
  {showLabel&&<span id={id+'-label'} className="rhine-text rhine-text--label">{label}</span>}
  <div id={id} ref={tree} role="tree" tabIndex={visible.length?-1:0} aria-labelledby={showLabel?id+'-label':undefined} aria-label={showLabel?undefined:label} aria-multiselectable={multiple||undefined} aria-readonly={readOnly||undefined} aria-busy={loading} aria-disabled={disabled||undefined} aria-describedby={onMove?id+'-move-help':undefined} onKeyDown={event=>{if(event.target===event.currentTarget&&['ArrowDown','Home','End'].includes(event.key)){event.preventDefault();focus(event.key==='End'?visible.at(-1)?.node.id:current);}}}>{renderNodes(nodes)}</div>
  {onMove&&<Text id={id+'-move-help'} variant="caption">在节点上按Shift+F10打开移动表单；手柄可拖放到目标的之前、内部或之后。仅提出意图，不直接保存。</Text>}
  {(loading||error||!nodes.length)&&<Text role={error?'alert':'status'}>{loading?'正在读取…':error||'暂无节点'}</Text>}{error&&onRetry&&<Button variant="secondary" busy={loading} disabled={disabled} onClick={onRetry}>重试读取</Button>}
  {(drop||message)&&<Text role="status" variant="caption">{drop?('放置到'+byId.get(drop.targetId)?.label+'的'+placementText[drop.position]+'；释放后仅提出移动。'):message}</Text>}
 </div>;
}
