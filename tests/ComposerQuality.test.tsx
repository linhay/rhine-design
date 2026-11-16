import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Composer } from '../components';

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
