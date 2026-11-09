import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AgentRow, Composer, MessageBubble } from '../components';

describe('Chat Foundation primitives', () => {
  it('renders Agent status as text and exposes selected state', () => {
    const onSelect = vi.fn();
    render(<AgentRow identity={<strong>Research</strong>} preview="资料已准备好" status="ready" selected onSelect={onSelect} />);
    const row = screen.getByRole('button', { name: 'Research资料已准备好准备就绪' });
    expect(row).toHaveAttribute('aria-current', 'page');
    fireEvent.click(row);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('keeps message actions available to the host and renders quotes', () => {
    render(<MessageBubble author="Research" time="09:51" avatar={<span>R</span>} quote="来源仍未知" actions={<button type="button">复制</button>}>正文</MessageBubble>);
    expect(screen.getByText('正文').closest('article')).toHaveTextContent('Research');
    expect(screen.getByText('来源仍未知')).toBeVisible();
    expect(screen.getByRole('button', { name: '复制' })).toBeVisible();
  });

  it('submits on Enter, preserves Shift+Enter, and blocks empty drafts', () => {
    const onSubmit = vi.fn();
    render(<Composer value="hello" onChange={vi.fn()} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox', { name: '消息' });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });
    expect(onSubmit).toHaveBeenCalledOnce();
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('does not submit while busy and exposes an error as an alert', () => {
    const onSubmit = vi.fn();
    render(<Composer value="draft" onChange={vi.fn()} onSubmit={onSubmit} busy error="提交失败，草稿仍在输入框中。" />);
    expect(screen.getByRole('alert')).toHaveTextContent('提交失败');
    fireEvent.submit(screen.getByRole('button', { name: '发送消息' }).closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
