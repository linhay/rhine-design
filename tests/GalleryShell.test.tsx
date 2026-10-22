import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GalleryShell } from '../preview/GalleryShell';

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
afterEach(() => window.history.replaceState(null, '', '/'));

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
