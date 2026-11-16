import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Anchor } from '../components';

const entries: Array<{ callback: IntersectionObserverCallback; nodes: Set<Element>; disconnect: ReturnType<typeof vi.fn> }> = [];
function observers() {
  class Observer {
    callback: IntersectionObserverCallback;
    nodes = new Set<Element>();
    disconnect = vi.fn(() => this.nodes.clear());
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; entries.push(this); }
    observe(node: Element) { this.nodes.add(node); }
    unobserve(node: Element) { this.nodes.delete(node); }
    takeRecords() { return []; }
  }
  vi.stubGlobal('IntersectionObserver', Observer);
}
const mark = (node: Element, visible: boolean, ratio = 1) => ({ target: node, isIntersecting: visible, intersectionRatio: visible ? ratio : 0 } as IntersectionObserverEntry);
const items = [{ id: 'heading-a', label: '第一节' }, { id: 'heading-b', label: '第二节' }];
const current = () => screen.getAllByRole('link').filter(link => link.hasAttribute('aria-current'));
afterEach(() => { entries.length = 0; vi.unstubAllGlobals(); });

describe('Anchor truthful current location', () => {
  it('does not invent a current location before any target is known', () => {
    observers(); render(<Anchor label="位置" items={items} />);
    expect(current()).toHaveLength(0);
  });

  it('keeps current unknown when observation is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<><Anchor label="位置" items={items} /><h2 id="heading-a">实际标题</h2></>);
    expect(current()).toHaveLength(0);
  });

  it('retains incremental visible observations and clears when none are visible', () => {
    observers(); render(<><Anchor label="位置" items={items} /><h2 id="heading-a">甲</h2><h2 id="heading-b">乙</h2></>);
    const observer = entries.at(-1)!;
    act(() => observer.callback([mark(document.getElementById('heading-a')!, true, .8)], {} as IntersectionObserver));
    expect(screen.getByRole('link', { name: '第一节' })).toHaveAttribute('aria-current', 'location');
    act(() => observer.callback([mark(document.getElementById('heading-b')!, true, .2)], {} as IntersectionObserver));
    expect(screen.getByRole('link', { name: '第一节' })).toHaveAttribute('aria-current', 'location');
    act(() => observer.callback([mark(document.getElementById('heading-a')!, false)], {} as IntersectionObserver));
    expect(screen.getByRole('link', { name: '第二节' })).toHaveAttribute('aria-current', 'location');
    act(() => observer.callback([mark(document.getElementById('heading-b')!, false)], {} as IntersectionObserver));
    expect(current()).toHaveLength(0);
  });

  it('clears removed targets without replaying a disconnected observer', async () => {
    observers();
    const { rerender } = render(<><Anchor label="位置" items={items} /><h2 id="heading-a">甲</h2></>);
    const old = entries.at(-1)!, node = document.getElementById('heading-a')!;
    act(() => old.callback([mark(node, true)], {} as IntersectionObserver));
    expect(current()).toHaveLength(1);
    rerender(<Anchor label="位置" items={items} />);
    await waitFor(() => expect(current()).toHaveLength(0));
    act(() => old.callback([mark(node, true)], {} as IntersectionObserver));
    expect(current()).toHaveLength(0);
  });

  it('observes targets that mount later and releases observers on unmount', async () => {
    observers(); const { rerender, unmount } = render(<Anchor label="位置" items={items} />);
    rerender(<><Anchor label="位置" items={items} /><h2 id="heading-b">乙</h2></>);
    await waitFor(() => expect(entries.some(entry => entry.nodes.has(document.getElementById('heading-b')!))).toBe(true));
    const active = [...entries].reverse().find(entry => entry.nodes.has(document.getElementById('heading-b')!))!;
    act(() => active.callback([mark(document.getElementById('heading-b')!, true)], {} as IntersectionObserver));
    expect(screen.getByRole('link', { name: '第二节' })).toHaveAttribute('aria-current', 'location');
    unmount(); expect(active.disconnect).toHaveBeenCalled();
  });
});
