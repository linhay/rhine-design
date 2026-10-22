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
    className={`tod-logo tod-logo--${variant} ${className}`}
    data-theme={theme}
    data-animate={animate}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : label}
    aria-hidden={decorative || undefined}
    style={{ '--tod-logo-size': `${dimension}px`, '--tod-logo-travel': `${2400 / dimension}px` } as CSSProperties}
  >
    <svg className="tod-logo__symbol" viewBox="0 0 800 800" aria-hidden="true" focusable="false">
      <use className="tod-logo__plate tod-logo__plate--left" href={`${markUrl}#left`} />
      <use className="tod-logo__plate tod-logo__plate--right" href={`${markUrl}#right`} />
      <use className="tod-logo__plate tod-logo__plate--base" href={`${markUrl}#base`} />
    </svg>
    {variant === 'lockup' && <span className="tod-logo__wordmark" aria-hidden="true">{wordmark}</span>}
  </span>;
}
