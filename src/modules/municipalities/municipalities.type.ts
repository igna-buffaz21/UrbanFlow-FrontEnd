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