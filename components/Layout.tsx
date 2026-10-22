import type { CSSProperties, HTMLAttributes } from 'react';
export type Spacing = 1 | 2 | 3 | 4 | 6 | 8 | 12;
type LayoutProps = HTMLAttributes<HTMLDivElement> & { gap?: Spacing };
export function Stack({ gap = 4, className = '', style, ...props }: LayoutProps) {
  return <div {...props} className={`tod-stack ${className}`} style={{ gap: `var(--tod-space-${gap})`, ...style }} />;
}
export function Inline({ gap = 3, className = '', style, ...props }: LayoutProps) {
  return <div {...props} className={`tod-inline ${className}`} style={{ gap: `var(--tod-space-${gap})`, ...style }} />;
}
export function Grid({ gap = 4, minWidth = 240, className = '', style, ...props }: LayoutProps & { minWidth?: number }) {
  return <div {...props} className={`tod-grid ${className}`} style={{ '--tod-grid-min': `${Math.max(80, minWidth)}px`, gap: `var(--tod-space-${gap})`, ...style } as CSSProperties} />;
}
export function Divider() { return <hr className="tod-divider" />; }
