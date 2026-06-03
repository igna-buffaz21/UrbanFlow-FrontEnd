export type IncidentStatus = | "in_review" | "open" | "assigned" | "resolved" | "closed" | "rejected";

export type IncidentPriority = "low" | "medium" | "high";

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
}

export interface AdminIncidentDetail {
  id: string;
  title: string;
  description: string;
  photoUrl: string | null;

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
}

export interface OperatorIncident {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignedAt: string;
}


export interface IncidentMe {
  id: string;
  title: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  createdAt: string;
}