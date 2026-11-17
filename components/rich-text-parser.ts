export type InlineToken = {kind:'text';text:string}|{kind:'code';text:string}|{kind:'strong'|'emphasis'|'strike';children:InlineToken[]}|{kind:'link';children:InlineToken[];url:string};
export type RichBlock = {kind:'paragraph';raw:string}|{kind:'heading';level:1|2|3;raw:string}|{kind:'list';ordered:boolean;items:string[]}|{kind:'code';language:string;raw:string}|{kind:'table';headers:string[];rows:string[][]}|{kind:'literal';raw:string};
export function safeRichUrl(url:string):string|null {
 if(!/^https?:\/\//i.test(url)||/[\u0000-\u0020\u007f]/u.test(url))return null;
 try{const parsed=new URL(url);return ['http:','https:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password?parsed.href:null;}catch{return null;}
}
export function inlineText(tokens:InlineToken[]):string{return tokens.map(token=>'text'in token?token.text:inlineText(token.children)).join('');}
const tick=String.fromCharCode(96);
export function parseInline(text:string,depth=0,budget={count:0}):InlineToken[] {
 if(depth>=8||text.length>16384)return [{kind:'text',text}];
 const out:InlineToken[]=[];let plain='';const flush=()=>{if(plain){out.push({kind:'text',text:plain});plain='';}};
 for(let index=0;index<text.length;){
  if(++budget.count>32768){plain+=text.slice(index);break;}
  if(text[index]==='\\'&&index+1<text.length){plain+=text[index+1];index+=2;continue;}
  if(text[index]==='!'&&text[index+1]==='['){const end=text.indexOf(')',index+2);if(end>=0){plain+=text.slice(index,end+1);index=end+1;continue;}}
  if(text[index]==='['){const middle=text.indexOf('](',index+1),end=middle<0?-1:text.indexOf(')',middle+2);if(middle>=0&&end>=0&&end-middle<=2048){flush();out.push({kind:'link',url:text.slice(middle+2,end),children:parseInline(text.slice(index+1,middle),depth+1,budget)});index=end+1;continue;}plain+=text.slice(index);break;}
  const marker=text.startsWith('**',index)?'**':text.startsWith('~~',index)?'~~':text[index]==='*'?'*':undefined;
  if(text[index]===tick){const end=text.indexOf(tick,index+1);if(end>index+1){flush();out.push({kind:'code',text:text.slice(index+1,end)});index=end+1;continue;}plain+=text.slice(index);break;}
  if(marker){const end=text.indexOf(marker,index+marker.length);if(end>index+marker.length){flush();out.push({kind:marker==='**'?'strong':marker==='~~'?'strike':'emphasis',children:parseInline(text.slice(index+marker.length,end),depth+1,budget)});index=end+marker.length;continue;}plain+=text.slice(index);break;}
  plain+=text[index++];
 }
 flush();return out;
}
const cells=(line:string)=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(value=>value.trim());
export function parseRichBlocks(source:string):RichBlock[] {
 const lines=source.replace(/\r\n?/g,'\n').split('\n'),blocks:RichBlock[]=[];
 for(let index=0;index<lines.length;){
  const line=lines[index];if(!line.trim()){index++;continue;}
  if(line.length>16384){blocks.push({kind:'literal',raw:line});index++;continue;}
  const fence=/^```([A-Za-z0-9_+-]{0,32})\s*$/.exec(line);
  if(fence){let end=index+1;while(end<lines.length&&lines[end]!==tick.repeat(3))end++;if(end===lines.length){blocks.push({kind:'literal',raw:lines.slice(index).join('\n')});break;}blocks.push({kind:'code',language:fence[1],raw:lines.slice(index+1,end).join('\n')});index=end+1;continue;}
  const heading=/^(#{1,3}) +(.+)$/.exec(line);if(heading){blocks.push({kind:'heading',level:heading[1].length as 1|2|3,raw:heading[2]});index++;continue;}
  const bullet=/^([-+*]|\d{1,6}\.) +(.+)$/.exec(line);if(bullet){const blockStart=index,ordered=/^\d/.test(bullet[1]),items:string[]=[];while(index<lines.length){const item=/^([-+*]|\d{1,6}\.) +(.+)$/.exec(lines[index]);if(!item||/^\d/.test(item[1])!==ordered)break;items.push(item[2]);index++;}blocks.push(items.length<=200?{kind:'list',ordered,items}:{kind:'literal',raw:lines.slice(blockStart,index).join('\n')});continue;}
  if(line.includes('|')&&index+1<lines.length&&/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index+1])){
   const headers=cells(line);let end=index+2;const rows:string[][]=[];while(end<lines.length&&lines[end].trim()&&lines[end].includes('|'))rows.push(cells(lines[end++]));
   if(headers.length<=40&&rows.length<=200&&rows.every(row=>row.length===headers.length))blocks.push({kind:'table',headers,rows});else blocks.push({kind:'literal',raw:lines.slice(index,end).join('\n')});index=end;continue;
  }
  const paragraph=[line];index++;while(index<lines.length&&lines[index].trim()&&!/^(#{1,3} |[-+*] |\d{1,6}\. |```)/.test(lines[index])&&!(lines[index].includes('|')&&lines[index+1]?.includes('---'))){paragraph.push(lines[index++]);}const raw=paragraph.join('\n');blocks.push({kind:raw.length>16384?'literal':'paragraph',raw});
 }
 return blocks;
}
