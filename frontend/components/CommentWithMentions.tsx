'use client';

import { useState, useRef, useEffect } from 'react';
import { kanbanApi } from '@/lib/kanban';
import { teamsApi, Team } from '@/lib/teams';
import { useAuthStore } from '@/store/auth-store';

interface Comment {
  id: string;
  content: string;
  mentions?: string[];
  user: {
    id: string;
    name?: string;
    email: string;
    profileImage?: string;
  };
  createdAt: string;
}

interface CommentWithMentionsProps {
  cardId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export default function CommentWithMentions({
  cardId,
  comments,
  onCommentAdded,
}: CommentWithMentionsProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Team | null>(null);

  useEffect(() => {
    loadWorkspaceAndMembers();
  }, []);

  const loadWorkspaceAndMembers = async () => {
    try {
      const workspace = await teamsApi.getCurrentWorkspace();
      setCurrentWorkspace(workspace);
      if (workspace) {
        // Get team members for mentions
        const team = await teamsApi.getTeam(workspace.id);
        const allMembers = [
          { id: team.owner.id, name: team.owner.name, email: team.owner.email },
          ...team.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
          })),
        ];
        setTeamMembers(allMembers);
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.substring(lastAtIndex + 1);
      const spaceIndex = query.indexOf(' ');
      if (spaceIndex === -1 || spaceIndex > 0) {
        setMentionQuery(spaceIndex === -1 ? query : query.substring(0, spaceIndex));
        setMentionIndex(lastAtIndex);
        setShowMentions(true);
        return;
      }
    }

    setShowMentions(false);
  };

  const handleMentionSelect = (member: { id: string; name?: string; email: string }) => {
    if (mentionIndex === -1) return;

    const beforeMention = newComment.substring(0, mentionIndex);
    const afterMention = newComment.substring(mentionIndex + 1 + mentionQuery.length);
    const mentionText = `@${member.name || member.email} `;
    const updatedComment = beforeMention + mentionText + afterMention;

    setNewComment(updatedComment);
    setShowMentions(false);
    setMentionQuery('');
    setMentionIndex(-1);

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPos = beforeMention.length + mentionText.length;
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await kanbanApi.addComment(cardId, newComment);
      setNewComment('');
      onCommentAdded(comment);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const renderCommentContent = (content: string, mentions?: string[]) => {
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    const mentionRegex = /@(\w+)/g;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (!match) break;
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Find mentioned user
      const mentionedUser = teamMembers.find(
        (m) => m.id === match![1] || m.name === match![1] || m.email === match![1],
      );

      if (mentionedUser) {
        parts.push(
          <span
            key={match.index}
            className="font-semibold text-blue-600 dark:text-blue-400"
          >
            @{mentionedUser.name || mentionedUser.email}
          </span>,
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3">Comments</h3>

        {/* Comments List */}
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-start space-x-3">
                  {comment.user.profileImage ? (
                    <img
                      src={comment.user.profileImage}
                      alt={comment.user.name || comment.user.email}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                      {(comment.user.name || comment.user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.user.name || comment.user.email}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {renderCommentContent(comment.content, comment.mentions)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleSubmitComment} className="relative">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={handleCommentChange}
            onKeyDown={(e) => {
              if (showMentions && e.key === 'ArrowDown') {
                e.preventDefault();
                // Handle arrow navigation
              } else if (showMentions && e.key === 'Enter' && filteredMembers.length > 0) {
                e.preventDefault();
                handleMentionSelect(filteredMembers[0]);
              }
            }}
            placeholder="Add a comment... Use @ to mention someone"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
            rows={3}
          />
          {showMentions && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleMentionSelect(member)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                    {(member.name || member.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {member.name || member.email}
                    </div>
                    {member.name && (
                      <div className="text-xs text-gray-500">{member.email}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Add Comment
          </button>
        </form>
      </div>
    </div>
  );
}

