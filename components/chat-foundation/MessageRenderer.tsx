import type { ComponentType } from 'react';
import { MessageBubble } from './MessageBubble';
import type { MessageListItem } from './message-types';

/** Module-stable components keep their local UI state when message data changes. */
export type MessageRenderers = Partial<Record<NonNullable<MessageListItem['kind']>, ComponentType<MessageListItem>>>;
export interface MessageRendererProps {
  message: MessageListItem;
  renderers?: MessageRenderers;
}

/** Keyed presentation dispatch with a default bubble for each unregistered kind. */
export function MessageRenderer({ message, renderers }: MessageRendererProps) {
  const Renderer = renderers?.[message.kind ?? 'agent'] ?? MessageBubble;
  return <Renderer {...message} />;
}
