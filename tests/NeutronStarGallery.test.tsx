import type { HTMLAttributes } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NeutronStarGallery } from '../preview/NeutronStarGallery';

vi.mock('../components', async importOriginal => {
  const actual = await importOriginal<typeof import('../components')>();
  return {
    ...actual,
    NeutronStarBackdrop: ({ appearance = 'theme', reducedMotion, ...props }: HTMLAttributes<HTMLDivElement> & { appearance?: 'theme' | 'original'; reducedMotion?: boolean }) =>
      <div {...props} data-appearance={appearance} data-reduced={String(Boolean(reducedMotion))} />,
  };
});

describe('NeutronStarGallery composition', () => {
  it('presents unobstructed artwork before collapsed controls and content', () => {
    const { container } = render(<NeutronStarGallery />);
    const artwork = screen.getByRole('group', { name: '中子星艺术' });
    expect(artwork).toBeEmptyDOMElement();
    expect(artwork).toHaveAttribute('data-appearance', 'theme');
    expect(artwork).toHaveAttribute('data-neutron-example', 'artwork');
    expect([...container.querySelectorAll('details')].map(item => item.open)).toEqual([false, false]);
    expect(artwork.compareDocumentPosition(container.querySelector('details')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('changes appearance and reduction without replacing the artwork or entered content', () => {
    render(<NeutronStarGallery />);
    fireEvent.click(screen.getByText('演示控制'));
    fireEvent.click(screen.getByText('查看内容组合'));
    const artwork = screen.getByRole('group', { name: '中子星艺术' });
    const content = screen.getByRole('group', { name: '中子星内容组合' });
    const input = screen.getByRole('textbox', { name: '观测名称' });
    fireEvent.change(input, { target: { value: '保留这份草稿' } });
    fireEvent.change(screen.getByRole('combobox', { name: '艺术配色' }), { target: { value: 'original' } });
    fireEvent.click(screen.getByRole('switch', { name: '减少中子星动态' }));
    expect(screen.getByRole('group', { name: '中子星艺术' })).toBe(artwork);
    expect(screen.getByRole('group', { name: '中子星内容组合' })).toBe(content);
    for (const example of [artwork, content]) {
      expect(example).toHaveAttribute('data-appearance', 'original');
      expect(example).toHaveAttribute('data-reduced', 'true');
    }
    expect(input).toHaveValue('保留这份草稿');
  });

  it('replays only the main artwork while keeping the composition draft and replay focus', () => {
    render(<NeutronStarGallery />);
    fireEvent.click(screen.getByText('演示控制'));
    fireEvent.click(screen.getByText('查看内容组合'));
    const artwork = screen.getByRole('group', { name: '中子星艺术' });
    const content = screen.getByRole('group', { name: '中子星内容组合' });
    const input = screen.getByRole('textbox', { name: '观测名称' });
    fireEvent.change(input, { target: { value: '不重建这份输入' } });
    const replay = screen.getByRole('button', { name: '重播中子星' });
    replay.focus();
    fireEvent.click(replay);
    expect(screen.getByRole('group', { name: '中子星艺术' })).not.toBe(artwork);
    expect(screen.getByRole('group', { name: '中子星内容组合' })).toBe(content);
    expect(screen.getByRole('textbox', { name: '观测名称' })).toBe(input);
    expect(input).toHaveValue('不重建这份输入');
    expect(replay).toHaveFocus();
  });
});
