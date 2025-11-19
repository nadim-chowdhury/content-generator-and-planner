import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const collaborationClient = {
  connect: (token: string): Socket => {
    if (socket?.connected) {
      return socket;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    socket = io(`${apiUrl}/collaboration`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to collaboration server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from collaboration server');
    });

    return socket;
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  joinWorkspace: (workspaceId: string) => {
    if (socket) {
      socket.emit('join-workspace', { workspaceId });
    }
  },

  leaveWorkspace: () => {
    if (socket) {
      socket.emit('leave-workspace');
    }
  },

  onCardUpdated: (callback: (data: any) => void) => {
    if (socket) {
      socket.on('card-updated', callback);
    }
  },

  onCommentAdded: (callback: (data: any) => void) => {
    if (socket) {
      socket.on('comment-added', callback);
    }
  },

  onUserTyping: (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-typing', callback);
    }
  },

  onUserJoined: (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-joined', callback);
    }
  },

  onUserLeft: (callback: (data: any) => void) => {
    if (socket) {
      socket.on('user-left', callback);
    }
  },

  off: (event: string, callback?: any) => {
    if (socket) {
      socket.off(event, callback);
    }
  },

  emitCardUpdate: (workspaceId: string, cardId: string, updates: any) => {
    if (socket) {
      socket.emit('card-updated', { workspaceId, cardId, updates });
    }
  },

  emitComment: (workspaceId: string, cardId: string, comment: any) => {
    if (socket) {
      socket.emit('comment-added', { workspaceId, cardId, comment });
    }
  },

  emitTyping: (workspaceId: string, cardId: string, isTyping: boolean) => {
    if (socket) {
      socket.emit('user-typing', { workspaceId, cardId, isTyping });
    }
  },
};


