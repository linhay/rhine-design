import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Button } from './components';
import { Dialog } from './Overlays';

type AssetStatus = 'loading' | 'loaded' | 'error';
export interface ImageProps { alt:string; src?:string; caption?:string }
function useResource(src?:string) {
  const [attempt,setAttempt]=useState(0);
  const [reported,setReported]=useState<{src?:string;attempt:number;status:AssetStatus}>({src,attempt:0,status:'loading'});
  const report=useCallback((status:AssetStatus)=>setReported(current=>current.src===src&&current.attempt===attempt&&current.status===status?current:{src,attempt,status}),[src,attempt]);
  const status=!src?'empty':reported.src===src&&reported.attempt===attempt?reported.status:'loading';
  return {attempt,status,report,retry:()=>setAttempt(value=>value+1)};
}
function useLostResourceFocus(root:RefObject<HTMLElement|null>) {
  const owned=useRef<HTMLElement|null>(null);
  useLayoutEffect(()=>{
    const previous=owned.current;
    if(previous&&root.current?.isConnected&&(!previous.isConnected||previous.matches(':disabled'))&&document.activeElement===document.body)root.current.focus({preventScroll:true});
  });
  return {
    onFocusCapture:(event:React.FocusEvent<HTMLElement>)=>{if(root.current?.contains(event.target))owned.current=event.target;},
    onBlurCapture:(event:React.FocusEvent<HTMLElement>)=>{if(event.relatedTarget&&!root.current?.contains(event.relatedTarget))owned.current=null;},
  };
}
function NativeImage({src,alt,thumbnail,onStatus}:{src:string;alt:string;thumbnail?:boolean;onStatus:(status:AssetStatus)=>void}) {
  const [status,setStatus]=useState<AssetStatus>('loading');
  useLayoutEffect(()=>{onStatus(status);},[status,onStatus]);
  return <span className="rhine-image__asset" data-state={status} aria-busy={status==='loading'||undefined}>
    {status==='loading'&&<span role="status">正在读取{thumbnail?'缩略图':'预览图'}…</span>}
    {status==='error'?<span role="alert">{thumbnail?'缩略图读取失败，可重试或打开预览。':'图片读取失败，可重试或关闭预览。'}</span>:<img src={src} alt={alt} onLoad={()=>setStatus('loaded')} onError={()=>setStatus('error')}/>}
  </span>;
}
function Preview({src,alt}:{src?:string;alt:string}) {
  const resource=useResource(src),root=useRef<HTMLDivElement>(null),focus=useLostResourceFocus(root);
  return <div ref={root} className="rhine-image__preview" role="group" aria-label={`${alt}图片资源`} tabIndex={-1} {...focus}>
    {src?<NativeImage key={`${src}:${resource.attempt}`} src={src} alt={alt} onStatus={resource.report}/>:<p>{alt}（没有提供图片）</p>}
    {src&&<Button variant="secondary" busy={resource.status==='loading'} busyLabel="正在读取预览图" onClick={resource.retry}>{resource.status==='error'?'重试图片':'重新读取图片'}</Button>}
  </div>;
}
export function Image({alt,src,caption}:ImageProps) {
  const resource=useResource(src),root=useRef<HTMLElement>(null),focus=useLostResourceFocus(root);
  return <figure ref={root} className="rhine-image" aria-label={alt} tabIndex={-1} {...focus}>
    <Dialog title={alt} trigger={<button type="button" className="rhine-image__trigger" aria-label={`查看${alt}`} data-image-state={resource.status}>{src?<NativeImage key={`${src}:${resource.attempt}`} src={src} alt="" thumbnail onStatus={resource.report}/>:<span>{alt}</span>}</button>}><Preview src={src} alt={alt}/></Dialog>
    {src&&<Button variant="secondary" busy={resource.status==='loading'} busyLabel="正在读取缩略图" onClick={resource.retry}>{resource.status==='error'?'重试缩略图':'重新读取缩略图'}</Button>}
    {caption&&<figcaption>{caption}</figcaption>}
  </figure>;
}
