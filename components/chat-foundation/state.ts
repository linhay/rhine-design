/** Lifecycle phases are deliberately transport agnostic; hosts map their runtime state into these values. */
export type ChatSessionPhase = 'idle' | 'loading' | 'ready' | 'working' | 'waiting' | 'error' | 'unknown';

/** Serializable UI state owned by the host session controller. */
export interface ChatSessionState {
  phase: ChatSessionPhase;
  selectedAgentId: string | null;
  query: string;
  draft: string;
  inspectorOpen: boolean;
  error: string | null;
}

export type ChatSessionAction =
  | { type: 'phase/set'; phase: ChatSessionPhase }
  | { type: 'agent/select'; agentId: string | null }
  | { type: 'query/set'; query: string }
  | { type: 'draft/set'; draft: string }
  | { type: 'inspector/set'; open: boolean }
  | { type: 'error/set'; error: string | null };

export const initialChatSessionState: ChatSessionState = {
  phase: 'idle',
  selectedAgentId: null,
  query: '',
  draft: '',
  inspectorOpen: false,
  error: null,
};

/** Pure state transition for a host-owned Chat controller or store. */
export function chatSessionReducer(state: ChatSessionState, action: ChatSessionAction): ChatSessionState {
  switch (action.type) {
    case 'phase/set':
      return { ...state, phase: action.phase };
    case 'agent/select':
      return { ...state, selectedAgentId: action.agentId };
    case 'query/set':
      return { ...state, query: action.query };
    case 'draft/set':
      return { ...state, draft: action.draft };
    case 'inspector/set':
      return { ...state, inspectorOpen: action.open };
    case 'error/set':
      return { ...state, error: action.error };
    default: {
      const exhaustive: never = action;
      void exhaustive;
      return state;
    }
  }
}
