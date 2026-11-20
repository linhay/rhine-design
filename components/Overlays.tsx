import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import * as DialogBase from '@radix-ui/react-dialog';
import * as AlertBase from '@radix-ui/react-alert-dialog';
import * as PopoverBase from '@radix-ui/react-popover';
import * as MenuBase from '@radix-ui/react-dropdown-menu';
import * as TooltipBase from '@radix-ui/react-tooltip';
import { Button, Notice } from './components';
import { Icon, IconButton, type IconName } from './Actions';
import './drawer-placement.css';
import './dialog-settings.css';
import { useFloatingScale, useFloatingSide } from './useFloatingScale';

import { dialogDismiss, respectFocusHandoff, useLayerScope as useScope } from './layer';
import {useDialogReturnFocus,type DialogReturnFocus} from './dialog-focus';
import type {SelectionChangeReason,SelectionOpenChange} from './selection-lifecycle';
export type {DialogReturnFocus} from './dialog-focus';
export interface DialogProps { width?: CSSProperties['width']; titleVisibility?: 'visible' | 'hidden'; headerContent?: ReactNode; headerActions?: ReactNode; height?: CSSProperties['height']; footer?: ReactNode; trigger?: ReactElement; closingDisabled?:boolean; closeDisabledReason?:string; outsideDismiss?:boolean; returnFocus?:DialogReturnFocus; title: string; description?: ReactNode; children: ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void; navigation?: ReactNode; sidePanel?: ReactNode | ((closeButton: ReactElement) => ReactNode); onCloseAutoFocus?: (event: Event) => void }
export function Dialog(props: DialogProps) {
  return <DialogFrame {...props}/>;
}
export function Drawer(props: Omit<DialogProps, 'sidePanel' | 'navigation' | 'height' | 'footer' | 'width' | 'titleVisibility' | 'headerContent' | 'headerActions'> & { side?: 'left' | 'right' }) { return <DialogFrame {...props} drawer />; }
function DialogFrame({ trigger, title, description, children, open, onOpenChange, sidePanel, navigation, onCloseAutoFocus, height, footer, width, titleVisibility = 'visible', headerContent, headerActions, closingDisabled = false, closeDisabledReason = '正在处理，暂时不能关闭。', outsideDismiss = true, returnFocus, drawer = false, side = 'right' }: DialogProps & { drawer?: boolean; side?: 'left' | 'right' }) {
  const { ref, container, density } = useScope();
  const [localOpen, setLocalOpen] = useState(false);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const changeOpen = (next: boolean) => { if (!next && closingDisabled) return; setLocalOpen(next); onOpenChange?.(next); };
  const closeAutoFocus = useDialogReturnFocus(open ?? localOpen,Boolean(trigger),ref,returnFocus,onCloseAutoFocus);
  useLayoutEffect(() => {
    if (!content) return;
    dialogDismiss.set(content, () => { if (!closingDisabled) { setLocalOpen(false); onOpenChange?.(false); } });
    return () => { dialogDismiss.delete(content); };
  }, [content, onOpenChange, closingDisabled]);
  const escape = (event: KeyboardEvent) => {
    if (event.defaultPrevented || !(event.target instanceof Element)) return;
    const owner = event.target.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]');
    if (!owner || owner === content) { if (closingDisabled) event.preventDefault(); return; }
    // Radix's top layer may lag a newly focused nested dialog until its passive
    // effect runs. Redirect only that stale callback; keep Tooltip/Menu priority.
    event.preventDefault();
    dialogDismiss.get(owner)?.();
  };
  const sideNavigation = typeof sidePanel === 'function';
  const hasDescription = description != null && description !== false && description !== '';
  const settings = navigation != null && navigation !== false;
  if (settings && sidePanel) throw new Error('Dialog navigation and sidePanel are mutually exclusive.');
  const closeButton = <DialogBase.Close asChild><IconButton label={drawer ? '关闭抽屉' : '关闭对话框'} disabled={closingDisabled} icon="close" /></DialogBase.Close>;
  const hasFooter = footer != null && footer !== false && footer !== '';
  const bounded = height != null || hasFooter;
  // Percent max-height cannot constrain a footer in an auto-height parent.
  // Resolve the viewport limit in local CSS pixels, including ancestor CSS zoom.
  useLayoutEffect(() => {
    if (!content || !hasFooter || (height != null && height !== 'auto')) return;
    const ancestors: Element[] = [];
    for (let element = content.parentElement; element; element = element.parentElement) ancestors.push(element);
    const measure = () => {
      const scale = ancestors.reduce((value, element) => {
        const raw = getComputedStyle(element).zoom || '1';
        const zoom = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
        return value * (Number.isFinite(zoom) && zoom > 0 ? zoom : 1);
      }, 1);
      content.style.setProperty('--rhine-dialog-footer-limit', `${Math.max(0, (window.innerHeight / scale - 32) * .4)}px`);
    };
    measure();
    const observer = new MutationObserver(measure);
    ancestors.forEach(element => observer.observe(element, {attributes:true, attributeFilter:['style','class','data-rhine-theme']}));
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); content.style.removeProperty('--rhine-dialog-footer-limit'); };
  }, [content, hasFooter, height]);
  const bodyScrollRegion = bounded && !settings && !sidePanel;
  const customHeader = headerContent != null || headerActions != null || titleVisibility === 'hidden';
  const panes = <><div className="rhine-dialog__main"><div className={`rhine-dialog__head${customHeader ? ' rhine-dialog__head--custom' : ''}`}><DialogBase.Title className={`rhine-text rhine-text--section${titleVisibility === 'hidden' ? ' rhine-sr-only' : ''}`}>{title}</DialogBase.Title>{headerContent != null && <div className="rhine-dialog__header-content">{headerContent}</div>}{headerActions != null && <div className="rhine-dialog__header-actions">{headerActions}</div>}{!sideNavigation && closeButton}</div>{hasDescription && <DialogBase.Description className="rhine-text rhine-text--body rhine-text--muted">{description}</DialogBase.Description>}{closingDisabled && <p className="rhine-text rhine-text--caption" role="status">{closeDisabledReason}</p>}<div className="rhine-dialog__body" tabIndex={bodyScrollRegion ? 0 : undefined} role={bodyScrollRegion ? 'region' : undefined} aria-label={bodyScrollRegion ? `${title}内容` : undefined}>{settings ? <div className="rhine-dialog__settings-grid"><div className="rhine-dialog__navigation">{navigation}</div><div className="rhine-dialog__settings-content" tabIndex={bounded ? 0 : undefined} role={bounded ? 'region' : undefined} aria-label={bounded ? `${title}内容` : undefined}>{children}</div></div> : children}</div></div>{sidePanel && <div className="rhine-dialog__side">{typeof sidePanel === 'function' ? sidePanel(closeButton) : sidePanel}</div>}</>;
  return <span className="rhine-overlay-anchor" ref={ref}><DialogBase.Root open={open ?? localOpen} onOpenChange={changeOpen}>{trigger && <DialogBase.Trigger asChild>{trigger}</DialogBase.Trigger>}<DialogBase.Portal container={container}>
    <DialogBase.Overlay className="rhine-overlay" /><DialogBase.Content data-rhine-density={density} ref={setContent} onEscapeKeyDown={escape} onCloseAutoFocus={closeAutoFocus} aria-busy={closingDisabled || undefined} aria-description={closingDisabled ? closeDisabledReason : undefined} onPointerDownOutside={event=>{if(closingDisabled||!outsideDismiss)event.preventDefault();}} onInteractOutside={event=>{if(closingDisabled||!outsideDismiss)event.preventDefault();}} {...(!hasDescription ? { 'aria-describedby': undefined } : {})} data-side={drawer ? side : undefined}
      style={height == null && width == null ? undefined : { ...(height != null ? { '--rhine-dialog-height': typeof height === 'number' ? `${height}px` : height } : {}), ...(width != null ? { width: typeof width === 'number' ? `${width}px` : width, maxWidth: 'calc(100% - 32px)' } : {}) } as CSSProperties}
      className={`rhine-dialog${drawer ? ' rhine-drawer' : ''}${settings ? ' rhine-dialog--settings' : ''}${sidePanel ? ' rhine-dialog--split' : ''}${sideNavigation ? ' rhine-dialog--side-navigation' : ''}${bounded ? ' rhine-dialog--bounded' : ''}`}>
      {bounded ? <div className="rhine-dialog__scroll">{panes}</div> : panes}
      {hasFooter && <div className="rhine-dialog__footer">{footer}</div>}
    </DialogBase.Content>
  </DialogBase.Portal></DialogBase.Root></span>;
}
export type ConfirmResult = void | boolean | {status:'success'|'error'|'unknown';message?:string};
export interface ConfirmDialogProps {trigger?:ReactElement;open?:boolean;onOpenChange?:(open:boolean)=>void;returnFocus?:DialogReturnFocus;title:string;description:string;confirmLabel?:string;danger?:boolean;closingDisabled?:boolean;closeDisabledReason?:string;resultMode?:'legacy'|'explicit';onConfirm:()=>ConfirmResult|Promise<ConfirmResult>}
export function ConfirmDialog({trigger,title,description,confirmLabel='确认操作',danger=false,onConfirm,open:controlledOpen,onOpenChange,returnFocus,closingDisabled=false,closeDisabledReason='正在处理，暂时不能关闭。',resultMode='legacy'}:ConfirmDialogProps){
 const{ref,container,density}=useScope();const[localOpen,setLocalOpen]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const open=controlledOpen??localOpen,pending=useRef(false),mounted=useRef(true),revision=useRef(0);const[content,setContent]=useState<HTMLDivElement|null>(null);
 const changeOpen=(next:boolean)=>{if(!next&&(pending.current||closingDisabled))return;if(controlledOpen===undefined)setLocalOpen(next);onOpenChange?.(next);if(next)setMessage('');};
 const closeFocus=useDialogReturnFocus(open,Boolean(trigger),ref,returnFocus,undefined);
 useLayoutEffect(()=>{if(!open){revision.current++;pending.current=false;setBusy(false);}},[open]);
 useLayoutEffect(()=>{mounted.current=true;return()=>{mounted.current=false;revision.current++;};},[]);
 useLayoutEffect(()=>{if(!content)return;dialogDismiss.set(content,()=>changeOpen(false));return()=>{dialogDismiss.delete(content);};},[content,closingDisabled,onOpenChange]);
 const run=async()=>{if(pending.current||closingDisabled)return;const token=++revision.current;pending.current=true;setBusy(true);setMessage('');try{const result=await onConfirm();if(!mounted.current||token!==revision.current)return;const success=result===true||(typeof result==='object'&&result?.status==='success')||(result===undefined&&resultMode==='legacy');if(success){if(controlledOpen===undefined)setLocalOpen(false);onOpenChange?.(false);}else setMessage(typeof result==='object'&&result?.message?result.message:result===false||(typeof result==='object'&&result?.status==='error')?'操作未完成，请重试或取消。':'结果未知，尚未关闭。');}catch{if(mounted.current&&token===revision.current)setMessage('操作未完成，请重试或取消。');}finally{if(mounted.current&&token===revision.current){pending.current=false;setBusy(false);}}};
 const blocked=busy||closingDisabled;
 return <span className="rhine-overlay-anchor" ref={ref}><AlertBase.Root open={open} onOpenChange={changeOpen}>{trigger&&<AlertBase.Trigger asChild>{trigger}</AlertBase.Trigger>}<AlertBase.Portal container={container}><AlertBase.Overlay className="rhine-overlay"/><AlertBase.Content data-rhine-density={density} ref={setContent} className="rhine-dialog" aria-busy={blocked} onCloseAutoFocus={closeFocus} onEscapeKeyDown={event=>{if(blocked)event.preventDefault();}}>
 <AlertBase.Title className="rhine-text rhine-text--section">{title}</AlertBase.Title><AlertBase.Description className="rhine-text rhine-text--body rhine-text--muted">{description}</AlertBase.Description>{blocked&&<p role="status">{closeDisabledReason}</p>}{message&&<Notice tone="error" title="操作未完成">{message}</Notice>}
 <div className="rhine-dialog__actions"><AlertBase.Cancel asChild><Button variant="secondary" disabled={blocked}>取消</Button></AlertBase.Cancel><Button variant={danger?'danger':'primary'} disabled={closingDisabled} busy={busy} onClick={run}>{confirmLabel}</Button></div>
 </AlertBase.Content></AlertBase.Portal></AlertBase.Root></span>;
}

interface OverlayControl { open?: boolean; onOpenChange?: (open: boolean) => void; side?: 'top' | 'right' | 'bottom' | 'left' }
export interface PopoverProps extends Omit<OverlayControl,'onOpenChange'> { onOpenChange?:(open:boolean,detail:SelectionOpenChange)=>void; trigger: ReactElement; title: string; children: ReactNode; showHeader?: boolean }
export function Popover({ trigger, title, children, open, onOpenChange, side, showHeader = true }: PopoverProps) {
  const { ref, container, density } = useScope();
  const cause=useRef<{reason:SelectionChangeReason} | null>(null),tabExit=useRef(false);
  const markCause = (reason: SelectionChangeReason) => {
    const request = {reason}; cause.current=request;
    queueMicrotask(()=>{if(cause.current===request)cause.current=null;});
  };
  const floatingRef = useFloatingScale(undefined, 'popover');
  const floatingSide = useFloatingSide(ref, side, 300);
  return <span className="rhine-overlay-anchor" ref={ref}><PopoverBase.Root open={open} onOpenChange={next=>{const reason=next?'open':cause.current?.reason??'programmatic';cause.current=null;onOpenChange?.(next,{reason});}}><PopoverBase.Trigger asChild>{trigger}</PopoverBase.Trigger><PopoverBase.Portal container={container}><PopoverBase.Content onKeyDownCapture={event=>{if(event.key==='Tab'){tabExit.current=true;queueMicrotask(()=>{tabExit.current=false;});}}} onEscapeKeyDown={()=>markCause('escape')} onInteractOutside={event=>markCause(event.detail.originalEvent.type==='pointerdown'?'outside':tabExit.current?'tab':'blur')} onCloseAutoFocus={event => respectFocusHandoff(event, ref)} data-rhine-density={density} ref={floatingRef} className="rhine-popover" aria-label={title} side={floatingSide} sideOffset={8} collisionPadding={12}>{showHeader && <div className="rhine-dialog__head"><strong>{title}</strong><PopoverBase.Close asChild><IconButton label="关闭详情" icon="close" /></PopoverBase.Close></div>}{children}</PopoverBase.Content></PopoverBase.Portal></PopoverBase.Root></span>;
}
interface MenuItemPresentation {
  /** Stable and unique across this Menu, including groups and radio options. */
  id: string;
  label: string;
  icon?: IconName;
  disabled?: boolean;
  /** Visible and described while disabled; never becomes part of the item name. */
  disabledReason?: string;
  danger?: boolean;
}
export interface MenuItem extends MenuItemPresentation { onSelect: () => void }
export interface MenuSeparator { type: 'separator'; id: string }
export interface MenuGroup { type: 'group'; id: string; label: string; items: readonly MenuEntry[] }
export interface MenuRadioItem extends MenuItemPresentation { value: string }
export interface MenuRadioGroup { type: 'radio-group'; id: string; label: string; value: string; onValueChange: (value: string) => void; items: readonly MenuRadioItem[] }
export interface MenuCheckboxItem extends MenuItemPresentation { type: 'checkbox'; checked: boolean; onCheckedChange: (checked: boolean) => void }
export type MenuEntry = MenuItem | MenuSeparator | MenuGroup | MenuRadioGroup | MenuCheckboxItem;
export interface MenuProps extends OverlayControl { trigger: ReactElement; label: string; items: readonly MenuEntry[]; onCloseAutoFocus?: (event: Event) => void }

function isMenuAction(entry: MenuEntry | MenuRadioItem): entry is MenuItem {
  return 'onSelect' in entry;
}

function menuEntryIndex(items: readonly MenuEntry[]) {
  const entries = new Map<string, MenuEntry | MenuRadioItem>();
  const add = (entry: MenuEntry | MenuRadioItem, requireNonempty = true) => {
    if (entries.has(entry.id)) throw new Error('Menu ids must be unique across all entries.');
    if (requireNonempty && !entry.id.trim()) throw new Error('Structured menu ids must be nonempty.');
    entries.set(entry.id, entry);
  };
  const visit = (list: readonly MenuEntry[]) => list.forEach(entry => {
    // Legacy actions keep their own metadata and may use a unique blank key.
    if (isMenuAction(entry)) { add(entry, false); return; }
    add(entry);
    if (entry.type === 'group' || entry.type === 'radio-group') {
      if (!entry.label.trim()) throw new Error('Menu groups require a nonempty label.');
      if (entry.type === 'group') visit(entry.items);
      else {
        const values = new Set<string>();
        entry.items.forEach(item => {
          add(item);
          if (!item.value || values.has(item.value)) throw new Error('Menu radio values must be nonempty and unique within their group.');
          values.add(item.value);
        });
      }
    }
  });
  visit(items);
  return entries;
}

export function Menu({ trigger, label, items, open, onOpenChange, onCloseAutoFocus, side }: MenuProps) {
  const { ref, container, density } = useScope();
  const contentRef = useRef<HTMLDivElement>(null);
  // Keep long-menu sizing independent of Radix's measured placement height.
  const floatingRef = useFloatingScale(contentRef, 'dropdown-menu', 480);
  const floatingSide = useFloatingSide(ref, side, 180);
  const prefix = useId();
  const entries = menuEntryIndex(items);
  const currentEntries = useRef(entries);
  const focusedItem = useRef<{ node: HTMLElement; index: number } | null>(null);
  useLayoutEffect(() => {
    currentEntries.current = entries;
    const content = contentRef.current, previous = focusedItem.current;
    if (!content) { focusedItem.current = null; return; }
    if (!previous) return;
    const active = document.activeElement;
    const nodes = Array.from(content.querySelectorAll<HTMLElement>('[data-rhine-menu-item]'));
    if (previous.node.isConnected && previous.node.getAttribute('aria-disabled') !== 'true') {
      if (active === previous.node) previous.index = nodes.indexOf(previous.node);
      return;
    }
    if (active !== previous.node && !(active === document.body && !previous.node.isConnected) && active !== content) return;
    const enabled = nodes.filter(node => node.getAttribute('aria-disabled') !== 'true');
    const target = enabled.find(node => nodes.indexOf(node) >= previous.index) ?? enabled.at(-1);
    focusedItem.current = null;
    (target ?? content).focus();
  });
  const domId = (id: string, part: string) => `${prefix}-${encodeURIComponent(id)}-${part}`;
  const itemProps = (item: MenuItemPresentation) => ({
    'data-rhine-menu-item': item.id,
    'aria-label': item.label,
    'aria-describedby': item.disabled && item.disabledReason?.trim() ? domId(item.id, 'reason') : undefined,
    disabled: item.disabled,
    textValue: item.label,
    className: 'rhine-menu__item',
    'data-danger': item.danger,
  });
  const itemContent = (item: MenuItemPresentation, indicator = false) => <>
    {indicator && <span className="rhine-menu__indicator" aria-hidden="true"><MenuBase.ItemIndicator><Icon name="check" size={16} /></MenuBase.ItemIndicator></span>}
    {item.icon && <Icon name={item.icon} size={16} />}
    <span className="rhine-menu__text"><span>{item.label}</span>{item.disabled && item.disabledReason?.trim() && <span className="rhine-menu__reason" id={domId(item.id, 'reason')}>{item.disabledReason}</span>}</span>
  </>;
  const renderEntries = (list: readonly MenuEntry[]): ReactNode => list.map(entry => {
    if (isMenuAction(entry)) return <MenuBase.Item key={entry.id} {...itemProps(entry)} onSelect={event => {
      const item = currentEntries.current.get(entry.id);
      if (item && isMenuAction(item) && !item.disabled) item.onSelect();
      else event.preventDefault();
    }}>{itemContent(entry)}</MenuBase.Item>;
    if (entry.type === 'separator') return <MenuBase.Separator key={entry.id} className="rhine-menu__separator" />;
    if (entry.type === 'group' || entry.type === 'radio-group') {
      const titleId = domId(entry.id, 'label');
      const title = <MenuBase.Label id={titleId} className="rhine-menu__group-label">{entry.label}</MenuBase.Label>;
      if (entry.type === 'group') return <MenuBase.Group key={entry.id} aria-labelledby={titleId}>{title}{renderEntries(entry.items)}</MenuBase.Group>;
      return <MenuBase.RadioGroup key={entry.id} aria-labelledby={titleId} value={entry.value} onValueChange={value => {
        const group = currentEntries.current.get(entry.id);
        if (group && !isMenuAction(group) && 'type' in group && group.type === 'radio-group' && group.items.some(item => item.value === value && !item.disabled)) group.onValueChange(value);
      }}>{title}{entry.items.map(item => <MenuBase.RadioItem key={item.id} {...itemProps(item)} value={item.value} onSelect={event => event.preventDefault()}>{itemContent(item, true)}</MenuBase.RadioItem>)}</MenuBase.RadioGroup>;
    }
    return <MenuBase.CheckboxItem key={entry.id} {...itemProps(entry)} checked={entry.checked} onSelect={event => event.preventDefault()} onCheckedChange={checked => {
      const item = currentEntries.current.get(entry.id);
      if (item && !isMenuAction(item) && 'type' in item && item.type === 'checkbox' && !item.disabled) item.onCheckedChange(checked === true);
    }}>{itemContent(entry, true)}</MenuBase.CheckboxItem>;
  });
  return <span className="rhine-overlay-anchor" ref={ref}><MenuBase.Root open={open} onOpenChange={onOpenChange}><MenuBase.Trigger asChild>{trigger}</MenuBase.Trigger><MenuBase.Portal container={container}><MenuBase.Content data-rhine-density={density} onFocus={event => { if (event.target === event.currentTarget && !event.currentTarget.querySelector('[data-rhine-menu-item]:not([aria-disabled="true"])')) event.preventDefault(); }} onCloseAutoFocus={event => { onCloseAutoFocus?.(event); respectFocusHandoff(event, ref); }} onFocusCapture={event => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-rhine-menu-item]');
    if (node && contentRef.current?.contains(node)) focusedItem.current = { node, index: Array.from(contentRef.current.querySelectorAll('[data-rhine-menu-item]')).indexOf(node) };
  }} ref={floatingRef} className="rhine-menu" aria-label={label} aria-labelledby={undefined} side={floatingSide} sideOffset={8} collisionPadding={12}>{renderEntries(items)}</MenuBase.Content></MenuBase.Portal></MenuBase.Root></span>;
}
export interface TooltipDetails { title?: string; rows: readonly {label:string;value:string}[]; description?: string }
export interface TooltipProps extends OverlayControl { children:ReactElement; content:string|TooltipDetails; width?:number }
export function Tooltip({ children, content, open, onOpenChange, side, width }: TooltipProps) {
  if (width !== undefined && (!Number.isFinite(width) || width < 44 || width > 640)) throw new RangeError('Tooltip width must be between 44 and 640 CSS pixels.');
  const { ref, container, density } = useScope();
  const [localOpen,setLocalOpen]=useState(false),explicitClose=useRef(false);
  const changeTooltip=(next:boolean)=>{if(!next&&!explicitClose.current&&ref.current?.contains(document.activeElement))return;explicitClose.current=false;setLocalOpen(next);onOpenChange?.(next);};
  const floatingRef = useFloatingScale(undefined, 'tooltip',undefined,width);
  const floatingSide = useFloatingSide(ref, side, width ?? 280);
  return <span className="rhine-overlay-anchor" ref={ref}><TooltipBase.Provider delayDuration={300}><TooltipBase.Root open={open??localOpen} onOpenChange={changeTooltip}><TooltipBase.Trigger asChild onPointerDown={()=>{explicitClose.current=true;}} onClick={()=>{explicitClose.current=true;}}>{children}</TooltipBase.Trigger><TooltipBase.Portal container={container}><TooltipBase.Content onEscapeKeyDown={()=>{explicitClose.current=true;}} onPointerDownOutside={()=>{explicitClose.current=true;}} data-rhine-density={density} ref={floatingRef} className="rhine-tooltip" style={{width,maxWidth:width !== undefined ? Math.min(width,640) : undefined}} side={floatingSide} sideOffset={8} collisionPadding={12}>{typeof content === 'string' ? content : <div className="rhine-tooltip__details">{content.title && <strong>{content.title}</strong>}<dl>{content.rows.map((row,index)=><div key={index}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>{content.description && <p>{content.description}</p>}</div>}</TooltipBase.Content></TooltipBase.Portal></TooltipBase.Root></TooltipBase.Provider></span>;
}
