export interface Disctrict {
    name: string;
    id: string;
}

export interface DistrictResponse {
  id: string;
  name: string;
  polygon: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  createdAt: Date;
  updatedAt: Date;
}