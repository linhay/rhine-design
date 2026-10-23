import { createContext, useCallback, useContext, useMemo, useState, type HTMLAttributes } from 'react';
import './styles.css';
import './theme-arknights.css';
import './theme-neo-brutalism.css';

export const themes = [
  { name: 'rhine', label: '莱茵 · 纸面' },
  { name: 'arknights', label: '明日方舟 · 战术终端' },
  { name: 'neo-brutalism', label: '橙趣 · 粗描边' },
] as const;

export type ThemeName = typeof themes[number]['name'];

export interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  defaultTheme?: ThemeName;
  theme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
}

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function assertTheme(theme: ThemeName) {
  if (!themes.some(item => item.name === theme)) {
    throw new Error(`Unknown Rhine theme: ${String(theme)}. Use a name from themes.`);
  }
}

export function ThemeProvider({ theme: controlledTheme, defaultTheme = 'rhine', onThemeChange, className, children, ...rootProps }: ThemeProviderProps) {
  const parent = useContext(ThemeContext);
  const [internalTheme, setInternalTheme] = useState(defaultTheme);
  const theme = controlledTheme ?? internalTheme;
  const setTheme = useCallback((next: ThemeName) => {
    assertTheme(next);
    if (next === theme) return;
    if (controlledTheme === undefined) setInternalTheme(next);
    onThemeChange?.(next);
  }, [controlledTheme, onThemeChange, theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  // Descendant CSS selectors cannot isolate nested theme roots yet.
  if (parent) throw new Error('Nested Rhine ThemeProvider is not supported. Use sibling providers instead.');
  assertTheme(theme);

  return <ThemeContext.Provider value={value}>
    <div {...rootProps} className={['rhine-theme', className].filter(Boolean).join(' ')} data-rhine-theme={theme}>{children}</div>
  </ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a Rhine ThemeProvider.');
  return context;
}
