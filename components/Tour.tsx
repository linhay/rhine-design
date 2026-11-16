import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import * as DialogBase from '@radix-ui/react-dialog';
import { Button } from './components';
import { dialogDismiss, useLayerScope } from './layer';

type Side = 'top'|'right'|'bottom'|'left';
type TargetState = 'legacy'|'pending'|'ready'|'offscreen'|'missing'|'hidden';
export interface TourProps {
  title:string; description:string; step:number; total:number;
  onNext:()=>void; onPrevious:()=>void; onClose:()=>void;
  target?:HTMLElement|null|(()=>HTMLElement|null);
  side?:Side; targetPadding?:number;
  onTargetMissing?:(reason:'missing'|'hidden')=>void;
  onTargetRetry?:()=>void;
}
interface TargetLayout {
  state:TargetState; logical:HTMLElement|null; visual:HTMLElement|null;
  style:CSSProperties; halo?:CSSProperties; scale:number; signature:string;
}
function zoomAt(element:HTMLElement|null) {
  let value=1;
  for(let node=element;node;node=node.parentElement){const raw=getComputedStyle(node).zoom||'1';const parsed=parseFloat(raw)/(raw.endsWith('%')?100:1);if(Number.isFinite(parsed)&&parsed>0)value*=parsed;}
  return value;
}
function resolveTarget(target:TourProps['target']) { return typeof target==='function'?target():target??null; }
function visibleElement(element:HTMLElement) {
  const style=getComputedStyle(element),rect=element.getBoundingClientRect();
  return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
}
function visualFor(element:HTMLElement) {
  if(element instanceof HTMLLabelElement&&element.control instanceof HTMLElement){const control=element.control,style=getComputedStyle(control);return {logical:control.hidden||style.display==='none'||style.visibility==='hidden'?element:control,visual:element};}
  if(element instanceof HTMLInputElement){const style=getComputedStyle(element);if(element.hidden||style.display==='none'||style.visibility==='hidden')return {logical:element,visual:element};const rect=element.getBoundingClientRect();if((getComputedStyle(element).opacity==='0'||rect.width<4||rect.height<4)&&element.labels){const label=[...element.labels].find(visibleElement);if(label)return {logical:element,visual:label};}}
  return {logical:element,visual:element};
}
function useTargetLayout(props:TourProps,content:HTMLElement|null,descriptionId?:string) {
  const [layout,setLayout]=useState<TargetLayout>({state:props.target===undefined?'legacy':'pending',logical:null,visual:null,style:{},scale:1,signature:''});
  const refresh=useRef<()=>void>(()=>undefined),lastScroll=useRef<{step:number;element:HTMLElement}|null>(null),notified=useRef<{step:number;state:TargetState}|null>(null),ownedTargetFocus=useRef<HTMLElement|null>(null);
  const missingCallback=useRef(props.onTargetMissing);
  useLayoutEffect(()=>{missingCallback.current=props.onTargetMissing;},[props.onTargetMissing]);
  useLayoutEffect(()=>{
    if(!content)return;
    let frame=0,disposed=false,observedVisual:HTMLElement|null=null;
    const targeted=props.target!==undefined;
    const measure=()=>{
      if(disposed)return;
      const scale=zoomAt(content.parentElement),vw=window.innerWidth,vh=window.innerHeight,margin=12;
      let logical:HTMLElement|null=null,visual:HTMLElement|null=null,state:TargetState=targeted?'missing':'legacy',halo:CSSProperties|undefined;
      const style:CSSProperties={maxWidth:Math.max(44,(vw-24)/scale),maxHeight:Math.max(44,(vh-Math.min(24*scale,vh/4)-margin)/scale),overflow:'auto'};
      const supplied=targeted?resolveTarget(props.target):null;
      let geometry='';
      if(supplied?.isConnected&&supplied.ownerDocument===document){
        ({logical,visual}=visualFor(supplied));
        if(visibleElement(visual)){
          if(!lastScroll.current||lastScroll.current.step!==props.step||lastScroll.current.element!==visual){lastScroll.current={step:props.step,element:visual};visual.scrollIntoView?.({block:'center',inline:'nearest',behavior:'auto'});}
          const rect=visual.getBoundingClientRect();geometry=[rect.x,rect.y,rect.width,rect.height].join(',');
          const intersects=rect.bottom>0&&rect.top<vh&&rect.right>0&&rect.left<vw;
          state=intersects?'ready':'offscreen';
          if(intersects){
            const padding=(Number.isFinite(props.targetPadding)?Math.max(0,props.targetPadding!):8)*scale;
            const left=Math.max(0,rect.left-padding),top=Math.max(0,rect.top-padding),right=Math.min(vw,rect.right+padding),bottom=Math.min(vh,rect.bottom+padding);
            halo={left:left/scale,top:top/scale,width:(right-left)/scale,height:(bottom-top)/scale};
            const gap=8*scale,width=Math.min(360*scale,vw-2*margin),height=content.getBoundingClientRect().height;
            const spaces={top:Math.max(0,rect.top-margin-gap),bottom:Math.max(0,vh-rect.bottom-margin-gap),left:Math.max(0,rect.left-margin-gap),right:Math.max(0,vw-rect.right-margin-gap)};
            let side=props.side??'bottom';
            if((side==='left'||side==='right')&&spaces[side]<Math.min(220*scale,width))side=spaces.bottom>=spaces.top?'bottom':'top';
            if(side==='bottom'&&spaces.bottom<Math.min(height,120*scale)&&spaces.top>spaces.bottom)side='top';
            if(side==='top'&&spaces.top<Math.min(height,120*scale)&&spaces.bottom>spaces.top)side='bottom';
            const maxHeight=(side==='top'||side==='bottom')&&spaces[side]>=44*scale?Math.min(vh-24,spaces[side]):vh-24;
            const actualHeight=Math.min(height,maxHeight);
            let x=side==='right'?rect.right+gap:side==='left'?rect.left-width-gap:rect.left;
            let y=side==='bottom'?rect.bottom+gap:side==='top'?rect.top-actualHeight-gap:rect.top;
            x=Math.max(margin,Math.min(x,vw-width-margin));y=Math.max(margin,Math.min(y,vh-actualHeight-margin));
            Object.assign(style,{left:x/scale,top:y/scale,right:'auto',bottom:'auto',width:width/scale,maxWidth:width/scale,maxHeight:maxHeight/scale});
          }
        }else state='hidden';
      }
      if(observedVisual!==visual){if(observedVisual)size?.unobserve(observedVisual);observedVisual=visual;if(visual)size?.observe(visual);}
      if(ownedTargetFocus.current&&document.activeElement===document.body&&((state==='missing'||state==='hidden')||!ownedTargetFocus.current.isConnected))content.focus({preventScroll:true});
      const report=notified.current;notified.current={step:props.step,state};
      if((state==='missing'||state==='hidden')&&(!report||report.step!==props.step||report.state!==state))missingCallback.current?.(state);
      const signature=JSON.stringify([state,scale,geometry,style,halo]);
      setLayout(current=>current.signature===signature&&current.logical===logical&&current.visual===visual?current:{state,logical,visual,style,halo,scale,signature});
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;measure();});};
    refresh.current=measure;
    const focus=(event:FocusEvent)=>{
      const current=resolveTarget(props.target),node=event.target;
      if(!(node instanceof HTMLElement)){ownedTargetFocus.current=null;return;}
      const normalized=current?visualFor(current):null;
      ownedTargetFocus.current=normalized&&(normalized.logical.contains(node)||normalized.visual.contains(node))?node:null;
    };
    const mutation=new MutationObserver(schedule);mutation.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','hidden']});
    const size=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(schedule);size?.observe(content);
    window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);document.addEventListener('focusin',focus,true);
    measure();
    return()=>{disposed=true;refresh.current=()=>undefined;if(frame)cancelAnimationFrame(frame);mutation.disconnect();size?.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);document.removeEventListener('focusin',focus,true);};
  },[content,props.target,props.step,props.side,props.targetPadding]);
  useLayoutEffect(()=>{
    const target=layout.logical;if(!target||!descriptionId)return;
    const tokens=new Set((target.getAttribute('aria-describedby')??'').split(/\s+/).filter(Boolean));tokens.add(descriptionId);target.setAttribute('aria-describedby',[...tokens].join(' '));
    const addedTab=!target.hasAttribute('tabindex')&&!target.matches('button,input,select,textarea,a[href],[contenteditable]');
    if(addedTab)target.setAttribute('tabindex','-1');
    return()=>{const remaining=(target.getAttribute('aria-describedby')??'').split(/\s+/).filter(token=>token&&token!==descriptionId);remaining.length?target.setAttribute('aria-describedby',remaining.join(' ')):target.removeAttribute('aria-describedby');if(addedTab&&target.getAttribute('tabindex')==='-1')target.removeAttribute('tabindex');};
  },[layout.logical,descriptionId]);
  return {layout,refresh:()=>refresh.current(),locate:(focus:boolean)=>{const target=layout.visual;if(!target)return;target.scrollIntoView?.({block:'center',inline:'nearest',behavior:'auto'});refresh.current();if(focus)layout.logical?.focus({preventScroll:true});}};
}
export function Tour(props:TourProps) {
  const {title,description,step,total,onNext,onPrevious,onClose,target}=props;
  const {ref,container,density}=useLayerScope();
  const [content,setContent]=useState<HTMLElement|null>(null),[descriptionElement,setDescriptionElement]=useState<HTMLElement|null>(null),entered=useRef(false),previousStep=useRef(step);
  const descriptionId=descriptionElement?.id;
  const [restore]=useState(()=>typeof document!=='undefined'&&document.activeElement instanceof HTMLElement?document.activeElement:null);
  const {layout,refresh,locate}=useTargetLayout(props,content,descriptionId);
  const unavailable=layout.state==='missing'||layout.state==='hidden'||layout.state==='pending';
  useLayoutEffect(()=>{if(!content)return;dialogDismiss.set(content,onClose);return()=>{dialogDismiss.delete(content);};},[content,onClose]);
  useLayoutEffect(()=>{if(content&&previousStep.current!==step)content.scrollTop=0;previousStep.current=step;if(content&&(!entered.current||target===undefined||document.activeElement===document.body||content.contains(document.activeElement))){entered.current=true;content.focus({preventScroll:true});}},[content,step,target]);
  return <span ref={ref}><DialogBase.Root open modal={false} onOpenChange={next=>{if(!next)onClose();}}><DialogBase.Portal container={container}>
    {layout.halo&&<div className="rhine-tour__target" data-rhine-tour-target aria-hidden="true" style={layout.halo}/>}
    <DialogBase.Content asChild onEscapeKeyDown={event=>{const owner=event.target instanceof Element?event.target.closest('[role=dialog],[role=alertdialog],[role=menu],[role=listbox]'):null;if(owner&&owner!==content&&!owner.contains(layout.logical)){event.preventDefault();dialogDismiss.get(owner)?.();}}} onInteractOutside={event=>{if(target!==undefined)event.preventDefault();}} onCloseAutoFocus={event=>{event.preventDefault();const active=document.activeElement;if(restore?.isConnected&&(active===document.body||content?.contains(active)||active?.hasAttribute('data-radix-focus-guard')))restore.focus();}} onOpenAutoFocus={event=>{event.preventDefault();content?.focus();}}>
      <section ref={setContent} className="rhine-tour" tabIndex={-1} data-rhine-density={density} data-target-state={layout.state} data-targeted={target!==undefined||undefined} style={layout.style}>
        <DialogBase.Title>{title}</DialogBase.Title><DialogBase.Description ref={setDescriptionElement}>{description}</DialogBase.Description><p>{step+1} / {total}</p>
        {(layout.state==='missing'||layout.state==='hidden')&&<p role="alert">目标暂不可用，未自动前进。可重新查找、返回或关闭。</p>}
        {layout.state==='offscreen'&&<p role="status">目标已移出视口，可重新定位。</p>}
        <div className="rhine-inline"><Button variant="secondary" onClick={onPrevious} disabled={step<=0}>上一步</Button><Button onClick={step>=total-1?onClose:onNext} disabled={unavailable}>{step>=total-1?'完成':'下一步'}</Button>
          {target!==undefined&&(unavailable?<Button variant="secondary" onClick={()=>{props.onTargetRetry?.();refresh();}}>重新查找</Button>:<Button variant="secondary" disabled={layout.logical?.matches(':disabled')} onClick={()=>locate(true)}>转到目标</Button>)}
          <Button variant="quiet" onClick={onClose}>关闭引导</Button>
        </div>
      </section>
    </DialogBase.Content>
  </DialogBase.Portal></DialogBase.Root></span>;
}
