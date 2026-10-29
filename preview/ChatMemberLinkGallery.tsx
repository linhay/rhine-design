import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ChatThread, Select, Stack, Surface, Text, Toolbar, type ChatEntry, type ChatMember, type ChatMessage, type ChatThreadProps } from '../components';
import './chat-member-link.css';

function avatar(letter: string) {
  return <svg width="24" height="24" viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" /><text x="12" y="16" textAnchor="middle" fontSize="11" fill="currentColor">{letter}</text></svg>;
}
const members: Record<string, ChatMember> = {
  a: { id: 'a', name: '成员 A', avatar: avatar('A') },
  b: { id: 'b', name: '成员 B', avatar: avatar('B') },
  c: { id: 'c', name: '成员 C · 河谷长期观察与公开资料整理小组 RiverValleyResearchCollective0123456789', avatar: avatar('C') },
};
const unknown: ChatMember = { id: 'unavailable', name: '未知目标成员', avatar: avatar('?') };
function message(id: string, member: ChatMember, minute: number, content: string, earlier = false): ChatMessage {
  return { id, kind: 'message', member, day: earlier ? '昨天 · 10 月 29 日' : '今天 · 10 月 30 日',
    time: `10:${String(minute).padStart(2, '0')}`, dateTime: `2026-10-${earlier ? '29' : '30'}T10:${String(minute).padStart(2, '0')}:00+08:00`, content: <p>{content}</p> };
}
const earlier = [
  message('member-history-a', members.a, 10, '更早记录：先整理公开资料，再核对不同版本。', true),
  message('member-history-b', members.b, 12, '更早记录：资料仍有未知项，保留原文和时间。', true),
];
const pair: ChatEntry[] = [
  message('member-a-1', members.a, 20, '点头像或姓名可阅读个人空间，返回后继续停在这条记录。'),
  message('member-a-2', members.a, 21, '同一成员的连续消息保留作者与时间，不重复展示成员入口。'),
  message('member-b-1', members.b, 22, '我补充一段公开资料。双方的个人空间都可直接打开。'),
];
const team: ChatEntry[] = [
  ...pair,
  { id: 'event-member', kind: 'event', day: '今天 · 10 月 30 日', content: '10:23 · 成员 C 加入记录（合成事件）' },
  message('member-c-1', members.c, 24, '长名称应完整换行。资料身份与消息时间各自保留，事件没有成员链接。'),
  message('member-unknown', unknown, 25, '当前没有可用的个人空间地址，作者保持静态，不提供失效入口。'),
];
const remaining = Array.from({ length: 10 }, (_, index) => message(`member-record-${index}`, members[index % 2 ? 'a' : 'b'], 30 + index,
  `合成记录 ${index + 1}：公开资料的摘要与证据需要分别核对。保留已加载的历史，进入个人空间不会接受请求、发送消息或修改阅读状态。`));

function memberFromLocation() { return new URLSearchParams(location.search).get('member'); }
function preference(name: string, value: string) {
  const url = new URL(location.href); url.searchParams.set(name, value);
  history.replaceState(history.state, '', url);
}

/** Synthetic host navigation: data, route and return position belong to the host. */
export function ChatMemberLinkGallery({ initialScene = 'pair', initialAppearance = 'plain' }: { initialScene?: string; initialAppearance?: ChatThreadProps['appearance'] }) {
  const [scene, setScene] = useState(initialScene === 'team' ? 'team' : 'pair');
  const [appearance, setAppearance] = useState(initialAppearance);
  const [older, setOlder] = useState(false);
  const [profileId, setProfileId] = useState(memberFromLocation);
  const threadHost = useRef<HTMLDivElement>(null);
  const profileHeading = useRef<HTMLHeadingElement>(null);
  const returnPoint = useRef<{ scrollTop: number; triggerId: string } | null>(null);
  const lastProfile = useRef(profileId);
  const profile = profileId && Object.hasOwn(members, profileId) ? members[profileId] : undefined;
  useEffect(() => {
    const pop = () => setProfileId(memberFromLocation());
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useLayoutEffect(() => {
    if (profileId) { lastProfile.current = profileId; profileHeading.current?.focus({ preventScroll: true }); return; }
    const position = returnPoint.current;
    const viewport = threadHost.current?.querySelector<HTMLElement>('[role="region"]');
    if (!viewport) return;
    // A copied URL/new tab has no earlier chat position or originating control.
    if (!position) { if (lastProfile.current) viewport.focus({ preventScroll: true }); return; }
    viewport.scrollTop = position.scrollTop;
    // Focus capture also pauses following at the restored position.
    document.getElementById(position.triggerId)?.focus({ preventScroll: true });
  }, [profileId]);
  function returnToThread() {
    if (history.state?.rhineMemberDemo && returnPoint.current) { history.back(); return; }
    const url = new URL(location.href); url.searchParams.delete('member');
    history.replaceState(history.state, '', url); setProfileId(null);
  }
  const memberLink: NonNullable<ChatThreadProps['memberLink']> = (member, entry) => {
    if (!Object.hasOwn(members, member.id)) return undefined;
    const url = new URL(location.href); url.searchParams.set('member', member.id);
    return { href: `${url.pathname}${url.search}${url.hash}`, id: `member-author-${entry.id}`, 'aria-label': `查看${member.name}的个人空间`,
      onClick: event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.currentTarget.target && event.currentTarget.target !== '_self')) return;
        event.preventDefault();
        const viewport = threadHost.current?.querySelector<HTMLElement>('[role="region"]');
        returnPoint.current = { scrollTop: viewport?.scrollTop ?? 0, triggerId: event.currentTarget.id };
        history.pushState({ ...history.state, rhineMemberDemo: true }, '', event.currentTarget.href);
        setProfileId(member.id);
      },
    };
  };
  return <section data-member-demo className="member-link-gallery"><Stack gap={6}>
    <Toolbar title="成员个人空间" description="阅读成员资料后，回到原来的消息。全部内容为合成示例。" />
    <div ref={threadHost} data-member-thread-host hidden={!!profileId} inert={!!profileId}>
      <Stack gap={4}>
        <div className="member-link-controls">
          <Select label="成员导航场景" value={scene} onChange={event => { setScene(event.target.value); setOlder(false); returnPoint.current = null; preference('scene', event.target.value); }}><option value="pair">两成员对话</option><option value="team">群聊、事件与未知目标</option></Select>
          <Select label="成员导航外观" value={appearance} onChange={event => { setAppearance(event.target.value as 'plain' | 'bubble'); preference('appearance', event.target.value); }}><option value="plain">纯正文</option><option value="bubble">成员气泡</option></Select>
        </div>
        <ChatThread key={scene} label="成员导航聊天消息" entries={[...(older ? earlier : []), ...(scene === 'team' ? team : pair), ...remaining]} readOnly appearance={appearance}
          memberAppearance={{ a: { align: 'end', tone: 'strong' }, b: { align: 'start', tone: 'subtle' }, c: { align: 'start', tone: 'strong' } }}
          memberLink={memberLink} hasEarlier={!older} onLoadEarlier={() => setOlder(true)} />
      </Stack>
    </div>
    {profileId && <div data-member-profile><Surface><Stack gap={4}>
      <h2 ref={profileHeading} tabIndex={-1}>{profile ? `${profile.name}的个人空间` : '个人空间暂不可用'}</h2>
      <Text>{profile ? '河谷观察与资料整理。这里展示可阅读的合成个人资料，不执行成员操作。' : '这个地址没有可用的合成资料，可以返回聊天继续阅读。'}</Text>
      <Button variant="secondary" onClick={returnToThread}>返回聊天</Button>
    </Stack></Surface></div>}
  </Stack></section>;
}
