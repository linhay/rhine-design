# API map

All paths are relative to the matching package root. `package.json` exports, `components/index.ts` and the separate `components/theme.tsx` entry are the public export authority. This index locates APIs; exact props come from the installed source, not from remembered examples.

| Exports | Source |
| --- | --- |
| TrendChart, StackedBar；StatusTimeline.detail（0.5.0 候选，未发布） | `components/Charts.tsx`、`components/StatusTimeline.tsx`；`docs/APPLICATION_COMPONENTS.md`，未知不补零 |
| Background, AppShell（0.5.0 候选，未发布） | `components/Background.tsx`、`components/AppShell.tsx`；`docs/APPLICATION_COMPONENTS.md` |
| MediaCard, MediaViewer（0.5.0 候选，未发布） | `components/Media.tsx`；中性画布，不嵌套主题 |
| DateField, DateRangePicker, NumberField, TreeSelect, RemoteMultiSelect（0.5.0 候选，未发布） | `components/AdvancedForms.tsx`；请求、时区和查询由宿主负责 |
| ThemeProvider, useTheme, themes, ThemeName, ThemeProviderProps (0.4.0；`@linhey/rhine-design/theme`) | `components/theme.tsx`；契约 `docs/THEMING.md` |
| Logo | `components/Logo.tsx` |
| Text | `components/Typography.tsx` |
| Select | `components/Select.tsx` |
| Toolbar | `components/Toolbar.tsx` |
| Icon, IconButton, Link, CopyButton | `components/Actions.tsx` |
| Divider, Stack, Inline, Grid | `components/Layout.tsx` |
| Metric, KeyValue, DataTable, Pagination | `components/Data.tsx` |
| Checkbox, RadioGroup, Switch, Textarea, SearchField, Combobox | `components/Forms.tsx` |
| Dialog, Drawer (0.4.0), ConfirmDialog, Popover, Menu, Tooltip | `components/Overlays.tsx` |
| StatusTimeline, TimelineLegend (0.4.0) | `components/StatusTimeline.tsx`；历史证据，不计算健康评分 |
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
- `SelectionCard` uses checkbox semantics; the host determines single-selection policy. Do not nest other interactive controls in it.
- `Text`'s `as` chooses semantics; `variant` chooses visual hierarchy.
- `Logo` accepts `wordmark` and `label`; its `theme` affects the logo, not the full component library.
- `Toast` presents one notification, not a global queue. `DataTable` is not a query or table-state engine.
- Components in `preview/` are demonstrations. Public API must resolve through a `package.json` export; theme APIs use the separate `/theme` entry.
