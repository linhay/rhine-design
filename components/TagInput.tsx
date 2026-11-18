import {useId,useLayoutEffect,useRef,useState,type ClipboardEvent,type KeyboardEvent} from 'react';
import {Button} from './components';
import {SelectionTags} from './SelectionTags';
import {FieldFeedback,fieldDescription,type ProvidedFieldProps} from './field-support';
import {useNativeFieldDisabled} from './selection-lifecycle';
import './extensions.css';
import './compact-forms.css';
import './tag-input.css';

export interface TagInputProps extends ProvidedFieldProps {
  label:string; value:readonly string[]; onValueChange:(value:string[])=>void;
  query?:string; defaultQuery?:string; onQueryChange?:(query:string)=>void;
  placeholder?:string; suggestions?:readonly string[]; maxSuggestions?:number;
  separators?:readonly string[]; pasteBehavior?:'draft'|'split'; commitOnBlur?:boolean;
  trim?:boolean; allowDuplicates?:boolean; maxLength?:number; maxTags?:number;
  validateTag?:(tag:string,values:readonly string[])=>string|undefined;
  maxVisibleTags?:number; clearable?:boolean;
}
const tagIndex=(scope:HTMLElement,node:HTMLElement)=>[...scope.querySelectorAll('.rhine-multi-select__tags li')].indexOf(node.closest('li')!);
const same=(left:readonly string[],right:readonly string[])=>left.length===right.length&&left.every((item,index)=>item===right[index]);
export function TagInput({label,value,onValueChange,query,defaultQuery='',onQueryChange,placeholder='输入后按 Enter 确认',suggestions=[],maxSuggestions=6,separators=[],pasteBehavior='draft',commitOnBlur=false,trim=true,allowDuplicates=false,maxLength,maxTags,validateTag,maxVisibleTags=3,clearable=true,id:suppliedId,name,form,disabled=false,readOnly=false,hint,error,required,'aria-describedby':extra}:TagInputProps){
  for(const [key,amount]of Object.entries({maxSuggestions,maxVisibleTags,maxLength,maxTags}))if(amount!==undefined&&(!Number.isInteger(amount)||amount<0))throw new RangeError('TagInput '+key+' must be a nonnegative integer.');
  if(separators.some(item=>Array.from(item).length!==1))throw new TypeError('TagInput separators must each be one Unicode character.');
  const generated=useId(),id=suppliedId??'rhine-tags-'+generated,root=useRef<HTMLFieldSetElement>(null),entry=useRef<HTMLTextAreaElement>(null);
  const[local,setLocal]=useState(defaultQuery),[ime,setIme]=useState<string|null>(null),[localError,setLocalError]=useState(''),[focused,setFocused]=useState(false);
  const lastTagFocus=useRef<{node:HTMLButtonElement;label:string;copies:number}|null>(null);
  const tagCounts=new Map<string,number>();
  const tags=value.map(label=>{
    const occurrence=tagCounts.get(label)??0;
    tagCounts.set(label,occurrence+1);
    return {value:JSON.stringify([label,occurrence]),label};
  });
  const composing=useRef(false),compositionEnd=useRef(false),pending=useRef<{expected:string[];raw:string;remaining:string}|null>(null);
  const nativeDisabled=useNativeFieldDisabled(id),text=ime??query??local,feedback=[error,localError].filter(Boolean).join('；')||undefined;
  const unavailable=()=>disabled||readOnly||Boolean(entry.current?.matches(':disabled'));
  const write=(next:string)=>{if(query===undefined)setLocal(next);if(next!==(query??local))onQueryChange?.(next);};
  useLayoutEffect(()=>{
    const previous=lastTagFocus.current;if(!previous)return;
    const copies=tagCounts.get(previous.label)??0;
    // Fewer identical strings cannot identify which occurrence the host removed.
    if(previous.node.isConnected&&!previous.node.matches(':disabled')&&copies>=previous.copies){previous.copies=copies;return;}
    lastTagFocus.current=null;
    const active=document.activeElement;
    if(active===document.body||active===previous.node||!active?.isConnected)focusEntry();
  });
  useLayoutEffect(()=>{const proposal=pending.current;if(!proposal)return;if(text!==proposal.raw){pending.current=null;return;}if(same(value,proposal.expected)){pending.current=null;if(!unavailable()){write(proposal.remaining);setLocalError('');}}});
  const changeDraft=(next:string)=>{pending.current=null;setLocalError('');write(next);};
  const focusEntry=()=>{if(!disabled&&!entry.current?.matches(':disabled'))entry.current?.focus({preventScroll:true});};
  const propose=(parts:readonly string[],raw:string,remaining:string)=>{
    if(unavailable()||composing.current)return;
    const normalized=parts.map(part=>trim?part.trim():part).filter(part=>part!=='');
    if(!normalized.length){setLocalError('');return;}
    const next=[...value];
    for(const tag of normalized){
      const invalid=maxLength!==undefined&&tag.length>maxLength?'标签超过 '+maxLength+' 个 UTF-16 单元':!allowDuplicates&&next.includes(tag)?'标签已存在：'+tag:maxTags!==undefined&&next.length>=maxTags?'最多选择 '+maxTags+' 项':validateTag?.(tag,next);
      if(invalid){pending.current=null;setLocalError(invalid);return;}next.push(tag);
    }
    setLocalError('');pending.current={expected:[...next],raw,remaining};onValueChange(next);
  };
  const split=(raw:string)=>{const delimiter=new Set(separators),parts=[''];for(const character of raw){if(delimiter.has(character))parts.push('');else parts[parts.length-1]+=character;}return parts;};
  const commit=()=>propose(split(text),text,'');
  const remove=(index:number)=>{if(unavailable())return;pending.current=null;focusEntry();setLocalError('');onValueChange(value.filter((_,position)=>position!==index));};
  const clear=()=>{if(unavailable())return;pending.current=null;focusEntry();setLocalError('');if(value.length)onValueChange([]);};
  const keyDown=(event:KeyboardEvent<HTMLTextAreaElement>)=>{
    if(composing.current||compositionEnd.current||event.nativeEvent.isComposing||event.keyCode===229||unavailable())return;
    if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    if(event.key==='Enter'||separators.includes(event.key)){event.preventDefault();commit();}
    else if(event.key==='Backspace'&&text===''){event.preventDefault();if(value.length)remove(value.length-1);}
    else if(event.key==='ArrowLeft'&&entry.current?.selectionStart===0&&entry.current.selectionEnd===0){const buttons=root.current?.querySelectorAll<HTMLButtonElement>('.rhine-multi-select__tags button:not(:disabled)');const last=buttons?.item(buttons.length-1);if(last){event.preventDefault();last.focus();}}
  };
  const paste=(event:ClipboardEvent<HTMLTextAreaElement>)=>{
    if(unavailable()||composing.current||pasteBehavior!=='split')return;
    const inserted=event.clipboardData.getData('text/plain'),element=event.currentTarget,raw=text.slice(0,element.selectionStart)+inserted+text.slice(element.selectionEnd),parts=split(raw);
    if(parts.length<2)return;event.preventDefault();pending.current=null;write(raw);const remaining=parts.pop()??'';propose(parts,raw,remaining);
  };
  const visibleSuggestions=[...new Set(suggestions)].filter(item=>item!==''&&(allowDuplicates||!value.includes(item))&&item.toLocaleLowerCase().includes(text.toLocaleLowerCase())).slice(0,maxSuggestions);
  return <fieldset ref={root} className="rhine-field rhine-tag-input" aria-labelledby={id+'-label'} disabled={disabled} data-readonly={readOnly||undefined} onFocus={event=>{
    setFocused(true);const target=event.target;
    const index=target instanceof HTMLButtonElement&&target.closest('.rhine-multi-select__tags')?tagIndex(event.currentTarget,target):-1;
    const label=value[index];
    lastTagFocus.current=target instanceof HTMLButtonElement&&label!==undefined?{node:target,label,copies:tagCounts.get(label)!}:null;
  }} onBlur={event=>{const next=event.relatedTarget;if(next instanceof Node&&!event.currentTarget.contains(next)&&next!==document.body&&next!==document.documentElement)lastTagFocus.current=null;if(next instanceof Node&&event.currentTarget.contains(next))return;setFocused(false);if(commitOnBlur&&next instanceof HTMLElement&&!composing.current)commit();}} onKeyDown={event=>{
    const target=event.target;if(!(target instanceof HTMLButtonElement)||!target.closest('.rhine-multi-select__tags')||unavailable())return;const buttons=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('.rhine-multi-select__tags button:not(:disabled)')],index=buttons.indexOf(target);
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();const next=buttons[index+(event.key==='ArrowRight'?1:-1)];if(next)next.focus();else focusEntry();}
    if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();const index=tagIndex(event.currentTarget,target);if(index>=0)remove(index);}
  }}>
    <label id={id+'-label'} className="rhine-field__label" htmlFor={id}>{label}{required&&<span aria-hidden="true"> *</span>}</label>
    <div className="rhine-tag-input__selected">
      <SelectionTags id={id} label={label} value={tags} maxVisibleTags={maxVisibleTags} disabled={disabled||nativeDisabled} readOnly={readOnly} clearable={clearable} onRemove={key=>{const index=tags.findIndex(tag=>tag.value===key);if(index>=0)remove(index);}} onClear={clear}/>
    </div>
    <textarea ref={entry} id={id} className="rhine-input rhine-tag-input__entry" rows={1} value={text} placeholder={placeholder} disabled={disabled} readOnly={readOnly} aria-required={required||undefined} aria-invalid={feedback?true:undefined} aria-describedby={fieldDescription(id,hint,feedback,extra)} onChange={event=>{if(unavailable())return;if(composing.current)setIme(event.currentTarget.value);else changeDraft(event.currentTarget.value);}} onKeyDown={keyDown} onPaste={paste} onCompositionStart={()=>{pending.current=null;composing.current=true;setIme(query??local);}} onCompositionEnd={event=>{composing.current=false;compositionEnd.current=true;queueMicrotask(()=>{compositionEnd.current=false;});const next=event.currentTarget.value;setIme(null);if(!unavailable())changeDraft(next);}}/>
    {focused&&visibleSuggestions.length>0&&<div className="rhine-tag-input__suggestions" role="group" aria-label={label+'建议'}>{visibleSuggestions.map(item=><Button key={item} variant="quiet" disabled={disabled||nativeDisabled||readOnly} onPointerDown={event=>event.preventDefault()} onClick={()=>{if(unavailable())return;focusEntry();write(item);propose([item],item,'');}}>{item}</Button>)}</div>}
    <FieldFeedback id={id} hint={hint} error={feedback}/>
    {name&&value.map((item,index)=><input key={index} type="hidden" name={name} form={form} value={item} disabled={disabled}/>)}
  </fieldset>;
}
