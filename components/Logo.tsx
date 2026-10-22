import type { CSSProperties } from 'react';
import markUrl from './assets/logo.svg?no-inline';

export interface LogoProps {
  size?: number;
  variant?: 'mark' | 'icon' | 'lockup';
  theme?: 'light' | 'dark' | 'auto';
  animate?: boolean;
  decorative?: boolean;
  label?: string;
  wordmark?: string;
  className?: string;
}

/** All variants share the same SVG geometry and centered square viewport. */
export function Logo({ size = 48, variant = 'mark', theme = 'light', animate = false, decorative = false, wordmark = 'Rhine Design', label = wordmark, className = '' }: LogoProps) {
  const dimension = Number.isFinite(size) ? Math.max(16, size) : 48;
  return <span
    className={`rhine-logo rhine-logo--${variant} ${className}`}
    data-theme={theme}
    data-animate={animate}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : label}
    aria-hidden={decorative || undefined}
    style={{ '--rhine-logo-size': `${dimension}px`, '--rhine-logo-travel': `${2400 / dimension}px` } as CSSProperties}
  >
    <svg className="rhine-logo__symbol" viewBox="0 0 800 800" aria-hidden="true" focusable="false">
      <use className="rhine-logo__plate rhine-logo__plate--left" href={`${markUrl}#left`} />
      <use className="rhine-logo__plate rhine-logo__plate--right" href={`${markUrl}#right`} />
      <use className="rhine-logo__plate rhine-logo__plate--base" href={`${markUrl}#base`} />
    </svg>
    {variant === 'lockup' && <span className="rhine-logo__wordmark" aria-hidden="true">{wordmark}</span>}
  </span>;
}
