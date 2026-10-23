# 主题接入

`ThemeProvider`、`useTheme`、`themes` 和相关类型从 `@linhey/rhine-design/theme` 导出。此能力自 0.4.0 提供，npm 0.3.0 不包含；建议固定版本并提交 lockfile。组件仍从 `@linhey/rhine-design` 导入。

## 接入一次，随处切换

```tsx
import { Button } from '@linhey/rhine-design';
import { ThemeProvider, useTheme } from '@linhey/rhine-design/theme';

function Appearance() {
  const { theme, setTheme } = useTheme();
  return <Button onClick={() => setTheme('arknights')}>
    当前：{theme}，切换战术主题
  </Button>;
}

export function App() {
  return <ThemeProvider defaultTheme="rhine"><Appearance /></ThemeProvider>;
}
```

主题入口自动加载基础样式与三套内置主题，不需要另行导入主题 CSS、添加 `.rhine-theme` 或修改 DOM。Provider 渲染一个真实的 `div.rhine-theme`，通过 `data-rhine-theme` 应用主题，不重建子组件。普通组件入口保持独立，不额外加载可选主题。

## API

```ts
type ThemeName = 'rhine' | 'arknights' | 'neo-brutalism';

interface ThemeProviderProps extends HTMLAttributes<HTMLDivElement> {
  defaultTheme?: ThemeName;
  theme?: ThemeName;
  onThemeChange?: (theme: ThemeName) => void;
}

function useTheme(): {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};
```

| 属性 / 行为 | 约定 |
| --- | --- |
| `defaultTheme` | 非受控初始值，默认 `rhine`；后续修改该属性不会重置当前选择 |
| `theme` | 受控值；提供后以宿主传入值为准，`defaultTheme` 不生效 |
| `onThemeChange` | 请求切换到不同主题时同步调用；初次挂载、宿主更新 props、重复选择当前主题不会调用 |
| `setTheme(next)` | 非受控时更新内部值并通知；受控时仅通知宿主，宿主回传 `theme` 后生效 |
| 根节点属性 | 支持 `children`、`className`、`style`、`id`、ARIA、事件及 `data-rhine-motion` 等 div 属性；库保留 `.rhine-theme` 和 `data-rhine-theme` 的控制权 |
| 无 Provider | `useTheme()` 抛出明确错误 |
| 无效主题名 | TypeScript 限制为 `ThemeName`；运行时传入非法名字也会抛错，不静默应用不存在的主题 |

受控模式中需由 `onThemeChange` 更新宿主状态，否则选择仅产生请求、界面保持原值。不要在同一个 Provider 生命周期中切换受控和非受控模式。

## 使用主题列表生成选择器

`themes` 是只读元数据列表，每项包含稳定标识 `name` 和展示名称 `label`；`ThemeName` 从列表推导。不要根据中文名称保存偏好。

```tsx
import { Select } from '@linhey/rhine-design';
import { themes, useTheme } from '@linhey/rhine-design/theme';

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  return <Select label="界面主题" value={theme} onChange={event => {
    const next = themes.find(item => item.name === event.target.value);
    if (next) setTheme(next.name);
  }}>
    {themes.map(item => <option key={item.name} value={item.name}>{item.label}</option>)}
  </Select>;
}
```

## 宿主管理偏好

```tsx
import { useState } from 'react';
import { ThemeProvider, type ThemeName } from '@linhey/rhine-design/theme';

export function App() {
  const [theme, setTheme] = useState<ThemeName>('rhine');
  return <ThemeProvider theme={theme} onThemeChange={setTheme}>
    <ThemeSelect />
  </ThemeProvider>;
}
```

库不读写 `localStorage`、Cookie、URL 或账号设置。宿主将这些偏好校验为 `ThemeName` 后传入；读取失败或未知名称时应自行选择默认值。服务端渲染与其他构建器尚未验收；若宿主使用 SSR，需确保服务端和客户端初始值一致。

展台 `preview/GalleryShell.tsx` 是受控接入示例：有效 URL `?theme=` 优先，其次有效本地偏好，最后 `rhine`；主动切换后移除主题查询参数，保留其他参数和章节 hash；存储不可用时仍可切换。上述持久化行为属于展台，不是库默认行为。

## 范围、浮层和动态

- 第一版支持多个并列 Provider，各自维护主题。**不支持嵌套 Provider**，会抛错；不要把 Provider 嵌在另一个带主题的 `.rhine-theme` 内，也不要用嵌套手写主题根尝试覆盖风格。现有后代 CSS 选择器尚不具备嵌套隔离能力。
- Provider 放在页面根部，不添加 `transform`、裁剪或 `contain`。Dialog、Drawer、Menu、Popover、Tooltip、Combobox 的浮层沿用最近 `.rhine-theme` 挂载机制，主题切换时同步继承。
- 切换只改变视觉属性，不重挂载子树，不清除表单、关闭弹窗或重置滚动。宿主不要给 Provider 或应用子树添加 `key={theme}`。
- 主题 API 不注入切换动画。系统减少动态和 `data-rhine-motion="reduced"` 沿用组件规则。
- 内置主题属于视觉风格；不提供 `system` / `dark` / `light` 模式枚举。Logo 的 `theme` 仍是独立配色属性。
- 公共主题 CSS 只包含组件视觉。展台布局、HUD、终端读数、扫描与开机装饰位于 `preview/theme-*.css`，不会随公共主题入口进入应用。

## 从手写主题根迁移

将 `<div className="rhine-theme" data-rhine-theme="arknights">` 替换为 `<ThemeProvider defaultTheme="arknights">`，删除额外主题 CSS 导入；原根节点的布局类、`id`、动效属性直接传给 Provider。需要动态切换时调用 `useTheme().setTheme()`。

旧的 CSS-only 用法继续支持：先导入基础组件样式，再导入 `theme-arknights.css` 或 `theme-neo-brutalism.css`，在根节点设置属性。两种用法选择一种即可，不要为迁移再包一层主题根。
