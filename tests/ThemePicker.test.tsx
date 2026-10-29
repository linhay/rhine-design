import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ThemePicker, ThemePreview } from '../components/ThemePicker';

it('keeps theme ownership with the host and does not apply on focus or hover', () => {
  const change = vi.fn();
  const { rerender } = render(<ThemePicker value="rhine" onValueChange={change} />);
  const radio = screen.getByRole('radio', { name: '明日方舟 · 战术终端' });
  radio.focus(); fireEvent.mouseOver(radio); expect(change).not.toHaveBeenCalled();
  fireEvent.click(radio); expect(change).toHaveBeenCalledWith('arknights'); expect(radio).not.toBeChecked();
  rerender(<ThemePicker value="arknights" onValueChange={change} />); expect(radio).toBeChecked();
});

it('keeps failed previews selectable and retries a replacement source', () => {
  const change = vi.fn();
  const { container, rerender } = render(<ThemePicker value="rhine" onValueChange={change} />);
  fireEvent.error(container.querySelectorAll('img')[1]);
  expect(screen.getByText('预览暂不可用')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: '明日方舟 · 战术终端' })); expect(change).toHaveBeenCalledWith('arknights');
  rerender(<ThemePreview theme="rhine" src="replacement.png" />);
  expect(container.querySelector('img')).toHaveAttribute('src', 'replacement.png');
  fireEvent.load(container.querySelector('img')!); expect(container.querySelector('[data-state=ready]')).toBeInTheDocument();
});

it('uses independent radio groups and supports whole-group and per-option disabling', () => {
  render(<><ThemePicker label="一" value="rhine" onValueChange={() => {}} disabled /><ThemePicker label="二" value="rhine" onValueChange={() => {}} options={[{ value: 'rhine' }, { value: 'arknights', disabled: true }]} /></>);
  const radios = screen.getAllByRole('radio');
  expect(radios[0]).toBeDisabled(); expect(radios[5]).toBeDisabled();
  expect(radios[0].getAttribute('name')).not.toBe(radios[4].getAttribute('name'));
});
