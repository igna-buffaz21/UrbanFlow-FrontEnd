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
