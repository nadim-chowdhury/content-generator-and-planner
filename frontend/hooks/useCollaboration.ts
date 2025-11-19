"use client";

import { useEffect, useRef } from "react";
import { collaborationClient } from "@/lib/collaboration";
import { useAuthStore } from "@/store/auth-store";
import { teamsApi } from "@/lib/teams";

interface UseCollaborationOptions {
  workspaceId: string | null;
  onCardUpdated?: (data: any) => void;
  onCommentAdded?: (data: any) => void;
  onUserTyping?: (data: any) => void;
  onUserJoined?: (data: any) => void;
  onUserLeft?: (data: any) => void;
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { token } = useAuthStore();
  const connectedRef = useRef(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!token || !options.workspaceId) {
      return;
    }

    // Connect to collaboration server
    if (!connectedRef.current && token) {
      const socket = collaborationClient.connect(token);
      socketRef.current = socket;
      connectedRef.current = true;

      // Join workspace
      if (options.workspaceId) {
        collaborationClient.joinWorkspace(options.workspaceId);
      }

      // Set up event listeners
      if (options.onCardUpdated) {
        collaborationClient.onCardUpdated(options.onCardUpdated);
      }

      if (options.onCommentAdded) {
        collaborationClient.onCommentAdded(options.onCommentAdded);
      }

      if (options.onUserTyping) {
        collaborationClient.onUserTyping(options.onUserTyping);
      }

      if (options.onUserJoined) {
        collaborationClient.onUserJoined(options.onUserJoined);
      }

      if (options.onUserLeft) {
        collaborationClient.onUserLeft(options.onUserLeft);
      }

      return () => {
        // Cleanup
        if (options.onCardUpdated) {
          collaborationClient.off("card-updated", options.onCardUpdated);
        }
        if (options.onCommentAdded) {
          collaborationClient.off("comment-added", options.onCommentAdded);
        }
        if (options.onUserTyping) {
          collaborationClient.off("user-typing", options.onUserTyping);
        }
        if (options.onUserJoined) {
          collaborationClient.off("user-joined", options.onUserJoined);
        }
        if (options.onUserLeft) {
          collaborationClient.off("user-left", options.onUserLeft);
        }
        collaborationClient.leaveWorkspace();
        collaborationClient.disconnect();
        connectedRef.current = false;
        socketRef.current = null;
      };
    }
  }, [token]);

  useEffect(() => {
    // Update workspace when it changes
    if (options.workspaceId) {
      collaborationClient.leaveWorkspace();
      collaborationClient.joinWorkspace(options.workspaceId);
    } else {
      collaborationClient.leaveWorkspace();
    }
  }, [options.workspaceId]);

  return {
    emitCardUpdate: (cardId: string, updates: any) => {
      if (options.workspaceId) {
        collaborationClient.emitCardUpdate(
          options.workspaceId,
          cardId,
          updates
        );
      }
    },
    emitComment: (cardId: string, comment: any) => {
      if (options.workspaceId) {
        collaborationClient.emitComment(options.workspaceId, cardId, comment);
      }
    },
    emitTyping: (cardId: string, isTyping: boolean) => {
      if (options.workspaceId) {
        collaborationClient.emitTyping(options.workspaceId, cardId, isTyping);
      }
    },
  };
}
