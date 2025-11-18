import api from './api';

export type KanbanStage = 'IDEAS' | 'DRAFTING' | 'EDITING' | 'READY' | 'SCHEDULED' | 'POSTED';

export interface KanbanChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface KanbanChecklist {
  id: string;
  cardId: string;
  title: string;
  items: KanbanChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface KanbanComment {
  id: string;
  cardId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
    profileImage?: string;
  };
}

export interface KanbanCard {
  id: string;
  userId: string;
  title: string;
  description?: string;
  stage: KanbanStage;
  position: number;
  ideaId?: string;
  color?: string;
  dueDate?: string;
  attachments: string[];
  assignedTo: string[];
  createdAt: string;
  updatedAt: string;
  idea?: {
    id: string;
    title: string;
    platform: string;
    viralScore?: number;
  };
  checklists: KanbanChecklist[];
  comments: KanbanComment[];
}

export interface KanbanBoard {
  IDEAS: KanbanCard[];
  DRAFTING: KanbanCard[];
  EDITING: KanbanCard[];
  READY: KanbanCard[];
  SCHEDULED: KanbanCard[];
  POSTED: KanbanCard[];
}

export interface CreateKanbanCardDto {
  title: string;
  description?: string;
  stage?: KanbanStage;
  ideaId?: string;
  color?: string;
  dueDate?: string;
  attachments?: string[];
  assignedTo?: string[];
}

export interface UpdateKanbanCardDto extends Partial<CreateKanbanCardDto> {
  position?: number;
}

export interface MoveCardDto {
  targetStage: KanbanStage;
  targetPosition?: number;
}

export const kanbanApi = {
  getBoard: async (): Promise<KanbanBoard> => {
    const { data } = await api.get<KanbanBoard>('/api/kanban/board');
    return data;
  },

  getCard: async (id: string): Promise<KanbanCard> => {
    const { data } = await api.get<KanbanCard>(`/api/kanban/cards/${id}`);
    return data;
  },

  createCard: async (dto: CreateKanbanCardDto): Promise<KanbanCard> => {
    const { data } = await api.post<KanbanCard>('/api/kanban/cards', dto);
    return data;
  },

  createCardFromIdea: async (ideaId: string, stage?: KanbanStage): Promise<KanbanCard> => {
    const { data } = await api.post<KanbanCard>(`/api/kanban/cards/from-idea/${ideaId}`, { stage });
    return data;
  },

  updateCard: async (id: string, dto: UpdateKanbanCardDto): Promise<KanbanCard> => {
    const { data } = await api.put<KanbanCard>(`/api/kanban/cards/${id}`, dto);
    return data;
  },

  moveCard: async (id: string, dto: MoveCardDto): Promise<KanbanCard> => {
    const { data } = await api.patch<KanbanCard>(`/api/kanban/cards/${id}/move`, dto);
    return data;
  },

  deleteCard: async (id: string): Promise<void> => {
    await api.delete(`/api/kanban/cards/${id}`);
  },

  addChecklist: async (cardId: string, title: string, items?: KanbanChecklistItem[]): Promise<KanbanChecklist> => {
    const { data } = await api.post<KanbanChecklist>(`/api/kanban/cards/${cardId}/checklists`, { title, items });
    return data;
  },

  updateChecklist: async (checklistId: string, items: KanbanChecklistItem[]): Promise<KanbanChecklist> => {
    const { data } = await api.put<KanbanChecklist>(`/api/kanban/checklists/${checklistId}`, { items });
    return data;
  },

  deleteChecklist: async (checklistId: string): Promise<void> => {
    await api.delete(`/api/kanban/checklists/${checklistId}`);
  },

  addComment: async (cardId: string, content: string): Promise<KanbanComment> => {
    const { data } = await api.post<KanbanComment>(`/api/kanban/cards/${cardId}/comments`, { content });
    return data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/api/kanban/comments/${commentId}`);
  },

  generateAiTasks: async (cardId: string): Promise<Array<{ text: string; priority: string }>> => {
    const { data } = await api.get(`/api/kanban/cards/${cardId}/ai-tasks`);
    return data;
  },
};

