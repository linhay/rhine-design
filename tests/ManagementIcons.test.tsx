import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Icon, type IconName } from '../components';
const names = ['download','delete','edit','send','filter','sortAscending','sortDescending','show','hide','export','move','swap','reset','person','users','organization','tree','document','folder','code','database','history','clock','key','lock','shield','warning','help','question','robot','envelope','save','verify'] as const;
describe('management icon semantics', () => {
  it.each(names)('renders a concrete public path for %s', name => {
    const {container}=render(<Icon name={name as IconName}/>);
    expect(container.querySelector('path')?.getAttribute('d')?.trim()).toBeTruthy();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden','true');
  });
  it.each(['','unknown','constructor','__proto__'])('rejects an unsupported runtime name %s', name => {
    expect(()=>render(<Icon name={name as IconName}/>)).toThrow(/Unknown icon name/);
  });
  it('retains old names and exposes a name for a standalone icon', () => {
    const {rerender}=render(<Icon name="settings"/>);
    expect(document.querySelector('path')?.getAttribute('d')).toBeTruthy();
    rerender(<Icon {...({name:'download',label:'下载内容',size:16} as Parameters<typeof Icon>[0])}/>);
    expect(screen.getByRole('img',{name:'下载内容'})).toHaveAttribute('width','16');
    expect(screen.getByRole('img')).not.toHaveAttribute('aria-hidden','true');
  });
});
