import type { ReactNode } from 'react';
import type { MessageBubbleProps } from './MessageBubble';

/** Stable identity belongs to the host; presentation components never create message IDs. */
export interface MessageListItem extends Omit<MessageBubbleProps, 'className'> {
  id: string;
  day?: ReactNode;
}
