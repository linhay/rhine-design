import type { ComponentPropsWithRef, CSSProperties } from 'react';

export type BackgroundRole = 'canvas' | 'content' | 'sidebar' | 'surface' | 'overlay' | 'media';
export type BackgroundDecoration = 'auto' | 'theme' | 'none';

export interface BackgroundAppearance {
  color?: CSSProperties['backgroundColor'];
  textColor?: CSSProperties['color'];
  texture?: CSSProperties['backgroundImage'];
  textureSize?: CSSProperties['backgroundSize'];
}

export interface BackgroundProps extends ComponentPropsWithRef<'div'> {
  roleTone?: BackgroundRole;
  decoration?: BackgroundDecoration;
  appearance?: BackgroundAppearance;
}

/** Paints on this element, without a positioning context or an intercepting overlay. */
export function Background({ roleTone = 'content', decoration = 'auto', appearance, style, className = '', ...props }: BackgroundProps) {
  const paint = {
    '--rhine-background-color': appearance?.color,
    '--rhine-background-foreground': appearance?.textColor,
    '--rhine-background-image': appearance?.texture,
    '--rhine-background-size': appearance?.textureSize,
    ...style,
  } as CSSProperties;
  return <div {...props} style={paint} className={`rhine-background ${className}`} data-tone={roleTone} data-decoration={decoration} />;
}
