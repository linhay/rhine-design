export const chatFoundationPages = [
  { id:'chat-foundation-shell', label:'ChatShell', description:'组合工作区导航、Agent 侧栏、聊天正文与可选详情。' },
  { id:'chat-foundation-workspace-rail', label:'WorkspaceRail', description:'切换工作区入口，展示当前项与禁用项。' },
  { id:'chat-foundation-agent-list', label:'AgentList', description:'搜索和选择 Agent，并展示状态与无结果反馈。' },
  { id:'chat-foundation-agent-row', label:'AgentRow', description:'两行展示 Agent 身份、预览与工作状态。' },
  { id:'chat-foundation-header', label:'ChatHeader', description:'组织当前 Agent 身份、操作与详情入口。' },
  { id:'chat-foundation-message-list', label:'MessageList', description:'按时间组织消息、日期分隔及读取状态。' },
  { id:'chat-foundation-message-bubble', label:'MessageBubble', description:'展示双方消息、引用与常驻文字操作。' },
  { id:'chat-foundation-composer', label:'Composer', description:'编辑和提交草稿，查看忙碌与失败后的保留行为。' },
  { id:'chat-foundation-inspector', label:'AgentInspector', description:'查看 Agent 身份、信息项与设置入口。' },
] as const;
export type ChatFoundationComponentId = typeof chatFoundationPages[number]['id'];
export function isChatFoundationComponent(id:string): id is ChatFoundationComponentId {
  return chatFoundationPages.some(page => page.id === id);
}
