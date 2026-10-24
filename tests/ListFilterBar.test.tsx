import { useEffect, useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, ListFilterBar, Select, TextField, type ListFilterField } from '../components';

const label = '记录筛选';
const selection = (id: string, fieldLabel: string): ListFilterField => ({
  id, label: fieldLabel,
  control: <Select label={fieldLabel} defaultValue="all"><option value="all">全部</option><option value="selected">选中项</option></Select>,
});
const theme = (children: React.ReactNode) => <div className="rhine-theme" data-rhine-theme="neo-brutalism" data-rhine-motion="reduced">{children}</div>;

async function openFilters() {
  const trigger = screen.getByRole('button', { name: /^更多筛选/ });
  trigger.focus();
  fireEvent.click(trigger);
  return { trigger, dialog: await screen.findByRole('dialog', { name: label }) };
}

describe('ListFilterBar', () => {
  it('keeps focus on the filter region when the last removable summary has no focusable field', () => {
    function Example() {
      const [active, setActive] = useState(true);
      return <ListFilterBar label={label} primary={[{ id: 'fixed', label: '固定范围', control: <span>只读范围</span>, activeLabel: active ? '本周' : undefined, onClear: () => setActive(false) }]} />;
    }
    const { container } = render(<Example />);
    const chip = screen.getByRole('button', { name: '清除固定范围：本周' });
    chip.focus(); fireEvent.click(chip);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('.rhine-list-filter-bar')).toHaveFocus();
  });

  it('limits primary controls to two and keeps overflow in the same themed drawer', async () => {
    render(theme(<ListFilterBar label={label} primary={[selection('state', '状态'), selection('sort', '排序'), selection('length', '长度')]} filters={[selection('owner', '人员')]} />));
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(screen.queryByRole('combobox', { name: '长度' })).not.toBeInTheDocument();
    const { dialog } = await openFilters();
    expect(within(dialog).getAllByRole('combobox')).toHaveLength(2);
    expect(within(dialog).getByRole('combobox', { name: '长度' })).toHaveValue('all');
    expect(within(dialog).getByRole('combobox', { name: '人员' })).toHaveValue('all');
    expect(dialog.closest('.rhine-theme')).toHaveAttribute('data-rhine-theme', 'neo-brutalism');
    expect(dialog.closest('.rhine-theme')).toHaveAttribute('data-rhine-motion', 'reduced');
    expect(document.querySelectorAll('select')).toHaveLength(4);
  });

  it('does not move or remount primary fields when the container changes width', () => {
    const mounted = vi.fn(), unmounted = vi.fn();
    function LocalField() {
      useEffect(() => { mounted(); return unmounted; }, []);
      return <TextField label="本地输入" defaultValue="保留草稿" />;
    }
    const field = { id: 'local', label: '本地输入', control: <LocalField /> };
    const { rerender } = render(theme(<div style={{ width: 1000 }}><ListFilterBar label={label} primary={[field]} /></div>));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '尚未提交' } });
    input.focus();
    rerender(theme(<div style={{ width: 320 }}><ListFilterBar label={label} primary={[field]} /></div>));
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveValue('尚未提交');
    expect(input).toHaveFocus();
    expect(mounted).toHaveBeenCalledTimes(1);
    expect(unmounted).not.toHaveBeenCalled();
  });

  it('forwards controlled search and composition events without trimming or another query state', () => {
    const changed = vi.fn(), start = vi.fn(), end = vi.fn();
    function Example() {
      const [query, setQuery] = useState('');
      return <ListFilterBar label={label} search={{ label: '搜索记录', value: query, onChange: event => { changed(event.target.value); setQuery(event.target.value); }, onCompositionStart: start, onCompositionEnd: end, maxLength: 80, placeholder: '输入关键词' }} />;
    }
    render(theme(<Example />));
    const input = screen.getByRole('searchbox', { name: '搜索记录' });
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '  中文草稿  ' } });
    expect(input).toHaveValue('  中文草稿  ');
    expect(changed).toHaveBeenCalledWith('  中文草稿  ');
    fireEvent.compositionEnd(input);
    expect(start).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
    expect(input).toHaveAttribute('maxlength', '80');
    expect(screen.queryByRole('button', { name: /^更多筛选/ })).not.toBeInTheDocument();
  });

  it('applies host changes immediately and closing the drawer does not undo them', async () => {
    const changes = vi.fn(), reset = vi.fn();
    function Example() {
      const [value, setValue] = useState('all');
      return <ListFilterBar label={label} onReset={reset} result={value === 'all' ? '12 条结果' : '3 条结果'} filters={[{
        id: 'state', label: '状态', activeLabel: value === 'all' ? undefined : '选中项',
        control: <Select label="状态" value={value} onChange={event => { setValue(event.target.value); changes(event.target.value); }}><option value="all">全部</option><option value="selected">选中项</option></Select>,
      }]} />;
    }
    render(theme(<Example />));
    const { dialog, trigger } = await openFilters();
    fireEvent.change(within(dialog).getByRole('combobox', { name: '状态' }), { target: { value: 'selected' } });
    expect(changes).toHaveBeenCalledWith('selected');
    expect(within(dialog).getByRole('status')).toHaveTextContent('3 条结果');
    expect(within(dialog).queryByRole('button', { name: /应用|取消/ })).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(reset).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('3 条结果');
    const reopened = await openFilters();
    expect(within(reopened.dialog).getByRole('combobox', { name: '状态' })).toHaveValue('selected');
  });

  it('only summarizes explicit active labels and offers reset for an active search', () => {
    const reset = vi.fn(), field = selection('state', '状态');
    const { rerender } = render(theme(<ListFilterBar label={label} primary={[field]} onReset={reset} />));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'selected' } });
    expect(screen.queryByRole('group', { name: '已选条件' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '重置筛选' })).not.toBeInTheDocument();
    rerender(theme(<ListFilterBar label={label} primary={[{ ...field, activeLabel: ' ' }]} onReset={reset} search={{ label: '搜索', value: '真实查询', readOnly: true }} />));
    expect(screen.getByRole('button', { name: '重置筛选' })).toBeVisible();
    expect(screen.queryByText('搜索：真实查询')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重置筛选' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('keeps full active labels available and returns focus to a field when its chip is cleared', () => {
    const longLabel = '跨部门体验与可访问性协作组'.repeat(12);
    function Example() {
      const [active, setActive] = useState(true);
      return <ListFilterBar label={label} primary={[{ ...selection('team', '团队'), activeLabel: active ? longLabel : undefined, onClear: () => setActive(false) }]} />;
    }
    render(theme(<Example />));
    const chip = screen.getByRole('button', { name: `清除团队：${longLabel}` });
    expect(chip).toHaveTextContent(longLabel);
    chip.focus();
    fireEvent.click(chip);
    expect(screen.queryByRole('button', { name: /^清除团队/ })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '团队' })).toHaveFocus();
  });

  it('shows non-clearable summaries without inventing an action', () => {
    render(theme(<ListFilterBar label={label} primary={[{ ...selection('scope', '范围'), activeLabel: '团队范围' }]} />));
    expect(screen.getByText('范围：团队范围')).toBeVisible();
    expect(screen.queryByRole('button', { name: /^清除/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '重置筛选' })).not.toBeInTheDocument();
  });

  it('shows pending, accepted results and failures inside the modal without disabling correction', async () => {
    const props = { label, filters: [selection('state', '状态')], result: '上次结果 12 条' };
    const { rerender } = render(theme(<ListFilterBar {...props} pending />));
    const { dialog } = await openFilters();
    expect(within(dialog).getByRole('status')).toHaveTextContent('正在更新结果…');
    expect(within(dialog).getByRole('status')).toHaveTextContent('上次结果 12 条');
    expect(within(dialog).getByRole('combobox')).toBeEnabled();
    rerender(theme(<ListFilterBar {...props} error="连接暂不可用，请重试。" />));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('连接暂不可用，请重试。');
    expect(within(dialog).queryByText('正在更新结果…')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('combobox')).toBeEnabled();
    rerender(theme(<ListFilterBar {...props} result="8 条结果" />));
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(within(dialog).getByRole('status')).toHaveTextContent('8 条结果');
  });

  it('lets host reset query and all fields without closing the drawer or losing focus', async () => {
    function Example() {
      const [query, setQuery] = useState('关键词'), [state, setState] = useState('selected');
      return <ListFilterBar label={label} search={{ label: '搜索', value: query, onChange: event => setQuery(event.target.value) }}
        onReset={() => { setQuery(''); setState('all'); }}
        filters={[{ id: 'state', label: '状态', activeLabel: state === 'all' ? undefined : '选中项', control: <Select label="状态" value={state} onChange={event => setState(event.target.value)}><option value="all">全部</option><option value="selected">选中项</option></Select> }]} />;
    }
    render(theme(<Example />));
    const { dialog } = await openFilters();
    const reset = within(dialog).getByRole('button', { name: '重置筛选' });
    reset.focus();
    fireEvent.click(reset);
    expect(within(dialog).getByRole('combobox')).toHaveValue('all');
    expect(within(dialog).getByRole('combobox')).toHaveFocus();
    expect(within(dialog).queryByRole('button', { name: '重置筛选' })).not.toBeInTheDocument();
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.queryByRole('button', { name: '重置筛选' })).not.toBeInTheDocument();
  });

  it('preserves refresh busy focus and disables it independently of the one business action', () => {
    const refresh = vi.fn(), action = vi.fn();
    const props = { label, action: <Button onClick={action}>审查设置</Button> };
    const { rerender } = render(theme(<ListFilterBar {...props} refresh={{ onClick: refresh }} />));
    const button = screen.getByRole('button', { name: '刷新' });
    button.focus();
    rerender(theme(<ListFilterBar {...props} refresh={{ onClick: refresh, busy: true }} />));
    fireEvent.click(button);
    expect(refresh).not.toHaveBeenCalled();
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(screen.getByRole('button', { name: '审查设置' }));
    expect(action).toHaveBeenCalledTimes(1);
    rerender(theme(<ListFilterBar {...props} refresh={{ onClick: refresh, disabled: true }} />));
    expect(button).toBeDisabled();
    expect(screen.getByRole('button', { name: '审查设置' })).toBeEnabled();
  });
});
