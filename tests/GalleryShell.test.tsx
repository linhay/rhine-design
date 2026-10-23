import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GalleryShell } from '../preview/GalleryShell';
import { themes } from '@linhey/rhine-design/theme';

function Demo() {
  const [motion, setMotion] = useState('system');
  return <GalleryShell motion={motion} onMotionChange={setMotion}>{section => <h1>{section}</h1>}</GalleryShell>;
}
function navigate(hash: string) {
  act(() => {
    window.history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}
afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
});

describe('gallery theme integration', () => {
  it('uses public metadata, prioritizes URL theme and persists choices without losing the chapter', () => {
    window.localStorage.setItem('rhine-preview-theme', 'rhine');
    window.history.replaceState(null, '', '/?theme=arknights&other=keep#forms');
    render(<Demo />);
    const picker = screen.getByRole('combobox', { name: '界面主题' });
    expect(picker).toHaveValue('arknights');
    expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(themes.map(item => item.label));
    const main = screen.getByRole('main');
    main.scrollTop = 120;
    fireEvent.change(picker, { target: { value: 'neo-brutalism' } });
    expect(main.closest('.rhine-theme')).toHaveAttribute('data-rhine-theme', 'neo-brutalism');
    expect(main.scrollTop).toBe(120);
    expect(screen.getByRole('heading')).toHaveTextContent('forms');
    expect(window.localStorage.getItem('rhine-preview-theme')).toBe('neo-brutalism');
    expect(window.location.search).toBe('?other=keep');
    expect(window.location.hash).toBe('#forms');
  });

  it('restores a stored theme when the URL is invalid and falls back for unknown stored values', () => {
    window.localStorage.setItem('rhine-preview-theme', 'neo-brutalism');
    window.history.replaceState(null, '', '/?theme=unknown');
    const { unmount } = render(<Demo />);
    expect(screen.getByRole('combobox', { name: '界面主题' })).toHaveValue('neo-brutalism');
    unmount();
    window.localStorage.setItem('rhine-preview-theme', 'unknown');
    render(<Demo />);
    expect(screen.getByRole('combobox', { name: '界面主题' })).toHaveValue('rhine');
  });

  it('still switches when browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled'); });
    render(<Demo />);
    const picker = screen.getByRole('combobox', { name: '界面主题' });
    fireEvent.change(picker, { target: { value: 'arknights' } });
    expect(picker).toHaveValue('arknights');
    expect(screen.getByRole('main').closest('.rhine-theme')).toHaveAttribute('data-rhine-theme', 'arknights');
  });
});

describe('gallery chapter navigation', () => {
  it('opens deep links and follows history changes with one chapter and a current link', () => {
    window.history.replaceState(null, '', '#typography');
    render(<Demo />);
    expect(screen.getByRole('heading')).toHaveTextContent('typography');
    expect(screen.getByRole('link', {name:'字体与文字'})).toHaveAttribute('aria-current', 'page');
    navigate('#motion');
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('heading')).toHaveTextContent('motion');
    expect(screen.getByRole('main')).toHaveFocus();
    navigate('#typography');
    expect(screen.getByRole('heading')).toHaveTextContent('typography');
    navigate('#unknown');
    expect(screen.getByRole('heading')).toHaveTextContent('top');
  });
  it('keeps motion preferences while closing navigation on chapter changes', () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole('radio', {name:'减少动态'}));
    fireEvent.click(screen.getByRole('button', {name:'目录'}));
    expect(screen.getByRole('button', {name:'目录'})).toHaveAttribute('aria-expanded','true');
    navigate('#startup');
    expect(screen.getByRole('button', {name:'目录'})).toHaveAttribute('aria-expanded','false');
    expect(screen.getByRole('main').closest('.rhine-theme')).toHaveAttribute('data-rhine-motion','reduced');
  });
  it('closes the compact directory with Escape and returns focus to its trigger', () => {
    render(<Demo />);
    const trigger = screen.getByRole('button', {name:'目录'});
    fireEvent.click(trigger);
    const link = screen.getByRole('link', {name:'字体与文字'});
    link.focus();
    fireEvent.keyDown(link, {key:'Escape'});
    expect(trigger).toHaveAttribute('aria-expanded','false');
    expect(trigger).toHaveFocus();
  });
});
