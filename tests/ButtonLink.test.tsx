import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ButtonLink } from '../components';

describe('ButtonLink', () => {
  it('keeps native link and download attributes and forwards the anchor ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<ButtonLink ref={ref} href="#download" download="example.json" target="_blank" rel="noopener" variant="secondary" className="host-action">下载文件</ButtonLink>);
    const link = screen.getByRole('link', { name: '下载文件' });
    expect(link.tagName).toBe('A');
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute('href', '#download');
    expect(link).toHaveAttribute('download', 'example.json');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
    expect(link).toHaveClass('rhine-button', 'rhine-button--secondary', 'host-action');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('aria-busy');
    expect(link.tabIndex).toBe(0);
  });

  it('leaves primary, modified and auxiliary clicks to the browser and caller', () => {
    const click = vi.fn();
    const auxiliary = vi.fn();
    render(<ButtonLink href="#download" onClick={click} onAuxClick={auxiliary}>下载文件</ButtonLink>);
    const link = screen.getByRole('link');
    for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...modifiers });
      expect(fireEvent(link, event)).toBe(true);
      expect(event.defaultPrevented).toBe(false);
      expect(click.mock.lastCall?.[0].ctrlKey).toBe(Boolean('ctrlKey' in modifiers && modifiers.ctrlKey));
      expect(click.mock.lastCall?.[0].metaKey).toBe(Boolean('metaKey' in modifiers && modifiers.metaKey));
    }
    const event = new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true });
    expect(fireEvent(link, event)).toBe(true);
    expect(event.defaultPrevented).toBe(false);
    expect(click).toHaveBeenCalledTimes(4);
    expect(auxiliary).toHaveBeenCalledTimes(1);
  });

  it('lets the caller cancel native navigation', () => {
    render(<ButtonLink href="#download" onClick={event => event.preventDefault()}>下载文件</ButtonLink>);
    expect(fireEvent.click(screen.getByRole('link'))).toBe(false);
  });

  it('removes disabled destinations and blocks primary and auxiliary activation', () => {
    const click = vi.fn();
    const auxiliary = vi.fn();
    const delegated = vi.fn();
    render(<div onClick={delegated} onAuxClick={delegated}><ButtonLink href="#download" disabled tabIndex={0} onClick={click} onAuxClick={auxiliary}>下载文件</ButtonLink></div>);
    const link = screen.getByRole('link', { name: '下载文件' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link.tabIndex).toBe(-1);
    expect(fireEvent.click(link, { ctrlKey: true })).toBe(false);
    expect(fireEvent(link, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))).toBe(false);
    expect(click).not.toHaveBeenCalled();
    expect(auxiliary).not.toHaveBeenCalled();
    expect(delegated).not.toHaveBeenCalled();
  });

  it('retains focus while busy and restores the destination when ready', () => {
    const click = vi.fn();
    const auxiliary = vi.fn();
    const { rerender } = render(<ButtonLink href="#download" onClick={click} onAuxClick={auxiliary}>下载文件</ButtonLink>);
    const link = screen.getByRole('link');
    link.focus();
    rerender(<ButtonLink href="#download" busy busyLabel="准备文件" onClick={click} onAuxClick={auxiliary}>下载文件</ButtonLink>);
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('aria-busy', 'true');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAccessibleName('准备文件');
    expect(link).not.toHaveAttribute('href');
    expect(link.tabIndex).toBe(0);
    expect(fireEvent.click(link)).toBe(false);
    expect(fireEvent(link, new MouseEvent('auxclick', { button: 1, bubbles: true, cancelable: true }))).toBe(false);
    expect(click).not.toHaveBeenCalled();
    expect(auxiliary).not.toHaveBeenCalled();
    rerender(<ButtonLink href="#ready" onClick={click}>下载文件</ButtonLink>);
    expect(link).toHaveFocus();
    expect(link).toHaveAttribute('href', '#ready');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(link).not.toHaveAttribute('aria-busy');
  });

  it('keeps caller focus policy while busy and gives disabled precedence', () => {
    const { rerender } = render(<ButtonLink href="#download" busy tabIndex={-1}>下载文件</ButtonLink>);
    expect(screen.getByRole('link').tabIndex).toBe(-1);
    rerender(<ButtonLink href="#download" busy disabled tabIndex={0}>下载文件</ButtonLink>);
    expect(screen.getByRole('link').tabIndex).toBe(-1);
    expect(screen.getByRole('link')).toHaveAttribute('data-disabled', 'true');
  });
});
