import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button, Message, Notification, Tag, Toast } from '../components';

type Kind = 'toast' | 'message' | 'notification' | 'tag';
function Feedback({ kind, handoff = false, refuse = false }: { kind: Kind; handoff?: boolean; refuse?: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => { if (handoff) document.getElementById('host-target')?.focus(); if (!refuse) setOpen(false); };
  return <main aria-label="反馈任务" tabIndex={-1}>
    <Button onClick={() => setOpen(true)}>显示反馈</Button>
    {kind === 'toast' ? <Toast open={open} duration={0} onOpenChange={value => { if (!value) close(); }} title="演示反馈" /> : open && (kind === 'message' ? <Message title="演示反馈" onClose={close}>内容</Message> : kind === 'notification' ? <Notification title="演示反馈" description="内容" onClose={close} /> : <Tag onClose={close}>标签</Tag>)}
    <Button id="host-target">宿主目标</Button>
  </main>;
}
const settle = async () => { await act(async () => { await Promise.resolve(); }); };

describe('dismiss focus continuity', () => {
  it.each(['toast', 'message', 'notification', 'tag'] as const)('%s returns focused dismissal to its available origin', async kind => {
    render(<Feedback kind={kind} />);
    const origin = screen.getByRole('button', { name: '显示反馈' });
    act(() => origin.focus()); fireEvent.click(origin);
    const dismiss = screen.getByRole('button', { name: kind === 'toast' || kind === 'notification' ? '关闭通知' : kind === 'message' ? '关闭提示' : '移除标签' });
    act(() => dismiss.focus()); fireEvent.click(dismiss); await settle();
    expect(origin).toHaveFocus();
  });

  it.each(['toast', 'message', 'notification', 'tag'] as const)('%s respects a synchronous host handoff', async kind => {
    render(<Feedback kind={kind} handoff />);
    const origin = screen.getByRole('button', { name: '显示反馈' });
    act(() => origin.focus()); fireEvent.click(origin);
    const dismiss = screen.getByRole('button', { name: kind === 'toast' || kind === 'notification' ? '关闭通知' : kind === 'message' ? '关闭提示' : '移除标签' });
    act(() => dismiss.focus()); fireEvent.click(dismiss); await settle();
    expect(screen.getByRole('button', { name: '宿主目标' })).toHaveFocus();
  });

  it('keeps a refused dismiss focused and does not save an old focus intent', async () => {
    render(<Feedback kind="toast" refuse />);
    const origin = screen.getByRole('button', { name: '显示反馈' });
    act(() => origin.focus()); fireEvent.click(origin);
    const dismiss = screen.getByRole('button', { name: '关闭通知' });
    act(() => dismiss.focus()); fireEvent.click(dismiss); await settle();
    expect(dismiss).toHaveFocus();
    act(() => screen.getByRole('button', { name: '宿主目标' }).focus());
    await settle(); expect(screen.getByRole('button', { name: '宿主目标' })).toHaveFocus();
  });

  it('does not move an external focus when a nonfocused close is invoked', async () => {
    render(<Feedback kind="notification" />);
    fireEvent.click(screen.getByRole('button', { name: '显示反馈' }));
    const target = screen.getByRole('button', { name: '宿主目标' }); act(() => target.focus());
    fireEvent.click(screen.getByRole('button', { name: '关闭通知' })); await settle();
    expect(target).toHaveFocus();
  });

  it('moves a removed tag to the next local item without requiring an opener', async () => {
    function Tags() {
      const [tags, setTags] = useState(['甲', '乙']);
      return <div role="group" aria-label="标签集合" tabIndex={-1}>{tags.map(tag => <Tag key={tag} onClose={() => setTags(value => value.filter(item => item !== tag))}>{tag}</Tag>)}</div>;
    }
    render(<Tags />); const first = screen.getByRole('button', { name: '移除甲' });
    act(() => first.focus()); fireEvent.click(first); await settle();
    expect(screen.getByRole('button', { name: '移除乙' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: '移除乙' })); await settle();
    expect(screen.getByRole('group', { name: '标签集合' })).toHaveFocus();
  });
});
