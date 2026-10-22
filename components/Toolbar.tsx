import type { HTMLAttributes, ReactNode } from 'react';

export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string;
  description?: ReactNode;
}

// A native-control group keeps normal Tab navigation, not toolbar arrow-key semantics.
export function Toolbar({ title, description, children, className = '', ...props }: ToolbarProps) {
  return <div {...props} role="group" aria-label={props['aria-label'] || title} className={`tod-toolbar ${className}`}>
    <div className="tod-toolbar__intro"><strong className="tod-text tod-text--label">{title}</strong>{description && <p className="tod-text tod-text--caption tod-text--muted">{description}</p>}</div>
    <div className="tod-toolbar__controls">{children}</div>
  </div>;
}
