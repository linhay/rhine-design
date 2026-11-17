# 紧凑趋势（0.15.0；#223）

TrendChart新增可选density='regular'|'compact'，默认regular保留原完整图形/刻度/范围/图例/原始数据表。没有第二套曲线实现或监控引擎，不接受宿主复制SVG路径/圈点或覆盖私有高度来切换。

compact采用44px高的可聚焦/指针目标，在其中保留28px纵向绘图幅度；实际宽度随父级，可用于160px资源列。caption='hidden'只视觉隐藏figcaption，figure和SVG仍具名，范围/单位/说明仍能读取；旁边必须持续有父级度量标题。showLegend默认完整模式true、compact false，可显式打开。组件自己拥有这层可见性，不要求消费方CSS隐藏。

紧凑态始终有HTML峰值/最近/缺失数量摘要；峰值取原采样中的最大有限值（同峰保留首个），最近严格使用最后一项，即使它未知也不以之前已知项冒充。无数据与全未知分别显示，error/stale/loading反馈保持文字、不会只靠颜色。所有输入顺序、单位、时间范围、格式化与采样请求由宿主拥有，不做业务聚合/健康判定。

原point{id,label,value}与activePointId/defaultActivePointId/onActivePointChange继续有效，id须稳定唯一，重复label不合并时段。缺失/null/非有限值都未知，不补零或插值，折线在缺口断开。左右/Home/End、悬停/点击仍查看同一个时段；原始数据表保留全部输入顺序/值。没有有限值时不生成假图形，持焦图形被刷新移除时归给具名figure，不跳到其他样本。

valueFormatter仍用于显示；默认由图表附加unit。若formatter已经返回完整“值+单位”，须显式valueFormatterIncludesUnit=true，避免GiB GiB或量纲错配；此项只控制附加后缀，不转换原数值。未知不附单位；原始数据表仍保留精确数字，不能从格式化文字反算数据。

dataTable='collapsed'|'expanded'控制本次挂载的初始可见状态，默认收起；用户可继续展开/收起完整表格。没有禁用/删除数据入口的选项，summary目标至少44px，表格在局部可滚动，不缩字或删时段。若宿主希望外部默认改变，使用自己的内容生命周期明确切换，而不假装属性是受控开合状态。

#monitoring的紧凑资源样例覆盖CPU/内存/磁盘、实际160px列、缺口/全未知/空/单个零值/重复标签/极值与错误/陈旧/读取中；说明、图例、formatter可以真实切换。原完整模式样例同时保留。采样仅合成，不宣称真实监控或后端验收。源码候选不是registry0.14.0能力，正式包与消费方删除自绘代码仍待分别授权和核对。
