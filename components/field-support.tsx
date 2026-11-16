import type { InputHTMLAttributes } from 'react';

/** Shared field metadata only; state, validation rules and submission remain with the host. */
export interface ProvidedFieldProps {
  id?: string; name?: string; form?: string; disabled?: boolean; readOnly?: boolean;
  hint?: string; error?: string; required?: boolean; 'aria-describedby'?: string;
}
export type QueryInputProps = Pick<InputHTMLAttributes<HTMLInputElement>, 'name' | 'form' | 'required' | 'minLength' | 'maxLength' | 'pattern' | 'autoComplete' | 'inputMode' | 'aria-describedby'>;
export function fieldDescription(id: string, hint?: string, error?: string, extra?: string) {
  return [extra, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}
export function FieldFeedback({ id, hint, error }: Pick<ProvidedFieldProps, 'hint' | 'error'> & { id:string }) {
  return <>{hint && <span id={`${id}-hint`} className="rhine-field__hint">{hint}</span>}{error && <span id={`${id}-error`} className="rhine-field__error" role="alert">{error}</span>}</>;
}
