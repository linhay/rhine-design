import { memo, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Badge, Disclosure } from '../components';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tokenStyles = source('../components/tokens.css');
const baseStyles = source('../components/styles.css');
const arknightsStyles = source('../components/theme-arknights.css');
const neoBrutalismStyles = source('../components/theme-neo-brutalism.css');

interface AnimationProbe {
  cancel: ReturnType<typeof vi.fn>;
  onfinish: (() => void) | null;
}
function motionProbe(details: HTMLDetailsElement) {
  const trigger = details.querySelector('summary')!;
  const animations: AnimationProbe[] = [];
  let frame: number | undefined;
  details.style.setProperty('--rhine-duration-notice', '200ms');
  details.style.setProperty('--rhine-ease-standard', 'cubic-bezier(.2, 0, 0, 1)');
  details.style.setProperty('--rhine-ease-exit', 'cubic-bezier(.4, 0, 1, 1)');
  details.style.borderTop = '1px solid black';
  details.style.borderBottom = '1px solid black';
  vi.spyOn(details, 'getBoundingClientRect').mockImplementation(() => ({ height: frame ?? (details.open ? 160 : 50) } as DOMRect));
  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({ height: 48 } as DOMRect);
  const animate = vi.fn(() => {
    const next: AnimationProbe = { cancel: vi.fn(() => { frame = undefined; }), onfinish: null };
    animations.push(next);
    return next as unknown as Animation;
  });
  details.animate = animate;
  return { animate, animations, frame: (height: number) => { frame = height; } };
}
function mediaProbe() {
  const media = Object.assign(new EventTarget(), { matches: false, media: '(prefers-reduced-motion: reduce)' });
  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return media;
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.querySelectorAll('[data-disclosure-test-styles]').forEach(node => node.remove());
});

describe('Disclosure public contracts', () => {
  it('keeps legacy eager content, defaultOpen initialization and boolean requests', () => {
    const mounted = vi.fn(), changed = vi.fn();
    function Content() {
      useEffect(() => { mounted(); }, []);
      return <input aria-label="旧用法草稿" defaultValue="初始内容"/>;
    }
    const { rerender } = render(<Disclosure title="旧用法" onOpenChange={changed}><Content/></Disclosure>);
    const trigger = screen.getByLabelText('旧用法');
    expect(screen.getByText('旧用法', { selector: 'summary' })).toBe(trigger);
    expect(trigger.firstChild).toHaveProperty('nodeType', Node.TEXT_NODE);
    expect(trigger.querySelector('.rhine-disclosure__summary')).toBeNull();
    const details = trigger.closest('details')!;
    const draft = screen.getByLabelText('旧用法草稿');
    expect(mounted).toHaveBeenCalledOnce();
    expect(details.open).toBe(false);
    expect(draft).not.toBeVisible();
    expect(changed).not.toHaveBeenCalled();
    rerender(<Disclosure title="旧用法" defaultOpen onOpenChange={changed}><Content/></Disclosure>);
    expect(details.open).toBe(false);
    fireEvent.click(trigger);
    expect(details.open).toBe(true);
    fireEvent.change(draft, { target: { value: '保留旧草稿' } });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(draft).toBeVisible();
    expect(draft).toHaveValue('保留旧草稿');
    expect(mounted).toHaveBeenCalledOnce();
    expect(changed.mock.calls).toEqual([[true], [false], [true]]);
  });

  it('keeps rich summary facts with an explicit name and a display-only subtree', () => {
    const summary = <><strong>分析结果</strong><Badge tone="warning">3 项待处理</Badge><span>尚未完成</span></>;
    const { rerender } = render(<Disclosure title="分析结果" ariaLabel="分析结果，3 项待处理，尚未完成" summary={summary}>内容</Disclosure>);
    const trigger = screen.getByLabelText('分析结果，3 项待处理，尚未完成');
    expect(trigger.tagName).toBe('SUMMARY');
    expect(trigger).toHaveAccessibleName('分析结果，3 项待处理，尚未完成');
    expect(trigger).toHaveTextContent('分析结果3 项待处理尚未完成');
    const slot = trigger.querySelector('.rhine-disclosure__summary')!;
    expect(slot).toHaveAttribute('inert');
    expect(slot).toHaveAttribute('aria-hidden', 'true');
    expect(slot.querySelectorAll('button,a,input,[tabindex]')).toHaveLength(0);
    expect(trigger).not.toHaveAttribute('tabindex');
    expect(trigger.querySelector('.rhine-disclosure__indicator')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Disclosure title="标题仍命名" ariaLabel=" " summary={summary}>内容</Disclosure>);
    expect(trigger).toHaveAccessibleName('标题仍命名');
  });

  it('mounts lazy content on the first accepted open and retains its identity and state', () => {
    const mounted = vi.fn(), unmounted = vi.fn();
    function Content() {
      const [count, setCount] = useState(0);
      useEffect(() => { mounted(); return () => { unmounted(); }; }, []);
      return <><input aria-label="分析草稿" defaultValue=""/><button onClick={() => setCount(current => current + 1)}>计算 {count}</button></>;
    }
    render(<Disclosure title="按需分析" lazyMount><Content/></Disclosure>);
    const trigger = screen.getByLabelText('按需分析');
    expect(screen.queryByLabelText('分析草稿')).not.toBeInTheDocument();
    expect(mounted).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    const draft = screen.getByLabelText('分析草稿');
    fireEvent.change(draft, { target: { value: '一次挂载的草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '计算 0' }));
    fireEvent.click(trigger);
    expect(draft).not.toBeVisible();
    expect(draft).toBeInTheDocument();
    expect(unmounted).not.toHaveBeenCalled();
    fireEvent.click(trigger);
    expect(screen.getByLabelText('分析草稿')).toBe(draft);
    expect(draft).toHaveValue('一次挂载的草稿');
    expect(screen.getByRole('button', { name: '计算 1' })).toBeVisible();
    expect(mounted).toHaveBeenCalledOnce();
  });

  it('does not animate or mount a controlled rejected open, including repeated requests', () => {
    const request = vi.fn(), mounted = vi.fn();
    function Content() { useEffect(() => { mounted(); }, []); return <input aria-label="受控草稿"/>; }
    const { rerender } = render(<Disclosure title="受控分析" defaultOpen open={false} lazyMount onOpenChange={request}><Content/></Disclosure>);
    const trigger = screen.getByLabelText('受控分析');
    const details = trigger.closest('details')!;
    const probe = motionProbe(details);
    fireEvent.click(trigger);
    rerender(<Disclosure title="受控分析" defaultOpen open={false} lazyMount onOpenChange={request}><Content/></Disclosure>);
    fireEvent.click(trigger);
    expect(request.mock.calls).toEqual([[true], [true]]);
    expect(details.open).toBe(false);
    expect(details).toHaveAttribute('data-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(probe.animate).not.toHaveBeenCalled();
    expect(mounted).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('受控草稿')).not.toBeInTheDocument();
    rerender(<Disclosure title="受控分析" open lazyMount onOpenChange={request}><Content/></Disclosure>);
    expect(details.open).toBe(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(mounted).toHaveBeenCalledOnce();
    expect(request).toHaveBeenCalledTimes(2);
    expect(probe.animate).toHaveBeenCalledOnce();
  });

  it('retains controlled visibility and content on a refused close, then accepts external changes silently', () => {
    const request = vi.fn();
    const { rerender } = render(<Disclosure title="受控详情" open lazyMount onOpenChange={request}><input aria-label="受控详情草稿"/></Disclosure>);
    const trigger = screen.getByLabelText('受控详情');
    const details = trigger.closest('details')!;
    const draft = screen.getByLabelText('受控详情草稿');
    const probe = motionProbe(details);
    fireEvent.change(draft, { target: { value: '拒绝关闭仍保留' } });
    draft.focus();
    fireEvent.click(trigger);
    expect(request).toHaveBeenCalledExactlyOnceWith(false);
    expect(details.open).toBe(true);
    expect(draft).toHaveFocus();
    expect(draft).toBeVisible();
    expect(probe.animate).not.toHaveBeenCalled();
    rerender(<Disclosure title="受控详情" open={false} lazyMount onOpenChange={request}><input aria-label="受控详情草稿"/></Disclosure>);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(draft.parentElement).toHaveAttribute('inert');
    act(() => { probe.animations[0].onfinish?.(); });
    expect(details.open).toBe(false);
    rerender(<Disclosure title="受控详情" open lazyMount onOpenChange={request}><input aria-label="受控详情草稿"/></Disclosure>);
    expect(screen.getByLabelText('受控详情草稿')).toBe(draft);
    expect(draft).toHaveValue('拒绝关闭仍保留');
    expect(draft.parentElement).not.toHaveAttribute('inert');
    expect(request).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('mounts an initially accepted lazy open without emitting a request', () => {
    const request = vi.fn();
    render(<Disclosure title="初始打开" defaultOpen lazyMount onOpenChange={request}><input aria-label="初始打开草稿"/></Disclosure>);
    expect(screen.getByLabelText('初始打开').closest('details')!.open).toBe(true);
    expect(screen.getByLabelText('初始打开草稿')).toBeVisible();
    expect(request).not.toHaveBeenCalled();
  });

  it('returns focus to the real native summary when a host closes focused content', () => {
    const { rerender } = render(<Disclosure title="焦点详情" open><input aria-label="焦点详情草稿"/></Disclosure>);
    const trigger = screen.getByLabelText('焦点详情');
    screen.getByLabelText('焦点详情草稿').focus();
    rerender(<Disclosure title="焦点详情" open={false}><input aria-label="焦点详情草稿"/></Disclosure>);
    expect(trigger.tagName).toBe('SUMMARY');
    expect(trigger).toHaveFocus();
    expect(trigger.closest('details')!.open).toBe(false);
  });

  it('restores a removed content focus without taking an existing host focus', () => {
    const { rerender } = render(<><button>宿主目标</button><Disclosure title="移除内容" open><input aria-label="将移除的草稿"/></Disclosure></>);
    const trigger = screen.getByLabelText('移除内容');
    screen.getByLabelText('将移除的草稿').focus();
    rerender(<><button>宿主目标</button><Disclosure title="移除内容" open={false}>{null}</Disclosure></>);
    expect(trigger).toHaveFocus();
    rerender(<><button>宿主目标</button><Disclosure title="移除内容" open><input aria-label="将移除的草稿"/></Disclosure></>);
    screen.getByLabelText('将移除的草稿').focus();
    const outside = screen.getByRole('button', { name: '宿主目标' });
    outside.focus();
    rerender(<><button>宿主目标</button><Disclosure title="移除内容" open={false}>{null}</Disclosure></>);
    expect(outside).toHaveFocus();
  });

  it.each(['before', 'after'])('respects host focus handoff %s a synchronous accepted request', handoff => {
    function Host() {
      const [open, setOpen] = useState(true);
      const [notice, setNotice] = useState('');
      const outside = useRef<HTMLButtonElement>(null);
      return <>{notice}<button ref={outside}>主动交焦目标</button><Disclosure title="同步详情" open={open} onOpenChange={next => {
        if (handoff === 'before') outside.current?.focus();
        flushSync(() => { setNotice('正在接受本次关闭'); });
        flushSync(() => { setOpen(next); });
        if (handoff === 'after') outside.current?.focus();
      }}><input aria-label="同步详情草稿"/></Disclosure></>;
    }
    render(<Host/>);
    screen.getByLabelText('同步详情草稿').focus();
    const trigger = screen.getByLabelText('同步详情');
    fireEvent.click(trigger);
    expect(trigger.closest('details')!.open).toBe(false);
    expect(screen.getByRole('button', { name: '主动交焦目标' })).toHaveFocus();
  });

  it('continues quick reversals from the current height and ignores superseded finishes', () => {
    render(<Disclosure title="连续反向" lazyMount><input aria-label="反向草稿"/></Disclosure>);
    const trigger = screen.getByLabelText('连续反向');
    const details = trigger.closest('details')!;
    const probe = motionProbe(details);
    fireEvent.click(trigger);
    const draft = screen.getByLabelText('反向草稿');
    fireEvent.change(draft, { target: { value: '动画期间也保留' } });
    expect(probe.animate).toHaveBeenNthCalledWith(1, [{ height: '50px' }, { height: '160px' }], { duration: 200, easing: 'cubic-bezier(.2, 0, 0, 1)' });
    probe.frame(110);
    fireEvent.click(trigger);
    expect(probe.animations[0].cancel).toHaveBeenCalledOnce();
    expect(probe.animate).toHaveBeenNthCalledWith(2, [{ height: '110px' }, { height: '50px' }], { duration: 200, easing: 'cubic-bezier(.4, 0, 1, 1)' });
    expect(draft.parentElement).toHaveAttribute('inert');
    probe.frame(90);
    fireEvent.click(trigger);
    expect(probe.animations[1].cancel).toHaveBeenCalledOnce();
    expect(probe.animate).toHaveBeenNthCalledWith(3, [{ height: '90px' }, { height: '160px' }], { duration: 200, easing: 'cubic-bezier(.2, 0, 0, 1)' });
    act(() => { probe.animations[1].onfinish?.(); });
    expect(details.open).toBe(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    act(() => { probe.animations[2].onfinish?.(); });
    expect(details.open).toBe(true);
    expect(screen.getByLabelText('反向草稿')).toBe(draft);
    expect(draft).toHaveValue('动画期间也保留');
    expect(draft.parentElement).not.toHaveAttribute('inert');
  });

  it.each([false, true])('settles an in-flight accepted state when system motion changes, initially open=%s', initiallyOpen => {
    const media = mediaProbe();
    render(<Disclosure title="系统动态" defaultOpen={initiallyOpen}><input aria-label="系统动态草稿"/></Disclosure>);
    const trigger = screen.getByLabelText('系统动态');
    const details = trigger.closest('details')!;
    const probe = motionProbe(details);
    fireEvent.click(trigger);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    act(() => { media.matches = true; media.dispatchEvent(new Event('change')); });
    expect(probe.animations[0].cancel).toHaveBeenCalledOnce();
    expect(details.open).toBe(!initiallyOpen);
    expect(trigger).toHaveAttribute('aria-expanded', String(!initiallyOpen));
    expect(outside).toHaveFocus();
    act(() => { probe.animations[0].onfinish?.(); });
    expect(details.open).toBe(!initiallyOpen);
    outside.remove();
  });

  it.each([[false, '0ms'], [true, '0s']] as const)('settles runtime zero duration without a React rerender, initially open=%s', async (initiallyOpen, duration) => {
    const StableDisclosure = memo(() => <Disclosure title="运行时零时长" defaultOpen={initiallyOpen}><input aria-label="零时长草稿"/></Disclosure>);
    render(<StableDisclosure/>);
    const trigger = screen.getByLabelText('运行时零时长');
    const details = trigger.closest('details')!;
    const probe = motionProbe(details);
    fireEvent.click(trigger);
    await act(async () => { details.style.setProperty('--rhine-duration-notice', duration); await Promise.resolve(); });
    expect(probe.animations[0].cancel).toHaveBeenCalledOnce();
    expect(details.open).toBe(!initiallyOpen);
    act(() => { probe.animations[0].onfinish?.(); });
    expect(details.open).toBe(!initiallyOpen);
  });

  it('cancels an in-flight animation and releases motion subscriptions on unmount', () => {
    const media = mediaProbe();
    const remove = vi.spyOn(media, 'removeEventListener');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { unmount } = render(<Disclosure title="资源清理">内容</Disclosure>);
    const details = screen.getByLabelText('资源清理').closest('details')!;
    const probe = motionProbe(details);
    fireEvent.click(screen.getByLabelText('资源清理'));
    unmount();
    expect(probe.animations[0].cancel).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
    expect(disconnect).toHaveBeenCalledOnce();
    expect(() => { probe.animations[0].onfinish?.(); }).not.toThrow();
  });

  it.each(['rhine', 'arknights', 'neo-brutalism'])('styles only the owning indicator and preserves shared dividers in %s', theme => {
    const styles = document.createElement('style');
    styles.dataset.disclosureTestStyles = '';
    styles.textContent = tokenStyles + baseStyles.replace(/^@import.*$/gm, '') + arknightsStyles + neoBrutalismStyles;
    document.head.append(styles);
    render(<div className="rhine-theme" data-rhine-theme={theme}>
      <Disclosure title="外层" defaultOpen summary={<><strong>外层摘要</strong><Badge>3 项</Badge></>}>
        <Disclosure title="内层">内部内容</Disclosure>
      </Disclosure>
      <Disclosure title="相邻项">相邻内容</Disclosure>
    </div>);
    const outer = screen.getByLabelText('外层');
    const inner = screen.getByLabelText('内层');
    const rich = outer.querySelector('.rhine-disclosure__summary')!;
    const indicator = outer.querySelector('.rhine-disclosure__indicator')!;
    expect(getComputedStyle(indicator).transform).toBe('rotate(45deg)');
    expect(getComputedStyle(rich).transform).not.toContain('rotate');
    expect(getComputedStyle(rich).fontFamily).toBe(getComputedStyle(outer).fontFamily);
    expect(getComputedStyle(inner.querySelector('.rhine-disclosure__indicator')!).transform).not.toContain('rotate');
    expect(parseFloat(getComputedStyle(outer).minHeight)).toBeGreaterThanOrEqual(44);
    expect(getComputedStyle(screen.getByLabelText('相邻项').closest('details')!).borderTopWidth).toBe('0px');
  });
});
