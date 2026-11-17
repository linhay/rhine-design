import {useLayoutEffect,useRef,type RefObject} from 'react';
export type DialogReturnFocus = HTMLElement | (()=>HTMLElement|null);
/** Capture before the child passive focus scope opens; never override a later deliberate handoff. */
export function useDialogReturnFocus(open:boolean,hasTrigger:boolean,anchor:RefObject<HTMLElement|null>,returnFocus:DialogReturnFocus|undefined,callback:((event:Event)=>void)|undefined){
 const previous=useRef(false),callers=useRef<HTMLElement[]>([]);
 useLayoutEffect(()=>{if(open&&!previous.current){const chain:HTMLElement[]=[];for(let node=document.activeElement instanceof HTMLElement?document.activeElement:null;node&&node!==document.body;node=node.parentElement)chain.push(node);callers.current=chain;}previous.current=open;},[open]);
 return(event:Event)=>{
  callback?.(event);if(event.defaultPrevented)return;
  const active=document.activeElement,closing=event.target;
  const parentFallback=active instanceof Element&&active.matches('[role="dialog"],[role="alertdialog"]')&&active.contains(anchor.current);
  if(active&&active!==document.body&&active!==document.documentElement&&!active.hasAttribute('data-radix-focus-guard')&&!anchor.current?.contains(active)&&!(closing instanceof Node&&closing.contains(active))&&!parentFallback){event.preventDefault();return;}
  if(hasTrigger)return;
  event.preventDefault();const explicit=typeof returnFocus==='function'?returnFocus():returnFocus;
  const usable=(node:HTMLElement|undefined|null)=>{if(!node?.isConnected||node.closest('[hidden],[inert],[aria-hidden="true"]')||node.matches(':disabled')||['hidden','collapse'].includes(getComputedStyle(node).visibility))return false;for(let ancestor:HTMLElement|null=node;ancestor;ancestor=ancestor.parentElement)if(getComputedStyle(ancestor).display==='none')return false;return true;};
  const contexts:HTMLElement[]=[];for(let node=anchor.current?.parentElement;node&&node!==document.body;node=node.parentElement)if(node.matches('main,[role=main],[role=dialog],[role=alertdialog],[role=region][aria-label],[role=region][aria-labelledby]'))contexts.push(node);
  const target=[explicit,...callers.current,...contexts].find(usable);if(!target)return;
  target.focus({preventScroll:true});
  if(document.activeElement!==target){const before=target.getAttribute('tabindex');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.addEventListener('blur',()=>{if(before===null)target.removeAttribute('tabindex');else target.setAttribute('tabindex',before);},{once:true});}
 };
}
