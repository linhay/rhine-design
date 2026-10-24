import { useId, useState } from 'react';
import { themes, type ThemeName } from './themeMetadata';
import rhine from './assets/theme-previews/rhine.png?no-inline';
import arknights from './assets/theme-previews/arknights.png?no-inline';
import neoBrutalism from './assets/theme-previews/neo-brutalism.png?no-inline';
import './theme-picker.css';

const sources: Record<ThemeName, string> = { rhine, arknights, 'neo-brutalism': neoBrutalism };
const descriptions: Record<ThemeName, string> = {
  rhine: '暖白纸面、苔绿操作与细线边界。',
  arknights: '深色工作区、明亮信号与切角边界。',
  'neo-brutalism': '米白表面、亮橙操作与墨色硬阴影。',
};

export interface ThemePreviewProps { theme: ThemeName; src?: string }
function PreviewImage({ src }: { src: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  return <span className="rhine-theme-preview" aria-hidden="true" data-state={state}>
    {state === 'error' ? <span>预览暂不可用</span> : <><img src={src} alt="" width={960} height={600} decoding="async" onLoad={() => setState('ready')} onError={() => setState('error')} />{state === 'loading' && <span className="rhine-theme-preview__loading">正在加载预览</span>}</>}
  </span>;
}
/** Decorative, versioned snapshot; it never mounts a nested ThemeProvider. */
export function ThemePreview({ theme, src = sources[theme] }: ThemePreviewProps) {
  return <PreviewImage key={src} src={src} />;
}

export interface ThemePickerOption {
  value: ThemeName; label?: string; description?: string; disabled?: boolean; previewSrc?: string;
}
export interface ThemePickerProps {
  label?: string; value: ThemeName; onValueChange: (value: ThemeName) => void;
  options?: readonly ThemePickerOption[]; disabled?: boolean;
}
/** Controlled native radios: the host owns applying and persisting the theme. */
export function ThemePicker({ label = '界面主题', value, onValueChange, options = themes.map(theme => ({ value: theme.name })), disabled = false }: ThemePickerProps) {
  const id = useId();
  return <fieldset className="rhine-theme-picker" disabled={disabled}><legend>{label}</legend>
    <div className="rhine-theme-picker__options">{options.map(option => {
      const title = option.label ?? themes.find(theme => theme.name === option.value)!.label;
      const selected = value === option.value;
      const descriptionId = `${id}-${option.value}`;
      return <label className="rhine-theme-option" key={option.value}>
        <input className="rhine-sr-only" type="radio" name={id} value={option.value} checked={selected} disabled={option.disabled} aria-label={title} aria-describedby={descriptionId} onChange={() => onValueChange(option.value)} />
        <ThemePreview theme={option.value} src={option.previewSrc} />
        <span className="rhine-theme-option__copy"><strong>{title}</strong><span className="rhine-theme-option__description" id={descriptionId}>{option.description ?? descriptions[option.value]}</span><span className="rhine-theme-option__status" aria-hidden="true">{selected ? '✓ 已使用' : option.disabled || disabled ? '暂不可用' : '选择应用'}</span></span>
      </label>;
    })}</div>
  </fieldset>;
}
