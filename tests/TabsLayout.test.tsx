import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from '../components';

const items = [
  { value: 'a', label: '当前对象', content: <input aria-label="独立草稿" defaultValue="" /> },
  { value: 'disabled', label: '暂不可用', disabled: true, content: '禁用面板' },
  { value: 'b', label: '自定义范围与跨部门协作', content: '范围正文' },
];

describe('full-width content tabs', () => {
  it('preserves controlled selection, panel relationships and drafts across layout changes', () => {
    const changed = vi.fn();
    const { rerender } = render(<Tabs label="范围" fullWidth value="a" onValueChange={changed} items={items} />);
    const first = screen.getByRole('tab', { name: '当前对象' });
    const last = screen.getByRole('tab', { name: '自定义范围与跨部门协作' });
    fireEvent.change(screen.getByLabelText('独立草稿'), { target: { value: '合成草稿' } });
    fireEvent.click(last);
    expect(changed).toHaveBeenLastCalledWith('b');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', first.id);
    rerender(<Tabs label="范围" fullWidth layout="fill" value="b" onValueChange={changed} items={items} />);
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', last.getAttribute('aria-controls'));
    expect(screen.getByLabelText('独立草稿')).not.toBeVisible();
    rerender(<Tabs label="范围" fullWidth value="a" onValueChange={changed} items={items} />);
    expect(screen.getByLabelText('独立草稿')).toBeVisible();
    expect(screen.getByLabelText('独立草稿')).toHaveValue('合成草稿');
  });

  it('skips disabled items in both directions and wraps with Home and End available', () => {
    function Host() {
      const [value, setValue] = useState('a');
      return <Tabs label="范围" fullWidth value={value} onValueChange={setValue} items={items} />;
    }
    render(<Host />);
    const first = screen.getByRole('tab', { name: '当前对象' });
    const last = screen.getByRole('tab', { name: '自定义范围与跨部门协作' });
    first.focus();
    for (const [key, target] of [['ArrowLeft', last], ['ArrowRight', first], ['End', last], ['Home', first]] as const) {
      fireEvent.keyDown(document.activeElement!, { key });
      expect(target).toHaveFocus();
      expect(target).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', target.id);
    }
    fireEvent.click(screen.getByRole('tab', { name: '暂不可用' }));
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '暂不可用' })).toBeDisabled();
  });
});
