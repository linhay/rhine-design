# 模板驱动配置与来源→目标编辑

这是 **#78 未发布源码能力**。`MappingEditor` 从主入口导出；npm 0.11.3不包含它。固定精确候选、完成消费验收后，才能删除产品映射布局适配。合成展台 `#template-settings` / `?fixture=template-settings` 使用内存数据，不表示真实持久化、权限检查或批量业务提交。

## 模式与职责

仅在产品明确采用“模板驱动配置”时，应用栏目只选择已保存模板并只读预览；新建、改名、增删规则统一进入独立模板编辑栏目。不把这个约束推广到所有设置。保存模板不修改目标；模板只包含名称、版本和规则，不包含目标集合或其他批量设置。

应用默认不修改规则与其他设置。选择不是保存成功；预览不是已生效。确认前显示所选模板名称/可见版本、逐目标实际差异（包含具体来源→目标新增/删除/替换，不能只有条数）、跳过原因和不变项。二态功能优先一个有明确名称的Switch：单对象回显原值；多对象只有全部开启才checked，混合显示“部分对象已开启”短hint。宿主以未修改状态独立于布尔草稿建模，未操作保留各自原值，切换后才形成统一草稿。已有显式提交的工作区只在footer预览/确认生效；逐对象影响集中在确认内容，不常驻重复标题、统计、状态或三选控件。这取代早期“保持/全部开启/全部关闭”三选建议。空模板可以保存；应用空模板意味着清空规则，需在只读预览和差异中明确表达。

本组合的关闭与Escape只隐藏Dialog，重开保留目标、查询和全部草稿，不执行放弃，因此不弹放弃确认。footer撤销是明确的草稿重置操作。产品若将关闭定义为放弃，长列表也必须让确认提示及安全继续动作可见并归焦，继续后恢复原控件；不能仅凭提示存在于DOM判断可操作。

宿主持有跨栏目草稿与稳定行id，栏目切换不能用变化key重建整个Dialog。保存失败保留草稿并允许重试；重名先报告明确错误，不暗中覆盖。保存已选择的模板后，示例使旧选择失效并要求重选版本；产品也可采用清晰可见的固定版本策略，禁止显示新名称却提交旧规则。异步结果必须按提交快照和请求归属处理，不覆盖更新后的编辑；示例保存中锁定所有模板写入口，包括关闭后外部夹具加载按钮；重新打开仍锁定至请求完成。离开示例清理计时器。业务服务、权限、可选目录、允许关系、去重、持久化和调度都归宿主，不增加模板数据库或配置框架。

窗口选型沿用[设置Dialog](SETTINGS_DIALOG.md)：宿主提供期望height，直接按钮/Fragment footer与navigation；短任务仍自然高度。只在帮助决策时展示description，错误/未保存/冲突/影响范围反馈保留。头尾固定，正文和长导航独立滚动，窄屏不做wheel转发。

## 对象上下文与最小组合

单对象卡片入口绑定整个Dialog的固定身份，在标题/description显示一次当前对象；功能正文不重复放对象搜索、多选或清空。批量入口始终保留独立对象栏，即使当前只选了一个对象也不改变布局；目标集合、搜索和功能草稿由宿主持有，跨栏目保留。撤销功能草稿不清空目标。预览建立目标与草稿快照，确认期间禁用对象选择并停留在确认内容，返回编辑后恢复。

现有`Dialog.navigation`与`sidePanel`互斥，不能同时传入。当前最小组合保留`navigation={<SideNav ... />}`，在`children`内并列对象栏与功能正文：对象栏复用公开RemoteMultiSelect，宽容器分列，窄容器堆到正文上方，共用既有正文滚动和固定footer。单对象省略对象栏，不扩展Dialog API或增加业务框架。目标栏不随功能条件卸载；目标数量不参与容器布局判断。需要对象栏自身固定/独立滚动的产品须另行验收，不把此例外推为任意三栏框架。

查询、分页、已选对象标签与权限由宿主提供给RemoteMultiSelect。展台以三条合成对象模拟宿主查询与分页，每页两条，不代表真实服务；生产对接必须沿用服务端搜索/分页、取消与迟到响应策略。不可编辑对象在确认内容标记跳过。

## MappingEditor 公共契约

```tsx
const [rows, setRows] = useState<MappingEditorRow[]>([]);
const nextId = useRef(0);
<MappingEditor label="转换规则" rows={rows}
  sourceOptions={sourceOptions} targetOptions={targetOptions}
  onRowChange={(id, values) => setRows(current => current.map(row =>
    row.id === id ? { ...row, ...values } : row))}
  onRemove={id => setRows(current => current.filter(row => row.id !== id))}
  onAdd={() => {
    const id = `rule-${nextId.current++}`;
    setRows(current => [...current, { id, source: '', target: '' }]);
    return id;
  }} />
```

| 输入 | 契约 |
| --- | --- |
| `label` | 必填，整组可访问名称。 |
| `rows` | 受控只读数组；每行含唯一稳定 `id`、`source`、`target`。不使用数组下标作id，不由组件生成业务行。空串表示尚未选择。 |
| `sourceOptions / targetOptions` | 两侧 `readonly Choice[]`，支持 `disabled`；不预置产品目录。行上可提供同名数组覆盖，实现宿主定义的关系或重复来源禁选。 |
| 行 `error / disabled / readOnly` | 逐行错误关联两侧字段；禁用阻止更改/删除，只读以可换行文本显示并保留方向可访问信息。缺失目录值显示原值与“不可用”，不会悄悄切换选项。 |
| `onRowChange(id, {source,target})` | 仅发出改动，宿主回传新rows；不保存、不校验关系。 |
| `onAdd?(): string \| undefined` | 可选添加按钮。宿主在事件中同步追加受控行并返回其id；返回undefined表示取消。异步创建先在宿主处理，再通过自己的焦点策略载入，不把尚未存在的id作为成功。 |
| `onRemove?(id)` | 可选删除按钮；宿主同步更新受控rows。拒绝删除保留原焦点，不做乐观删除。 |
| `disabled / readOnly` | 整组状态；禁用覆盖全部编辑动作，只读移除所有编辑/增删控件。保存中由宿主传disabled，并在外部展示busy/结果。 |
| `sourceLabel / targetLabel` | 默认“来源 / 目标”。视觉标签隐藏，但真实label始终为“第N行 来源/目标”。可用 `rowLabel(index)` 自定义行序号文本，index从0起。不要返回空名。 |
| `sourcePlaceholder / targetPlaceholder` | 默认“选择来源 / 选择目标”；空目标提示不替代宿主校验。 |
| `addLabel / removeLabel / emptyContent` | 默认“添加规则 / 删除 / 暂无规则”；删除按钮可访问名附带行序号，空态可自定义。 |

箭头仅装饰，不额外读出；两侧复用原生Select，保持原生键盘选项。行错误可表达重复来源；选项禁用只是辅助，宿主仍负责最终规则校验。控件至少44×44 CSS px；宽容器为来源、箭头、目标、删除，窄于480 CSS px时按该顺序上下重排，删除靠右。长选项收于Select宽度内，只读值可换行。固定行id使删除中间行时后续Select DOM与状态不串行。

添加成功后聚焦新行来源，兼容普通React批处理和宿主`flushSync`同步提交：回调返回后安排一次组件提交来消费焦点意图，拒绝新增也及时清除意图，不用延时器在未来抢焦点；删除后依次寻找原位置之后、之前的可编辑行来源；无可编辑行回添加按钮，无添加按钮回整组焦点入口。取消/拒绝动作不移动焦点；宿主已移走焦点时不抢回。Tab/ShiftTab与原生Select选择沿用浏览器；需要异步增删或自定义跨页面焦点交接时由宿主明确处理。

## 真实组合验收

展台提供固定身份的单对象入口与独立对象栏的批量入口；应用栏目只有模板选择和只读规则，编辑栏目维护独立草稿，其他栏目仅一个Switch与必要的混合提示。合成目标甲/乙原值混合，丙模拟不可编辑，并保留逐目标差异/不变/跳过。新建空模板、改名、重名、失败/重试、保存中、已选模板更新失效均可交互。外部“载入八行草稿”“载入重复来源与空目标”和编辑器状态控件仅用于验收夹具。

`tests/MappingEditor.test.tsx`验证受控回调、稳定行DOM、禁用/只读/错误、空目录值与增删焦点；`tests/TemplateSettings.test.tsx`验证保存和应用分离、混合目标、版本失效及失败重试。真实浏览器另验三主题四宽度、100/200% CSS zoom、648px短屏、长文重排、滚动、44px、键盘和系统/手动减少动态。CSS zoom不等于原生缩放，合成Memory状态不等于业务后端。

浏览器回归入口：`scripts/check-template-settings.js`（48组布局/增删/草稿/只读禁用/键盘/滚轮，另测三种动态偏好）、`scripts/check-template-workflow.js`（24组模板管理与逐目标确认、宿主焦点交接）、`scripts/prepare-template-consumer.mjs <tarball> <new-directory>`（从实际已安装包提取同一合成例，公开入口及后置CSS生产构建）。


原生键盘选择使用 `check-template-keyboard.js`：宿主提供Alpha/Beta/Gamma等合成选项，真实focus + 字母按键改变受控来源和目标，切栏目后仍保留，不使用selectOption或修改DOM选项替代键盘。方向键原生弹出菜单在Chromium/WebKit自动化及无React HTML基线均未改变值，该路径单列SKIPPED，不影响已单独证明的键入选择；原生网页缩放、屏幕阅读器语音未覆盖。

`check-template-context.js`覆盖单/批量对象上下文、查询分页、跨栏目保留、预览锁目标/返回恢复、Switch真实空格键草稿与确认、对象栏宽窄重排及固定footer。`check-mapping-add-focus.js`以真实Enter/字母键覆盖普通提交、flushSync、宿主主动移焦、取消/拒绝新增。

对象选择Portal关闭后的归焦尊重用户/宿主已转到Switch等外部控件，不因旧scope延迟卸载重新抢焦点；快速重开继续按打开代次保护。实际回归包含关闭后立即Space、Tab离开及快速重开。
