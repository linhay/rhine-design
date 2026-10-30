# 列表筛选栏

`ListFilterBar` 把列表顶部限制为搜索、最多两个常显条件、更多筛选、结果反馈、刷新与一个业务操作。它统一信息层级与布局，不承接查询、权限、分页或业务筛选状态。需求来源为 [#19](https://github.com/linhay/rhine-design/issues/19)，真实展台为 `/#list-filter-bar`。

**版本边界：本组件在 0.9.0 新增。** 0.8.0 及更早版本不提供该组件；消费时必须核对实际导出及固定源码/安装快照。图库跟随源码，不能代替 npm 发布证据。

## 先决定常显内容

- 搜索在用户确实需要查找记录时提供；统计范围等场景无需填充一个无用搜索框。
- 搜索 label 持续可见，不以 placeholder 代替。#22 的 `f0f8495` 已移除早期候选隐藏搜索 label 的 CSS；消费旧安装副本时须核对，不能以源码文档描述代替实际安装行为。
- `primary` 只常显前两项，超出的项目自动进入“更多筛选”。选择高频且互相独立的条件，例如状态和排序；不要为了展开所有控件增加第二个筛选栏。
- 其他条件进入同一个 Drawer。字段自己的 label 持续可见，组件不重复加可见标题，也不提供任意 `children` 让页面插回一排控件。
- 非默认条件用短摘要说明当前限制；单项清除与整体重置都由宿主定义。默认排序、默认统计日期等是否需要摘要由宿主的 `activeLabel` 决定，不把所有非空值都视为筛选。
- 结果数量、更新中与错误反馈在栏内呈现；Drawer 默认重复结果摘要，信息较多时用 `drawerResult={null}` 移除重复统计。更新中与错误仍必须在 Drawer 内反馈，失败不能藏在遮罩后的页面上，也不能把旧数量当作新条件已经成功。
- 刷新之外最多一个业务操作。多记录的选择、批量操作属于结果区，录制启停等对象设置也不塞进筛选栏。
- 平级工作区已有侧栏身份时不重复大标题。组件的 `label` 提供可访问分组名称，宿主仍负责页面标题、主内容名称及路由焦点。

布局按组件实际容器宽度重排，窄嵌入区域和 200% 内容缩放保持完整文字、可达操作和 44px 目标；不以省略日期、缩小文字或横向撑破页面换取一行。三套主题使用同一组件结构与 tokens。

## 公共契约

| 属性 | 输入与责任 |
| --- | --- |
| `label` | 必填分组名称，也是更多筛选 Drawer 的标题 |
| `search` | 可选原生 input 属性加必填 `label`；支持受控 value、change、composition、disabled；内部为 TextField |
| `primary` | `ListFilterField[]`；最多前两项常显，其他顺序移入 Drawer |
| `filters` | `ListFilterField[]`；按顺序追加到 Drawer |
| `onReset` | 宿主清除搜索与恢复各条件默认值；有搜索或 activeLabel 才显示重置入口 |
| `refresh` | `{onClick,busy?,disabled?}`；原生共享 Button，不自动执行请求 |
| `action` | 可选单个 ReactElement，代表一个业务操作；消费方不能用 Fragment 或自建按钮组绕过数量限制 |
| `result` | 宿主提供的结果摘要；数量未知时明确显示未知，不用已加载条数冒充总数 |
| `drawerDescription` | 可选 ReactNode；省略时保留默认即时更新说明，传 `null` 不渲染说明，也不留下空段落或失效的 aria-describedby |
| `drawerResult` | 可选 ReactNode；省略时沿用 `result`，传 `null` 仅移除抽屉重复摘要；pending/error 始终保留 |
| `pending` / `error` | 正在更新 / 失败说明；在栏与已展开 Drawer 中保持一致 |
| `className` | 只用于外层组合布局，不覆盖组件内部视觉或状态 |

字段包含 `{id,label,control,activeLabel?,onClear?}`。`id` 在当前栏内唯一，用于稳定标识；它不是输入框 DOM id。`control` 提供真实受控组件及自己的可见/可访问标签；字段包装只添加分组语义。`activeLabel` 是宿主判断后的非默认条件摘要；`onClear` 缺省时摘要只读。不同实例的输入 DOM id 仍须唯一，优先使用组件自动生成的 id。

```tsx
<ListFilterBar
  label="会话筛选"
  search={{ label: '搜索会话', value: query, onChange: event => setQuery(event.target.value) }}
  primary={[
    {
      id: 'state', label: '会话状态',
      control: <Select label="会话状态" value={state} onChange={event => setState(event.target.value)}>
        <option value="all">全部状态</option><option value="done">已完成</option>
      </Select>,
      activeLabel: state === 'all' ? undefined : '已完成',
      onClear: () => setState('all'),
    },
  ]}
  filters={additionalFields}
  onReset={resetFilters}
  refresh={{ onClick: reload, busy: loading }}
  result={total === null ? '总数待确认' : `${total} 条结果`}
  pending={loading}
  error={error}
/>
```

示例中的状态、函数与额外字段由宿主提供。使用受控 `search.value` 才能准确决定搜索是否需要重置；组件不解析其他控件的值。

`drawerDescription` / `drawerResult` 自 0.10.0 提供，0.9.1 不支持。紧凑示例见 `preview/CompactFilterBarGallery.tsx`。无必要解释时，标题后直接展示筛选字段，不以另一段帮助文字替代被移除的重复说明。

## 状态与查询边界

更多筛选是同一组状态的展开视图，不建立另一套草稿/应用流程。普通选择即时回传宿主；关闭、点击外部与 Escape 只收起抽屉，不撤销已经接受的条件。业务本来要求完整范围显式应用的日期控件可以保留其局部草稿，但应在 Drawer 内内联展示，不再嵌套日期 Drawer。

服务端搜索、权限裁剪、默认值、URL 与偏好、请求防抖、IME、取消和过期响应保护都留在宿主。输入中的值不等于最后接受的结果；失败保留还是回滚条件按接口契约处理，并把结果/错误传入组件。不要为了接入组件改成拉取全量数据在浏览器过滤。

Drawer 复用已有模态、Escape 与焦点归还；移除当前聚焦摘要时焦点回到有效控件。忙碌与禁用不同：busy 保留焦点，禁用字段由宿主明确传入；不因一次后台刷新禁用所有条件。只读身份应从传入字段中移除其无权使用的条件，不能只改变颜色或 CSS 隐藏。

## 真实展台与验收

`preview/ListFilterBarGallery.tsx` 提供独立会话列表、420px 嵌入列表、无搜索统计范围三种组合。独立例子刻意传入第三项 primary，以验证运行时移入 Drawer；全局状态选择使用真实控件演示正常、加载、无结果、错误与禁用。记录与操作均为合成示例，无业务请求或文件下载。

验收至少覆盖：三主题与真实窄容器；400/520/880px、200% CSS zoom；主条件上限；输入法、键盘和焦点；多个活跃条件的完整摘要、单项/全量重置；Drawer 内加载与失败；筛选后总数、分页与迟到响应。图库证明共享组件组合，产品的服务端权限、导出和查询契约仍分别验收。

Drawer 中的原生日期还须检查实际文本编辑区：完整值、最后日期片段与日历图标均可见并可操作；input/document 的 scrollWidth 不溢出不代表原生编辑区没有裁字。重复分组内距的共享修复由 [#25](https://github.com/linhay/rhine-design/issues/25) 跟踪；不在业务页复制日期内部 CSS。


## 完整嵌入列表组合复核

[#19 的消费纠正](https://github.com/linhay/rhine-design/issues/19#issuecomment-6516661891) 要求复核完整嵌入列表，组件名称一致不能代替组合验收。适用于已有页面/展开区域中的历史记录等列表；具体字段和 250ms 防抖是该消费场景偏好，不设为通用默认。

- 单层 `ListFilterBar → Surface padding="none" + DataTable → Pagination`；筛选与结果外不再包旧的重复卡片，移除旧表格、手动搜索按钮及并存的查询流程，不覆写组件皮肤。
- 搜索与至多两个高频条件常显，其余进入更多筛选。此场景默认日期仅在结果摘要呈现，不重复默认标签；非默认条件可单项清除和整体重置。宿主防抖配合 IME 组合事件、取消和迟到保护，刷新保留；抽屉可以移除重复结果和机制说明，但 pending/error 仍可见。
- 技术字符串保留完整值并自然换行；只读客户端身份用中性 Badge，人员与部门分层，附加处理内容按需展开。数字列 `align="right"`，长表在自己的命名区域横滚，末列与操作可达；不通过缩小文字挤进窄列。
- 页面只展示服务返回页；总量与摘要基于匹配集合，不能把本页条数冒充总量。刷新/失败保留已有结果并标明上次结果；新筛选值不等于已接受的新结果。合成分页/设计网关不证明正式后端分页契约已实现。
- 区域已有可见标题时，[后续纠正](https://github.com/linhay/rhine-design/issues/19#issuecomment-6516734959)允许 `DataTable captionVisibility="hidden"` 消除重复 caption；必填 caption 仍描述表格，保留原生语义及可聚焦横滚区域名称。此可选参数为未发布源码能力，0.11.3 与旧固定候选不含，消费升级需另行核对，不能直接改 node_modules。

验收从完整实际容器出发：核对层级与旧结构移除、常显条件和默认摘要、IME/重置/服务返回页、抽屉 pending/error 与 Escape 归焦、旧结果语义、长值/数字对齐、局部横滚末列、窄屏/CSS zoom 及减少动态可操作。各消费方保留自己的业务/API 验收；本轮配方补充不冒充原产品或正式后端已完成。DataTable 默认/隐藏标题的真实组件展台在 `/#data`，隔离生产入口为 `/?fixture=data-caption`；参数契约见[应用组件](APPLICATION_COMPONENTS.md#datatable-与-pagination)。
