# 提示、关闭、范围与选择生命周期

本契约描述0.15.0的#224–#229新增API，与#219–#223共同进入本版本范围。正式制品与渠道状态见[0.15.0发行说明](releases/0.15.0.md)；按实际安装版本及SHA核对，不将任意工作区或展台当作正式包。原候选证据按各自修订保留。

## Tooltip：结构化只读事实

TooltipProps.content保留string，也接受TooltipDetails：可选title、必填rows（每行为label/value字符串）与可选description。这里刻意只接文本数据，不接任意React组件、按钮、输入或HTML。width可为44–640之间的有限CSS像素数，省略保留原宽度；实际显示仍受现有Portal、视口与CSS zoom边界约束。数据格式化、未知/部分/错误描述归宿主。

同一Radix Tooltip继续拥有悬停延迟、键盘聚焦与Escape；键盘聚焦触发的自动滚动不再立刻抹掉提示，显式Escape/点按/外点仍可关闭，不用title字符串代替结构。触屏点按不保证打开悬停提示；关键事实须常驻，交互内容使用Popover/Dialog。展台#tooltip同时呈现常驻明细与420px数据行，未知/部分/失败均不伪装成已知值。

## Dialog：关闭门禁与归焦

Dialog/Drawer新增closingDisabled、closeDisabledReason。门禁作用于库拥有的关闭按钮、Escape、外点与嵌套关闭委托，关闭按钮禁用，理由持续可读，内容aria-busy。outsideDismiss默认true，保持点击背景可关闭；设为false时只拦截背景和外点，Escape、标题栏关闭和宿主页脚关闭仍可用，直到closingDisabled统一阻断。它不修改宿主open状态、不取消后台请求，也不能拦截宿主直接把open置false或卸载；宿主导航、footer和自定义headerActions须使用同一门禁。成功/失败/未知、请求代次与草稿仍归宿主。

trigger现在可选；没有trigger时须受控open。returnFocus接受HTMLElement或返回当前稳定目标的获取器。真实trigger优先；无trigger时先尊重已经发生的主动交焦，再用显式目标或保存的打开前调用者/存活祖先。失效、hidden/inert、禁用目标不作可用焦点；鼠标调用者未取得焦点且显式目标失效时，退到组件所在的存活main/父Dialog或具名region；需要时祖先临时加入tabIndex=-1，在失焦恢复原属性，不添加假隐藏触发器。调用者可能被删除时，宿主宜用获取器返回现存具名上下文。onCloseAutoFocus仍先执行，可preventDefault接管。

ConfirmDialog同样可受控open、无trigger及配置returnFocus、closingDisabled。内部Promise在途门禁与外部门禁合并，重复激活不重放。旧默认resultMode=legacy保留resolved void视为完成；新业务使用explicit：仅true或{status:'success'}关闭，false/error保持失败，undefined/unknown保持未知，异常保持失败。不要捕获异常后无返回再把legacy误称为验证成功。外部关闭/卸载或重开会使旧响应代次失效，迟到结果不能关闭新一轮确认；受控关闭后重新打开时也不显示上一轮已返回的失败或未知提示。不自动重试业务写入。

## Slider与RangeSlider

Slider原number/value/onChange调用继续可用，新增marks:SliderMark[]与getValueText。刻度是范围内的只读值/人类文字，最多40个；网格保留实际文字高度，外侧标签向内对齐，位置按(min,max)计算，不影响业务值。范围、步长及外部值非法时，显示原数值与明确错误并禁用编辑，不默默把原值夹紧后通知宿主。

RangeSlider是同一条轨道上的两个原生range输入。value为只读[number,number]，onChange给出新的成对提案；thumbLabels分别命名，getValueText(value,index)提供单位文字。min/max/step必须有限且合法，minGap默认step且必须正数。值须在范围内、落在相对min的步长格点、严格有序且至少相差minGap；非法外部值只显示错误与原值，不发修正提案。

拖动/点击选择较近游标，44px高操作区和44px游标，禁止跨越且不推挤另一端；键盘方向键一格、Page十格、Home/End到该端合法边界。横向方向键和指针都沿显示轴：RTL 最小值在物理右端，Right 减小、Left 增大；上下、Page 与 Home/End 保留数值语义。游标和刻度随同一轴。受控拒绝保持宿主旧值。readOnly保留可读值与原生表单序列化但阻止编辑，disabled排除提交；祖先fieldset禁用在指针开始、拖动提案和键盘/变更时按真实输入的:disabled检查，保留first legend例外。names为两端字段名，form可外关联。type=range无文本IME草稿，数字联动使用现有NumberField的IME/无效草稿契约。动态上限由宿主提供，720分钟内600现值保持可见；若宿主降到240，明确报告非法，不能静默改成240。

## RemoteMultiSelect与TreeSelect生命周期

两者提供open/onOpenChange和onClose(reason)。onOpenChange是请求；受控拒绝关闭时浮层保持，onClose不会触发。onClose在已接受的可见true→false转换通知一次，选择期间只调用onValueChange。已接受打开会重置旧关闭原因；当前回调派发结束后仍保持打开的提交、或派发返回后的微任务截止会使未消费的请求原因过期，之后独立程序关闭保持programmatic，不复用complete/open。派发内flushSync更新提示不提前消耗原因，旧微任务也不清除新请求。跨窗口延迟接受时，宿主在设置open=false的同次状态更新显式传closeReason（例如complete/cancel）；重新打开时清除该声明。closeReason只作用于受控open的实际关闭，原生不可用/卸载的disabled/unmount原因优先。Remote程序打开可显式focusOnOpen聚焦真实查询入口，默认保留原Combobox不抢焦点的行为，空relatedTarget失焦本身不代表已完成，实际外点由现有Radix层分派。reason区分complete/cancel/escape/tab/outside/blur/selection/programmatic/disabled/unmount；unmount通知经微任务排除StrictMode效果重放，不当作完成或保存成功。宿主决定哪些关闭原因提交，通常Escape/取消撤销、不可用/卸载不提交。Tab按原焦点模型移至完成/后目标；关闭与归焦不抢新一轮或宿主主动交焦。

RemoteMultiSelect新增稳定id和受限inputProps（沿用Combobox QueryInputProps），实际query input拥有label/外部描述/validationError关系，不依赖rest偷偷透传。原name序列化已选值；inputProps.name若提供则另序列化查询，调用方不要误作选择值。maxSelected只阻止新增，达到上限后已选仍可取消；本地标签删除、Backspace、清空、分页/加载/重试和选择标记仍由库管理。

TreeSelect默认内联与独立父子选择保留，dropdown可受控生命周期。searchable/query/onQueryChange按节点名和完整路径筛选，保留匹配祖先并临时展开必要路径，不隐式改选择或持久化自动展开；其余展开仍归宿主。搜索期间必要祖先不折叠，清空恢复原受控展开。节点不可选仍可展开；不提供隐式级联选中。长列表、同名不同路径和无法识别的已选id保留，完整路径标签区分同名，完全相同路径另附id。未知项可移除，禁用项保留。

TreeSelect的maxVisibleTags默认3，和RemoteMultiSelect复用同一标签渲染，展开/收起/逐项删除/清空不复制树引擎。dropdown id关联常驻真实触发按钮，搜索输入使用id-query；内联可搜索时id关联真实搜索输入。inputProps用于搜索，name用于已选隐藏字段；hint/validationError关联两种入口。readonly可搜索/浏览但不改选择，disabled不能打开。原生fieldset禁用同样传递到Portal内容；局部观察entry与祖先fieldset的禁用/legend结构，memo跳过子组件渲染也会同步实际可用性；禁用时请求关闭并以disabled通知实际不可用，重新启用不将入口卡成永久disabled。没有onQueryChange的受控query为只读，IME组合期间保留草稿且不提交筛选。

展台#remote-lifecycle示范失败回退最后确认值，#tree-select示范失败保留未保存草稿，两者都展示确认值和在途状态；重开/外部同步使旧结果失效。它们只是宿主配方，不发真实权限写入。

## DataTable：行激活、匹配与表头帮助

DataTable.rowAction提供label(row)、onActivate(row)、可选isDisabled(row)及id(row)。表格仍保留table/row/cell，额外具名44px原生按钮提供Enter/Space键盘入口；普通单元格可点击激活同一行。链接、按钮、表单控件、标签、summary、contenteditable、带tabIndex/交互角色或data-row-interactive的内部交互不激活行，文本选择和第二次连击不重复激活。不要把勾选当激活。onActivate始终按当前可见稳定id解析最新行；业务权限与版本检查归宿主。

selection.mixedKeys 由调用方给出半选行；对可见且可选的行，表头把已有半选视为部分选择，即使同一键也在 keys 中。只有这些行都完全勾选时才提出清空，否则提出补足，保留不可选及跨页键。宿主收到提案后仍负责重算 mixedKeys；库不级联、排除隐藏后代或决定导出。expansion.rowToggle为true时，非交互正文点击只切换展开，选择框和行命令不串到展开。selection/expansion/sticky功能继续独立，loading或isDisabled阻止行激活。刷新移除持焦行控件后，如果没有主动交焦，回到原具名表格滚动区域；宿主详情可通过rowAction.id与Dialog.returnFocus返回稳定行，失效时返回具名上下文。

DataColumn.header仍是string，作为精确列名；headerDescription提供关联且可见的简短说明（不让绝对定位的隐藏节点扩展主区），headerHelp接Tooltip字符串或TooltipDetails，并生成独立44px“关于…”按钮。帮助不嵌在排序按钮里，排序目标、方向及列名保持明确。列内容槽不要求消费覆盖内部th或把帮助藏入无关联页脚。

## 验证边界

单元测试覆盖状态/原生FormData/无效值/拒绝/失效对象，真实展台另验证指针、键盘、触屏既有边界、主题、局部窄容器及CSS zoom。CSS zoom不证明浏览器原生缩放，WebKit不是完整Safari，合成在途/复制不证明真实后端或系统剪贴板；未验证项目不得计PASS。正式消费需等待独立固定制品及实际版本验收，不升级真实产品或删旧依赖来替代验证。
