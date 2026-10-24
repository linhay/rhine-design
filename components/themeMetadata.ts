export const themes = [
  { name: 'rhine', label: '莱茵 · 纸面' },
  { name: 'arknights', label: '明日方舟 · 战术终端' },
  { name: 'neo-brutalism', label: '橙趣 · 粗描边' },
] as const;

export type ThemeName = typeof themes[number]['name'];
