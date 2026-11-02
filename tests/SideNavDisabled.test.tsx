import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { SideNav } from '../components';

const groups = (disabled: boolean) => [{ label: '合成项目', items: [{ id: 'a', label: '可读名称', href: '#destination', disabled }] }];
it('removes disabled destinations and blocks primary, modified and auxiliary activation', () => {
  const navigate = vi.fn(), delegated = vi.fn();
  render(<div onClick={delegated} onAuxClick={delegated}><SideNav currentId="a" groups={groups(true)} onNavigate={navigate} /></div>);
  const link = screen.getByRole('link', { name: '可读名称' });
  expect(link).not.toHaveAttribute('href');
  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).toHaveAttribute('aria-current', 'page');
  expect(link.tabIndex).toBe(-1);
  for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) expect(fireEvent.click(link, modifiers)).toBe(false);
  expect(fireEvent(link, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))).toBe(false);
  expect(navigate).not.toHaveBeenCalled(); expect(delegated).not.toHaveBeenCalled();
  expect(fireEvent.contextMenu(link)).toBe(true);
});
it('retains the focused node and current identity through disable and re-enable', () => {
  const navigate = vi.fn();
  const { rerender } = render(<SideNav currentId="a" groups={groups(false)} onNavigate={navigate} />);
  const link = screen.getByRole('link', { name: '可读名称' }); link.focus();
  rerender(<SideNav currentId="a" groups={groups(true)} onNavigate={navigate} />);
  expect(link).toHaveFocus(); expect(link).not.toHaveAttribute('href'); expect(link.tabIndex).toBe(-1);
  fireEvent.click(link); expect(navigate).not.toHaveBeenCalled();
  rerender(<SideNav currentId="a" groups={groups(false)} onNavigate={navigate} />);
  expect(link).toHaveFocus(); expect(link).toHaveAttribute('href', '#destination'); expect(link.tabIndex).toBe(0);
  expect(link).not.toHaveAttribute('aria-disabled'); expect(link).toHaveAttribute('aria-current', 'page');
  for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) expect(fireEvent.click(link, modifiers)).toBe(true);
  expect(navigate).toHaveBeenCalledTimes(4);
  expect(fireEvent(link, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))).toBe(true);
  expect(fireEvent.contextMenu(link)).toBe(true);
});
