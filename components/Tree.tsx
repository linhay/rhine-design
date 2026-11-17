import { useState, type ReactNode } from 'react';
import { TreeView, type TreeNode, type TreeMoveProposal, type TreeRenderState } from './TreeView';
export interface BrowseNode { id:string; label:string; description?:string; disabled?:boolean; selectable?:boolean; children?:readonly BrowseNode[] }
export interface TreeProps { label:string; nodes:readonly BrowseNode[]; selected?:string; onSelect:(id:string)=>void; expandedKeys?:string[]; defaultExpandedKeys?:string[]; onExpandedChange?:(keys:string[])=>void; disabled?:boolean; readOnly?:boolean; loading?:boolean; error?:string; onRetry?:()=>void; renderNode?:(node:BrowseNode,state:TreeRenderState)=>ReactNode; onMove?:(proposal:TreeMoveProposal)=>void; canMove?:(proposal:TreeMoveProposal)=>boolean; movable?:boolean|((node:BrowseNode)=>boolean) }
export function Tree({label,nodes,selected,onSelect,expandedKeys,defaultExpandedKeys=[],onExpandedChange,renderNode,movable,...rest}:TreeProps) {
 const [local,setLocal]=useState<string[]>(defaultExpandedKeys),original=new Map<string,BrowseNode>();
 const convert=(items:readonly BrowseNode[],depth=0):TreeNode[]=>{if(depth>100)throw new RangeError('Tree depth exceeds 100.');return items.map(node=>{if(!node.id||original.has(node.id))throw new RangeError('Tree requires unique nonempty node ids.');original.set(node.id,node);return {...node,children:node.children?convert(node.children,depth+1):undefined};});};
 const converted=convert(nodes);
 return <TreeView {...rest} label={label} nodes={converted} value={selected?[selected]:[]} onValueChange={values=>{if(values[0])onSelect(values[0]);}} expandedKeys={expandedKeys??local} onExpandedChange={keys=>{if(expandedKeys===undefined)setLocal(keys);onExpandedChange?.(keys);}} renderNode={renderNode?(node,state)=>renderNode(original.get(node.id)!,state):undefined} movable={typeof movable==='function'?node=>movable(original.get(node.id)!):movable}/>;
}
