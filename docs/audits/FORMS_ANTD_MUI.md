# 表单组件：Ant Design / MUI API 与交互核对

查阅日期：**2026-10-24**。范围为 issues #1–#6 本次新增的 DateField、DateRangePicker、NumberField、RemoteMultiSelect、TreeSelect，以及它们复用的 Combobox。实现位置为 `components/AdvancedForms.tsx` / `components/Forms.tsx`；这些仍属于未发布候选 API。

官方页面当次标注 Ant Design **6.6.7**、Material UI **9.5.0**、MUI X Date Pickers **9.15.0**、Tree View **9.16.0**。版本仅标识这次查阅内容，不表示安装或运行过这些框架。此核对是官方 API/交互文档对照与 Rhine 自身验证，没有声称完成上游源码或跨库像素比较。

## DateField

参考 [Ant Design DatePicker](https://ant.design/components/date-picker/#api) 的值、日期限制、只读输入等契约，以及 [MUI X DateField API](https://mui.com/x/api/date-pickers/date-field/) 的 `readOnly`、`required`、`name`、辅助文本、错误通知。Rhine 保留 date-only ISO 字符串；MUI 的日期适配对象不进入本库 API。

| 核对项 | 原实现 | 本次补齐 / 保留 |
| --- | --- | --- |
| 受控值和空值 | `value: string` / 空字符串；宿主更新值 | 保留，不新增隐式日期、时区转换或自动钳制 |
| `min` / `max` 与外部无效值 | 仅传给原生 input；外部改约束后没有可见错误 | 校验 ISO 格式、真实日历日期、上下界及反向边界，显示 `aria-invalid` 和错误；不回写受控值 |
| 错误通知 | 只能传入 `error` | 新增 `onValidationChange(error: string \| null)`，初次渲染及校验结果变化通知；外部 `error` 优先 |
| 只读和表单关联 | 缺失 | 新增 `readOnly`、`required`、`id`、`name`、`hint`；只读仍可聚焦，不能改变值 |
| 键盘 / 移动日期面板 | 浏览器原生 `type=date` | 保留原生选择器；显示格式和日历面板由浏览器/系统决定 |

明确保留差异：没有自绘月历、任意日期禁选回调、月份/年份选择模式、适配器/时区、分段键盘编辑或统一跨浏览器日期显示格式。若产品需要这些能力，应单独定义 Calendar 的无障碍与移动端契约；不能把原生输入包装称为完整 AntD/MUI DatePicker 等价物。`required` 使用浏览器表单校验；`onValidationChange` 报告日期格式、范围及显式 `error`，不代替提交时的 required 校验。

## DateRangePicker

参考 [Ant Design RangePicker](https://ant.design/components/date-picker/#rangepicker) 的区间、预设、空值行为，以及 [MUI X DateRangePicker](https://mui.com/x/react-date-pickers/date-range-picker/) 和 [API](https://mui.com/x/api/date-pickers/date-range-picker/) 的组合、只读、表单和校验能力。

| 核对项 | 原实现 | 本次补齐 / 保留 |
| --- | --- | --- |
| 区间与顺序 | `{ start, end }`；反向区间提示错误 | 保留两端受控、允许编辑中单端为空；不自动交换用户输入 |
| 区间边界 | 结束日期 min 跟随开始值 | 继续限制结束端；额外校验两端日期、全局 min/max 与非法边界 |
| 预设 | 仅检查开始低于 min / 结束高于 max | 反向日期、非法日期、任一端越界的预设都不能提交；`required` 时禁止空端预设 |
| 只读 / 清空 | 缺只读，清空按钮固定 | 新增 `readOnly`；同时锁住两端、预设和清空；`clearable` 默认 true |
| 标签和表单 | 开始/结束标签固定，不能命名字段 | 新增 `startLabel`、`endLabel`、`startName`、`endName`、`required`、`hint` |
| 可组合校验 | 仅页面错误文本 | 新增 `onValidationChange`，宿主可用于错误汇总/阻止提交 |

明确保留差异：Rhine 是两个原生日期字段及快捷预设的组合，没有双月联动月历、拖动范围、移动端确认面板、日期部分选择或适配器功能。预设由宿主提供明确日期，不内建“最近七天”等依赖时区/当前时间的计算。更新一个端点只发变更意图，不清空另一个端点。

## NumberField

参考 [Ant Design InputNumber](https://ant.design/components/input-number/#api) 的只读、步进、精度、控制按钮与动态边界。MUI 官方 [Number Field](https://mui.com/material-ui/react-number-field/) 页面提供的是 **Base UI 组合示例**，不是 `@mui/material` 开箱即用的 NumberField 导出；对应底层契约见 [Base UI NumberField](https://base-ui.com/react/components/number-field)。

| 核对项 | 原实现 | 本次补齐 / 保留 |
| --- | --- | --- |
| 编辑草稿 / 数值提交 | `-` / `1.` 草稿保留；blur/Enter 提交合法数值 | 保留；新增 Escape 取消尚未提交的草稿并恢复宿主值，不发值变更 |
| 禁用 vs 只读 | 只有 disabled | 新增 `readOnly`，保留可聚焦输入，阻止输入、步进、提交，并禁用按钮 |
| 动态范围 | 改 min/max 不会立即标错 | 越界和反向配置立即显示错误；不钳制宿主值、不发送伪用户变更 |
| 空值步进 | `Number('')` 被视为 0，负值范围的加按钮可能被误禁用 | 空值不参与禁用边界比较；首次步进归入有效范围，非有限 step 回退 1 |
| 控制按钮 / 表单 | 固定按钮，缺字段身份 | 新增 `controls`（默认 true）、`name`、`id`、`required`、`hint` |
| 小数、IME、未知值 | 有精度/step/null/IME 契约 | 保留，输入法确认不会误提交或步进 |

明确保留差异：没有任意精度字符串、格式化/解析器、货币本地化、滚轮调值、拖动调值、长按加速或额外修饰键步长。数值仍为 JS `number \| null`，不能承诺财务高精度。越界手工输入保留草稿并拒绝提交；按钮/方向键步进会钳制到界限。`name` 提交当前显示的输入字符串；应用提交前仍应采用受控数值和现有表单校验。

## RemoteMultiSelect / Combobox

参考 [Ant Design Select](https://ant.design/components/select/#api) 的 multiple、选中标签、清空、远程搜索，以及 [MUI Autocomplete](https://mui.com/material-ui/react-autocomplete/#asynchronous-requests) / [API](https://mui.com/material-ui/api/autocomplete/) 的独立 input/value、持续选择、只读和选中语义。

| 核对项 | 原实现 | 本次补齐 / 保留 |
| --- | --- | --- |
| 服务端结果 / 已选值 | query/options/value 独立受控；完整 Choice 保留跨查询标签 | 保留；组件不本地过滤、请求、防抖或处理响应次序 |
| 连续多选 | 每选一项就关闭；listbox 无多选语义 | 多选默认 `closeOnSelect=false`，持续选择；listbox 添加 `aria-multiselectable`，选中选项正确 `aria-selected` |
| 查询重置 | 保留 query | 继续默认保留；新增显式 `clearQueryOnSelect=true` 可在选择后发送空查询 |
| 删除 / 焦点 | 标签按钮删除后焦点可能落到 body | 删除/清空后回输入框；空查询 Backspace 删除最后一个可移除标签，尊重锁定项和 IME |
| 只读 / 清空 / 辅助 | 缺只读及配置 | 新增 `readOnly`、`clearable`、`placeholder`、`hint`；只读输入不打开候选，标签不能删除 |
| 原生 FormData | 缺失 | `name` 为每个受控选中 key 渲染同名 hidden input，包含锁定选中项，disabled 不提交 |
| 既有单选 Combobox 兼容 | 选完关闭 | 默认仍关闭；新增可选 `selectedValues`、`closeOnSelect`、`onEmptyBackspace` 及 readOnly/id/hint/placeholder 支持多选包装，不改变单选 value 类型 |

明确保留差异：没有 freeSolo、自动 tokenization、本地分组/筛选、虚拟列表或任意 option renderer。已经选中的候选会标记为选中并跳过重复添加；取消选择通过标签、清空或 Backspace，未把选项点击改成反选。loading/error 仍阻止选取过期候选；已选值保持可见并可按宿主规则删除。未提交的输入不成为选中值。

## TreeSelect

参考 [Ant Design TreeSelect API](https://ant.design/components/tree-select/#api) 的节点可选性、受控展开和严格独立选中；交互基线参考 [MUI X Tree View accessibility](https://mui.com/x/react-tree-view/accessibility/)。Rhine 当前是内联树选择视图，形态更接近 MUI Tree View，不是 AntD 的下拉 TreeSelect。

| 核对项 | 原实现 | 本次补齐 / 保留 |
| --- | --- | --- |
| 选中/展开所有权 | 独立受控，父子不联动 | 保留；不自动传播选中，不隐式展开所有选中祖先 |
| 初次 Tab 进入 | 总在第一个可见节点 | 优先第一个可见已选项；之后保持用户浏览的节点 |
| Arrow / Home / End | 已支持层级导航 | 保留；DOM id 基于稳定 node id，避免展开改变数组下标导致标识漂移 |
| 字符导航 | 缺失 | 添加 500ms 连续前缀匹配；重复字符在同前缀节点间循环；不修改选择，不触发服务端查询 |
| 批量键盘操作 | 缺失 | `*` 展开同层分支；Ctrl/⌘+A 切换当前可见可选节点，保留不可见/禁选已选 key |
| 节点可选性 | 只有 disabled | 新增 `selectable=false` 作为结构节点，仍可展开/导航 |
| 外部收起 / 焦点 | 焦点节点移除后可能丢到 body | 宿主收起分支时恢复到可见祖先；没有祖先时恢复可见已选/首节点 |
| 只读 / 表单 | 缺失 | 新增 `readOnly`，可继续浏览展开但不能选中；`name` 同名 hidden inputs 提交受控 key |

明确保留差异：没有下拉搜索外壳、虚拟化、节点懒加载调度或级联半选；宿主更新 nodes/expandedKeys 即可显示加载后的节点。多选采用独立勾选模式，不内建 Shift 范围选择。Enter 与 Space 均选择节点，分支展开由方向键/展开按钮负责，保持原有契约；这和 MUI 的分支 Enter 展开行为不同。禁选节点仍可获焦浏览并展开，以免其可选子节点不可达。Ctrl/⌘+A 仅限可见节点，不推断未加载数据。

## 回归证据

`tests/FormParity.test.tsx` 新增 **14** 个行为测试，覆盖动态日期错误与通知、通知回调稳定性、反向/非法预设、只读保护、数值取消草稿和空值步进、多选连续选择与 aria、锁定标签/IME、删除焦点、单选兼容、树类型导航/批选/外部收起焦点和字符事件不冒泡。`tests/Extensions.test.tsx` 保留原有受控/IME/跨查询与禁选树行为证据。

本次负责范围已运行 FormParity + CommonComponents（27 个用例通过）及 TypeScript 检查。独立 Chromium 会话 `rhine-forms-parity` 在 `http://127.0.0.1:18309/#advanced-forms` 验证 16 项真实输入/键盘/焦点/只读断言；三主题 × 400/520/880 宽度及三次 CSS 200% 缩放均没有 document/main 横向溢出，控制台 0 错误。局部截图为忽略目录 `output/playwright/forms-parity-400.png`。完整生产构建和跨组件回归由本轮主报告汇总；这里不把 JSDOM 或 Chromium 日期字段测试称为所有系统原生日期面板或屏幕阅读器验证。
