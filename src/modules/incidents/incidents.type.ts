export type IncidentStatus = "pending" | "in_review" | "resolved" | "rejected";

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
}

export interface IncidentCreatedBy {
  id: string;
  name: string;
  photoUrl: string | null;
}
