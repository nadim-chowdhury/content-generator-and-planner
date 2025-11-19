import api from "./api";

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  owner: {
    id: string;
    email: string;
    name?: string;
  };
  members: TeamMember[];
  _count?: {
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "VIEWER" | "EDITOR" | "MANAGER" | "ADMIN";
  user: {
    id: string;
    email: string;
    name?: string;
    profileImage?: string;
  };
  invitedBy?: string;
  joinedAt: string;
}

export const teamsApi = {
  // Teams
  createTeam: async (name: string): Promise<Team> => {
    const { data } = await api.post<Team>("/api/teams", { name });
    return data;
  },

  getTeams: async (): Promise<{ owned: Team[]; memberOf: Team[] }> => {
    const { data } = await api.get<{ owned: Team[]; memberOf: Team[] }>(
      "/api/teams"
    );
    return data;
  },

  getTeam: async (teamId: string): Promise<Team> => {
    const { data } = await api.get<Team>(`/api/teams/${teamId}`);
    return data;
  },

  updateTeam: async (teamId: string, name: string): Promise<Team> => {
    const { data } = await api.put<Team>(`/api/teams/${teamId}`, { name });
    return data;
  },

  deleteTeam: async (teamId: string): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(
      `/api/teams/${teamId}`
    );
    return data;
  },

  // Team Members
  inviteMember: async (
    teamId: string,
    email: string,
    role: "VIEWER" | "EDITOR" | "MANAGER" | "ADMIN" = "EDITOR"
  ): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      `/api/teams/${teamId}/members`,
      { email, role }
    );
    return data;
  },

  updateMemberRole: async (
    teamId: string,
    memberId: string,
    role: "VIEWER" | "EDITOR" | "MANAGER" | "ADMIN"
  ): Promise<TeamMember> => {
    const { data } = await api.put<TeamMember>(
      `/api/teams/${teamId}/members/${memberId}/role`,
      { role }
    );
    return data;
  },

  // Workspace management
  switchWorkspace: async (
    workspaceId: string
  ): Promise<{ message: string; workspace: any }> => {
    const { data } = await api.post("/api/teams/workspace/switch", {
      workspaceId,
    });
    return data;
  },

  getCurrentWorkspace: async (): Promise<Team | null> => {
    const { data } = await api.get("/api/teams/workspace/current");
    return data;
  },

  clearWorkspace: async (): Promise<{ message: string }> => {
    const { data } = await api.post("/api/teams/workspace/clear");
    return data;
  },

  // Team activities
  getTeamActivities: async (teamId: string): Promise<any[]> => {
    const { data } = await api.get(`/api/teams/${teamId}/activities`);
    return data;
  },

  removeMember: async (
    teamId: string,
    memberId: string
  ): Promise<{ message: string }> => {
    const { data } = await api.delete<{ message: string }>(
      `/api/teams/${teamId}/members/${memberId}`
    );
    return data;
  },

  leaveTeam: async (teamId: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      `/api/teams/${teamId}/leave`
    );
    return data;
  },
};
