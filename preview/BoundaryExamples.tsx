import { useId, useState } from 'react';
import { Avatar, Button, Carousel, Checkbox, Collapse, ColorPicker, IconButton, Inline, Mentions, Rate, SegmentedControl, Select, Stack, Text, TextField, Transfer, Upload, VirtualList } from '../components';

const goodAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23425c4b'/%3E%3Cpath d='M12 52 32 12 52 52Z' fill='%23f5f3e8'/%3E%3C/svg%3E";
const badAvatar = 'data:image/svg+xml,%3Csvg%20broken';
const people = [{ id:'lin', label:'林可' }, { id:'zhou', label:'周宁' }, { id:'chen', label:'陈页' }];

export function BoundaryExamples({ id }: { id:string }) {
  if (id === 'avatar') return <AvatarExample />;
  if (id === 'carousel') return <CarouselExample />;
  if (id === 'listy') return <VirtualListExample />;
  if (id === 'upload') return <UploadExample />;
  if (id === 'rate') return <RateExample />;
  if (id === 'collapse') return <CollapseExample />;
  if (id === 'transfer') return <TransferExample />;
  if (id === 'mentions') return <MentionsExample />;
  if (id === 'color-picker') return <ColorExample />;
  return null;
}

function AvatarExample() {
  const [source, setSource] = useState<'none'|'bad'|'good'>('none');
  return <Stack gap={4}><Inline gap={2}><Button variant="secondary" onClick={() => setSource('bad')}>显示失败图片</Button><Button onClick={() => setSource('good')}>换成有效图片</Button><Button variant="quiet" onClick={() => setSource('none')}>仅显示名称</Button></Inline><Avatar name="示例用户" src={source === 'none' ? undefined : source === 'good' ? goodAvatar : badAvatar} /><Text>当前来源：{source === 'good' ? '有效合成图片' : source === 'bad' ? '明确损坏的合成图片' : '未提供图片'}</Text></Stack>;
}
function RateExample() {
  const [first, setFirst] = useState(2), [second, setSecond] = useState(3);
  return <Stack gap={4}><Text>同名的两组评分独立，不会因原生 radio 分组串扰。</Text><Rate label="示例评分" value={first} onChange={setFirst} /><Rate label="示例评分" value={second} onChange={setSecond} /><Text>第一组：{first}；第二组：{second}</Text></Stack>;
}
function CarouselExample() {
  const [index, setIndex] = useState(0), [mode, setMode] = useState('normal'), [draft, setDraft] = useState('光标左右移动不会切页'), [requests, setRequests] = useState(0);
  const pages = [<TextField key="draft" label="轮播草稿" value={draft} onChange={event => setDraft(event.target.value)} />, <Text key="second">第二张：这是已有内容，不会自动播放。</Text>];
  return <Stack gap={4}><SegmentedControl label="轮播数据" items={[{value:'normal',label:'两张'},{value:'single',label:'单张'},{value:'empty',label:'空列表'}]} value={mode} onValueChange={setMode} /><Inline gap={2}><Button variant="secondary" onClick={() => setIndex(999)}>传入越界索引</Button><Button variant="quiet" onClick={() => setIndex(NaN)}>传入无效索引</Button></Inline><Carousel label="示例轮播" items={mode === 'empty' ? [] : mode === 'single' ? pages.slice(0,1) : pages} index={index} onChange={next => { setIndex(next); setRequests(value => value + 1); }} /><Text>宿主索引：{String(index)}；切页请求：{requests}</Text></Stack>;
}
function VirtualListExample() {
  const [rows, setRows] = useState(() => Array.from({length:100},(_,index) => ({ id:String(index + 1), title:`条目${index + 1}` })));
  const [limited, setLimited] = useState(false);
  const swap = () => setRows(current => current.length < 2 ? current : [current[1],current[0],...current.slice(2)].map(item => ({...item})));
  const moveToEnd = (key:string) => setRows(current => [...current.filter(item => item.id !== key), ...current.filter(item => item.id === key)].map(item => ({...item})));
  return <Stack gap={4}><Inline gap={2}><Button variant="secondary" onClick={swap}>交换前两行</Button><Button variant="secondary" onClick={() => setLimited(value => !value)}>{limited ? '显示全部行' : '仅显示两行'}</Button></Inline><Text>在输入框按 Enter 交换前两行；Shift+Enter 把当前行移到末尾。行内草稿随稳定身份移动；被真正卸载的草稿仍应由宿主持有。</Text><VirtualList label="可编辑虚拟列表" items={limited ? rows.slice(0,2) : rows} itemHeight={96} height={288} getItemKey={item => item.id} renderItem={item => <div className="rhine-field" style={{height:'100%',padding:8}}><label htmlFor={`virtual-draft-${item.id}`}>{item.title}草稿</label><div style={{display:'flex',gap:8,minWidth:0}}><input id={`virtual-draft-${item.id}`} defaultValue={item.title} style={{flex:1,width:0}} onKeyDown={event => { if(event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); if(event.shiftKey) moveToEnd(item.id); else swap(); } }} /><IconButton label={`移除${item.title}`} icon="close" onClick={() => setRows(current => current.filter(row => row.id !== item.id))} /></div></div>} /><Text>当前条目：{limited ? Math.min(2,rows.length) : rows.length}，只渲染窗口和当前持焦行。</Text></Stack>;
}
function UploadExample() {
  const [files, setFiles] = useState(() => [new File(['synthetic'], 'example.txt', { type: 'text/plain' })]);
  const [disabled, setDisabled] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [result, setResult] = useState('');
  return <Stack gap={4}>
    <Checkbox label="禁用本地文件操作" checked={disabled} onChange={event => setDisabled(event.target.checked)} />
    <Checkbox label="显示附件说明" checked={showHint} onChange={event => setShowHint(event.target.checked)} />
    <form aria-label="附件提交示例" onSubmit={event => {
      event.preventDefault();
      const attachments = new FormData(event.currentTarget).getAll('attachments');
      setResult(`表单收到 ${attachments.length} 个文件${attachments.length ? `：${attachments.map(file => (file as File).name).join('、')}` : ''}`);
    }}>
      <Stack gap={3}>
        <Upload label="选择本地文件" name="attachments" files={files} onChange={setFiles} disabled={disabled}
          hint={showHint ? '附件随表单保存。本示例只预览表单内容。' : undefined} />
        <Button type="submit">预览表单附件</Button>
        <Text role="status">{result}</Text>
      </Stack>
    </form>
  </Stack>;
}
function CollapseExample() {
  const [accordion,setAccordion] = useState(false), [a,setA] = useState('第一组草稿'), [b,setB] = useState('第二组草稿');
  const content = (label:string,value:string,change:(value:string)=>void) => <Stack gap={2}><TextField label={label} value={value} onChange={event => change(event.target.value)} /><Button variant="secondary" onClick={() => setAccordion(current => !current)}>{accordion ? '允许多组展开' : '进入单组模式'}</Button></Stack>;
  return <Stack gap={4}><Checkbox label="手风琴模式" checked={accordion} onChange={event => setAccordion(event.target.checked)} /><Collapse label="动态折叠" accordion={accordion} items={[{id:'a',title:'第一组',content:content('第一组草稿',a,setA)},{id:'b',title:'第二组',content:content('第二组草稿',b,setB)}]} /><Text>切换为单组时，保留当前持焦面板；没有面板持焦则保留已展开的第一组。</Text></Stack>;
}
function TransferExample() {
  const [target,setTarget] = useState<string[]>(['lin']), [mode,setMode] = useState('accept'), [pending,setPending] = useState<string[] | null>(null), [disabled,setDisabled] = useState(false), [message,setMessage] = useState('尚未移动');
  const followup = useId();
  const change = (next:string[]) => {
    if(mode === 'reject') setMessage('宿主未接受，勾选保持');
    else if(mode === 'delay') { setPending(next); setMessage('已记录意图，尚未接受'); }
    else { setTarget(mode === 'partial' ? next.filter(key => key !== 'chen') : next); setMessage(mode === 'partial' ? '仅接受不含陈页的子集' : '已接受本地选择'); }
  };
  return <Stack gap={4}><Select label="接收方式" value={mode} onChange={event => setMode(event.target.value)}><option value="accept">同步接受</option><option value="reject">明确拒绝</option><option value="delay">延迟接受</option><option value="partial">部分接受</option></Select><Checkbox label="禁用穿梭操作" checked={disabled} onChange={event => setDisabled(event.target.checked)} /><Transfer label="成员" source={people} target={target} onChange={change} disabled={disabled} /><Inline gap={2}><Button variant="secondary" onClick={() => setTarget(current => [...current])}>刷新同值数组</Button><Button variant="secondary" aria-disabled={!pending} onClick={() => { if(pending) { setTarget(pending); setPending(null); setMessage('已接受待处理选择'); document.getElementById(followup)?.focus(); } }}>接受并继续编辑</Button></Inline><TextField id={followup} label="后续编辑" defaultValue="不被旧动作抢焦" /><Text role="status">{message}</Text><Text>已选：{people.filter(item => target.includes(item.id)).map(item => item.label).join('、') || '无'}</Text></Stack>;
}
function MentionsExample() {
  const [value,setValue] = useState('请 @');
  return <Stack gap={4}><Mentions label="备注" value={value} onChange={setValue} options={['林可','周宁']} /><Text>第一次按上方向键从末项开始，下方向键从首项开始；Escape 只关闭候选，不删除文字。</Text></Stack>;
}
function ColorExample() {
  const [value,setValue] = useState('#425c4b'), [disabled,setDisabled] = useState(false);
  return <Stack gap={4}><Checkbox label="禁用颜色输入" checked={disabled} onChange={event => setDisabled(event.target.checked)} /><ColorPicker label="强调色" value={value} onChange={setValue} disabled={disabled} /><Text>色值错误关联到输入框；非法草稿不会把色盘改成另一个固定颜色。</Text></Stack>;
}
