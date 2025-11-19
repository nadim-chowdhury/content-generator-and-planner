import api from "./api";

export interface Backup {
  filename: string;
  path: string;
  size: number;
  createdAt: string;
  type: "daily" | "weekly" | "monthly" | "manual";
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  dailyBackups: number;
  weeklyBackups: number;
  monthlyBackups: number;
  manualBackups: number;
  oldestBackup?: string;
  newestBackup?: string;
}

export interface BaseBackup {
  path: string;
  timestamp: string;
  walLocation: string;
  size: number;
}

export interface DdosStats {
  activeBlocks: number;
  trackedIPs: number;
  suspiciousIPs: number;
}

export interface IPStatistics {
  blocked: boolean;
  requestsLastMinute: number;
  requestsLastHour: number;
  suspiciousScore: number;
  blockedUntil?: string;
}

export const infrastructureApi = {
  // DDOS Protection
  getDdosStats: async (): Promise<DdosStats> => {
    const { data } = await api.get<DdosStats>("/api/infrastructure/ddos/stats");
    return data;
  },

  getIPStatistics: async (ip: string): Promise<IPStatistics> => {
    const { data } = await api.get<IPStatistics>(
      `/api/infrastructure/ddos/ip/${ip}`
    );
    return data;
  },

  blockIP: async (
    ip: string,
    reason?: string
  ): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      `/api/infrastructure/ddos/block/${ip}`,
      { reason }
    );
    return data;
  },

  unblockIP: async (ip: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>(
      `/api/infrastructure/ddos/unblock/${ip}`
    );
    return data;
  },

  // Backups
  createBackup: async (
    type?: "daily" | "weekly" | "monthly" | "manual"
  ): Promise<{
    success: boolean;
    filename: string;
    path: string;
    size: number;
    timestamp: string;
  }> => {
    const { data } = await api.post("/api/infrastructure/backups/create", {
      type: type || "manual",
    });
    return data;
  },

  listBackups: async (): Promise<Backup[]> => {
    const { data } = await api.get<Backup[]>("/api/infrastructure/backups");
    return data;
  },

  getBackupStats: async (): Promise<BackupStats> => {
    const { data } = await api.get<BackupStats>(
      "/api/infrastructure/backups/stats"
    );
    return data;
  },

  restoreBackup: async (
    filepath: string
  ): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post("/api/infrastructure/backups/restore", {
      filepath,
    });
    return data;
  },

  // PITR
  getPitrConfig: async (): Promise<{
    postgresqlConf: string;
    recoveryConf: string;
    instructions: string[];
  }> => {
    const { data } = await api.get("/api/infrastructure/pitr/config");
    return data;
  },

  createBaseBackup: async (): Promise<{
    success: boolean;
    backupPath: string;
    timestamp: string;
    walLocation: string;
  }> => {
    const { data } = await api.post("/api/infrastructure/pitr/base-backup");
    return data;
  },

  listBaseBackups: async (): Promise<BaseBackup[]> => {
    const { data } = await api.get<BaseBackup[]>(
      "/api/infrastructure/pitr/base-backups"
    );
    return data;
  },

  recoverToTimestamp: async (
    backupPath: string,
    targetTimestamp: string
  ): Promise<{
    success: boolean;
    recoveryScript: string;
    instructions: string[];
  }> => {
    const { data } = await api.post("/api/infrastructure/pitr/recover", {
      backupPath,
      targetTimestamp,
    });
    return data;
  },

  getWalArchiveStats: async (): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: string;
    newestFile?: string;
  }> => {
    const { data } = await api.get("/api/infrastructure/pitr/stats");
    return data;
  },
};
