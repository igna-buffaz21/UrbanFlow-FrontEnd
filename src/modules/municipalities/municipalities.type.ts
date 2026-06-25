export type Municipality = {
  id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  district: {
    id: string;
    name: string;
  };
};

export interface CreateMunicipality {
  name: string;
  districtId: string;
}

export type MunicipalityStatus = "active" | "inactive";

export interface MunicipalityMonthlyUsage {
  generatedAt: string;
  month: string;
  from: string;
  to: string;
  monthlyLimit: number;
  totals: {
    municipalities: number;
    incidentsCreated: number;
    exceededLimit: number;
    nearLimit: number;
  };
  municipalities: MunicipalityUsageItem[];
}

export interface MunicipalityUsageItem {
  municipality: Municipality;
  monthlyLimit: number;
  month: string;
  incidents: {
    created: number;
    remaining: number;
    usagePercent: number;
    exceededLimit: boolean;
    nearLimit: boolean;
    active: number;
    resolved: number;
    closed: number;
    rejected: number;
    canceled: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    lastIncidentAt: string | null;
  };
  projection: {
    elapsedDays: number;
    daysInMonth: number;
    averagePerDay: number;
    projectedMonthlyIncidents: number;
    projectedUsagePercent: number;
  };
}
