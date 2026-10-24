# 紧凑摘要与凭证操作

对应 [issue #14](https://github.com/linhay/rhine-design/issues/14)。本页的 `ButtonLink`、`StatusTimelineList` 与 `TimelineLegend` 扩展是源码候选，npm 0.6.0 尚未包含；使用前核对实际导出并固定消费来源。真实展台：`/#compact-account`。

## 从用户任务开始消融

先确定用户现在要识别什么、判断什么、执行什么，再选择常显信息。接口返回多少字段不决定界面有多少行。优先保留对象身份、当前有效读数、可执行动作、未知/失败与影响当前决策的后果；机制说明、重复状态和低频记录退出首屏。

每次删减都说明为何不影响任务，并验证反例：链接框与复制/下载已表达“有链接”，无需再堆叠“当前链接”和“已生成”；读取失败、无链接与操作结果未知仍须分别呈现。历史记录有内容时按需展开，空历史不占一块常驻区域。生成时间可进入记录，不能把时间本身删除或改成其他语义。

短风险提示放在相关动作附近。例如“链接可下载凭证，请勿分享。”持续可见；“重置或撤销后，旧链接失效。”紧邻管理入口。客户端如何轮询、接口如何返回，不是用户取得链接所需的首屏信息。若机制影响当前动作或恢复路径，则保留其具体后果，不能用消融隐藏失败或撤销边界。不展示与当前选择无关的技术徽标来代替用户可行动的提示。

## 只读摘要使用无框组合

外层 `Surface` 已定义对象边界时，内部额度摘要不再包细线圆角框。进度、剩余额度、重置时间与预测状态通过 `Progress`、`Text`、`Inline` 和 `Stack` 组合，必要分区使用 `Divider`；不能移除未知或预测失败的文字。

事实按共享维度配对：优先级与密钥数量一行；账号到期与订阅到期分别呈现；今日与本周期读数配对。复用 `KeyValue`、`Inline`、`Stack`，不把每个字段装成胶囊或小卡片。压缩来自移除装饰、重复标签和无意义空白，不减小业务字号、不裁切数字、不固定高度。保留双成本的顺序和含义、未知 `—` 与真实 `0`，不相加或相互替换。长内容和 200% 缩放允许自然增高。

## ButtonLink：具有按钮外观的原生链接

```tsx
<ButtonLink href="/files/example.json" download="example.json"
  variant="secondary" target="_blank" rel="noreferrer">
  下载文件
</ButtonLink>
```

`ButtonLinkProps` 包含必填 `href: string`、原生 anchor 属性、`variant: primary | secondary | quiet | danger`、`disabled`、`busy`、`busyLabel`，支持 anchor ref。与 `Button` 复用同一视觉体系。默认 variant 为 primary；同一组动作通过任务优先级选择 variant，不因 HTML 元素不同而降低视觉权重。

- 可用时是真实 `<a href>`：Enter 激活，修饰键、右键、`download`、`target` 与 `rel` 由浏览器处理；不设置 `role="button"`，不模拟 Space 按钮行为，不命令式导航。
- `disabled` 移除 href、设置 `aria-disabled` 与 `tabIndex=-1`，阻止主/辅助点击；原生 anchor 没有 `disabled` 属性。
- `busy` 移除 href 并阻止重复激活，但保留焦点和 Tab 位置，设置 `aria-busy` / `aria-disabled`；原文字占位、spinner 与 busyLabel 遵循 Button。
- 原生 capture 事件仍先于组件拦截运行。业务动作使用 `onClick` / `onAuxClick`，capture 仅用于观测；不要在 capture 内绕过禁用状态。
- 组件只管理可交互语义。宿主负责同源/目标路径校验、权限、请求生命周期与结果，不把历史失效链接传成可用下载。

## 一行图例，按需查看规则

```tsx
<TimelineLegend label="历史状态图例" compact items={[
  { status: 'healthy', label: '有输出', description: '有已确认输出；当前证据未发现异常，不代表完整可用性。' },
  { status: 'recovered', label: '已恢复', description: '本时段曾异常，后续重试已有成功证据。' },
  { status: 'degraded', label: '待确认', description: '存在异常，但最终结果证据不足。' },
  { status: 'failed', label: '失败', description: '存在已确认的最终失败。' },
  { status: 'unknown', label: '未知', description: '缺少记录或证据不完整，不能解释为健康。' },
]} />
```

`TimelineLegendProps` 为 `label?: string`、`compact?: boolean`、`items?: TimelineLegendItem[]`；item 为 `status: TimelineStatus`、`label: string`、`description?: string`。每种 status 在一组中唯一。以上规则仅为合成示例，宿主必须传入自己的实际证据定义，组件不推断健康评分。

默认无参调用仍显示原五类完整标签。`compact` 把项目保留在一行；容器过窄时仅图例局部横向滚动，不使页面溢出。有 description 的项目可鼠标悬停、键盘聚焦或触屏点按查看，操作区域至少 44px；一次只开一项规则。Enter/Space 从触发器进入详情关闭按钮，Escape 关闭并按需要归还焦点。没有 description 的项目保持只读文本，不制造空交互。

`StatusTimelineList` 负责稳定行身份与详情互斥，公共契约见[应用组件](APPLICATION_COMPONENTS.md)。时间窗口、统计范围、unknown/partial/error 与实际业务判定仍由宿主保留；短标签不改变详情证据。

时间轴与图例的浮层内部归一化定位包装层的祖先 CSS zoom，正文保留等效缩放与视口内滚动。此修复仅覆盖这两类详情，不宣称其他浮层已支持主题根 CSS zoom；浏览器原生网页缩放与 CSS zoom 是不同的证据。跨卡鼠标移走后延迟关闭，并允许移入详情继续阅读；键盘焦点和触屏操作不被鼠标离开逻辑打断。

## 验收边界

展台覆盖三主题、400/520/880 宽度、200% 缩放、长值/双成本/零值/未知、可选到期、loading/error/no-link/历史展开、原生下载语义、图例鼠标/键盘/触屏入口。界面仅使用合成数据；库测试和浏览器样机不证明消费方鉴权、真实下载或生产接口通过。

### 2026-10-24 源码候选验证

- Node 24：164 项测试、类型检查、构建与资源门禁通过。
- Chromium：30 个内容布局组合（18 个三主题/三宽度/100–200%组合，加12个400px/200%订阅状态组合）、79 条行为断言通过。有效零值、未知、长双成本、两种到期、历史展开、触屏、键盘及复制失败保留链接均得到检查。
- 9 组局部内容 200% 图例定位通过；全页 `document.documentElement.style.zoom=2` 的三主题图例及时间轴详情在视口内、可实际点击关闭，并恢复正确焦点。主题根缩放、打开时动态2→1恢复也通过；正文物理尺寸保留2倍，不以抵消字体缩放换取位置通过。
- 跨两个独立 `StatusTimelineList` 鼠标悬停和鼠标点击后切卡只保留当前详情；移入详情保持，移走关闭，键盘 Enter/Escape 返回正确时间条。
- 最终运行无 pageerror、console error、外部请求或下载事件。下载仅验证原生 anchor 语义并阻止真实导航；生产下载、npm 发布和浏览器原生工具栏缩放不属于本次证据。

正常880px橙趣样机的事实区高104px；这是当前样机测量，不把不同宿主截图作为严格前后对照。

![紧凑账号摘要与凭证操作，橙趣主题合成样机](assets/compact-account-neo.png)
