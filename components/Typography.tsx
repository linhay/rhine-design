import type { HTMLAttributes } from 'react';

export type TextVariant = 'title' | 'section' | 'heading' | 'body' | 'label' | 'caption' | 'overline' | 'metric' | 'code';
export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'strong' | 'code';
  variant?: TextVariant;
  tone?: 'default' | 'muted' | 'success' | 'warning' | 'error';
  numeric?: boolean;
}

export function Text({ as: Element = 'p', variant = 'body', tone = 'default', numeric = false, className = '', ...props }: TextProps) {
  return <Element {...props} className={`tod-text tod-text--${variant} tod-text--${tone}${numeric ? ' tod-text--numeric' : ''} ${className}`} />;
}
