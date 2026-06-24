export type IncidentStatus =
  | "in_review"
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected"
  | "canceled";

export type IncidentPriority = "low" | "medium" | "high";

export type IncidentCommentStatus = "visible" | "hidden" | "deleted";

export type GeoJSONPoint = {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
};

export interface MapIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  location: GeoJSONPoint;
  distance: number;
}

export interface IncidentDetail {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  category: string | null;
  status: IncidentStatus;
  priority: IncidentPriority;
  createdAt: string;
  createdBy: IncidentCreatedBy;
  is_owner: boolean;
}

export interface IncidentCreatedBy {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
    photoUrl?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    label: string;
  } | null;
  location?: GeoJSONPoint | null;
}

export interface AdminIncidentDetail {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;
  resolutionPhotoUrl: string | null;
  resolvedAt: string | null;
  location: GeoJSONPoint;
  category: {
    id: string;
    name: string;
  } | null;
  status: IncidentStatus;
  priority: IncidentPriority;
  createdAt: string;
  createdBy: IncidentCreatedBy;
  assignedAt?: string;
  assignedTo: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  rejectedBy?: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  rejectionReason?: string | null;
}

export interface OperatorIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignedAt: string;
  photoUrl?: string | null;
}


export interface IncidentMe {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  createdAt: string;
}

export interface IncidentCommentUser {
  id: string;
  name: string;
  role: string;
  photoUrl?: string | null;
}

export interface IncidentCommentResponse {
  id: string;
  comment: string;
  photoUrl?: string | null;
  status: IncidentCommentStatus;
  createdBy: IncidentCommentUser;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReportResponse {
  reportedByMe: boolean;
  reportsCount: number;
}

export interface ReportedIncidentResponse {
  reportId: string;
  reportedAt: string;
  incident: ReportedIncident;
}

export interface ReportedIncident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  photoUrl: string | null;
  createdAt: string;
}

export interface IncidentDetailBaseResponse {
  id: string;
  publicCode: string;
  title: string;
  description?: string;

  photoUrl: string | null;

  resolutionPhotoUrl: string | null;
  resolvedAt: Date | null;

  location: {
    type: "Point";
    coordinates: [number, number];
  } | null;

  category: {
    id: string;
    name: string;
  } | null;

  aiUrgencyScore: number;

  createdAt: string;

  is_owner: boolean;

  createdBy: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;

  status: IncidentStatus;
  assignedAt?: string;
  assignedTo?: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  updatedAt: string;

  startedAt: string | null;

  closedAt: string | null;

  rejectedAt: string | null;

}

export interface IncidentDetailResponse extends IncidentDetailBaseResponse {
  reportsCount: number;
  priorityScore: number;
  priority: IncidentPriority;
  closedBy?: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  rejectedBy?: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
  rejectionReason?: string | null;
}

export interface IncidentLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IncidentCategory {
  id: string;
  name: string;
}

export interface IncidentCreatedBy {
  id: string;
  name: string;
  photoUrl: string | null;
}

export type ResolvePendingDuplicateAction =
  | "confirm_duplicate"
  | "create_new";

export interface ResolvePendingDuplicateResponse {
  status: "reported_existing_incident" | "created_new_incident";
  message: string;
  data: {
    incidentId: string;
  };
}

export interface IncidentFeedResponse {
  message: string;
  data: IncidentFeedItem[];
  pagination: IncidentFeedPagination;
}

export interface IncidentFeedItem {
  id: string;

  title: string;
  description: string;

  status: IncidentFeedStatus;

  photoUrl: string;

  createdAt: string;

  createdBy: IncidentFeedCreatedBy;

  category: IncidentFeedCategory;

  reportsCount: number;
  commentsCount: number;

  aiUrgencyScore: number;
  relevanceScore: number;
}

export interface IncidentFeedCreatedBy {
  id: string;
  name: string;
  photoUrl: string | undefined;
}

export interface IncidentFeedCategory {
  id: string;
  name: string;
}

export interface IncidentFeedPagination {
  page: number;
  limit: number;
}

export type IncidentFeedStatus =
  | "open"
  | "in_review"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface GetIncidentFeedParams {
  lat: number;
  lng: number;
  page?: number;
  limit?: number;
}

export interface PaginatedIncidentsResponse {
  data: Incident[];
  total: number;
  page: number;
  limit: number;
}

export interface FrequencyByCategoryResult {
  categoryId: string;
  categoryName: string;
  categoryLabel: string;
  total: number;
  open: number;
  assigned: number;
  resolved: number;
  closed: number;
}

export interface ResolutionByCategoryResult {
  categoryId: string;
  categoryName: string;
  categoryLabel: string;
  total: number;
  closed: number;
  closureRate: number;
  avgResolutionHours: number | null;
}

export interface ResolutionOverallResult {
  totalIncidents: number;
  closedIncidents: number;
  resolvedIncidents: number;
  criticalIncidents: number;
  closureRate: number;
  avgResolutionHours: number | null;
}

export interface ResolutionMetricsResult {
  overall: ResolutionOverallResult;
  byCategory: ResolutionByCategoryResult[];
}

export interface SubDistrictResponse {
  id: string;
  name: string;
  polygon: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  municipalityId: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface SubDistrictsApiResponse {
  message: string;
  data: SubDistrictResponse[];
}

export interface GeographicStatItem {
  subDistrictId: string;
  subDistrictName: string;
  total: number;
  open: number;
  assigned: number;
  resolved: number;
  closed: number;
  high: number;
  medium: number;
  low: number;
}

export interface GeographicStatsResult {
  withSubDistrict: GeographicStatItem[];
  withoutSubDistrict: number;
}

export interface TemporalStatItem {
  period: string;
  total: number;
  open: number;
  resolved: number;
  closed: number;
}

export interface OperatorStatItem {
  operatorId: string;
  operatorName: string;
  total: number;
  resolved: number;
  closed: number;
  avgResolutionHours: number | null;
}

export interface PriorityStatItem {
  priority: string;
  total: number;
}

export interface ExtendedStatsResult {
  temporal: TemporalStatItem[];
  byOperator: OperatorStatItem[];
  byPriority: PriorityStatItem[];
}
