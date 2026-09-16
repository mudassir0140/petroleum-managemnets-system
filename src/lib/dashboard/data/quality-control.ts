// @ts-nocheck
import { DEPOT } from "@/lib/dashboard/data/stations";
import type { FuelType } from "@/lib/dashboard/data/stations";

export type QCLocationType = "Depot" | "Pump";

export const QC_LOCATIONS = [
  DEPOT,
  "Al-Rehman Filling Station, Karachi",
  "Chaudhry Petroleum, Lahore",
  "Sunrise Fuel Station, Islamabad",
  "Highway Filling Station, Faisalabad",
  "Malik Fuels, Rawalpindi",
  "Gulshan Petroleum, Multan",
] as const;

export type QCLocation = (typeof QC_LOCATIONS)[number];

function locationType(location: string): QCLocationType {
  return location === DEPOT ? "Depot" : "Pump";
}

export const QUALITY_TEST_TYPES = [
  "Density",
  "Flash Point",
  "Water Content",
  "Octane/Cetane Rating",
  "Color & Appearance",
] as const;

export type QualityTestType = (typeof QUALITY_TEST_TYPES)[number];

export type QualityTestResult = "Pass" | "Fail";

export type FuelQualityTest = {
  id: string;
  location: QCLocation;
  fuelType: FuelType;
  testType: QualityTestType;
  testedValue: string;
  standardRange: string;
  result: QualityTestResult;
  testedBy: string;
  testedAt: string;
  notes: string;
};

export function testLocationType(test: { location: string }): QCLocationType {
  return locationType(test.location);
}

export const FUEL_QUALITY_TESTS: FuelQualityTest[] = [];

export type InspectionLog = {
  id: string;
  source: string;
  referenceId?: string | null;
  location: QCLocation | string;
  inspector: string;
  inspectedAt: string;
  summary: string;
  severity: string;
  status: string;
  date?: string;
  findings?: string;
  followUpDate?: string | null;
};

export type InspectionLogEntry = InspectionLog;
export type InspectionStatus = string;
export type InspectionSeverity = string;
export type InspectionSource = string;

export const INSPECTION_LOG: InspectionLog[] = [];
export const INSPECTION_STATUSES: InspectionStatus[] = [];
export const INSPECTION_SEVERITIES: InspectionSeverity[] = [];
export const INSPECTION_SOURCES: InspectionSource[] = [];

export function inspectionLocationType(inspection: { location: string }): QCLocationType {
  return locationType(inspection.location);
}

export type AdulterationCheck = {
  id: string;
  location: string;
  fuelType: string;
  method: string;
  adulterationLevel: string;
  verdict: string;
  actionTaken: string;
  checkedBy: string;
  checkedAt: string;
};

export type AdulterationMethod = string;
export type AdulterationVerdict = "Clean" | "Suspected" | "Confirmed";

export const ADULTERATION_CHECKS: AdulterationCheck[] = [];
export const ADULTERATION_METHODS: AdulterationMethod[] = [];

export function checkLocationType(check: { location: string }): "Depot" | "Pump" {
  return check.location === "Depot" ? "Depot" : "Pump";
}
