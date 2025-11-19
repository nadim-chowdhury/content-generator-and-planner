import api from "./api";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  platform?: string;
  deadline?: string;
  status: TaskStatus;
  attachments: string[];
  tags: string[];
  viralScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  platform?: string;
  deadline?: string;
  attachments?: string[];
  tags?: string[];
  viralScore?: number;
  notes?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: TaskStatus;
}

export const tasksApi = {
  getAll: async (
    status?: TaskStatus,
    platform?: string,
    tags?: string,
    search?: string,
    deadlineFrom?: string,
    deadlineTo?: string
  ): Promise<Task[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (platform) params.platform = platform;
    if (tags) params.tags = tags;
    if (search) params.search = search;
    if (deadlineFrom) params.deadlineFrom = deadlineFrom;
    if (deadlineTo) params.deadlineTo = deadlineTo;
    const { data } = await api.get<Task[]>("/api/tasks", { params });
    return data;
  },

  getOne: async (id: string): Promise<Task> => {
    const { data } = await api.get<Task>(`/api/tasks/${id}`);
    return data;
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    const { data } = await api.post<Task>("/api/tasks", dto);
    return data;
  },

  update: async (id: string, dto: UpdateTaskDto): Promise<Task> => {
    const { data } = await api.put<Task>(`/api/tasks/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
  },

  bulkDelete: async (taskIds: string[]): Promise<{ message: string }> => {
    const { data } = await api.post("/api/tasks/bulk-delete", { taskIds });
    return data;
  },

  bulkUpdateStatus: async (
    taskIds: string[],
    status: TaskStatus
  ): Promise<{ message: string }> => {
    const { data } = await api.post("/api/tasks/bulk-update-status", {
      taskIds,
      status,
    });
    return data;
  },
};
