import { useId, type SelectHTMLAttributes } from 'react';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'multiple' | 'size'> {
  label: string;
  hint?: string;
  error?: string;
}

export function Select({ label, hint, error, id: providedId, className = '', children, ...props }: SelectProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const description = [props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ');
  return <div className={`rhine-field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <div className="rhine-select">
      <select {...props} id={id} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description || undefined}>{children}</select>
      <svg className="rhine-select__arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 6 4 4 4-4" /></svg>
    </div>
    {hint && <span id={`${id}-hint`} className="rhine-field__hint">{hint}</span>}
    {error && <span id={`${id}-error`} className="rhine-field__error" role="alert">{error}</span>}
  </div>;
}
