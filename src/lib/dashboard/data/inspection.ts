// @ts-nocheck
export type InspectionLog = { id: string };
export type InspectionStatus = string;
export type InspectionSeverity = string;

export const INSPECTION_LOG: InspectionLog[] = [];
export const INSPECTION_STATUSES: InspectionStatus[] = [];
export const INSPECTION_SEVERITIES: InspectionSeverity[] = [];
export const INSPECTION_SOURCES: string[] = [];

export function inspectionLocationType(inspection: unknown): string {
  return "Depot";
}
