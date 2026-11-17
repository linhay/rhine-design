# 常驻Tree与移动提案（0.15.0；#221）

Tree保留label/nodes/selected/onSelect旧调用，展开仍可内部持有；新增可选expandedKeys/onExpandedChange及defaultExpandedKeys，受控拒绝不覆盖宿主状态。底层与TreeSelect内联/下拉共用TreeView，不引入第二套树或Ant兼容层。节点id全树唯一非空，深度不超过100；非法输入明确报错。BrowseNode支持disabled/selectable/description，子节点仍readonly。

Tree新增disabled/readOnly/loading/error/onRetry；禁用或失败/读取中不选择、不展开、不移动。只读允许浏览/展开，但不改选择或移动；node.disabled和selectable=false都不剥夺浏览/展开能力。焦点、选择与展开分开，刷新后按稳定id或存活祖先恢复；没有存活祖先时留在具名树容器，不自动跳到另一业务节点。主动移到树外的焦点不被回收。

renderNode(node,state)用于名称、编号、匹配数与标签等只读内容，state包含selected/expanded/disabled。该槽inert并隐藏于独立无障碍遍历，不能偷偷增加Tab停靠或交互；node.label作为treeitem名称，额外重要事实用description提供等价说明。移动手柄由库在槽外单独提供；不要在只读槽里放自定义动作。搜索/过滤和展开策略由宿主负责，#tree样例只加mark，不清选择或展开。

onMove启用44px独立移动手柄。拖放按目标行上/中/下三段产生before/inside/after；Shift+F10在当前节点打开同一可达移动表单，原生目标/位置选择、提交和取消均可键盘操作。常规Tab只停靠一个可见treeitem，手柄通过指针或快捷键进入，不添加第二套树焦点模型。带移动手柄的行保留至少240px的可读/可操作宽度，极窄容器由树自身横向滚动，不挤掉44px手柄或让主区横溢。

提案为{sourceId,targetId,position,via:'drag'|'controls'}；controls表示表单路径，也可由鼠标操作，不声称设备检测。库仅发一次提案，不重排或持久化数据，不把回调返回/Promise完成写成移动成功。自移、移入后代、丢失/禁用节点及不同树的外来拖放不提出；movable与同步canMove可进一步收窄。canMove只有明确true才放行，业务提交前仍须按最新权限/revision重复校验，不能把手势校验当授权。

确认、请求、失败/未知、取消、revision和迟到结果全由宿主处理。提案通知前同步交焦到稳定树容器，再按仍可见的源id/祖先恢复；尊重宿主主动交焦，不加全局监听或固定补焦延时。源节点卸载/重排、节点内容变化和取消状态均不冒称完成。

#tree真实样例有多级/长名称、匹配标记、部分可选、读错重试/空/读取中/只读/禁用，以及宿主确认、300ms可清理合成回读、失败重试、未知不改树、关闭取消和刷新revision失效。延迟用于演示结果，不用于修补焦点。所有数据为合成，不是组织接口或真实移动验收。

源码候选不包含于registry0.14.0。固定包验证、正式发行与真实消费升级分别记录；本轮不自动替换消费项目或删除其依赖。原常驻树阅读配方见[RESIDENT_TREE](RESIDENT_TREE.md)，其历史语义HTML样例不等于新公开Tree接口。
