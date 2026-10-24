import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, DateField, DateRangePicker } from '../components';

// JSDOM cannot edit native calendar fragments; browser coverage verifies the real keystrokes.
function nativeInput(input: HTMLElement, value: string, badInput: boolean) {
  Object.defineProperty(input, 'validity', { configurable: true, value: { badInput } });
  fireEvent.input(input, { target: { value } });
}

describe('native date editing', () => {
  it('does not display a valid proposal that the controlled host rejected', () => {
    const change = vi.fn();
    render(<DateField label="日期" value="2026-10-20" onValueChange={change} />);
    const input = screen.getByLabelText('日期');
    nativeInput(input, '2026-10-21', false);
    expect(change).toHaveBeenCalledExactlyOnceWith('2026-10-21');
    expect(input).toHaveValue('2026-10-20');
  });

  it('does not report an incomplete native date as an intentionally empty boundary', () => {
    const change = vi.fn(), validation = vi.fn();
    const props = { label: '日期', value: '2026-10-20', onValueChange: change, onValidationChange: validation };
    const { rerender } = render(<DateField {...props} />);
    const input = screen.getByLabelText('日期');
    nativeInput(input, '', true);
    expect(change).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(validation).toHaveBeenLastCalledWith('请填写完整有效的日期。');
    rerender(<DateField {...props} hint="父级刷新了其他状态" />);
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    nativeInput(input, '2026-10-21', false);
    expect(change.mock.calls).toEqual([['2026-10-21']]);
    expect(input).toHaveValue('2026-10-20');
    expect(validation).toHaveBeenLastCalledWith(null);
  });

  it('detects fragments from an initially empty field even when its string value does not change', () => {
    const change = vi.fn(), validation = vi.fn();
    render(<DateField label="日期" value="" onValueChange={change} onValidationChange={validation} />);
    const input = screen.getByLabelText('日期');
    nativeInput(input, '', true);
    expect(change).not.toHaveBeenCalled();
    expect(validation).toHaveBeenLastCalledWith('请填写完整有效的日期。');
    nativeInput(input, '', false);
    expect(change.mock.calls).toEqual([['']]);
    expect(validation).toHaveBeenLastCalledWith(null);
  });

  it('observes calendar fragments that only emit keyup without submitting valid values twice', () => {
    const change = vi.fn(), validation = vi.fn();
    render(<DateField label="日期" value="" onValueChange={change} onValidationChange={validation} />);
    const input = screen.getByLabelText('日期');
    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: true } });
    fireEvent.keyUp(input, { key: '2' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(validation).toHaveBeenLastCalledWith('请填写完整有效的日期。');
    expect(change).not.toHaveBeenCalled();
    nativeInput(input, '2026-10-21', false);
    fireEvent.keyUp(input, { key: '1' });
    fireEvent.blur(input);
    expect(change.mock.calls).toEqual([['2026-10-21']]);
    expect(validation).toHaveBeenLastCalledWith(null);
  });

  it('recognizes intentionally erasing the last native fragment during blur', () => {
    const change = vi.fn();
    render(<DateField label="日期" value="2026-10-20" onValueChange={change} />);
    const input = screen.getByLabelText('日期');
    nativeInput(input, '', true);
    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: false } });
    fireEvent.blur(input);
    expect(change.mock.calls).toEqual([['']]);
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('synchronizes a genuinely changed external date and removes the native draft error', () => {
    const validation = vi.fn(), change = vi.fn();
    const props = { label: '日期', value: '2026-10-20', onValueChange: change, onValidationChange: validation };
    const { rerender } = render(<DateField {...props} />);
    const input = screen.getByLabelText('日期');
    nativeInput(input, '', true);
    rerender(<DateField {...props} value="2026-10-24" />);
    expect(input).toHaveValue('2026-10-24');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(validation).toHaveBeenLastCalledWith(null);
    expect(change).not.toHaveBeenCalled();
  });

  it('does not accept input events from disabled or read-only fields', () => {
    const change = vi.fn();
    const { rerender } = render(<DateField label="日期" value="2026-10-20" onValueChange={change} readOnly />);
    nativeInput(screen.getByLabelText('日期'), '2026-10-21', false);
    expect(change).not.toHaveBeenCalled();
    rerender(<DateField label="日期" value="2026-10-20" onValueChange={change} disabled />);
    nativeInput(screen.getByLabelText('日期'), '', true);
    expect(change).not.toHaveBeenCalled();
  });

  it('aggregates incomplete child input without creating an error feedback loop', () => {
    const change = vi.fn(), validation = vi.fn();
    function Example() {
      const [value, setValue] = useState({ start: '2026-10-20', end: '2026-10-24' });
      const [error, setError] = useState<string | null>(null);
      return <><DateRangePicker label="范围" value={value} onValueChange={next => { change(next); setValue(next); }} onValidationChange={next => { validation(next); setError(next); }} />
        <Button disabled={!!error}>应用日期</Button></>;
    }
    render(<Example />);
    nativeInput(screen.getByLabelText('开始日期'), '', true);
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '应用日期' })).toBeDisabled();
    expect(screen.getByLabelText('结束日期')).not.toHaveAttribute('aria-invalid', 'true');
    nativeInput(screen.getByLabelText('开始日期'), '2026-10-21', false);
    expect(change.mock.calls).toEqual([[{ start: '2026-10-21', end: '2026-10-24' }]]);
    expect(screen.getByRole('button', { name: '应用日期' })).toBeEnabled();
    expect(validation.mock.calls).toEqual([[null], ['请填写完整有效的日期。'], [null]]);
  });

  it('clears an invalid native draft when the accepted range is already empty', () => {
    const change = vi.fn(), validation = vi.fn();
    render(<DateRangePicker label="范围" value={{ start: '', end: '' }} onValueChange={change} onValidationChange={validation} />);
    const input = screen.getByLabelText('开始日期');
    nativeInput(input, '', true);
    const clear = screen.getByRole('button', { name: '清空日期' });
    expect(clear).toBeEnabled();
    fireEvent.click(clear);
    expect(change.mock.calls).toEqual([[{ start: '', end: '' }]]);
    expect(screen.getByLabelText('开始日期')).not.toBe(input);
    expect(screen.getByLabelText('开始日期')).not.toHaveAttribute('aria-invalid', 'true');
    expect(validation).toHaveBeenLastCalledWith(null);
    expect(clear).toBeDisabled();
  });

  it('replaces incomplete drafts with a preset even when its accepted dates have not changed', () => {
    const change = vi.fn(), validation = vi.fn(), value = { start: '2026-10-20', end: '2026-10-24' };
    render(<DateRangePicker label="范围" value={value} onValueChange={change} onValidationChange={validation} presets={[{ label: '当前周', value }]} />);
    nativeInput(screen.getByLabelText('结束日期'), '', true);
    fireEvent.click(screen.getByRole('button', { name: '当前周' }));
    expect(change).toHaveBeenCalledExactlyOnceWith(value);
    expect(screen.getByLabelText('结束日期')).toHaveValue('2026-10-24');
    expect(screen.getByLabelText('结束日期')).not.toHaveAttribute('aria-invalid', 'true');
    expect(validation).toHaveBeenLastCalledWith(null);
  });
});
