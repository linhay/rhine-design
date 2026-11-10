import { useId, type ChangeEvent, type FormEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Button } from '../components';
import { Textarea } from '../Forms';

export interface ComposerProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onSubmit'> {
  value: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string, event: FormEvent<HTMLFormElement>) => void;
  label?: string;
  submitLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  attachments?: ReactNode;
  hint?: ReactNode;
  error?: string;
  actions?: ReactNode;
}

/** Controlled composer with native Enter/Shift+Enter behavior and host owned submission. */
export function Composer({ value, onChange, onSubmit, label = '消息', submitLabel = '发送消息', busy = false, busyLabel = '正在发送', attachments, hint, error, actions, onKeyDown, rows = 2, disabled, ...props }: ComposerProps) {
  const fieldId = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled && !busy && value.trim()) onSubmit(value, event);
  };
  return <form className="rhine-chat-composer" onSubmit={submit}>
    <Textarea {...props} id={fieldId} label={label} value={value} onChange={onChange} rows={rows} disabled={disabled || busy} error={error} onKeyDown={event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
      }
      onKeyDown?.(event);
    }} />
    <div className="rhine-chat-composer__footer">
      <span className="rhine-chat-composer__hint">{error || hint}</span>
      <div className="rhine-chat-composer-actions">{attachments}{actions}<Button type="submit" aria-label={submitLabel} busy={busy} busyLabel={busyLabel} disabled={disabled || busy || !value.trim()}>↑</Button></div>
    </div>
  </form>;
}
