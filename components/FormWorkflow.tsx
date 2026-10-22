import { useEffect, useId, useRef, type FieldsetHTMLAttributes, type ReactNode } from 'react';

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> { legend: string; hint?: string; children: ReactNode }
export function Fieldset({ legend, hint, children, className = '', 'aria-describedby': describedBy, ...props }: FieldsetProps) {
  const id = useId();
  return <fieldset {...props} className={`rhine-fieldset ${className}`} aria-describedby={[describedBy, hint ? id : undefined].filter(Boolean).join(' ') || undefined}>
    <legend>{legend}</legend>{hint && <p id={id}>{hint}</p>}<div className="rhine-fieldset__body">{children}</div>
  </fieldset>;
}

export interface FieldError { fieldId: string; message: string }
export interface ErrorSummaryProps { errors: readonly FieldError[]; title?: string; focusKey?: number }
export function ErrorSummary({ errors, title = '请修正以下问题', focusKey }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null), id = useId();
  const hasErrors = errors.length > 0;
  // Focus only on a failed submission, never on each keystroke. Increment focusKey for retries.
  useEffect(() => { if (hasErrors && focusKey !== undefined) ref.current?.focus(); }, [focusKey, hasErrors]);
  if (!hasErrors) return null;
  return <div className="rhine-error-summary" ref={ref} tabIndex={-1} role="region" aria-labelledby={id}>
    <h3 id={id}>{title}</h3><ul>{errors.map(error => <li key={error.fieldId}><a href={`#${error.fieldId}`} onClick={event => {
      const field = document.getElementById(error.fieldId);
      if (field) { event.preventDefault(); field.focus(); field.scrollIntoView?.({ block: 'center' }); }
    }}>{error.message}</a></li>)}</ul>
  </div>;
}
