import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../components/theme';
import { ResidentTree, ResidentTreeWorkspace, syntheticNodes, type BrowseNode } from '../preview/ResidentTreeRecipe';

const nodes = syntheticNodes('alpha');
function TreeHarness({ data = nodes }: { data?: BrowseNode[] }) {
  const [expanded, setExpanded] = useState(new Set(nodes.map(node => node.id)));
  const [selected, setSelected] = useState<string | null>('alpha-root');
  return <><ResidentTree nodes={data} selected={selected} hovered={null} expanded={expanded} updated={null} onExpanded={setExpanded} onSelect={setSelected} onHover={() => {}} /><button>外部动作</button></>;
}
const row = (id: string) => document.querySelector<HTMLElement>(`[data-node-id="${id}"]`)!;
afterEach(() => vi.useRealTimers());
describe('resident browsing tree recipe', () => {
  it('moves a single focus stop independently of controlled selection; collapse and parent navigation do not select', () => {
    render(<TreeHarness />);
    expect(document.querySelectorAll('[role=treeitem][tabindex="0"]')).toHaveLength(1);
    expect(row('alpha-depth-6')).toHaveAttribute('aria-level', '8');
    expect(row('alpha-item-13')).toHaveAttribute('aria-posinset', '15');
    expect(row('alpha-item-13')).toHaveAttribute('aria-setsize', '15');
    act(() => row('alpha-root').focus());
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(row('alpha-depth-0')).toHaveFocus();
    expect(row('alpha-root')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(row('alpha-depth-0')).toHaveAttribute('aria-expanded', 'false');
    expect(row('alpha-depth-1')).toBeNull();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    expect(row('alpha-root')).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(row('alpha-depth-0')).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
    expect(row('alpha-depth-1')).not.toBeNull();
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(row('alpha-item-13')).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: ' ' });
    expect(row('alpha-item-13')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(row('alpha-root')).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' });
    expect(row('alpha-root')).toHaveAttribute('aria-selected', 'true');
  });
  it('recovers a deleted focused node to its surviving parent, preserves external focus and stable DOM on refresh', () => {
    const { rerender } = render(<TreeHarness />);
    act(() => row('alpha-depth-6').focus());
    rerender(<TreeHarness data={nodes.filter(node => node.id !== 'alpha-depth-6')} />);
    expect(row('alpha-depth-5')).toHaveFocus();
    const stable = row('alpha-depth-5');
    rerender(<TreeHarness data={nodes.filter(node => node.id !== 'alpha-depth-6').map(node => ({ ...node, label: `${node.label} 更新` }))} />);
    expect(row('alpha-depth-5')).toBe(stable);
    expect(stable).toHaveFocus();
    act(() => screen.getByRole('button', { name: '外部动作' }).focus());
    rerender(<TreeHarness data={[]} />);
    expect(screen.getByRole('button', { name: '外部动作' })).toHaveFocus();
    expect(screen.getByRole('tree')).toHaveAttribute('tabindex', '0');
  });
  it('restores tree focus to the empty root when every node disappears, then to a new target', () => {
    const { rerender } = render(<TreeHarness />);
    act(() => row('alpha-root').focus());
    rerender(<TreeHarness data={[]} />);
    expect(screen.getByRole('tree')).toHaveFocus();
    rerender(<TreeHarness data={syntheticNodes('beta')} />);
    expect(row('beta-root')).toHaveFocus();
  });
  it('releases focus ownership on explicit blur, external pointer and window blur', () => {
    const { rerender } = render(<TreeHarness />);
    act(() => row('alpha-depth-6').focus());
    act(() => row('alpha-depth-6').blur());
    rerender(<TreeHarness data={nodes.filter(node => node.id !== 'alpha-depth-6')} />);
    expect(row('alpha-depth-5')).not.toHaveFocus();
    act(() => row('alpha-depth-5').focus());
    fireEvent.pointerDown(screen.getByRole('button', { name: '外部动作' }));
    rerender(<TreeHarness data={nodes.filter(node => !['alpha-depth-5', 'alpha-depth-6'].includes(node.id))} />);
    expect(row('alpha-depth-4')).not.toHaveFocus();
    act(() => row('alpha-depth-4').focus());
    fireEvent(window, new Event('blur'));
    rerender(<TreeHarness data={[]} />);
    expect(screen.getByRole('tree')).not.toHaveFocus();
  });
  it('cleans pending refresh and active one-second update timers on unmount', () => {
    vi.useFakeTimers();
    for (const elapsed of [0, 500]) {
      const { unmount } = render(<ThemeProvider><ResidentTreeWorkspace /></ThemeProvider>);
      fireEvent.click(screen.getByRole('button', { name: '刷新快照' }));
      act(() => vi.advanceTimersByTime(elapsed));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      unmount();
      expect(vi.getTimerCount()).toBe(0);
    }
  });
  it('keeps a fixed target across canvas changes, retains failed snapshots, and cancels stale refresh/update timers', () => {
    vi.useFakeTimers();
    const { unmount } = render(<ThemeProvider><ResidentTreeWorkspace /></ThemeProvider>);
    fireEvent.click(screen.getByRole('button', { name: '固定当前目标' }));
    fireEvent.change(screen.getByLabelText('画布目标'), { target: { value: 'beta' } });
    expect(row('alpha-root')).not.toBeNull();
    expect(screen.getByText('树保持固定目标；恢复跟随后再联动。')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '刷新失败示例' }));
    fireEvent.click(screen.getByRole('button', { name: '刷新快照' }));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByLabelText('快照状态')).toHaveTextContent('刷新失败，保留旧快照');
    expect(row('alpha-root')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '刷新失败示例' }));
    fireEvent.click(screen.getByRole('button', { name: '刷新快照' }));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('已更新')).toBeVisible();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('已更新')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '刷新快照' }));
    fireEvent.click(screen.getByRole('button', { name: '恢复跟随' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(row('beta-root')).not.toBeNull();
    expect(screen.getByLabelText('快照状态')).not.toHaveTextContent('刷新失败');
    expect(row('beta-root')).not.toHaveTextContent('快照');
    fireEvent.click(screen.getByRole('button', { name: '刷新快照' }));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
