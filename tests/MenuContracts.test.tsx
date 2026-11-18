import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../components/components';
import { Menu, type MenuCheckboxItem, type MenuEntry, type MenuRadioGroup } from '../components/Overlays';
import type { MenuItem } from '../components';
import { ConfigProvider } from '../components/config';

const trigger = () => screen.getByRole('button', { name: 'Open actions' });
const focus = (element: HTMLElement) => act(() => element.focus());
function openMenu() {
  fireEvent.keyDown(trigger(), { key: 'ArrowDown' });
  return screen.getByRole('menu', { name: 'Actions' });
}
const action = (id: string, label = id): MenuItem => ({ id, label, onSelect: vi.fn() });
const sorting = (onValueChange = vi.fn(), value = 'recent'): MenuRadioGroup => ({
  type: 'radio-group', id: 'sorting', label: 'Session sorting', value, onValueChange,
  items: [{ id: 'sort-recent', label: 'Recent', value: 'recent', icon: 'clock' }, { id: 'sort-name', label: 'Name', value: 'name' }],
});
const pinning = (onCheckedChange = vi.fn(), checked = false): MenuCheckboxItem => ({
  type: 'checkbox', id: 'pin', label: 'Pinned', checked, onCheckedChange,
});
function Fixture({ items, open, onOpenChange }: { items: readonly MenuEntry[]; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return <Menu trigger={<Button>Open actions</Button>} label="Actions" items={items} open={open} onOpenChange={onOpenChange} />;
}

describe('Menu structured entry contracts', () => {
  it('keeps readonly legacy actions, decorative icons, danger, selection, closing and real trigger focus', async () => {
    const select = vi.fn(), change = vi.fn();
    const items: readonly MenuItem[] = [{ id: 'export', label: 'Export', icon: 'export', danger: true, onSelect: select }];
    render(<Fixture items={items} onOpenChange={change} />);
    openMenu();
    const item = screen.getByRole('menuitem', { name: 'Export' });
    await waitFor(() => expect(item).toHaveFocus());
    expect(item).toHaveAttribute('data-danger', 'true');
    expect(item.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(select).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
    expect(change.mock.calls.map(([value]) => value)).toEqual([true, false]);
  });

  it.each(['', ' '])('keeps a unique blank legacy action id %j selectable', async id => {
    const select = vi.fn();
    render(<Fixture items={[{ id, label: 'Legacy action', onSelect: select }]} />);
    openMenu();
    const item = screen.getByRole('menuitem', { name: 'Legacy action' });
    await waitFor(() => expect(item).toHaveFocus());
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(select).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it.each(['command', 'group'] as const)('ignores legacy host type metadata %s', async type => {
    interface HostItem extends MenuItem { type: 'command' | 'group' }
    const legacy: HostItem = { id: 'legacy', type, label: 'Legacy host command', onSelect: vi.fn() };
    const items: readonly MenuItem[] = [legacy];
    render(<Fixture items={items} />);
    openMenu();
    const item = screen.getByRole('menuitem', { name: legacy.label });
    await waitFor(() => expect(item).toHaveFocus());
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(legacy.onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('names groups and skips separators, headings and disabled commands during keyboard navigation', async () => {
    const first = action('first', 'Copy'), last = action('last', 'Export');
    render(<Fixture items={[first, { type: 'separator', id: 'divider' }, { type: 'group', id: 'operations', label: 'Department operations', items: [
      { ...action('unavailable', 'Unavailable'), disabled: true }, last,
    ] }]} />);
    openMenu();
    const copy = screen.getByRole('menuitem', { name: 'Copy' }), exp = screen.getByRole('menuitem', { name: 'Export' });
    await waitFor(() => expect(copy).toHaveFocus());
    const group = screen.getByRole('group', { name: 'Department operations' });
    expect(within(group).getAllByRole('menuitem')).toHaveLength(2);
    const separator = screen.getByRole('separator');
    expect(separator).not.toHaveAttribute('tabindex');
    fireEvent.click(separator);
    expect(first.onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(copy, { key: 'ArrowDown' });
    await waitFor(() => expect(exp).toHaveFocus());
    fireEvent.keyDown(exp, { key: 'Home' });
    await waitFor(() => expect(copy).toHaveFocus());
    fireEvent.keyDown(copy, { key: 'End' });
    await waitFor(() => expect(exp).toHaveFocus());
    expect(last.onSelect).not.toHaveBeenCalled();
  });

  it('shows disabled reasons with stable descriptions while preserving each item name and blocking activation', () => {
    const select = vi.fn(), radio = vi.fn(), checkbox = vi.fn();
    const items: readonly MenuEntry[] = [
      { id: 'remove', label: 'Delete endpoint', icon: 'delete', danger: true, disabled: true, disabledReason: '至少保留一个通知端点。', onSelect: select },
      { ...sorting(radio), items: [{ id: 'sort-unavailable', label: 'Custom order', value: 'custom', disabled: true, disabledReason: '请先启用自定义排序。' }] },
      { ...pinning(checkbox), disabled: true, disabledReason: '当前会话不可置顶。' },
    ];
    const { rerender } = render(<Fixture open items={items} />);
    const cases = [
      ['menuitem', 'Delete endpoint', '至少保留一个通知端点。'],
      ['menuitemradio', 'Custom order', '请先启用自定义排序。'],
      ['menuitemcheckbox', 'Pinned', '当前会话不可置顶。'],
    ];
    const ids = cases.map(([role, name, reason]) => {
      const item = screen.getByRole(role, { name });
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).toHaveAccessibleName(name);
      expect(item).toHaveAccessibleDescription(reason);
      expect(screen.getByText(reason)).toBeVisible();
      fireEvent.click(item);
      fireEvent.keyDown(item, { key: 'Enter' });
      return item.getAttribute('aria-describedby');
    });
    expect(new Set(ids).size).toBe(3);
    rerender(<Fixture open items={[...items]} />);
    cases.forEach(([role, name], index) => expect(screen.getByRole(role, { name })).toHaveAttribute('aria-describedby', ids[index]!));
    expect(select).not.toHaveBeenCalled();
    expect(radio).not.toHaveBeenCalled();
    expect(checkbox).not.toHaveBeenCalled();
  });

  it('keeps exactly the host radio value after refused keyboard requests, then reflects an accepted value', async () => {
    const change = vi.fn(), opened = vi.fn();
    const { rerender } = render(<Fixture items={[sorting(change)]} onOpenChange={opened} />);
    openMenu();
    const recent = screen.getByRole('menuitemradio', { name: 'Recent' }), name = screen.getByRole('menuitemradio', { name: 'Name' });
    expect(screen.getByRole('group', { name: 'Session sorting' })).toContainElement(recent);
    await waitFor(() => expect(recent).toHaveFocus());
    fireEvent.keyDown(recent, { key: 'ArrowDown' });
    await waitFor(() => expect(name).toHaveFocus());
    fireEvent.keyDown(name, { key: 'Enter' });
    fireEvent.keyDown(name, { key: ' ' });
    expect(change.mock.calls).toEqual([['name'], ['name']]);
    expect(recent).toHaveAttribute('aria-checked', 'true');
    expect(name).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menu')).toBeVisible();
    expect(opened).not.toHaveBeenCalledWith(false);
    rerender(<Fixture items={[sorting(change, 'name')]} onOpenChange={opened} />);
    expect(name).toHaveFocus();
    expect(screen.getAllByRole('menuitemradio', { checked: true })).toEqual([name]);
    expect(recent).toHaveAttribute('aria-checked', 'false');
    expect(name.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps checkbox requests controlled for both keyboard and pointer activation', async () => {
    const change = vi.fn();
    const { rerender } = render(<Fixture items={[pinning(change)]} />);
    openMenu();
    const pin = screen.getByRole('menuitemcheckbox', { name: 'Pinned' });
    await waitFor(() => expect(pin).toHaveFocus());
    fireEvent.keyDown(pin, { key: ' ' });
    fireEvent.click(pin);
    expect(change.mock.calls).toEqual([[true], [true]]);
    expect(pin).toHaveAttribute('aria-checked', 'false');
    rerender(<Fixture items={[pinning(change, true)]} />);
    expect(pin).toHaveAttribute('aria-checked', 'true');
    expect(pin).toHaveFocus();
    fireEvent.keyDown(pin, { key: 'Enter' });
    expect(change).toHaveBeenLastCalledWith(false);
    expect(pin).toHaveAttribute('aria-checked', 'true');
  });

  it('does not invent a current radio item when the host value was removed or is unknown', () => {
    const change = vi.fn();
    const { rerender } = render(<Fixture open items={[sorting(change)]} />);
    const group = sorting(change);
    rerender(<Fixture open items={[{ ...group, items: group.items.filter(item => item.value !== 'recent') }]} />);
    expect(screen.queryByRole('menuitemradio', { checked: true })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'false');
    rerender(<Fixture open items={[sorting(change, 'unknown')]} />);
    expect(screen.queryByRole('menuitemradio', { checked: true })).not.toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it('uses current action, radio and checkbox callbacks after a live update', () => {
    const previous = vi.fn(), current = vi.fn();
    const entries = (callback: typeof current): readonly MenuEntry[] => [
      { id: 'copy', label: 'Copy', onSelect: callback }, sorting(callback), pinning(callback),
    ];
    const { rerender } = render(<Fixture open items={entries(previous)} />);
    rerender(<Fixture open items={entries(current)} />);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Name' }));
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Pinned' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(previous).not.toHaveBeenCalled();
    expect(current.mock.calls).toEqual([['name'], [true], []]);
  });

  it('moves focus when the focused action becomes disabled or is deleted, without running it', async () => {
    const first = action('first', 'First'), second = action('second', 'Second'), third = action('third', 'Third');
    const { rerender } = render(<Fixture items={[first, second, third]} />);
    openMenu();
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'First' })).toHaveFocus());
    const firstNode = screen.getByRole('menuitem', { name: 'First' });
    rerender(<Fixture items={[third, first, second]} />);
    expect(screen.getByRole('menuitem', { name: 'First' })).toBe(firstNode);
    expect(firstNode).toHaveFocus();
    rerender(<Fixture items={[third, { ...first, disabled: true }, second]} />);
    expect(screen.getByRole('menuitem', { name: 'Second' })).toHaveFocus();
    rerender(<Fixture items={[{ ...first, disabled: true }, third]} />);
    expect(screen.getByRole('menuitem', { name: 'Third' })).toHaveFocus();
    rerender(<Fixture items={[{ ...first, disabled: true }]} />);
    expect(screen.getByRole('menu')).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Enter' });
    expect(first.onSelect).not.toHaveBeenCalled();
    expect(second.onSelect).not.toHaveBeenCalled();
    expect(third.onSelect).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('repairs a focused radio disabled by an external update while preserving the controlled current item', async () => {
    const change = vi.fn();
    const { rerender } = render(<Fixture items={[sorting(change)]} />);
    openMenu();
    const recent = screen.getByRole('menuitemradio', { name: 'Recent' });
    await waitFor(() => expect(recent).toHaveFocus());
    const group = sorting(change);
    rerender(<Fixture items={[{ ...group, items: group.items.map(item => ({ ...item, disabled: item.value === 'recent' })) }]} />);
    expect(recent).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveFocus();
    fireEvent.click(recent);
    expect(change).not.toHaveBeenCalled();
  });

  it('honors controlled open rejection and returns focus only after the host accepts closing', async () => {
    const change = vi.fn();
    const { rerender } = render(<Fixture open items={[action('copy', 'Copy')]} onOpenChange={change} />);
    const copy = screen.getByRole('menuitem', { name: 'Copy' });
    focus(copy);
    fireEvent.keyDown(copy, { key: 'Escape' });
    expect(change).toHaveBeenCalledWith(false);
    expect(screen.getByRole('menu')).toBeVisible();
    expect(copy).toHaveFocus();
    rerender(<Fixture open={false} items={[action('copy', 'Copy')]} onOpenChange={change} />);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('honors an explicit close-focus handoff instead of restoring the old trigger', async () => {
    const closeFocus = vi.fn((event: Event) => {
      event.preventDefault();
      document.getElementById('menu-next')?.focus();
    });
    function Host() {
      const [open, setOpen] = useState(false);
      return <><Button id="menu-next">Next task</Button><Menu label="Actions" trigger={<Button>Open actions</Button>} open={open} onOpenChange={setOpen} onCloseAutoFocus={closeFocus} items={[
        { id: 'next', label: 'Continue', onSelect: vi.fn() },
      ]} /></>;
    }
    render(<Host />);
    openMenu();
    const item = screen.getByRole('menuitem', { name: 'Continue' });
    await waitFor(() => expect(item).toHaveFocus());
    fireEvent.keyDown(item, { key: 'Enter' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next task' })).toHaveFocus());
    expect(closeFocus).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('retains the nearest theme portal and provider density for structured items', () => {
    render(<ConfigProvider density="compact"><div className="rhine-theme" data-testid="menu-theme"><Fixture open items={[sorting()]} /></div></ConfigProvider>);
    const menu = screen.getByRole('menu');
    expect(screen.getByTestId('menu-theme')).toContainElement(menu);
    expect(menu).toHaveAttribute('data-rhine-density', 'compact');
  });

  it('rejects duplicate ids across groups and options, and duplicate radio values', () => {
    expect(() => render(<Fixture items={[action('sort-recent'), sorting()]} />)).toThrow('Menu ids must be unique');
    expect(() => render(<Fixture items={[action('', 'First'), action('', 'Duplicate')]} />)).toThrow('Menu ids must be unique');
    expect(() => render(<Fixture items={[{ id: ' ', type: 'separator' }]} />)).toThrow('Structured menu ids must be nonempty');
    const group = sorting();
    expect(() => render(<Fixture items={[{ ...group, items: group.items.map(item => ({ ...item, value: 'same' })) }]} />)).toThrow('Menu radio values must be nonempty and unique');
  });
});
