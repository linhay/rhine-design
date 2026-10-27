import { useEffect, useRef, useState } from 'react';
import { Badge, Button, ChatCard, ChatThread, Checkbox, Inline, Select, Stack, Surface, Text, Toolbar, type ChatEntry, type ChatStatus } from '../components';
import './chat-gallery.css';

const members = [{ id: 'a', name: '成员 A' }, { id: 'b', name: '成员 B' }, { id: 'c', name: '成员 C' }];
const paragraph = '先保留原始证据，再比较两个版本的差异。长段落应完整换行，错误原因和未知状态不会被折叠隐藏；消息、引用与结构化结果各有清晰归属。';
function message(id: string, member: number, minute: number, content: ChatEntry['content'], day = '今天 · 10 月 27 日'): ChatEntry {
  return { id, kind: 'message', member: members[member], day, time: `10:${String(minute).padStart(2, '0')}`, dateTime: `2026-10-${day.startsWith('昨天') ? '26' : '27'}T10:${String(minute).padStart(2, '0')}:00+08:00`, content };
}
const history = [
  message('history-a', 0, 10, <p>这是更早的合成记录。资料清单包含版本说明、公开摘要和未确认项。</p>, '昨天 · 10 月 26 日'),
  message('history-b', 1, 12, <><p>{paragraph}</p><p>{paragraph}</p><pre><code>{'const evidence = { source: "sample", verified: false };\n// 未确认不等于零，也不等于完成。'}</code></pre></>, '昨天 · 10 月 26 日'),
];
const states: [ChatStatus, string][] = [
  ['pending', '资料核对请求，等待成员回应。'], ['accepted', '成员 B 已接受；尚未执行。'],
  ['declined', '另一个可选请求被成员 C 拒绝，本分支结束。'], ['blocked', '等待公开资料补全，不显示无限加载。'],
  ['running', '正在比较已到达的资料。'], ['partial', '已找到两处差异，结论仍不完整。'],
  ['failed', '来源样例暂不可用。保留部分结果，可由有权限的成员稍后重试。'],
  ['unknown', '来源没有提供最终状态，不能推断成功。'], ['cancelled', '成员停止了该分支，已有内容保留。'],
  ['expired', '请求超过有效期，后续操作由宿主决定。'], ['succeeded', '独立的摘要归档已确认完成。'],
];

/** A host example using public exports only; all timers and transitions are synthetic host state. */
export function ChatGallery() {
  const [scene, setScene] = useState('pair');
  const [layout, setLayout] = useState('after');
  const [width, setWidth] = useState('880');
  const [request, setRequest] = useState<ChatStatus>('pending');
  const [older, setOlder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [failHistory, setFailHistory] = useState(false);
  const [streamState, setStreamState] = useState<ChatStatus>('unknown');
  const [chunks, setChunks] = useState(0);
  const [arrivals, setArrivals] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = streamState === 'running';
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setChunks(value => value + 1), 220);
    return () => clearInterval(interval);
  }, [running]);
  useEffect(() => { if (chunks >= 24 && running) setStreamState('partial'); }, [chunks, running]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function resetScene(next: string) {
    if (timer.current) clearTimeout(timer.current);
    setScene(next); setOlder(false); setLoading(false); setHistoryError(''); setChunks(0); setStreamState('unknown'); setArrivals(0); setRequest('pending');
  }
  const before = layout === 'before';
  const requestCard = before ? <Surface><Stack gap={3}><Badge>待回应</Badge><Text as="h3" variant="heading">资料核对请求</Text><Text>比较版本并附上依据。</Text><Button variant="quiet">查看条款</Button></Stack></Surface>
    : <ChatCard title="资料核对请求" status={request} summary="比较版本并附上依据。" actions={<><Button variant="quiet" aria-disabled={request !== 'pending'} onClick={() => { if (request === 'pending') setRequest('accepted'); }}>接受请求</Button><Button variant="quiet" aria-disabled={request !== 'pending'} onClick={() => { if (request === 'pending') setRequest('declined'); }}>拒绝请求</Button></>}>
      <p>仅比较公开的合成资料，保留未知项；接受不代表运行完成。</p><a href="https://example.com">来源示例 · example.com</a>
    </ChatCard>;
  const pair: ChatEntry[] = [
    message('a1', 0, 23, <p>需要一起核对资料变化。</p>),
    message('a2', 0, 24, requestCard),
    message('b1', 1, 25, <><p>先查看这段依据：</p><blockquote>“比较版本并附上依据。”<br /><a href="https://example.com">公开来源示例</a></blockquote><p>{paragraph}</p></>),
    message('b2', 1, 26, <><pre><code>{'const result = {\n  status: "partial",\n  source: "synthetic-example-with-a-very-long-unbroken-identifier-0123456789"\n};'}</code></pre><p><strong>尚未确认：</strong>补全来源后再形成最终结论。</p></>),
    message('a3', 0, 32, <ChatCard title="来源核验" status="failed" summary="公开样例暂不可用，已保留部分内容。请稍后重新核对。"><p>{paragraph.repeat(3)}</p></ChatCard>),
    message('b3', 1, 33, <ChatCard title="结果摘要" status="unknown" summary="尚未收到最终确认，不将结束视为成功。"><p>完整产物由宿主在独立详情视图呈现；聊天内保留摘要和来源。</p></ChatCard>),
  ];
  const team: ChatEntry[] = [pair[0], pair[1], { id: 'event1', kind: 'event', day: '今天 · 10 月 27 日', content: '10:25 · 成员 C 加入记录（合成事件）' },
    message('c1', 2, 25, <><p>我补充一份公开来源，成员身份没有左右主从之分。</p><blockquote>{paragraph}</blockquote></>), pair[2], pair[3], pair[4], pair[5]];
  const observing = scene === 'observer';
  const observation: ChatEntry[] = states.map(([status, summary], index) => message(`observation-${status}`, index % 3, index + 20,
    <ChatCard title={`记录 ${index + 1} · 资料核对`} status={status} summary={summary}><p>{paragraph}</p><pre><code>{`{ "state": "${status}", "synthetic": true }`}</code></pre></ChatCard>));
  const entries = [ ...(older ? history : []), ...(observing ? observation : scene === 'team' ? team : pair),
    ...Array.from({ length: arrivals }, (_, i) => message(`arrival-${i}`, 2, 40, <p>新到达的合成消息 {i + 1}。上翻历史时不会强制回到这里。</p>)),
    ...(chunks || running || streamState === 'cancelled' || streamState === 'failed' ? [message('stream', 1, 45,
      <ChatCard title="合成流式记录" status={streamState} summary={<><p>{streamState === 'cancelled' ? '生成已取消；保留部分内容，未确认成功。' : streamState === 'failed' ? '合成连接中断；保留部分内容，未确认成功。' : '文字逐段到达，终态由宿主提供。'}</p><p>{paragraph.repeat(Math.ceil(chunks / 3)).slice(0, chunks * 25)}</p></>}><p>分片计数：{chunks}。仅用于合成演示，未调用模型。</p></ChatCard>)] : []),
  ];
  return <section id="agent-chat"><Stack gap={6}>
    <Toolbar title="Agent Chat · 对话与记录" description="正文优先，成员平等；摘要紧随消息，阅读位置由读者掌握。">
      <Select label="聊天场景" value={scene} onChange={e => resetScene(e.target.value)}><option value="pair">两成员连续对话</option><option value="team">三成员与事件混排</option><option value="observer">只读观察与历史</option></Select>
      <Select label="聊天容器宽度" value={width} onChange={e => setWidth(e.target.value)}><option>400</option><option>520</option><option>880</option></Select>
      <Select label="排版对照" value={layout} onChange={e => setLayout(e.target.value)}><option value="after">规范组合</option><option value="before">问题结构复现</option></Select>
    </Toolbar>
    <div className="chat-gallery-canvas" style={{ width: `${width}px` }}>
      {before ? <Surface><Stack gap={6}>{entries.map(entry => <div key={entry.id}>{entry.kind === 'message' && <Inline gap={2}><Text>{entry.member.name}</Text><Text variant="caption">{entry.time}</Text></Inline>}{entry.content}</div>)}</Stack></Surface>
        : <ChatThread key={scene} label="合成聊天消息" entries={entries} readOnly={observing} hasEarlier={!older} loadingEarlier={loading} historyError={historyError}
          announcement={running ? '正在接收合成记录' : streamState === 'cancelled' ? '已取消，保留部分内容' : streamState === 'failed' ? '连接中断，未完成' : ''}
          onLoadEarlier={() => {
            setLoading(true); setHistoryError('');
            timer.current = setTimeout(() => { setLoading(false); if (failHistory) setHistoryError('合成历史加载失败。取消下方失败模拟后，可重新加载。'); else setOlder(true); timer.current = null; }, 600);
          }} />}
    </div>
    <Surface><Stack gap={3}><Text as="h2" variant="heading">合成数据演示控制</Text><Text tone="muted">此处只控制展台数据，不代表成员操作。上翻消息或打开详情后，播放新记录检查阅读位置。</Text>
      <Inline gap={2}>
        <Button variant="secondary" onClick={() => setArrivals(value => value + 1)}>到达一条合成消息</Button>
        <Button variant="secondary" disabled={running} onClick={() => { setChunks(0); setStreamState('running'); }}>播放合成流式记录</Button>
        <Button variant="quiet" aria-disabled={!running} onClick={() => { if (running) setStreamState('cancelled'); }}>取消演示生成</Button>
        <Button variant="quiet" aria-disabled={!running} onClick={() => { if (running) setStreamState('failed'); }}>模拟连接失败</Button>
      </Inline>
      <Checkbox label="下次历史加载失败" checked={failHistory} onChange={event => setFailHistory(event.target.checked)} />
      <Text variant="caption">离开本章节或切换场景会清理计时器；自然结束保留「部分结果」，不会自行宣称成功。</Text>
    </Stack></Surface>
  </Stack></section>;
}
