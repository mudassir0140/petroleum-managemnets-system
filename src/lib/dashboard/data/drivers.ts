// @ts-nocheck
export type DriverStatus = "On Duty" | "Off Duty" | "On Leave" | "Suspended";

export type Driver = {
  id: string;
  name: string;
  license: string;
  phone: string;
  experienceYears: number;
  assignedTanker: string;
  status: DriverStatus;
  rating: number;
  joinDate: string;
};

export const DRIVERS: Driver[] = [];
