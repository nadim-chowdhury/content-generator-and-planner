# Team/Agency Features Implementation

This document describes the team collaboration and workspace management features implemented.

## Features Implemented

### 9.1 Workspace Management ✅

#### Create Workspace
- **Status**: Implemented
- **Location**: `backend/src/teams/teams.service.ts`
- **Endpoint**: `POST /api/teams`
- **Description**: Agency plan users can create workspaces (teams)
- **Frontend**: `/teams` page with create team modal

#### Switch Workspaces
- **Status**: Implemented
- **Location**: `backend/src/teams/services/workspace.service.ts`
- **Endpoints**:
  - `POST /api/teams/workspace/switch` - Switch to a workspace
  - `GET /api/teams/workspace/current` - Get current workspace
  - `POST /api/teams/workspace/clear` - Switch to personal workspace
- **Frontend**: `WorkspaceSwitcher` component in Navbar
- **Storage**: Current workspace stored in `User.currentWorkspaceId`

#### Invite Team Members
- **Status**: Implemented
- **Location**: `backend/src/teams/teams.service.ts`
- **Endpoint**: `POST /api/teams/:teamId/members`
- **Frontend**: Team detail page with invite modal
- **Features**:
  - Invite by email
  - Assign role during invitation
  - Automatic activity logging

#### Role Permissions
- **Status**: Implemented
- **Roles**:
  - **VIEWER**: Can only view content (read-only)
  - **EDITOR**: Can create and edit content
  - **MANAGER**: Can manage team members and settings
  - **ADMIN**: Full access (owner only)
- **Location**: `backend/src/teams/services/permissions.service.ts`
- **Permission Checks**:
  - `checkPermission()` - Check if user has specific permission
  - `getUserRole()` - Get user's role in workspace
  - `getRolePermissions()` - Get permissions for a role

### 9.2 Collaboration ✅

#### Real-time Board Updates
- **Status**: Implemented
- **Location**: `backend/src/collaboration/collaboration.gateway.ts`
- **Technology**: WebSocket (Socket.io)
- **Events**:
  - `card-updated` - Broadcast card changes
  - `comment-added` - Broadcast new comments
  - `user-typing` - Typing indicators
  - `user-joined` - User joined workspace
  - `user-left` - User left workspace
- **Frontend**: `useCollaboration` hook for real-time updates
- **Client**: `frontend/lib/collaboration.ts`

#### Comments
- **Status**: Enhanced
- **Location**: `backend/src/kanban/kanban.service.ts`
- **Features**:
  - Add comments to kanban cards
  - Real-time comment updates
  - Comment history
- **Frontend**: `CommentWithMentions` component

#### Mentions
- **Status**: Implemented
- **Location**: `backend/src/collaboration/collaboration.service.ts`
- **Features**:
  - Extract mentions from text (`@username` or `@email`)
  - Resolve mentions to user IDs
  - Notify mentioned users
  - Highlight mentions in comments
- **Frontend**: 
  - Autocomplete dropdown when typing `@`
  - Mention highlighting in comment display
  - `CommentWithMentions` component

#### Notifications
- **Status**: Implemented
- **Location**: `backend/src/collaboration/collaboration.service.ts`
- **Features**:
  - In-app notifications for mentions
  - Team activity notifications
  - Real-time notification delivery
- **Activity Types**:
  - `member_invited` - Member invited to team
  - `member_joined` - Member joined team
  - `member_left` - Member left team
  - `role_changed` - Member role changed
  - `card_created` - Card created
  - `card_updated` - Card updated
  - `comment_added` - Comment added

## Database Schema Changes

### New Enum: TeamRole
```prisma
enum TeamRole {
  VIEWER
  EDITOR
  MANAGER
  ADMIN
}
```

### Updated Models
- **TeamMember**: Now uses `TeamRole` enum instead of string
- **User**: Added `currentWorkspaceId` field
- **KanbanComment**: Added `mentions` array field
- **TeamActivity**: New model for tracking team activities

## API Endpoints

### Workspace Management
- `POST /api/teams/workspace/switch` - Switch workspace
- `GET /api/teams/workspace/current` - Get current workspace
- `POST /api/teams/workspace/clear` - Clear workspace (switch to personal)

### Team Activities
- `GET /api/teams/:teamId/activities` - Get team activity feed

### Team Members (Updated)
- `POST /api/teams/:teamId/members` - Invite member (with role)
- `PUT /api/teams/:teamId/members/:memberId/role` - Update role (VIEWER/EDITOR/MANAGER/ADMIN)

## Frontend Components

1. **WorkspaceSwitcher** (`frontend/components/WorkspaceSwitcher.tsx`)
   - Dropdown to switch between workspaces
   - Shows owned and member workspaces
   - Integrated in Navbar

2. **CommentWithMentions** (`frontend/components/CommentWithMentions.tsx`)
   - Comment input with @ mention support
   - Autocomplete dropdown for mentions
   - Mention highlighting in comments
   - Real-time comment updates

3. **useCollaboration Hook** (`frontend/hooks/useCollaboration.ts`)
   - React hook for real-time collaboration
   - Manages WebSocket connection
   - Handles workspace joining/leaving
   - Event listeners for real-time updates

## WebSocket Events

### Client → Server
- `join-workspace` - Join a workspace room
- `leave-workspace` - Leave workspace room
- `card-updated` - Broadcast card update
- `comment-added` - Broadcast comment
- `user-typing` - Broadcast typing indicator

### Server → Client
- `card-updated` - Card was updated
- `comment-added` - New comment added
- `user-typing` - User is typing
- `user-joined` - User joined workspace
- `user-left` - User left workspace

## Role Permissions Matrix

| Permission | VIEWER | EDITOR | MANAGER | ADMIN | OWNER |
|------------|--------|--------|---------|-------|-------|
| View Content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/Edit Content | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Members | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Access | ❌ | ❌ | ❌ | ✅ | ✅ |

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd backend
   npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
   
   cd ../frontend
   npm install socket.io-client
   ```

2. **Run Database Migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_workspace_collaboration
   ```

3. **Environment Variables**:
   ```env
   # No additional env vars needed for collaboration
   # WebSocket uses same JWT_SECRET as REST API
   ```

## Usage Examples

### Switch Workspace (Frontend)
```typescript
import { teamsApi } from '@/lib/teams';

// Switch to a workspace
await teamsApi.switchWorkspace(workspaceId);

// Get current workspace
const workspace = await teamsApi.getCurrentWorkspace();

// Switch to personal workspace
await teamsApi.clearWorkspace();
```

### Real-time Collaboration (Frontend)
```typescript
import { useCollaboration } from '@/hooks/useCollaboration';

const { emitCardUpdate, emitComment } = useCollaboration({
  workspaceId: currentWorkspace?.id || null,
  onCardUpdated: (data) => {
    // Handle real-time card update
    updateCardInState(data.cardId, data.updates);
  },
  onCommentAdded: (data) => {
    // Handle new comment
    addCommentToState(data.comment);
  },
});
```

### Add Comment with Mention (Frontend)
```typescript
// User types: "Hey @john, check this out!"
// The @john will be automatically resolved to user ID
// Mentioned user will receive a notification
```

## Testing

1. **Create a workspace** (Agency plan required)
2. **Invite team members** with different roles
3. **Switch workspaces** using the switcher in Navbar
4. **Add comments with mentions** using @username
5. **Verify real-time updates** by opening multiple browser tabs
6. **Check team activities** on team detail page

## Notes

- WebSocket connection requires JWT authentication
- Workspace switching is per-user (stored in database)
- Mentions are resolved based on workspace members
- Real-time updates only work within the same workspace
- Team activities are logged for audit purposes

