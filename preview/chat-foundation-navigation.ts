export const chatFoundationPages = [
  { id:'chat-foundation-shell', label:'ChatShell', description:'组合工作区导航、Agent 侧栏、聊天正文与可选详情。' },
  { id:'chat-foundation-pane', label:'ChatPane', description:'组合聊天头部、消息流和输入栏，状态由宿主持有。' },
  { id:'chat-foundation-workspace-rail', label:'WorkspaceRail', description:'切换工作区入口，展示当前项与禁用项。' },
  { id:'chat-foundation-agent-list', label:'AgentList', description:'搜索和选择 Agent，并展示状态与无结果反馈。' },
  { id:'chat-foundation-agent-row', label:'AgentRow', description:'两行展示 Agent 身份、预览与工作状态。' },
  { id:'chat-foundation-header', label:'ChatHeader', description:'组织当前 Agent 身份、操作与详情入口。' },
  { id:'chat-foundation-message-list', label:'MessageList', description:'按时间组织消息、日期分隔及读取状态。' },
  { id:'chat-foundation-message-bubble', label:'MessageBubble', description:'展示双方消息、引用与常驻文字操作。' },
  { id:'chat-foundation-message-meta', label:'MessageMeta', description:'独立展示作者与时间。' },
  { id:'chat-foundation-message-content', label:'MessageContent', description:'正文与引用的主题表面，由宿主渲染内容。' },
  { id:'chat-foundation-message-actions', label:'MessageActions', description:'常驻的灰色小文字操作，保留键盘焦点与触控范围。' },
  { id:'chat-foundation-day-divider', label:'DayDivider', description:'展示宿主格式化的日期分隔。' },
  { id:'chat-foundation-message-status', label:'MessageStatus', description:'独立展示空、加载、错误、未知和工作中状态。' },
  { id:'chat-foundation-message-renderer', label:'MessageRenderer', description:'按消息类型选择呈现组件，未配置的类型使用默认消息气泡。' },
  { id:'chat-foundation-composer', label:'Composer', description:'编辑和提交草稿，查看忙碌与失败后的保留行为。' },
  { id:'chat-foundation-inspector', label:'AgentInspector', description:'查看 Agent 身份、信息项与设置入口。' },
] as const;
export type ChatFoundationComponentId = typeof chatFoundationPages[number]['id'];
export function isChatFoundationComponent(id:string): id is ChatFoundationComponentId {
  return chatFoundationPages.some(page => page.id === id);
}
