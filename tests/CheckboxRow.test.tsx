import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox, type CheckboxProps } from '../components';

describe('Checkbox row layout', () => {
  it('toggles once when the controlled checkbox description is clicked', () => {
    const change = vi.fn();
    function Example() {
      const [checked, setChecked] = useState(false);
      return <Checkbox layout="row" label="项目 A" hint="内存卡 · 14 项" checked={checked} onChange={event => { setChecked(event.target.checked); change(event.target.checked); }} />;
    }
    render(<Example />);
    const input = screen.getByRole('checkbox', { name: '项目 A' });
    expect(input).toHaveAccessibleDescription('内存卡 · 14 项');
    fireEvent.click(screen.getByText('内存卡 · 14 项'));
    expect(input).toBeChecked();
    expect(change).toHaveBeenCalledExactlyOnceWith(true);
  });
  it('keeps mixed and disabled states on the native input', () => {
    const change = vi.fn();
    const { rerender } = render(<Checkbox layout="row" label="全部" hint="三个项目" indeterminate disabled onChange={change} />);
    expect(screen.getByRole('checkbox')).toBePartiallyChecked();
    fireEvent.click(screen.getByText('三个项目'));
    expect(change).not.toHaveBeenCalled();
    rerender(<Checkbox layout="row" label="全部" checked disabled onChange={change} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('checkbox')).not.toBePartiallyChecked();
  });
  it('preserves native form submission and reset for uncontrolled selection', () => {
    render(<form aria-label="项目"><Checkbox layout="row" label="项目 A" name="source" value="a" defaultChecked /><button type="reset">重置</button></form>);
    const form = screen.getByRole('form') as HTMLFormElement;
    expect(new FormData(form).getAll('source')).toEqual(['a']);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(new FormData(form).getAll('source')).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
  it('preserves caller accessible names and combines descriptions', () => {
    const props: CheckboxProps = { layout: 'row', label: '名称', hint: '说明', 'aria-label': '自定义名称', 'aria-describedby': 'external' };
    render(<><span id="external">附加信息</span><Checkbox {...props} /></>);
    expect(screen.getByRole('checkbox', { name: '自定义名称' })).toHaveAccessibleDescription('附加信息 说明');
  });
  it('keeps the default form hint outside its original label', () => {
    const change = vi.fn();
    render(<Checkbox label="表单字段" hint="原布局" onChange={change} />);
    expect(screen.getByText('原布局').closest('label')).toBeNull();
    fireEvent.click(screen.getByText('原布局'));
    expect(change).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('表单字段'));
    expect(change).toHaveBeenCalledOnce();
  });
});
