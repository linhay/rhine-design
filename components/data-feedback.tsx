import { useLayoutEffect, useRef } from 'react';
import { Button, Notice } from './components';

/** Controlled feedback, not a data loader. Retry emits intent only. */
export interface ProvidedDataProps { loading?:boolean; loadError?:string; onRetry?:()=>void; emptyText?:string }
export function DataFeedback({ id, loading, loadError, onRetry, empty, emptyText = '暂无项目', disabled = false, focusId }: ProvidedDataProps & { id:string; empty?:boolean; disabled?:boolean; focusId?:string }) {
  const root = useRef<HTMLDivElement>(null), mounted = useRef(true);
  useLayoutEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  if(!loading&&!loadError&&!empty)return null;
  return <div ref={root} id={id} className="rhine-data-feedback">{loading ? <p role="status">正在读取…</p> : loadError ? <Notice tone="error" title="读取未完成">{loadError}{onRetry && <Button variant="secondary" disabled={disabled} onClick={event => {
    if(disabled || event.currentTarget.matches(':disabled'))return;
    const trigger=event.currentTarget, owned=document.activeElement===trigger;
    onRetry();
    queueMicrotask(() => { if(owned && mounted.current && !trigger.isConnected && document.activeElement===document.body && focusId)document.getElementById(focusId)?.focus({preventScroll:true}); });
  }}>重试读取</Button>}</Notice> : empty ? <p role="status">{emptyText}</p> : null}</div>;
}
