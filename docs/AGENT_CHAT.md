# Agent Chat：消息、卡片与历史

源码候选，关联 #43；不属于 npm 0.11.0。以包含本规范的精确源码或后续已验证版本接入。入口：`ChatThread`、`ChatCard`，展台 `#agent-chat`。不引入模型、聊天运行时、Markdown 解析器或业务流程。

## 参考与采用决策（2026-10-27）

本轮实际读取官方文档、代码示例、网页可访问性结构及可见演示。日期固定为 2026-10-27（Asia/Shanghai），这些页面没有统一发布版本；LibreChat 标注 Latest (dev)。以下是当日文档/演示证据，不声称审计安装后的完整产品。没有安装三个项目的依赖。

| 问题 | 官方证据与界面观察 | Rhine 决定与原因 |
| --- | --- | --- |
| 流式更新打断历史阅读 | [assistant-ui Thread](https://www.assistant-ui.com/docs/primitives/thread) 的 Viewport & Auto-Scroll 明确上翻暂停、展开 disclosure 暂停；LoadEarlier 保留可见消息和按钮焦点。示例展示消息视口与独立 composer。 | 采用锚点与暂停；用稳定消息 ID 保留位置。进一步要求显式「回到最新并跟随」才恢复，展开/新运行均不擅自恢复。无需运行时 Provider。 |
| 正文与卡片抢层级 | 旧 [Message](https://elements.ai-sdk.dev/components/message) 演示正文、代码及紧随内容的动作；[Tool](https://elements.ai-sdk.dev/components/tool) 演示折叠行及 Pending / Running / Error 等文字状态。本轮点击 Error 行确认展开状态变化，状态仍在摘要行。 | 采用正文无外框、结构化卡片摘要优先；错误和未知解释始终置于摘要。拒绝固定 user/assistant 左右角色。 |
| 依赖即将迁移 | 旧文档横幅写明 2026 年 11 月底弃用；实际跟随 [shadcn/ui 迁移入口](https://ui.shadcn.com/docs/ai-elements#migrating-from-ai-sdk-elements)，Conversation 对应 Chat，Tool 对应 Tool/Trace，既有复制代码仍可用。[新 Chat](https://ui.shadcn.com/docs/ai-elements/base/chat) 采用 Message Scroller；[新 Tool](https://ui.shadcn.com/docs/ai-elements/base/tool) 保持状态与详情分层。 | 参考行为与组合，不锁定旧 AI Elements 包。没有复制其代码或迁移消费项目。新 Chat 的 person turn 顶部锚点适合问答；Rhine 多成员记录采用时间顺序和当前可见消息锚点。 |
| 完整产物挤占对话 | [LibreChat Artifacts](https://www.librechat.ai/docs/features/artifacts) 描述独立交互视图；Preview and Export 说明窄屏不展示独立窗口操作，并描述紧凑 Mermaid 内嵌卡片进入产物面板。页面有嵌入演示视频入口。 | 聊天只承载摘要、依据与必要详情。复杂产物由宿主提供独立详情入口，不把可执行 HTML 或完整编辑器塞入消息；本轮没有运行其模型、视频中的产品或产物执行器。 |

本地采样目录为 `output/playwright/`：reference-assistant / reference-migration / reference-tool / reference-librechat。官方站点的第三方加载错误单列为外站环境现象，不据此推断组件失败。Rhine 前后对照使用同一组合成内容；「问题结构复现」重建 issue 中的重复元信息与大卡片结构，不冒充消费产品截图。

## 消息骨架与密度

- 时间升序；`id` 唯一稳定。宿主提供成员 ID/名称、可选装饰头像、ISO 时间（含时区）及本地化时间/日期。头像不重复朗读姓名。
- 同成员、同日期、间隔不超过 5 分钟且中间无事件，合并可见元信息；每条仍保留可访问作者/时间。换成员、跨日、系统事件、较长间隔均重新开始组。无右侧「当前用户」特权。
- 正文用 body 14/22 与主题 regular 字重，不缩字；作者与时间 caption 12/18，作者用 label 字重。行宽上限 72ch；卡片 64ch，窄屏不设最小宽度。
- 组间 24px、同组消息 8px、元信息到正文 8px、段间 12px。日期以细线区隔，事件用次级文字，不伪装成员气泡。
- 普通正文无卡片外框。结构化内容复用 Surface、Badge、Disclosure，卡片内距 12px，标题/状态间距 8px。动作靠近对应正文或卡片尾部，使用 Button quiet/secondary，自然宽度并换行；保留 44px 命中范围。
- 文本、列表、代码、引用均完整换行。代码保留空白并可在长标识符处换行；复制由宿主使用原始数据。引用使用 blockquote + 可键盘访问的来源链接，宿主校验 URL 并提供可读名称。大型表格/产物另开详情，不默认裁切正文。

## 卡片与状态所有权

`ChatCard({title, status, summary, children?, detailLabel?, actions?, readOnly?})`：标题和状态同层，摘要始终显示；children 是可开合详情，错误原因/恢复建议不得只放在 children。详情默认显示短标签“详情”，可用 `detailLabel` 改成“查看依据”等短文案；折叠控件的无障碍名称仍包含对象标题，多个卡片可以区分。支持请求、工具过程、等待依据、结果/产物与来源卡片，无业务种类枚举。详情不默认展开。

只读对象卡片优先把阅读入口放进 `summary`，使用公共 `Button` 作为 `Dialog` 的 trigger，并把对象标题用于按钮的可访问名称，例如：

```tsx
<ChatCard title="河谷观察笔记：跨季节采样、长期维护与共享资料的整理方法" status="partial" readOnly
  summary={<><p>已保留部分结果，来源仍待核对。</p>
    <Dialog title="河谷观察笔记：跨季节采样、长期维护与共享资料的整理方法"
      trigger={<Button variant="secondary" aria-label="阅读对象：河谷观察笔记：跨季节采样、长期维护与共享资料的整理方法">阅读对象</Button>}>
      <p>这里是只读对象阅读内容。</p>
    </Dialog>
  </>} />
```

没有 `children` 时不会生成多余的折叠层；阅读动作与接受、拒绝、重试等业务写入动作分开，`readOnly` 继续隐藏 `actions` 和消息动作。

| status | 含义 |
| --- | --- |
| pending / accepted / declined | 待回应 / 已接受（未必运行）/ 已拒绝 |
| blocked / running | 等待依赖（无无限 spinner）/ 正在运行 |
| partial / succeeded | 部分结果（未完成）/ 宿主已确认完成 |
| failed / cancelled / expired / unknown | 失败 / 已取消 / 已过期 / 未知，分别保留事实与后续说明 |

状态只有呈现映射，没有自动转换、重试、超时或权限推断。缺失/异常外部状态先由宿主规范化为 unknown；运行时兜底也显示未知，不显示成功。停止流、网络断开或动画结束都不能推导 succeeded。宿主取消请求、屏蔽迟到回调、卸载清理；部分结果继续可读。

`ChatThread readOnly` 通过上下文隐藏消息和 ChatCard 的 actions；卡片自身也可 readOnly。展开、来源访问、历史加载和恢复跟随属于阅读动作，仍可用。宿主不得将发送/接受/拒绝等操作藏进任意 content/summary/children 插槽；readOnly 不是权限沙箱。不发送已读回执、不登记观察者身份、不自动改变阅读状态。首版无输入框。

## 滚动、焦点与历史

`ChatThread({label, entries, readOnly?, hasEarlier?, loadingEarlier?, historyError?, onLoadEarlier?, announcement?})`。

- 初次显示定位最新。跟随时新增消息、流式增长与图片尺寸变化保持底部；ResizeObserver 观察内容和视口，卸载 disconnect。
- 上翻、PageUp/Home、进入消息内控件或开合详情会暂停。暂停后新增/流式内容不夺取阅读位置或焦点；提供常驻恢复按钮。不会因新 run 或滚回底部意外恢复。
- 加载更早由宿主发起；宿主原样保留已有 ID 并 prepend。根据首个可见消息 ID 与相对视口偏移恢复，而非简单比较总 scrollHeight（其间可能还在流式增长）。日期/组边界变化也纳入定位。加载按钮在忙碌/无更多记录时保持 DOM 与焦点，用 aria-disabled 阻止重复调用；失败文字常显且可重试。
- 本地详情展开保留当前行锚点，使用既有 Disclosure 键盘/焦点和减少动态实现；不会主动移焦到新消息。历史定位由宿主先加载所需记录，再聚焦该内容中带稳定 DOM id 的链接/控件；focus capture 会暂停跟随。切换整个对话使用 `key={conversationId}` 重新挂载，重置阅读状态。
- 非虚拟列表适用于有界记录；大量历史的窗口化不在首版。移除当前锚点、任意重排或更换稳定 ID 不承诺保持阅读位置。异步媒体应声明尺寸，避免单条超长消息内部重排。
- 消息区是有名称、可聚焦 region + 有序列表，不把历史和每个流式字元放入 live log。announcement 仅供宿主低频播报「接收中/已取消/失败」等；不重复播报全部正文。
- 跟随/锚点调整均即时，无平滑位移。系统/手动减少动态继续保留明确文字状态。CSS zoom 验证与浏览器原生缩放分别记录，前者不替代后者。

## 公开接入

下面只用公开 API。分页、权限、格式化与内容安全由宿主负责。已发布版本是否包含 API 需核对实际导出。

```tsx
import { ChatThread, ChatCard, Button, type ChatEntry } from '@linhey/rhine-design';

const entries: ChatEntry[] = [{
  id: 'sample-request', kind: 'message', day: '2026 年 10 月 27 日',
  member: { id: 'member-a', name: '成员 A' },
  dateTime: '2026-10-27T10:23:00+08:00', time: '10:23',
  content: <ChatCard title="资料核对" status="blocked"
    summary="等待公开来源补全；当前没有运行中的任务。">
    <p>保留已有依据，未知项尚待核对。</p>
  </ChatCard>,
  actions: <Button variant="quiet" onClick={() => { /* 宿主允许的操作 */ }}>查看来源目录</Button>,
}];
export function Observation() {
  return <ChatThread label="资料核对记录" entries={entries} readOnly />;
}
```

完整可运行公开导出消费样例：`preview/ChatGallery.tsx`。三场景全部合成：两成员连续消息、三成员和事件、只读状态分支记录；演示控制在消息区之外，不执行模型或真实业务接口。`排版对照` 提供改造前后相同内容。验证结果见 [Agent Chat 验证](AGENT_CHAT_VERIFICATION.md)。
