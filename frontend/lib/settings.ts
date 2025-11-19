import api from "./api";
// import { SocialPlatform } from './kanban';
export type SocialPlatform =
  | "FACEBOOK"
  | "TWITTER"
  | "INSTAGRAM"
  | "THREADS"
  | "LINKEDIN"
  | "REDDIT"
  | "QUORA"
  | "PINTEREST"
  | "TIKTOK"
  | "YOUTUBE";

export interface UserSettings {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  preferredPlatforms: SocialPlatform[];
  contentTemplates?: any;
  aiTone: "professional" | "casual" | "friendly" | "formal" | "creative";
  aiStyle: "balanced" | "concise" | "detailed" | "engaging";
  aiPersonality?: string;
  aiMaxLength: number;
  aiIncludeHashtags: boolean;
  aiIncludeEmojis: boolean;
  theme: "light" | "dark" | "auto";
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSettings {
  id: string;
  teamId: string;
  brandName?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  brandLogo?: string;
  brandFont?: string;
  defaultPostingSchedule?: {
    days?: string[];
    times?: string[];
  };
  defaultTimeZone: string;
  allowViewersToComment: boolean;
  allowEditorsToSchedule: boolean;
  allowEditorsToPublish: boolean;
  requireApprovalForPublishing: boolean;
  contentGuidelines?: string;
  hashtagPolicy?: string;
  autoScheduleEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserSettingsDto {
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: "12h" | "24h";
  preferredPlatforms?: SocialPlatform[];
  contentTemplates?: any;
  aiTone?: "professional" | "casual" | "friendly" | "formal" | "creative";
  aiStyle?: "balanced" | "concise" | "detailed" | "engaging";
  aiPersonality?: string;
  aiMaxLength?: number;
  aiIncludeHashtags?: boolean;
  aiIncludeEmojis?: boolean;
  theme?: "light" | "dark" | "auto";
}

export interface UpdateWorkspaceSettingsDto {
  brandName?: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  brandLogo?: string;
  brandFont?: string;
  defaultPostingSchedule?: {
    days?: string[];
    times?: string[];
  };
  defaultTimeZone?: string;
  allowViewersToComment?: boolean;
  allowEditorsToSchedule?: boolean;
  allowEditorsToPublish?: boolean;
  requireApprovalForPublishing?: boolean;
  contentGuidelines?: string;
  hashtagPolicy?: string;
  autoScheduleEnabled?: boolean;
}

export const settingsApi = {
  getUserSettings: async (): Promise<UserSettings> => {
    const { data } = await api.get<UserSettings>("/api/settings/user");
    return data;
  },

  updateUserSettings: async (
    updates: UpdateUserSettingsDto
  ): Promise<UserSettings> => {
    const { data } = await api.put<UserSettings>("/api/settings/user", updates);
    return data;
  },

  getWorkspaceSettings: async (teamId: string): Promise<WorkspaceSettings> => {
    const { data } = await api.get<WorkspaceSettings>(
      `/api/settings/workspace/${teamId}`
    );
    return data;
  },

  updateWorkspaceSettings: async (
    teamId: string,
    updates: UpdateWorkspaceSettingsDto
  ): Promise<WorkspaceSettings> => {
    const { data } = await api.put<WorkspaceSettings>(
      `/api/settings/workspace/${teamId}`,
      updates
    );
    return data;
  },

  getAISettings: async () => {
    const { data } = await api.get("/api/settings/ai");
    return data;
  },

  getPreferredPlatforms: async (): Promise<SocialPlatform[]> => {
    const { data } = await api.get<SocialPlatform[]>("/api/settings/platforms");
    return data;
  },

  getWorkspaceBrand: async (teamId: string) => {
    const { data } = await api.get(`/api/settings/workspace/${teamId}/brand`);
    return data;
  },
};
