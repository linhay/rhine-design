import type { HTMLAttributes, ReactNode } from 'react';

export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string;
  description?: ReactNode;
}

// A native-control group keeps normal Tab navigation, not toolbar arrow-key semantics.
export function Toolbar({ title, description, children, className = '', ...props }: ToolbarProps) {
  return <div {...props} role="group" aria-label={props['aria-label'] || title} className={`rhine-toolbar ${className}`}>
    <div className="rhine-toolbar__intro"><strong className="rhine-text rhine-text--label">{title}</strong>{description && <p className="rhine-text rhine-text--caption rhine-text--muted">{description}</p>}</div>
    <div className="rhine-toolbar__controls">{children}</div>
  </div>;
}
