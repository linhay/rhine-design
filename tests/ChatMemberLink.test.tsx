import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ChatThread, type ChatEntry, type ChatMemberLink, type ChatMessage } from '../components';

const message = (id: string, minute: number, memberId = 'a', day = '今天'): ChatMessage => ({
  id, kind: 'message', day, time: `10:${minute}`, dateTime: `2026-10-30T10:${minute}:00+08:00`,
  member: { id: memberId, name: `成员 ${memberId}`, avatar: <svg data-testid={`avatar-${id}`} /> }, content: '正文',
});

it('links avatar and string name once in readOnly, keeping time and article identity separate', () => {
  const click = vi.fn(event => event.preventDefault());
  const entry = { ...message('first', 10), actions: <button>写入</button> };
  render(<ChatThread label="聊天" readOnly entries={[entry]} memberLink={() => ({
    href: '/members/a', id: 'author-first', 'aria-label': '查看成员 a 的资料', title: '成员资料', target: '_blank', rel: 'noopener', onClick: click,
  })} />);
  const link = screen.getByRole('link', { name: '查看成员 a 的资料' });
  expect(link).toHaveAttribute('href', '/members/a'); expect(link).toHaveAttribute('id', 'author-first');
  expect(link).toHaveAttribute('target', '_blank'); expect(link).toHaveAttribute('rel', 'noopener');
  expect(link).toHaveAttribute('title', '成员资料');
  expect(within(link).getByText('成员 a')).toBeVisible();
  const avatar = within(link).getByTestId('avatar-first');
  expect(avatar.parentElement).toHaveAttribute('aria-hidden', 'true');
  expect(link.querySelector('time')).toBeNull();
  expect(screen.getByRole('article', { name: '成员 a · 10:10' })).toBeVisible();
  fireEvent.click(screen.getByText('10:10')); expect(click).not.toHaveBeenCalled();
  fireEvent.click(avatar); fireEvent.click(within(link).getByText('成员 a')); expect(click).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('button', { name: '写入' })).toBeNull();
});

it('evaluates the pure mapping once per visible author render, never for continuations or events', () => {
  const entries: ChatEntry[] = [message('first', 10), message('continuation', 11),
    { id: 'event', kind: 'event', day: '今天', content: '成员加入' }, message('after-event', 12),
    message('after-gap', 20), message('after-day', 21, 'a', '明天'), message('other', 22, 'b')];
  const mapping = vi.fn((member, entry) => ({ href: `/members/${member.id}`, id: `author-${entry.id}` }));
  const { container, rerender } = render(<ChatThread label="聊天" entries={entries} memberLink={mapping} />);
  expect(mapping.mock.calls.map(([, entry]) => entry.id)).toEqual(['first', 'after-event', 'after-gap', 'after-day', 'other']);
  expect(mapping).toHaveBeenNthCalledWith(1, entries[0].kind === 'message' && entries[0].member, entries[0]);
  expect(screen.getAllByRole('link')).toHaveLength(5);
  expect(container.querySelector('.rhine-sr-only a')).toBeNull();
  expect(screen.getByRole('article', { name: '成员 a · 10:11' })).toHaveTextContent('成员 a');
  mapping.mockClear();
  rerender(<ChatThread label="聊天" entries={entries} memberLink={mapping} />);
  expect(mapping).toHaveBeenCalledTimes(5);
});

it('keeps defaults and unknown mappings static without manufacturing targets', () => {
  const entries = [message('first', 10), message('other', 12, 'b')];
  const { rerender } = render(<ChatThread label="聊天" entries={entries} />);
  expect(screen.queryByRole('link')).toBeNull();
  rerender(<ChatThread label="聊天" entries={entries} memberLink={member => member.id === 'a' ? { href: '/members/a' } : undefined} />);
  expect(screen.getAllByRole('link')).toHaveLength(1);
  expect(screen.getByText('成员 b')).toBeVisible();
  expect(screen.getByRole('article', { name: '成员 b · 10:12' }).querySelector('a')).toBeNull();
});

it('passes ordinary and modified click events through without cancelling native navigation', () => {
  const click = vi.fn();
  render(<ChatThread label="聊天" entries={[message('first', 10)]} memberLink={() => ({ href: '#member-a', onClick: click })} />);
  const link = screen.getByRole('link');
  for (const init of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }]) {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    expect(fireEvent(link, event)).toBe(true); expect(event.defaultPrevented).toBe(false);
  }
  expect(click).toHaveBeenCalledTimes(5);
});

// Type-only boundaries: callers supply navigation, never replace identity or tab semantics.
const valid: ChatMemberLink = { href: '/members/a' }; void valid;
// @ts-expect-error A native destination is required.
const missingHref: ChatMemberLink = { title: '成员' }; void missingHref;
// @ts-expect-error Children stay owned by ChatThread.
const children: ChatMemberLink = { href: '/', children: 'replacement' }; void children;
// @ts-expect-error Anchor keyboard semantics cannot be overridden through this mapping.
const tabIndex: ChatMemberLink = { href: '/', tabIndex: -1 }; void tabIndex;
// @ts-expect-error Preserve the native link role.
const role: ChatMemberLink = { href: '/', role: 'button' }; void role;
