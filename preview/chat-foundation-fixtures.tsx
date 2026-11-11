import { type CSSProperties } from 'react';
import { Text } from '../components';

export type Agent={id:string;name:string;role:string;preview:string;initial:string;color:string;status:'working'|'ready'|'offline'};
export const agents:Agent[]=[
 {id:'chief',name:'Chief of Staff',role:'协调团队与重点工作',preview:'正在整理今天的工作重点',initial:'C',color:'#e77f61',status:'working'},
 {id:'research',name:'Research',role:'研究与资料核对',preview:'资料 v2 已准备好',initial:'R',color:'#6b9df0',status:'ready'},
 {id:'writer',name:'Writer',role:'写作与内容整理',preview:'可以继续修改发布稿',initial:'W',color:'#9b88df',status:'ready'},
 {id:'browser',name:'Browser',role:'浏览器与网页任务',preview:'需要重新连接浏览器',initial:'B',color:'#6ebea2',status:'offline'},
];
export const messages=[
 {id:'1',author:'Chief of Staff',initial:'C',time:'09:42',kind:'agent' as const,day:'今天',body:'早上好。今天有三个工作值得继续：\n\n• 核对资料 v2 的新增条件\n• 整理研究结论和未决问题\n• 准备下午的发布草稿'},
 {id:'2',author:'你',initial:'你',time:'09:44',kind:'person' as const,day:'今天',body:'先从资料 v2 开始，告诉我哪些结论需要重新确认。'},
 {id:'3',author:'Chief of Staff',initial:'C',time:'09:44',kind:'agent' as const,day:'今天',body:'收到。我会逐条比较旧版和 v2，并把依据与未知部分分开。'},
 {id:'4',author:'Research',initial:'R',time:'09:51',kind:'agent' as const,day:'今天',body:'我发现一处变化：',quote:'条件 C 只在样本 A 上有依据，其他样本仍未知。\n\n建议保留旧结论，同时标注适用范围。'},
];
export const statusLabels:Record<Agent['status'],string>={working:'正在工作',ready:'准备就绪',offline:'离线'};
export function Avatar({agent,large=false}:{agent:Pick<Agent,'initial'|'color'>;large?:boolean}){return <span className={`rhine-chat-avatar${large?' rhine-chat-avatar--large':''}`} style={{'--rhine-chat-avatar':agent.color} as CSSProperties}>{agent.initial}</span>}
export function MessageBody({text}:{text:string}){return <>{text.split('\n\n').map((part,index)=><Text key={index}>{part.startsWith('•')?part.split('\n').map(line=><span className="rhine-chat-list-line" key={line}>{line}</span>):part}</Text>)}</>}
