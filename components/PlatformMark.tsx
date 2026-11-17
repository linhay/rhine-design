import { platformPaths } from './platform-paths';
import './platform-mark.css';
export type PlatformName = 'macos' | 'windows';
export interface PlatformMarkProps { platform: PlatformName; size?: 16 | 20; decorative?: boolean; label?: string }
/** Inline, noninteractive identity only; no platform detection, fetch or download. */
export function PlatformMark({ platform, size=20, decorative=true, label }: PlatformMarkProps) {
  if (size !== 16 && size !== 20) throw new RangeError('PlatformMark size must be 16 or 20.');
  if (!Object.hasOwn(platformPaths, platform)) return <span className="rhine-platform-mark--unsupported">未支持的平台</span>;
  const name = label?.trim() || (platform === 'macos' ? 'macOS 平台' : 'Windows 平台');
  return <svg className="rhine-platform-mark" data-platform={platform} width={size} height={size} viewBox="0 0 16 16" fill="currentColor" focusable="false" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : name}>{platformPaths[platform].map((d,index)=><path key={index} d={d}/>)}</svg>;
}
