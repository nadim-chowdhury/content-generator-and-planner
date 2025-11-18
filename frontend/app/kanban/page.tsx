'use client';

import { useEffect, useState } from 'react';
import { kanbanApi, KanbanCard, KanbanBoard, KanbanStage, KanbanChecklist, KanbanComment } from '@/lib/kanban';
import { ideasApi, Idea } from '@/lib/ideas';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import PlatformBadge from '@/components/PlatformBadge';

const STAGES: KanbanStage[] = ['IDEAS', 'DRAFTING', 'EDITING', 'READY', 'SCHEDULED', 'POSTED'];

const STAGE_LABELS: Record<KanbanStage, string> = {
  IDEAS: 'Ideas',
  DRAFTING: 'Drafting',
  EDITING: 'Editing',
  READY: 'Ready',
  SCHEDULED: 'Scheduled',
  POSTED: 'Posted',
};

const STAGE_COLORS: Record<KanbanStage, string> = {
  IDEAS: 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700',
  DRAFTING: 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
  EDITING: 'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700',
  READY: 'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700',
  SCHEDULED: 'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700',
  POSTED: 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700',
};

export default function KanbanPage() {
  const [board, setBoard] = useState<KanbanBoard>({
    IDEAS: [],
    DRAFTING: [],
    EDITING: [],
    READY: [],
    SCHEDULED: [],
    POSTED: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    loadBoard();
    loadIdeas();
  }, []);

  const loadBoard = async () => {
    try {
      setLoading(true);
      const data = await kanbanApi.getBoard();
      setBoard(data);
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadIdeas = async () => {
    try {
      const data = await ideasApi.getAll('DRAFT');
      setIdeas(data);
    } catch (err) {
      console.error('Failed to load ideas:', err);
    }
  };

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent, stage: KanbanStage) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    if (!draggedCard) return;

    try {
      // Calculate target position (end of the list)
      const targetCards = board[targetStage];
      const targetPosition = targetCards.length;

      await kanbanApi.moveCard(draggedCard.id, {
        targetStage,
        targetPosition,
      });

      await loadBoard();
    } catch (err) {
      console.error('Failed to move card:', err);
      alert('Failed to move card');
    } finally {
      setDraggedCard(null);
    }
  };

  const handleCardClick = async (cardId: string) => {
    try {
      const card = await kanbanApi.getCard(cardId);
      setSelectedCard(card);
      setShowCardModal(true);
    } catch (err) {
      console.error('Failed to load card:', err);
    }
  };

  const handleCreateCard = async (title: string, description?: string, ideaId?: string) => {
    try {
      await kanbanApi.createCard({
        title,
        description,
        ideaId,
        stage: 'IDEAS',
      });
      await loadBoard();
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to create card');
    }
  };

  const handleCreateFromIdea = async (ideaId: string) => {
    try {
      await kanbanApi.createCardFromIdea(ideaId, 'IDEAS');
      await loadBoard();
    } catch (err) {
      alert('Failed to create card from idea');
    }
  };

  const handleAddChecklist = async (cardId: string, title: string) => {
    try {
      await kanbanApi.addChecklist(cardId, title);
      await loadBoard();
      if (selectedCard?.id === cardId) {
        const updated = await kanbanApi.getCard(cardId);
        setSelectedCard(updated);
      }
    } catch (err) {
      alert('Failed to add checklist');
    }
  };

  const handleUpdateChecklist = async (checklistId: string, items: Array<{ id: string; text: string; completed: boolean }>) => {
    try {
      await kanbanApi.updateChecklist(checklistId, items);
      if (selectedCard) {
        const updated = await kanbanApi.getCard(selectedCard.id);
        setSelectedCard(updated);
      }
    } catch (err) {
      alert('Failed to update checklist');
    }
  };

  const handleAddComment = async (cardId: string, content: string) => {
    try {
      await kanbanApi.addComment(cardId, content);
      if (selectedCard?.id === cardId) {
        const updated = await kanbanApi.getCard(cardId);
        setSelectedCard(updated);
      }
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      await kanbanApi.deleteCard(cardId);
      await loadBoard();
      setShowCardModal(false);
      setSelectedCard(null);
    } catch (err) {
      alert('Failed to delete card');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                + Create Card
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600 dark:text-gray-400">Loading board...</div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => (
                <div
                  key={stage}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDrop={(e) => handleDrop(e, stage)}
                  className={`flex-shrink-0 w-80 ${STAGE_COLORS[stage]} border-2 rounded-lg p-4 min-h-[600px]`}
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {STAGE_LABELS[stage]} ({board[stage].length})
                  </h2>
                  <div className="space-y-3">
                    {board[stage].map((card) => (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card)}
                        onClick={() => handleCardClick(card.id)}
                        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow cursor-move hover:shadow-md transition-shadow"
                        style={card.color ? { borderLeft: `4px solid ${card.color}` } : {}}
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {card.title}
                        </h3>
                        {card.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {card.description}
                          </p>
                        )}
                        {card.idea && (
                          <div className="mb-2">
                            <PlatformBadge platform={card.idea.platform} size="sm" />
                            {card.idea.viralScore && (
                              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                                Score: {card.idea.viralScore}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {card.checklists.length > 0 && (
                            <span>
                              ✓ {card.checklists.reduce((acc, cl) => acc + cl.items.filter((i: any) => i.completed).length, 0)}/
                              {card.checklists.reduce((acc, cl) => acc + cl.items.length, 0)}
                            </span>
                          )}
                          {card.comments.length > 0 && (
                            <span>💬 {card.comments.length}</span>
                          )}
                          {card.attachments.length > 0 && (
                            <span>📎 {card.attachments.length}</span>
                          )}
                          {card.assignedTo.length > 0 && (
                            <span>👥 {card.assignedTo.length}</span>
                          )}
                          {card.dueDate && (
                            <span className={new Date(card.dueDate) < new Date() ? 'text-red-600 dark:text-red-400' : ''}>
                              📅 {new Date(card.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Card Modal */}
          {showCreateModal && (
            <CreateCardModal
              ideas={ideas}
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreateCard}
              onCreateFromIdea={handleCreateFromIdea}
            />
          )}

          {/* Card Detail Modal */}
          {showCardModal && selectedCard && (
            <CardDetailModal
              card={selectedCard}
              onClose={() => {
                setShowCardModal(false);
                setSelectedCard(null);
              }}
              onDelete={handleDeleteCard}
              onAddChecklist={handleAddChecklist}
              onUpdateChecklist={handleUpdateChecklist}
              onAddComment={handleAddComment}
              onReload={async () => {
                const updated = await kanbanApi.getCard(selectedCard.id);
                setSelectedCard(updated);
                await loadBoard();
              }}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function CreateCardModal({
  ideas,
  onClose,
  onCreate,
  onCreateFromIdea,
}: {
  ideas: Idea[];
  onClose: () => void;
  onCreate: (title: string, description?: string, ideaId?: string) => void;
  onCreateFromIdea: (ideaId: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ideaId, setIdeaId] = useState<string>('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Card</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Create from Idea (Optional)
            </label>
            <select
              value={ideaId}
              onChange={(e) => setIdeaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">None</option>
              {ideas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          {ideaId ? (
            <button
              onClick={() => {
                onCreateFromIdea(ideaId);
                onClose();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create from Idea
            </button>
          ) : (
            <button
              onClick={() => {
                if (title) {
                  onCreate(title, description);
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CardDetailModal({
  card,
  onClose,
  onDelete,
  onAddChecklist,
  onUpdateChecklist,
  onAddComment,
  onReload,
}: {
  card: KanbanCard;
  onClose: () => void;
  onDelete: (cardId: string) => void;
  onAddChecklist: (cardId: string, title: string) => void;
  onUpdateChecklist: (checklistId: string, items: Array<{ id: string; text: string; completed: boolean }>) => void;
  onAddComment: (cardId: string, content: string) => void;
  onReload: () => void;
}) {
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newComment, setNewComment] = useState('');

  const handleToggleChecklistItem = async (checklistId: string, itemId: string) => {
    const checklist = card.checklists.find(c => c.id === checklistId);
    if (!checklist) return;

    const items = (checklist.items as Array<{ id: string; text: string; completed: boolean }>).map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await onUpdateChecklist(checklistId, items);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{card.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {card.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{card.description}</p>
        )}

        {card.idea && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="flex items-center gap-2">
              <PlatformBadge platform={card.idea.platform} size="sm" />
              {card.idea.viralScore && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Viral Score: {card.idea.viralScore}
                </span>
              )}
            </div>
          </div>
        )}

        {/* AI Generated Tasks */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Generated Tasks</h3>
            <button
              onClick={async () => {
                try {
                  const tasks = await kanbanApi.generateAiTasks(card.id);
                  // Add tasks as checklist items
                  if (tasks.length > 0) {
                    const items = tasks.map((task, idx) => ({
                      id: `ai-${Date.now()}-${idx}`,
                      text: `${task.text} [${task.priority}]`,
                      completed: false,
                    }));
                    const checklist = await kanbanApi.addChecklist(card.id, 'AI Generated Tasks', items);
                    await onReload();
                  }
                } catch (err) {
                  alert('Failed to generate AI tasks');
                }
              }}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Generate Tasks
            </button>
          </div>
        </div>

        {/* Checklists */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Checklists</h3>
          {card.checklists.map((checklist) => (
            <div key={checklist.id} className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{checklist.title}</h4>
              <div className="space-y-2">
                {(checklist.items as Array<{ id: string; text: string; completed: boolean }>).map((item) => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(checklist.id, item.id)}
                      className="rounded"
                    />
                    <span className={item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newChecklistTitle}
              onChange={(e) => setNewChecklistTitle(e.target.value)}
              placeholder="New checklist title"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => {
                if (newChecklistTitle) {
                  onAddChecklist(card.id, newChecklistTitle);
                  setNewChecklistTitle('');
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Comments</h3>
          <div className="space-y-3 mb-4">
            {card.comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm">
                    {comment.user.name?.[0] || comment.user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {comment.user.name || comment.user.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={() => {
                if (newComment.trim()) {
                  onAddComment(card.id, newComment);
                  setNewComment('');
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Comment
            </button>
          </div>
        </div>

        {/* Attachments */}
        {card.attachments.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Attachments</h3>
            <div className="space-y-2">
              {card.attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  📎 {attachment}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => onDelete(card.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Card
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

