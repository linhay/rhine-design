# DataTable / Pagination 对标核对

核对日期：2026-10-24。范围：issues #1–#6 候选中的 DataTable 与 Pagination 扩展。以下是 API 与行为核对，不是 Ant Design 或 MUI 的兼容实现；源码能力尚未发布到 npm。

## 官方依据

- [Ant Design Table API](https://ant.design/components/table/#api)：受控排序、选择、展开与固定列；重点为 `selectedRowKeys`、`preserveSelectedRowKeys`、`type`、`hideSelectAll`、`checkStrictly`、`rowExpandable`、`rowScope`。
- [Ant Design Pagination API](https://ant.design/components/pagination/#api)：受控页码/页大小、禁用、快速跳页与总量。
- [MUI Table](https://mui.com/material-ui/react-table/)：原生表格组合、滚动容器、固定表头、分页控件与焦点恢复。
- [MUI TablePagination API](https://mui.com/material-ui/api/table-pagination/)：未知总量、独立页大小事件、首末页与 `disabled`。
- [MUI X row selection](https://mui.com/x/react-data-grid/row-selection/)：受控选择、禁选、跨服务端页保留 key、仅可见行全选。
- [MUI X tree data](https://mui.com/x/react-data-grid/tree-data/) 与 [master-detail](https://mui.com/x/react-data-grid/master-detail/)：树数据、受控详情展开及独立数据所有权。
- [MUI X sorting](https://mui.com/x/react-data-grid/sorting/) 与 [column pinning](https://mui.com/x/react-data-grid/column-pinning/)：受控排序模型与左右固定列的布局约束。

## API 与行为逐项判定

| 核对项 | Rhine API / 当前行为 | 判定与本次处理 |
| --- | --- | --- |
| 数据与事件所有权 | `rows`、`sort`、`onSortChange`；组件原样展示传入行 | 保留；只回传排序意图，不以本地排序/筛选替代服务端结果 |
| 多选与禁选 | `selection.keys/onChange/isDisabled` | 已有；只更改可见且可选 key，全选/取消全选均保留跨页及禁选 key |
| 单选 | `selection.mode='single'`，默认 `multiple` | 补齐；原生同名 radio，选择新行回传仅该 key，不提供全选；单选 keys 只读取第一项 |
| 不允许批量选择 | `selection.hideSelectAll` | 补齐；保留每行选择与列标题，隐藏全选入口 |
| 行点击与键盘 | checkbox/radio/button 原生 Tab、Space/Enter | 保留独立操作入口；行内链接、菜单不会隐式改变选择，不伪装 ARIA grid |
| 父子选择 | 树父、子独立 key | 保留；不推断未加载子树的选择状态，不自动级联 |
| 排序取消 | 可选 `onSortReset` 显示“清除排序”；原 `onSortChange(TableSort)` 不变 | 补齐显式取消；先将焦点送回排序列按钮（缺失时回到表格滚动区），再发送重置意图，避免按钮卸载丢焦点；宿主清空 `sort` 后才改变排序状态，保留既有升/降循环 |
| 排序可发现性 | `aria-sort`、文字表头与方向图标、下一方向 `title` | 已有状态语义，补齐下一动作提示；不靠箭头颜色表达方向 |
| 受控展开与禁展开 | `expansion.keys/onChange/getChildren/renderDetail/canExpand` | 修复：`canExpand=false` 也阻止陈旧 keys 渲染子行及详情，不能只隐藏按钮 |
| 详情关联 | 展开按钮 `aria-expanded/aria-controls`，详情命名 region | 修复：ID 基于 row key，不因服务端排序更换；数字 `0` 仍是有效详情 |
| 行标题语义 | `DataColumn.rowHeader` | 补齐可选 `th scope=row`；保持正文背景与固定列层叠，不被固定表头规则吸到顶部 |
| 多固定列 | `sticky='left'/'right'`、可选 `stickyOffset` | 修复默认多列重叠；按真实布局宽度累计偏移，ResizeObserver 响应尺寸变化，显式 offset 优先；测量使用 CSS 布局宽度，避免 CSS zoom 加倍偏移 |
| 固定表头与密度 | `stickyHeader/maxHeight/density` | 保留；表格区域内部滚动，操作仍有 44px 命中区 |
| 加载/失败/空态 | `loading/error/onRetry/emptyTitle` | 保留旧行并说明刷新/错误，初始空态与读取失败分开；禁用会提交新请求的排序/选择 |
| 页码与页大小 | 1-based `page`、`pageSize`、独立 `onPageChange/onPageSizeChange` | 保留；页大小变化不隐式请求另一页，由宿主原子更新查询条件 |
| 未知总量 | `total` 缺省，`hasNext` 控制下一页 | 保留；负值/非有限 total 也按未知处理，不把未知写为零；只有 `total=0` 表示零条 |
| 首页/末页 | `showFirstButton/showLastButton`，均默认 false | 补齐；未知总量的末页按钮禁用，避免捏造最后页 |
| 全局禁用与多个分页 | `disabled`、`label`（默认“分页”） | 补齐；禁用可与加载分离；不同表格可以提供不同 navigation 名称 |
| 总量缩小越界 | 显式标注当前页超出总页数；上一页返回已知末页 | 修复；不静默伪装当前行属于另一页，不在 render/effect 自动请求修正 |
| 分页焦点 | 当当前 action 因页边界禁用时移至相邻可用 action | 补齐；没有可用 action 时不强行移动，外部已获取焦点时不抢回；页码摘要提供 status |

## 有意保留的差异

本库保持原生表格和受控服务端数据边界。AntD 的内置筛选、本地比较器、父子级联、单元格编辑、汇总/合并表头、拖列与虚拟化，以及 MUI X 的网格单元格导航、include/exclude 大数据选择模型、分组聚合，不在本轮 issue 的组件契约内。需要大量数据时宿主提供分页结果；没有自动拉全量模式。树行用明确层级文字与展开按钮，不宣称实现 `treegrid` 的完整键盘模型。

分页为紧凑的服务端前后页控件，补充可选首末页；没有页码枚举、快速跳页或“每页全部”，也不复制两个框架的页码基准差异。Rhine 使用 1-based；适配 MUI TablePagination 的 0-based 状态时由宿主转换。

固定列总宽仍须小于可用表格视口；窄屏由宿主减少固定列，不能用固定列覆盖所有可滚动内容。`stickyOffset` 仍可用于宿主特殊布局。API 以本库原名为准，不同时增加两套同义属性。

## 验证

- `tests/DataParity.test.tsx`：12 项针对新增与修复边界的回归，包含单选、隐藏全选、排序取消及焦点、禁展开陈旧 key、详情 ID、行标题、多固定列测量、已知/未知末页、越界恢复、非法数值、禁用/地标及分页焦点。
- `npm test -- tests/DataParity.test.tsx tests/CommonComponents.test.tsx tests/Extensions.test.tsx`：40 项通过，保留跨页/禁选选择和旧排序/分页契约。
- `npm run typecheck`：通过。执行环境 Node 24。
- JSDOM 的列宽测试使用可变 `offsetWidth` 与 ResizeObserver 回调，证明偏移计算及重测。
- 独立真实组件浏览器 fixture：3 主题 × 400/520/880 共 9 个布局，两个左固定列间距差均为 0px、无正文横向溢出、右列不覆盖左列、固定表头保持顶部且行标题随正文垂直滚动；3 主题在 CSS zoom 200% / 520px 有效宽度下固定列仍相邻。原生 radio 方向键跳过禁选行，分页到末页后焦点回上一页，最终重载回归无 pageerror。该证据不是原生菜单缩放、屏幕阅读器或产品集成验收；真实展台总体验收另记。

## 最小接入

```tsx
<DataTable
  caption="记录"
  rows={rows}
  rowKey={row => row.id}
  columns={[
    { key: 'name', header: '名称', render: row => row.name, rowHeader: true, sortable: true, sticky: 'left', width: 160 },
    { key: 'status', header: '状态', render: row => row.status, sticky: 'left', width: 120 },
  ]}
  selection={{ mode: 'single', keys: selectedKeys, onChange: setSelectedKeys }}
  sort={sort}
  onSortChange={setSort}
  onSortReset={() => setSort(undefined)}
/>
<Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} showFirstButton showLastButton label="记录分页" />
```

示例中的 setState 表示查询意图；实际宿主负责取消旧请求、请求排序/分页结果、更新状态以及处理失败。
