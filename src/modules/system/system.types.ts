export type SystemServiceStatus = "online" | "offline" | "unknown" | string;

export type SystemHistoryRange = "day" | "week" | "month" | "year";

export interface SystemCurrentMetrics {
  cpu: {
    usagePercent: number;
  };
  memory: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    availableMb: number;
    buffCacheMb: number;
    usagePercent: number;
  };
  disk: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    usagePercent: number;
  };
  uptime: {
    seconds: number;
  };
  services: Record<
    string,
    {
      status: SystemServiceStatus;
    }
  >;
}

export interface SystemHistorySnapshot {
  createdAt: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  memoryUsedMb: number;
  memoryAvailableMb: number;
  diskUsedGb: number;
  diskFreeGb: number;
}

export interface GetSystemHistoryParams {
  range?: SystemHistoryRange;
  limit?: number;
  from?: string;
  to?: string;
}

export interface SystemOverview {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    pending: number;
    inactive: number;
    blocked: number;
    newToday: number;
    newLast7Days: number;
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
  };
  incidents: {
    total: number;
    active: number;
    resolved: number;
    closed: number;
    rejected: number;
    canceled: number;
    createdToday: number;
    createdLast7Days: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  };
  municipalities: {
    total: number;
    active: number;
    inactive: number;
    byStatus: Record<string, number>;
  };
  coverage: {
    districts: number;
    subDistricts: number;
    activeSubDistricts: number;
    categories: number;
  };
  engagement: {
    reports: number;
    comments: number;
    visibleComments: number;
    pendingIncidents: number;
    pendingDuplicateConfirmations: number;
  };
}
