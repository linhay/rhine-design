import { useLayoutEffect, useRef, useState } from 'react';
import { Button, type ButtonProps } from './components';
import { Icon, IconButton, type IconName } from './Actions';
import { Menu, Tooltip } from './Overlays';
import './responsive-actions.css';

export interface ResponsiveAction {
  /** Stable identity, independent of translated labels or array position. */
  id: string;
  label: string;
  icon: IconName;
  onSelect: () => void;
  disabled?: boolean;
  busy?: boolean;
  /** Host permission/visibility policy. Hidden actions are omitted, including from the menu. */
  hidden?: boolean;
  variant?: ButtonProps['variant'];
}
export interface ResponsiveActionsProps {
  label: string;
  items: readonly ResponsiveAction[];
  moreLabel?: string;
  className?: string;
}
type Mode = 'text' | 'icons' | 'menu';

/** Measures both complete representations independently; never guesses from viewport breakpoints. */
export function ResponsiveActions({label,items,moreLabel='更多操作',className=''}:ResponsiveActionsProps) {
  const root=useRef<HTMLDivElement>(null),textProbe=useRef<HTMLDivElement>(null),iconProbe=useRef<HTMLDivElement>(null),more=useRef<HTMLButtonElement>(null);
  const [mode,setMode]=useState<Mode>('menu'),modeRef=useRef<Mode>('menu'),desired=useRef<Mode>('menu');
  const [open,setOpen]=useState(false),openRef=useRef(false),[tooltip,setTooltip]=useState<string|null>(null);
  const closing=useRef(false),[moreHint,setMoreHint]=useState(false);
  const pendingFocus=useRef<HTMLElement|null>(null),blurFrame=useRef<number|null>(null);
  const ownedFocus=useRef<HTMLElement|null>(null),menuNode=useRef<HTMLElement|null>(null),fallback=useRef<HTMLElement|null>(null),focusIndex=useRef(0);
  const visible=items.filter(item=>!item.hidden);
  const signature=JSON.stringify(visible.map(({id,label,icon,disabled,busy,variant})=>[id,label,icon,disabled,busy,variant]));
  const apply=()=>{
    const next=desired.current,current=modeRef.current;
    // A focused/open menu is a stable interaction surface, even when more room becomes available.
    if(current==='menu' && (openRef.current || closing.current || document.activeElement===more.current))return;
    if(next===current)return;
    const active=document.activeElement;
    if(next==='menu' && active instanceof HTMLElement && root.current?.querySelector('[data-responsive-row]')?.contains(active))pendingFocus.current=active;
    modeRef.current=next;setMode(next);setTooltip(null);
  };
  const settle=()=>{if(blurFrame.current!==null)cancelAnimationFrame(blurFrame.current);blurFrame.current=requestAnimationFrame(()=>{blurFrame.current=null;apply();});};
  useLayoutEffect(()=>{
    const prior=pendingFocus.current;pendingFocus.current=null;
    if(prior && (document.activeElement===prior || document.activeElement===document.body))more.current?.focus({preventScroll:true});
    if(mode==='icons' && document.activeElement instanceof HTMLElement && root.current?.contains(document.activeElement))setTooltip(document.activeElement.dataset.actionId || null);
  },[mode]);
  useLayoutEffect(()=>{
    const element=root.current,text=textProbe.current,icons=iconProbe.current;
    if(!element || !text || !icons)return;
    let frame:number|null=null;
    const measure=()=>{
      frame=null;
      const available=element.clientWidth;
      desired.current=text.offsetWidth<=available ? 'text' : icons.offsetWidth<=available ? 'icons' : 'menu';
      apply();
    };
    const schedule=()=>{if(frame===null)frame=requestAnimationFrame(measure);};
    measure();
    const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
    [element,text,icons].forEach(node=>observer?.observe(node));
    const theme=element.closest('.rhine-theme'),themeObserver=new MutationObserver(schedule);
    if(theme)themeObserver.observe(theme,{attributes:true,attributeFilter:['class','style','data-rhine-theme']});
    window.addEventListener('resize',schedule);document.fonts?.addEventListener('loadingdone',schedule);
    return()=>{observer?.disconnect();themeObserver.disconnect();window.removeEventListener('resize',schedule);document.fonts?.removeEventListener('loadingdone',schedule);if(frame!==null)cancelAnimationFrame(frame);};
  },[signature]);
  useLayoutEffect(()=>{
    if(!visible.length){closing.current=false;openRef.current=false;setOpen(false);setTooltip(null);modeRef.current='menu';desired.current='menu';setMode('menu');}
    const prior=ownedFocus.current;
    if(!prior || prior.isConnected || (document.activeElement!==document.body && document.activeElement!==document.documentElement))return;
    const controls=mode==='menu' && openRef.current ? [...(menuNode.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([data-disabled])') || [])] : [...(root.current?.querySelectorAll<HTMLButtonElement>('[data-action-id]:not(:disabled)') || [])];
    const next=!visible.length ? fallback.current : mode==='menu' && !openRef.current ? more.current : controls[Math.min(focusIndex.current,controls.length-1)] || (mode==='menu'?menuNode.current:fallback.current);
    if(next?.isConnected)next.focus({preventScroll:true});
  },[signature,mode]);
  const rememberFocus=(target:HTMLElement)=>{
    ownedFocus.current=target;
    const menu=target.closest<HTMLElement>('[role="menu"]');
    if(menu){menuNode.current=menu;focusIndex.current=Math.max(0,[...menu.querySelectorAll('[role="menuitem"]')].indexOf(target));return;}
    else focusIndex.current=Math.max(0,visible.findIndex(item=>item.id===target.dataset.actionId));
    const element=root.current;if(!element)return;
    const scope=element.closest('[role="dialog"]') || document;
    const candidates=[...scope.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(node=>!element.contains(node)&&!node.closest('[hidden],[inert],[aria-hidden="true"],[role="menu"]')&&node.getClientRects().length>0);
    fallback.current=candidates.find(node=>Boolean(element.compareDocumentPosition(node)&Node.DOCUMENT_POSITION_FOLLOWING)) || candidates.at(-1) || fallback.current;
  };
  useLayoutEffect(()=>()=>{if(blurFrame.current!==null)cancelAnimationFrame(blurFrame.current);},[]);
  if(!visible.length)return null;
  const run=(item:ResponsiveAction)=>{if(!item.disabled && !item.busy && !item.hidden)item.onSelect();};
  return <div ref={root} role="group" aria-label={label} className={`rhine-responsive-actions ${className}`} data-mode={mode}
    onFocusCapture={event=>{if(event.target instanceof HTMLElement)rememberFocus(event.target);}} onBlurCapture={settle}>
    <div data-responsive-row className="rhine-responsive-actions__row" hidden={mode==='menu'}>
      {visible.map(item=><Tooltip key={item.id} content={item.label} open={mode==='icons' && tooltip===item.id} onOpenChange={next=>setTooltip(next?item.id:null)}>
        <Button data-action-id={item.id} variant={item.variant || 'secondary'} aria-label={item.label} disabled={item.disabled} busy={item.busy} busyLabel={`${item.label}，处理中`} onClick={()=>run(item)}
          className={mode==='icons'?'rhine-responsive-actions__icon':undefined}>
          <Icon name={item.icon}/><span className={mode==='icons'?'rhine-sr-only':undefined}>{item.label}</span>
        </Button>
      </Tooltip>)}
    </div>
    <span className="rhine-responsive-actions__menu" hidden={mode!=='menu'}>
      <Tooltip content={moreLabel} open={mode==='menu' && !open && moreHint} onOpenChange={setMoreHint}><span><Menu label={`${label}菜单`} open={open} onOpenChange={next=>{if(next && more.current)rememberFocus(more.current);closing.current=!next;openRef.current=next;setOpen(next);}} onCloseAutoFocus={()=>{closing.current=false;settle();}}
        trigger={<IconButton ref={more} label={moreLabel} icon="moreVertical"/>}
        items={visible.map(item=>({id:item.id,label:item.busy?`${item.label}（处理中）`:item.label,disabled:item.disabled || item.busy,danger:item.variant==='danger',onSelect:()=>run(item)}))}/></span></Tooltip>
    </span>
    <div className="rhine-responsive-actions__measure" aria-hidden="true" inert>
    <div ref={textProbe} className="rhine-responsive-actions__probe rhine-responsive-actions__row" aria-hidden="true" inert>
      {visible.map(item=><Button key={item.id} variant={item.variant || 'secondary'} disabled={item.disabled} busy={item.busy}><Icon name={item.icon}/><span>{item.label}</span></Button>)}
    </div>
    <div ref={iconProbe} className="rhine-responsive-actions__probe rhine-responsive-actions__row" aria-hidden="true" inert>
      {visible.map(item=><Button key={item.id} className="rhine-responsive-actions__icon" variant={item.variant || 'secondary'} disabled={item.disabled} busy={item.busy} aria-label={item.label}><Icon name={item.icon}/></Button>)}
    </div>
    </div>
  </div>;
}
