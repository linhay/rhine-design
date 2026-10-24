# API map

All paths are relative to the matching package root. `package.json` exports, `components/index.ts` and the separate `components/theme.tsx` entry are the public export authority. This index locates APIs; exact props come from the installed source, not from remembered examples.

| Exports | Source |
| --- | --- |
| TrendChart, StackedBar；StatusTimeline.detail（0.5.0） | `components/Charts.tsx`、`components/StatusTimeline.tsx`；`docs/APPLICATION_COMPONENTS.md`，未知不补零；键盘逐点查看、按ID受控高亮/详情、valueFormatter |
| Background, AppShell（0.5.0） | `components/Background.tsx`、`components/AppShell.tsx`；`docs/APPLICATION_COMPONENTS.md`；桌面open与临时drawerOpen独立，断点为容器CSS布局宽度 |
| MediaCard, MediaViewer（0.5.0） | `components/Media.tsx`；中性画布，不嵌套主题 |
| DateField, DateRangePicker, NumberField, TreeSelect, RemoteMultiSelect（0.5.0） | `components/AdvancedForms.tsx`；请求、时区和查询由宿主负责；只读/校验/多选键盘及AntD/MUI保留差异见 `docs/ANTD_MUI_AUDIT.md` |
| Date presets + confirmed custom range（组合，无新增导出） | `docs/DATE_RANGE_FILTER.md`、`preview/DateRangeFilterGallery.tsx`；复用 SegmentedControl + Button + Popover + DateRangePicker，宿主负责时区、预设和查询 |
| ThemeProvider, useTheme, themes, ThemeName, ThemeProviderProps (0.4.0；`@linhey/rhine-design/theme`) | `components/theme.tsx`；契约 `docs/THEMING.md` |
| OrbitBackdrop, OrbitBackdropProps (0.6.0) | `components/OrbitBackdrop.tsx`；契约 `docs/ORBIT_BACKDROP.md`；`components/orbitRenderer.ts` 为内部绘制实现 |
| NeutronStarBackdrop, NeutronStarBackdropProps (unreleased source; absent from 0.6.0) | `components/NeutronStarBackdrop.tsx`；契约 `docs/NEUTRON_STAR_BACKDROP.md`；Three.js drawing modules are internal |
| Logo | `components/Logo.tsx` |
| Text | `components/Typography.tsx` |
| Select | `components/Select.tsx` |
| Toolbar | `components/Toolbar.tsx` |
| Icon, IconButton, Link, CopyButton | `components/Actions.tsx` |
| ButtonLink（源码候选，未发布） | `components/Actions.tsx`；`docs/COMPACT_ACCOUNT_PATTERNS.md`；原生 anchor/下载语义，同 Button 视觉，busy 保焦点并移除 href |
| Divider, Stack, Inline, Grid | `components/Layout.tsx` |
| Metric, KeyValue, DataTable, Pagination | `components/Data.tsx` |
| Checkbox, RadioGroup, Switch, Textarea, SearchField, Combobox | `components/Forms.tsx` |
| Dialog, Drawer (0.4.0), ConfirmDialog, Popover, Menu, Tooltip | `components/Overlays.tsx` |
| StatusTimeline, TimelineLegend (0.4.0) | `components/StatusTimeline.tsx`；历史证据，不计算健康评分 |
| TimelineLegend compact/items（源码候选，未发布） | `components/StatusTimeline.tsx`；`docs/COMPACT_ACCOUNT_PATTERNS.md`；宿主短标签/完整规则，一行局部滚动，hover/focus/touch 详情 |
| StatusTimelineList（源码候选，未发布） | `components/StatusTimelineList.tsx`、`docs/APPLICATION_COMPONENTS.md`；稳定行 ID、标题/摘要/紧凑时间条组合、单一详情，宿主保留请求与分页；展台 `/#monitoring` |
| SideNav, Breadcrumbs, Steps (0.4.0) | `components/Navigation.tsx` |
| Fieldset, ErrorSummary (0.4.0) | `components/FormWorkflow.tsx` |
| Toast | `components/Toast.tsx` |
| Button, Badge, Surface, SelectionCard, TextField, Tabs, SegmentedControl, Notice, Progress, Skeleton, Disclosure, EmptyState | `components/components.tsx` |

Primary contracts: `components/README.md` and `components/COMMON_COMPONENTS.md`. Find behavioral evidence in `tests/` and composition examples in `preview/`.

```sh
# From the resolved package root:
rg -n 'ConfirmDialog|DataTable|Combobox' components/index.ts components/*.tsx
rg -n 'ConfirmDialog|DataTable|Combobox' tests preview
```

API decisions that commonly matter:

- `Select` uses a native single-select; searchable candidates use `Combobox`.
- `SelectionCard.showIndicator=false` visually hides the native input while preserving keyboard focus, accessible state and card selection styling (source candidate, unpublished).
- `SelectionCard` uses checkbox semantics; the host determines single-selection policy. Do not nest other interactive controls in it.
- `Text`'s `as` chooses semantics; `variant` chooses visual hierarchy.
- `Logo` accepts `wordmark` and `label`; its `theme` affects the logo, not the full component library.
- `OrbitBackdrop` is decorative artwork with built-in pause / resume. Its `reducedMotion` prop can strengthen but never override system reduction; see `docs/ORBIT_BACKDROP.md` for visibility, narrow-window and fallback behavior. It does not express loading or business progress.
- `NeutronStarBackdrop` preserves the separate neutron-star artwork. `appearance="theme"` follows existing theme tokens; `original` restores its deep-space palette without replacing the host control theme. It lazy-loads WebGL, freezes under reduction or visibility constraints, and retains static art on failure. It is an unreleased source API, not part of npm 0.6.0; see `docs/NEUTRON_STAR_BACKDROP.md`.
- `Toast` presents one notification, not a global queue. `DataTable` is not a query or table-state engine.
- Components in `preview/` are demonstrations. Public API must resolve through a `package.json` export; theme APIs use the separate `/theme` entry.
