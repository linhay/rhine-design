import { useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Notice } from './components';
import { CopyButton } from './Actions';
import { parseRichBlocks, parseInline, inlineText, safeRichUrl, type InlineToken, type RichBlock } from './rich-text-parser';
import './rich-text.css';
export interface RichTextProps { source:string; label:string; highlight?:string; links?:'source'|'navigate'; initialBlocks?:number; copy?:(source:string)=>Promise<void> }
type Match=readonly[number,number];
function matches(text:string,query:string):Match[]{
 if(!query||query.length>256)return [];const ranges:Match[]=[];for(let start=0;ranges.length<1000;){const next=text.indexOf(query,start);if(next<0)break;ranges.push([next,next+query.length]);start=next+query.length;}return ranges;
}
function marked(text:string,offset:number,ranges:Match[]):ReactNode {
 const out:ReactNode[]=[];let cursor=0;
 for(const[start,end]of ranges){const left=Math.max(0,start-offset),right=Math.min(text.length,end-offset);if(right<=left)continue;if(left>cursor)out.push(text.slice(cursor,left));out.push(<mark key={offset+left}>{text.slice(left,right)}</mark>);cursor=right;}
 if(cursor<text.length)out.push(text.slice(cursor));return out;
}
function formatted(raw:string,query:string,links:'source'|'navigate'):ReactNode {
 const tokens=parseInline(raw),ranges=matches(inlineText(tokens),query);let offset=0;
 const render=(items:InlineToken[]):ReactNode=>items.map((token,index)=>{
  if('text'in token){const content=marked(token.text,offset,ranges);offset+=token.text.length;return token.kind==='code'?<code key={index}>{content}</code>:<span key={index}>{content}</span>;}
  const content=render(token.children);
  if(token.kind==='link'){const href=safeRichUrl(token.url);return href&&links==='navigate'?<a key={index} href={href} target="_blank" rel="noopener noreferrer">{content}<span className="rhine-sr-only">（新窗口打开）</span></a>:<span key={index} className="rhine-rich-text__source" title={href?'只读来源：'+href:'链接未启用'}>{content}<span className="rhine-rich-text__source-url">（{href||'不安全或未支持的链接'}）</span></span>;}
  const Tag=token.kind==='strong'?'strong':token.kind==='strike'?'del':'em';return <Tag key={index}>{content}</Tag>;
 });
 return render(tokens);
}
function renderBlock(block:RichBlock,index:number,query:string,links:'source'|'navigate'):ReactNode {
 if(block.kind==='paragraph')return <p key={index}>{formatted(block.raw,query,links)}</p>;
 if(block.kind==='heading'){const Heading=block.level===1?'h2':block.level===2?'h3':'h4';return <Heading key={index}>{formatted(block.raw,query,links)}</Heading>;}
 if(block.kind==='list'){const List=block.ordered?'ol':'ul';return <List key={index}>{block.items.map((item,key)=><li key={key}>{formatted(item,query,links)}</li>)}</List>;}
 if(block.kind==='code'||block.kind==='literal')return <pre key={index} tabIndex={0} aria-label={block.kind==='code'?'只读代码'+(block.language?'：'+block.language:''):'未格式化原文'}><code data-language={block.kind==='code'?block.language:undefined}>{marked(block.raw,0,matches(block.raw,query))}</code></pre>;
 return <div key={index} className="rhine-rich-text__table" tabIndex={0} role="region" aria-label="只读内容表格"><table><caption className="rhine-sr-only">原文表格</caption><thead><tr>{block.headers.map((cell,key)=><th key={key} scope="col">{formatted(cell,query,links)}</th>)}</tr></thead><tbody>{block.rows.map((row,key)=><tr key={key}>{row.map((cell,column)=><td key={column}>{formatted(cell,query,links)}</td>)}</tr>)}</tbody></table></div>;
}
/** Limited Markdown, never HTML. The immutable source is the only copy value. */
export function RichText({source,label,highlight='',links='source',initialBlocks=40,copy}:RichTextProps) {
 if(!label.trim())throw new TypeError('RichText requires a nonempty label.');
 const id=useId(),root=useRef<HTMLDivElement>(null),step=Math.max(1,Math.min(100,Number.isFinite(initialBlocks)?Math.floor(initialBlocks):40));
 const [paging,setPaging]=useState({source,count:step});
 if(paging.source!==source)setPaging({source,count:step});
 const tooLarge=source.length>131072;
 const blocks=useMemo(()=>tooLarge?[]:parseRichBlocks(source),[source,tooLarge]);
 const count=paging.source===source?paging.count:step,visible=blocks.slice(0,count),remaining=blocks.length-visible.length;
 return <div className="rhine-rich-text" role="region" aria-label={label}>
  <div ref={root} id={id} className="rhine-rich-text__blocks" tabIndex={-1}>
   {tooLarge?<Notice title="内容超出单次呈现上限" tone="warning">当前原文超过131072个UTF-16码元，未解析或截断为成功内容。原文仍可复制；请由宿主分页或分块提供。</Notice>:!source.trim()?<p role="status">暂无只读内容</p>:visible.map((block,index)=>renderBlock(block,index,highlight,links))}
  </div>
  <div className="rhine-rich-text__actions"><CopyButton key={source} value={source} label="复制原文" copy={copy}/>{remaining>0&&<Button variant="secondary" aria-controls={id} onClick={()=>{root.current?.focus();setPaging({source,count:count+step});}}>继续显示（剩余{remaining}块）</Button>}</div>
  {highlight.length>256&&<p role="status">搜索词超过256个UTF-16码元，未高亮；原文保持不变。</p>}
 </div>;
}
