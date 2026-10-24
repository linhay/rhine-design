import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DateRangeFilterExample } from '../preview/DateRangeFilterGallery';

function demo(props = {}) {
  render(<div className="rhine-theme"><DateRangeFilterExample {...props} /></div>);
}
const trigger = () => screen.getByRole('button', { name: /时间范围：.+选择日期/ });
async function open() {
  trigger().focus(); fireEvent.click(trigger());
  return screen.findByRole('dialog', { name: '时间范围设置' });
}

describe('date range filtering composition', () => {
  it('applies a quick preset immediately and always displays its dates', () => {
    demo();
    fireEvent.click(screen.getByRole('radio', { name: '昨天' }));
    expect(screen.getByRole('radio', { name: '昨天' })).toBeChecked();
    expect(trigger()).toHaveTextContent('2026-10-23 — 2026-10-23');
    expect(screen.getByRole('status')).toHaveTextContent('本次操作 1 次');
  });

  it('keeps edits as drafts, discards cancellation and restores trigger focus', async () => {
    demo(); const dialog = await open();
    fireEvent.change(within(dialog).getByLabelText('开始日期'), { target: { value: '2026-10-01' } });
    expect(screen.getByRole('status')).toHaveTextContent('2026-10-24 — 2026-10-24 · 本次操作 0 次');
    fireEvent.click(within(dialog).getByRole('button', { name: '取消' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
    const reopened = await open();
    expect(within(reopened).getByLabelText('开始日期')).toHaveValue('2026-10-24');
  });

  it('does not commit on Escape or the overlay close button', async () => {
    demo();
    for (const close of ['escape', 'button']) {
      const dialog = await open();
      fireEvent.change(within(dialog).getByLabelText('开始日期'), { target: { value: '2026-10-02' } });
      if (close === 'escape') fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
      else fireEvent.click(within(dialog).getByRole('button', { name: '关闭详情' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent('本次操作 0 次');
      await waitFor(() => expect(trigger()).toHaveFocus());
    }
  });

  it('blocks incomplete, reversed and out-of-range dates before applying one valid range', async () => {
    demo(); const dialog = await open();
    const start = within(dialog).getByLabelText('开始日期'), end = within(dialog).getByLabelText('结束日期');
    const apply = within(dialog).getByRole('button', { name: '应用日期' });
    for (const [from, to] of [['', '2026-10-24'], ['2026-10-24', ''], ['2026-10-25', '2026-10-24'], ['2024-12-31', '2026-10-24'], ['2026-10-24', '2027-01-01']]) {
      fireEvent.change(start, { target: { value: from } });
      fireEvent.change(end, { target: { value: to } });
      expect(apply).toBeDisabled();
      fireEvent.submit(apply.closest('form')!);
      expect(screen.getByRole('status')).toHaveTextContent('本次操作 0 次');
    }
    fireEvent.change(start, { target: { value: '2025-12-28' } });
    fireEvent.change(end, { target: { value: '2026-01-06' } });
    await waitFor(() => expect(apply).toBeEnabled());
    fireEvent.click(apply);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('status')).toHaveTextContent('2025-12-28 — 2026-01-06 · 本次操作 1 次');
    expect(screen.getAllByRole('radio').every(radio => !(radio as HTMLInputElement).checked)).toBe(true);
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('applies additional presets immediately instead of submitting an unfinished draft', async () => {
    demo(); const dialog = await open();
    fireEvent.change(within(dialog).getByLabelText('开始日期'), { target: { value: '' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '最近 30 天' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger()).toHaveTextContent('2026-09-25 — 2026-10-24');
    expect(screen.getByRole('status')).toHaveTextContent('本次操作 1 次');
  });

  it('keeps a disabled range readable and prevents all entry points', () => {
    demo({ disabled: true });
    expect(trigger()).toBeDisabled();
    expect(screen.getAllByRole('radio').every(radio => (radio as HTMLInputElement).disabled)).toBe(true);
    fireEvent.click(trigger());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('2026-10-24 — 2026-10-24 · 本次操作 0 次');
  });
});
