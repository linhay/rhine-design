# 图标语义（0.15.0；#219）

Icon的名称、IconName与公开只读iconNames来自同一份路径定义；旧名称全部保留。20×20线性网格支持16/20 CSS px，stroke继承currentColor，不内置主题颜色。不提供Ant图标名兼容壳或运行时外部图标依赖。

- 动作：download/delete/edit/send/filter/sortAscending/sortDescending/show/hide/export/move/swap/reset。
- 对象：person/users/organization/tree/document/folder/code/database/history/clock/key/lock/shield。
- 状态与帮助：warning/help/question；help为推荐名称，question为同形的明确同义名称。history带回转语义，clock仅表示时间；reset与refresh不同，export不冒充download；organization为组织关系，tree为层级目录。

已有settings/menu/close/chevronDown/chevronLeft/chevronRight/copy/refresh/plus/search/info/external/check/more/moreVertical/connection/chart保持行为。业务可用公开iconNames枚举和校验输入，不应通过存在于对象原型上的名字绕过核对。空、未知、原型名称与非16/20尺寸明确抛错，不静默输出空path。

默认Icon是装饰，aria-hidden=true，不进入Tab；具名静态图形可传非空label，得到role=img。动作使用具名IconButton或有完整文字的Button；label归动作，不靠SVG标题补按钮名称。MenuItem可选icon，同样装饰，不改变命令名称、方向键或禁用逻辑。busy/disabled沿用动作本身，不由图标推导成功。

真实展台#icon覆盖全部名称的16/20图形与44px图标动作、按钮/菜单/禁用/busy、未知名称宿主校验；平台资源另见[平台标记](PLATFORM_MARKS.md)，不混进一般Icon名称。源码候选不属于registry0.14.0；发行与真实消费升级仍是独立阶段。
