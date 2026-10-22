import type { CSSProperties, HTMLAttributes } from 'react';
export type Spacing = 1 | 2 | 3 | 4 | 6 | 8 | 12;
type LayoutProps = HTMLAttributes<HTMLDivElement> & { gap?: Spacing };
export function Stack({ gap = 4, className = '', style, ...props }: LayoutProps) {
  return <div {...props} className={`rhine-stack ${className}`} style={{ gap: `var(--rhine-space-${gap})`, ...style }} />;
}
export function Inline({ gap = 3, className = '', style, ...props }: LayoutProps) {
  return <div {...props} className={`rhine-inline ${className}`} style={{ gap: `var(--rhine-space-${gap})`, ...style }} />;
}
export function Grid({ gap = 4, minWidth = 240, className = '', style, ...props }: LayoutProps & { minWidth?: number }) {
  return <div {...props} className={`rhine-grid ${className}`} style={{ '--rhine-grid-min': `${Math.max(80, minWidth)}px`, gap: `var(--rhine-space-${gap})`, ...style } as CSSProperties} />;
}
export function Divider() { return <hr className="rhine-divider" />; }
