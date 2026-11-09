import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IconButton, Inline, Tabs, TextField } from '../components';
import { SummaryTabsGallery } from '../preview/SummaryTabsGallery';

describe('Tabs header actions', () => {
  it('restores an available showcase tab when disabling the selected collaborator and preserves both drafts', () => {
    render(<SummaryTabsGallery/>);
    const list = screen.getByRole('tablist', { name: '栏内操作示例' });
    const project = within(list).getByRole('tab', { name: '项目' });
    const team = within(list).getByRole('tab', { name: '协作' });
    fireEvent.change(screen.getByRole('textbox', { name: '项目操作草稿' }), { target: { value: '项目草稿' } });
    fireEvent.click(team);
    fireEvent.change(screen.getByRole('textbox', { name: '协作操作草稿' }), { target: { value: '协作草稿' } });
    fireEvent.change(screen.getByRole('combobox', { name: '摘要页签场景' }), { target: { value: 'disabled' } });
    expect(project).toHaveAttribute('aria-selected', 'true');
    expect(project).toHaveAttribute('tabindex', '0');
    expect(team).toBeDisabled();
    expect(team).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('textbox', { name: '项目操作草稿' })).toHaveValue('项目草稿');
    project.focus();
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      fireEvent.keyDown(project, { key });
      expect(project).toHaveFocus();
      expect(project).toHaveAttribute('aria-selected', 'true');
    }
    fireEvent.change(screen.getByRole('combobox', { name: '摘要页签场景' }), { target: { value: 'normal' } });
    fireEvent.click(team);
    expect(screen.getByRole('textbox', { name: '协作操作草稿' })).toHaveValue('协作草稿');
    fireEvent.click(project);
    expect(screen.getByRole('textbox', { name: '项目操作草稿' })).toHaveValue('项目草稿');
  });

  it('keeps real panel drafts and action keyboard handling separate from tab selection', () => {
    const created = vi.fn();
    function Example() {
      const [value, setValue] = useState('one');
      return <Tabs label="项目" value={value} onValueChange={setValue} actions={<Inline style={{ gap: 0 }}><IconButton label="新建项目" icon="plus" onClick={created}/><IconButton label="刷新项目" icon="refresh"/></Inline>} items={[
        { value: 'one', label: '项目一', content: <TextField label="项目一草稿"/> },
        { value: 'disabled', label: '不可用', disabled: true, content: null },
        { value: 'two', label: '项目二', content: <TextField label="项目二草稿"/> },
      ]}/>;
    }
    render(<Example/>);
    const list = screen.getByRole('tablist', { name: '项目' });
    const actions = screen.getByRole('group', { name: '项目操作' });
    expect(within(list).queryByRole('button', { name: '新建项目' })).not.toBeInTheDocument();
    expect(actions.parentElement).toContainElement(list);
    fireEvent.change(screen.getByRole('textbox', { name: '项目一草稿' }), { target: { value: '保留草稿' } });
    const one = screen.getByRole('tab', { name: '项目一' });
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: '项目二' })).toHaveAttribute('aria-selected', 'true');
    const add = screen.getByRole('button', { name: '新建项目' });
    fireEvent.keyDown(add, { key: 'Home' });
    fireEvent.click(add);
    expect(created).toHaveBeenCalledOnce();
    expect(screen.getByRole('tab', { name: '项目二' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(one);
    expect(screen.getByRole('textbox', { name: '项目一草稿' })).toHaveValue('保留草稿');
    expect(screen.getByRole('tabpanel', { name: '项目一' })).toContainElement(screen.getByRole('textbox', { name: '项目一草稿' }));
  });

  it('preserves the old direct tablist/panel DOM when actions are absent', () => {
    const { rerender } = render(<Tabs label="普通" className="host" value="one" onValueChange={() => {}} items={[{ value: 'one', label: '一', content: '正文' }]}/>);
    expect(screen.getByRole('tabpanel').previousElementSibling).toBe(screen.getByRole('tablist'));
    expect(screen.getByRole('tablist').parentElement).toHaveClass('host');
    rerender(<Tabs label="普通" value="one" onValueChange={() => {}} actions={false} items={[{ value: 'one', label: '一', content: '正文' }]}/>);
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('keeps an icon action focusable and inert while busy, with its ref and label intact', () => {
    const click = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    const { rerender } = render(<IconButton ref={ref} label="刷新" icon="refresh" onClick={click}/>);
    const button = screen.getByRole('button', { name: '刷新' });
    button.focus();
    rerender(<IconButton ref={ref} label="刷新" icon="refresh" busy onClick={click}/>);
    expect(ref.current).toBe(button);
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(click).not.toHaveBeenCalled();
    rerender(<IconButton ref={ref} label="刷新" icon="refresh" onClick={click}/>);
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
  });
});
