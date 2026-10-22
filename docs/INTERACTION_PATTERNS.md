# 场景、组件与交互选型

本规范面向通用工具、管理界面和数据应用。先确定用户任务、信息是否需要持续可见、是否允许中断，再选组件。视觉沿用莱茵设计；行为参考成熟模式。`preview/PatternGallery.tsx` 提供可操作的选型示例。

**版本边界：**本页新增的 SideNav、Breadcrumbs、Steps、Drawer、Fieldset、ErrorSummary 当前属于 main 源码的未发布能力。npm 0.3.0 不包含它们；接入前核对 `components/index.ts`，使用固定源码提交或等待后续正式版本。

## 快速决策

| 场景 | 组件组合 | 交互与状态 | 不宜使用 |
| --- | --- | --- | --- |
| 跨工作区、跨模块 | SideNav + Breadcrumbs | 当前页有文字、边界与 aria-current；路由变化后由宿主聚焦主内容 | Tabs 不代替全局导航；面包屑不显示浏览历史 |
| 同一对象的内容页签 | Tabs | 方向键选项、隐藏面板退出可访问树；焦点留在选项 | 不用一串按钮伪装页签 |
| 单视图指标或显示模式 | SegmentedControl | 原生单选，状态即时更新 | 不用于独立页面或执行命令 |
| 多字段配置 | Fieldset + TextField/Select + ErrorSummary | 提交后校验，摘要聚焦，链接回字段，保留已填值 | 不只弹 Toast；不在每次输入时抢焦点 |
| 线性配置流程 | Steps + Fieldset | 业务验证后推进，已完成步骤可返回；保留跨步数据 | 不自动走步骤，不拿步骤数估计后台进度 |
| 列表记录临时详情 | Drawer + KeyValue | 模态详情保留底层列表；进入限制焦点，Escape 关闭并归还 | 长编辑、需要分享链接的详情用独立页 |
| 短时独立任务 | Dialog | 一个明确任务，标题、说明、关闭路径齐全 | 不叠加多层任务弹窗 |
| 不可逆操作 | ConfirmDialog | 具体对象、影响、取消与明确动作；等真实结果，失败保留上下文 | 常规保存无需二次确认；可撤销优先撤销 |
| 简短成功反馈 | Toast | 不抢焦点；自动消失前允许 hover/focus 暂停 | 不能作为关键错误唯一载体 |
| 持续错误、离线或权限状态 | Notice | 就地说明原因、影响、下一步；需行动的信息持续显示 | 不用自动消失通知掩盖失败 |
| 首次加载 | Skeleton / Progress | 已知结构用骨架，未知进度不写百分比 | 不伪造进度，不循环品牌标志 |
| 保存、刷新 | Button busy + 保留旧数据 | 防重复提交；刷新明确旧值和更新时间；真实响应决定成败 | 不清空阅读上下文，不提前显示成功 |
| 大列表查询 | SearchField / Combobox + DataTable + Pagination | 宿主处理防抖、IME、取消与过期响应；服务端返回筛选排序分页 | 不为 UI 便利拉取全量本地筛选 |
| 少量/较多互斥选项 | RadioGroup / Select | Radio 展开选项便于比较，Select 压缩较长清单 | Menu 是命令，不能代替选择器 |
| 多选 / 即时二态设置 | Checkbox / Switch | Checkbox 选择项；Switch 即时偏好，若需保存明确说明 | 不混同“选中”与“已生效” |
| 补充说明 / 局部交互 | Tooltip / Popover | Tooltip 不放操作；Popover 可交互；鼠标、键盘均可触发 | 必要说明必须常驻，不能只在 hover 下出现 |
| 次级命令 | Menu | 动词命名、危险动作区分；键盘导航，Escape 返回入口 | 不把长表单放入菜单 |
| 尚无数据 / 筛选无结果 | EmptyState | 分别给创建或清除筛选；读失败用 Notice | 不能把错误、无权限当作空列表 |
| 监控与告警 | Metric + Badge + DataTable + Notice | 数值、单位、时间范围、最后更新时间齐全；陈旧数据标记；告警有文字和处理路径 | 未知不能填 0；红绿不能是唯一编码；告警不闪烁 |
| 启动与品牌识别 | Logo / 启动编排 | 三角、细线、分块归位；仅启动或主动重播；就绪立即进入 | 日常数据变化不反复播放品牌动画 |

## 新组件契约

| 导出 | 输入与责任 | 键盘、焦点、边界 |
| --- | --- | --- |
| SideNav | `groups[{label,items[{id,label,href}]}]`、`currentId`、`onNavigate(item,event)`；支持 nav 原生属性 | 原生链接可 Tab、打开新页；宿主接管路由时自行决定是否 preventDefault，保留修饰键语义；不自动滚动、鉴权或请求 |
| Breadcrumbs | `items[{label,href?}]`、`label`；最后一项是当前位置 | 带名称的 nav/ol；最后项 aria-current=page；只传真实父子层级，无 href 项为文本 |
| Steps | `items[{id,label,description?}]`、`current`、`error?`、`onStepChange?` | current 为从 0 开始的位置，等于项数代表完成；只允许点击已完成步骤；当前项 aria-current=step；错误有文字，不自动推进 |
| Drawer | 与 Dialog 相同：`trigger,title,description,children,open?,onOpenChange?` | 右侧模态面板；Radix 管理焦点限制、Escape 和归还；最近主题根继承动效偏好；可编辑内容需宿主保留草稿并在受控 onOpenChange 中处理未保存规则 |
| Fieldset | `legend,hint?,children` + 原生 fieldset 属性 | 原生 legend 分组、提示关联；disabled 禁用组内表单控件；不替代单字段标签 |
| ErrorSummary | `errors[{fieldId,message}]`、`title?`、`focusKey?` | 非空且 focusKey 变化时聚焦摘要；每次失败提交递增；链接聚焦已有字段并滚动到可见位置，不修改 hash 路由；fieldId 必须指向唯一、可聚焦字段；无错误不渲染 |

```tsx
// 提交时验证；不要在每次键入时递增 attempt。
const [errors, setErrors] = useState<FieldError[]>([]);
const [attempt, setAttempt] = useState(0);
function submit(event: FormEvent) {
  event.preventDefault();
  const next = name.trim() ? [] : [{ fieldId: 'name', message: '请输入名称' }];
  setErrors(next);
  setAttempt(value => value + 1);
  if (!next.length) { /* 宿主执行真实提交并处理 pending / success / failure */ }
}
// 在 form 内：
<ErrorSummary errors={errors} focusKey={attempt} />
<Fieldset legend="基本信息">
  <TextField id="name" label="名称" required value={name}
    onChange={event => setName(event.target.value)} error={errors[0]?.message} />
</Fieldset>
```

示例是组合片段；React hooks/types、组件导入、state 及 form 由宿主提供。异步校验必须忽略过期结果；摘要不负责业务验证。

## 动效按意图选择

| 意图 | 参数与效果 | 触发/结束 | 减少动态 |
| --- | --- | --- | --- |
| 指明可操作、选中 | 120ms 颜色/边界，按下 80ms | hover/press/选择；语义立即更新 | 即时颜色变化 |
| 呈现新内容、步骤 | 180ms opacity + 最多 3px | 新面板或当前步骤出现；单次 | 直接显示最终态 |
| 临时浮层、抽屉 | 160ms opacity，抽屉从右侧 3px | 打开；关闭立即解除遮挡并归还焦点 | 保留同样焦点规则，无位移 |
| 表单错误 | 即时文字、边界、摘要焦点 | 失败提交；纠正后重新验证 | 行为一致，无抖动 |
| 刷新数值、告警 | 原位替换，文字说明时间/严重性 | 真实数据更新 | 行为一致，无数字翻转 |
| 加载占位 | 已有 Skeleton/Progress 配方 | 请求结束或卸载终止 | 静态占位仍显示加载文字 |

共享 CSS token 是参数来源。仅声明必要属性，不使用 transition:all；优先 transform/opacity，不做整页高度动画、循环滤镜或滚动监听驱动的装饰。DOM 测量先读后写；能使用 CSS 的交互不另引动画运行时。

`/#motion` 有 12 组播放/重播/复位、4 倍慢放、逐例/全局减少动态示例。新增 Drawer 的弹层内重播只重启动画，不重新挂载、不清空输入或移动焦点；Steps 只模拟一次本步完成。错误反馈不加入“错误动画”，直接在 `/#form-workflow` 验证聚焦与纠错。

## 验收清单

1. 明确默认、加载、空、错误、成功、禁用、长文本各状态；不能仅凭颜色理解。
2. 键盘顺序符合阅读顺序；可见焦点；浮层 Escape 与焦点归还；错误定位不改变页面路由。
3. 400/520/880 宽度与 200% 等效重排无关键内容丢失；窄屏模态可滚动且关闭入口可达。
4. 系统/手动减少动态都保留信息；重复播放不会重执行业务动作或留下计时器。
5. 当前浏览器验证不代表原生 WebView、VoiceOver/Narrator 或完整 WCAG 审计通过。

参考来源与取舍见 [GitHub 调研](./REFERENCE_RESEARCH.md)。
