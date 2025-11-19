import api from "./api";

export interface ExportResult {
  type: string;
  exportedAt: string;
  count: number;
  data: any[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  details: {
    imported: Array<{ row: number; id: string; title: string }>;
    errors: Array<{ row: number; error: string; data: any }>;
  };
}

export const exportImportApi = {
  exportIdeasJSON: async (): Promise<Blob> => {
    const response = await api.get("/api/export-import/ideas/json", {
      responseType: "blob",
    });
    return response.data;
  },

  exportIdeasCSV: async (): Promise<Blob> => {
    const response = await api.get("/api/export-import/ideas/csv", {
      responseType: "blob",
    });
    return response.data;
  },

  exportPlanner: async (): Promise<Blob> => {
    const response = await api.get("/api/export-import/planner", {
      responseType: "blob",
    });
    return response.data;
  },

  exportCalendar: async (
    startDate?: string,
    endDate?: string
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const response = await api.get(
      `/api/export-import/calendar?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  },

  exportWorkspace: async (teamId: string): Promise<Blob> => {
    const response = await api.get(`/api/export-import/workspace/${teamId}`, {
      responseType: "blob",
    });
    return response.data;
  },

  importIdeas: async (csvContent: string): Promise<ImportResult> => {
    const { data } = await api.post<ImportResult>(
      "/api/export-import/ideas/import",
      {
        csvContent,
      }
    );
    return data;
  },
};
