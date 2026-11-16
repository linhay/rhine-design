import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Collapse, Dropdown, Form, Popconfirm } from '../components';

describe('parity components', () => {
  it('submits a form without clearing fields', () => {
    const submitted = viSubmit();
    render(<Form label="示例表单" onSubmit={submitted.fn}><input aria-label="名称" defaultValue="研究" /><button type="submit">提交</button></Form>);
    fireEvent.click(screen.getByRole('button', { name: '提交' }));
    expect(submitted.calls).toBe(1);
    expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('研究');
  });

  it('closes a dropdown after selection and confirms in place', async () => {
    function Demo() {
      const [value, setValue] = useState('未确认');
      return <><Dropdown label="更多操作" items={[{ id: 'copy', label: '复制' }]} onSelect={() => setValue('已选择')} /><Popconfirm label="移除示例" title="确认移除？" onConfirm={() => setValue('已确认')} /><span>{value}</span></>;
    }
    render(<Demo />);
    fireEvent.keyDown(screen.getByRole('button', { name: '更多操作' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('menuitem', { name: '复制' }));
    expect(screen.getByText('已选择')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '移除示例' }));
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(screen.getByText('已确认')).toBeInTheDocument();
  });

  it('keeps only one collapse panel open in accordion mode', () => {
    render(<Collapse label="说明" accordion items={[{ id: 'a', title: '第一组', content: <p>甲</p> }, { id: 'b', title: '第二组', content: <p>乙</p> }]} />);
    expect(screen.getByText('甲')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '第二组' }));
    expect(screen.getByText('乙')).toBeInTheDocument();
    expect(screen.queryByText('甲')).not.toBeInTheDocument();
  });
});

function viSubmit() {
  const state = { calls: 0, fn() { state.calls += 1; } };
  return state;
}
