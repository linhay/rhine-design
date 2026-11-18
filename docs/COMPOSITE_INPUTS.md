# 自由标签、富摘要折叠与结构化命令菜单

本契约对应 0.16.0 范围内的 #230–#232，不包含于已有 v0.15.0 tag。消费方按实际安装制品核对公开导出；渠道见[发行说明](releases/0.16.0.md)。数据、校验、权限、请求和保存仍归宿主。

## TagInput

`TagInput`接`label`、受控`value:readonly string[]`和`onValueChange(next:string[])`。每项保持字符串大小写、顺序和外部值，只在明确提交新项时按规则处理。它复用已有选中标签，独立管理草稿、IME和归焦。

| 行为 | 默认与选择 |
| --- | --- |
| Enter | 非组合态、无修饰键时确认草稿；Shift+Enter只编辑多行草稿 |
| separators | 默认空数组；配置的单个Unicode字符触发提交，并用于显式粘贴拆分 |
| pasteBehavior | 默认draft：粘贴只改文本；split按分隔符提出完整片段，末尾未终止片段保留草稿 |
| commitOnBlur | 默认false；true只在焦点离开整个组合且目标明确时提交；标签/建议内交焦和空relatedTarget不提交 |
| trim / allowDuplicates | 默认true/false，只处理新增项；重复按完整字符串精确判断，不改大小写、不重排 |
| maxLength / maxTags | 默认无约束；maxLength计UTF-16单元；超限拒绝提案，外部值照常展示、移除及序列化 |
| validateTag(tag, values) | 同步纯校验，错误字符串表示拒绝；整批先验证，任一失败不发部分提案，完整草稿保留 |
| query / onQueryChange / defaultQuery | 可选受控或本地草稿；组合期间保留IME文本，结束时才提出最终query |
| maxVisibleTags | 默认3，仅限制初始常显，支持0；展开可查全部值，name仍提交全部值 |
| suggestions / maxSuggestions | 可选建议按钮组，默认最多6项；大小写无关筛选只影响发现，提交原字符串，自由输入不依赖目录 |

`onValueChange`是提案。宿主拒绝不改变已选或抹掉草稿；当前草稿未被新输入替换且实际值完整表示提案，才清除已确认部分并保留未提交末尾。受控query也可拒绝清空。外部同步不把新输入当作已提交内容。

真实入口是textarea；id/label、hint/error和外部描述关联入口。name/form只用于重复隐藏已选值，不提交草稿；required是已选值的可访问元数据，必填校验由宿主以error提供。只读可选择文本和展开检查，禁用/原生祖先fieldset禁用不提出值或query变更，保留first legend例外。

提案接纳快照与发给宿主的可变数组分离；新composition作废旧清理意图。宿主外部删除或禁用持焦标签时，仅在未发生有效外部交焦且真实入口仍可用时恢复到入口。

可见标签用浏览器完整Tab路径进入（macOS WebKit当前偏好为Option+Tab）；也可不依赖该偏好，入口开头ArrowLeft进入末项，左右键移动，Delete/Backspace移除后归入口；入口空草稿Backspace移除末项。清空选择只清已确认值，保留草稿。

```tsx
import {useState} from 'react';
import {TagInput} from '@linhey/rhine-design';
function Models(){
  const [value,setValue]=useState<string[]>([]);
  return <TagInput label="模型" value={value} onValueChange={setValue}
    separators={[',','\n']} pasteBehavior="split" name="models"
    suggestions={['Alpha','中文模型']} maxVisibleTags={3}/>;
}
```

## Disclosure

旧title:string、children、defaultOpen和ariaLabel保留；summary?:ReactNode是只读视觉摘要，title/ariaLabel提供真实summary的名称。重要数量/状态须等价写入ariaLabel。槽内容inert且aria-hidden，不嵌入额外Tab动作，不用指示符样式覆盖标记。

open?:boolean与onOpenChange(next:boolean)分别表示接受状态和请求。受控拒绝不打开、动画或提前挂载。lazyMount默认false保留eager；true在首个接受展开时挂载，之后闭合保留children状态。关闭内容退出键盘/可访问顺序，内容持焦时回真实summary，宿主主动交焦则保持。原WAAPI、快速反转、运行时减少动态/0ms结算和相邻分隔线保留。

## Menu

MenuItem保留id/label/icon/disabled/danger/onSelect及旧扁平数组。icon已存在于0.15来源，本轮不重建图标目录。MenuProps.items接readonly MenuEntry[]：

| 条目 | 公开数据与语义 |
| --- | --- |
| item（type可省略） | 原普通动作，选择后关闭；真实trigger或宿主显式交焦继续可用 |
| separator | type/id，真实非执行分隔 |
| group | type/id/label/items，具名组，可含结构化子项 |
| radio-group | type/id/label/value/onValueChange/items；RadioItem有id/value/label/icon等，使用Radix radio与aria-checked |
| checkbox | type/id/label/checked/onCheckedChange，使用Radix checkbox语义 |

radio/checkbox保留菜单，checked只跟随宿主接受值，拒绝请求不显示假选中。radio未知/已删除值保持无选中，不替宿主挑选。id 在菜单树内唯一。旧普通动作仍支持唯一的空或纯空白字符串；新增结构化条目、分组和单选项要求非空白 id，单选 value 在组内非空且唯一。disabledReason可见并通过aria-describedby关联，名称保持label；禁用项不执行，危险态有明确文字。长标签/原因换行，条目44px，分隔和组名不进入执行焦点序列。菜单高度以480px和当前视口内边界中较小者封顶并可滚动，避免将Radix随定位变化的available-height反馈进自身高度。

## 样例与边界

真实展台：`#tag-input`、`#disclosure`（原`#collapse`保留独立Collapse）、`#menu-actions`。示例分开提案与接受，含拒绝、只读/禁用、长值和内容状态保留。几何/键盘/Portal/主题/缩放按当次记录；composition/clipboard事件不外推系统输入法候选窗或剪贴板。CSS zoom不外推原生缩放，WebKit自动化不等同完整Safari或读屏语音。
