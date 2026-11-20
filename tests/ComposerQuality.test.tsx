import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from '../components';

describe('Composer input continuity', () => {
  it.each(['onKeyDown', 'onKeyDownCapture'] as const)('lets %s consume Enter without sending the draft', prop => {
    const choose = vi.fn(), send = vi.fn();
    const intercept = { [prop]: (event: { preventDefault: () => void }) => { event.preventDefault(); choose(); } };
    render(<Composer value="候选草稿" onChange={vi.fn()} onSubmit={send} {...intercept} />);
    fireEvent.keyDown(screen.getByRole('textbox', {name: '消息'}), {key: 'Enter'});
    expect(choose).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled();
  });
  it('preserves the edited draft and focus when a busy send fails', () => {
    const send = vi.fn();
    const view = (busy: boolean, error?: string) => <><Composer value="发送草稿" onChange={vi.fn()} onSubmit={send} busy={busy} error={error} /><button>外部操作</button></>;
    const {rerender} = render(view(false));
    const input = screen.getByRole('textbox', {name: '消息'});
    act(() => input.focus());
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(send).toHaveBeenCalledOnce();
    rerender(view(true));
    expect(input).toHaveFocus();
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    fireEvent.keyDown(input, {key:'Enter'});
    fireEvent.click(screen.getByRole('button', {name:'发送消息'}));
    expect(send).toHaveBeenCalledOnce();
    rerender(view(false, '稍后再试'));
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('readonly');
    expect(input).toHaveValue('发送草稿');
    expect(screen.getByRole('alert')).toHaveTextContent('稍后再试');
    rerender(view(true));
    const outside = screen.getByRole('button', {name:'外部操作'});
    act(() => outside.focus());
    rerender(view(false, '仍未发送'));
    expect(outside).toHaveFocus();
  });
});

describe('Composer one error source', () => {
  it('keeps the draft and describes one visible error', () => {
    render(<Composer value="原始草稿" onChange={vi.fn()} onSubmit={vi.fn()} error="提交失败，草稿保留。" hint="Enter发送" />);
    expect(screen.getAllByText('提交失败，草稿保留。')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: '消息' })).toHaveValue('原始草稿');
    expect(screen.getByRole('textbox', { name: '消息' })).toHaveAccessibleDescription('提交失败，草稿保留。');
    expect(screen.getByRole('alert')).toHaveTextContent('提交失败，草稿保留。');
  });
  it('restores the ordinary hint after an error clears', () => {
    const { rerender } = render(<Composer value="草稿" onChange={vi.fn()} onSubmit={vi.fn()} error="读取失败" hint="Enter发送" />);
    rerender(<Composer value="草稿" onChange={vi.fn()} onSubmit={vi.fn()} hint="Enter发送" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Enter发送')).toBeVisible();
    expect(screen.getByRole('textbox', { name: '消息' })).toHaveValue('草稿');
  });
});
