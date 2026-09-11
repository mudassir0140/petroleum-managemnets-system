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

export const FUEL_QUALITY_TESTS: FuelQualityTest[] = [
  {
    id: "QT-101",
    location: DEPOT,
    fuelType: "petrol",
    testType: "Density",
    testedValue: "742 kg/m³",
    standardRange: "720-775 kg/m³",
    result: "Pass",
    testedBy: "Sana Farooq",
    testedAt: "2026-09-01",
    notes: "Sample drawn from Tank D-1 before tanker loading.",
  },
  {
    id: "QT-102",
    location: DEPOT,
    fuelType: "diesel",
    testType: "Flash Point",
    testedValue: "58°C",
    standardRange: "≥ 55°C",
    result: "Pass",
    testedBy: "Sana Farooq",
    testedAt: "2026-09-01",
    notes: "",
  },
  {
    id: "QT-103",
    location: DEPOT,
    fuelType: "hi-octane",
    testType: "Octane/Cetane Rating",
    testedValue: "94 RON",
    standardRange: "≥ 92 RON",
    result: "Pass",
    testedBy: "Bilal Aslam",
    testedAt: "2026-09-02",
    notes: "",
  },
  {
    id: "QT-104",
    location: "Al-Rehman Filling Station, Karachi",
    fuelType: "petrol",
    testType: "Water Content",
    testedValue: "0.08%",
    standardRange: "≤ 0.05%",
    result: "Fail",
    testedBy: "Bilal Aslam",
    testedAt: "2026-09-02",
    notes: "Moisture likely from underground tank seal; flagged for re-check.",
  },
  {
    id: "QT-105",
    location: "Chaudhry Petroleum, Lahore",
    fuelType: "diesel",
    testType: "Density",
    testedValue: "833 kg/m³",
    standardRange: "815-870 kg/m³",
    result: "Pass",
    testedBy: "Sana Farooq",
    testedAt: "2026-09-03",
    notes: "",
  },
  {
    id: "QT-106",
    location: "Sunrise Fuel Station, Islamabad",
    fuelType: "petrol",
    testType: "Color & Appearance",
    testedValue: "Clear, light yellow",
    standardRange: "Clear, no visible sediment",
    result: "Pass",
    testedBy: "Rabia Sheikh",
    testedAt: "2026-09-03",
    notes: "",
  },
  {
    id: "QT-107",
    location: "Highway Filling Station, Faisalabad",
    fuelType: "hi-octane",
    testType: "Density",
    testedValue: "789 kg/m³",
    standardRange: "725-780 kg/m³",
    result: "Fail",
    testedBy: "Rabia Sheikh",
    testedAt: "2026-09-04",
    notes: "Above upper limit — possible cross-contamination, retest requested.",
  },
  {
    id: "QT-108",
    location: "Malik Fuels, Rawalpindi",
    fuelType: "diesel",
    testType: "Water Content",
    testedValue: "0.02%",
    standardRange: "≤ 0.05%",
    result: "Pass",
    testedBy: "Bilal Aslam",
    testedAt: "2026-09-05",
    notes: "",
  },
  {
    id: "QT-109",
    location: "Gulshan Petroleum, Multan",
    fuelType: "petrol",
    testType: "Flash Point",
    testedValue: "N/A — visual only",
    standardRange: "N/A",
    result: "Pass",
    testedBy: "Sana Farooq",
    testedAt: "2026-09-06",
    notes: "Routine appearance check, no anomalies.",
  },
  {
    id: "QT-110",
    location: DEPOT,
    fuelType: "diesel",
    testType: "Octane/Cetane Rating",
    testedValue: "48 CN",
    standardRange: "≥ 45 CN",
    result: "Pass",
    testedBy: "Bilal Aslam",
    testedAt: "2026-09-07",
    notes: "",
  },
  {
    id: "QT-111",
    location: "Al-Rehman Filling Station, Karachi",
    fuelType: "hi-octane",
    testType: "Water Content",
    testedValue: "0.03%",
    standardRange: "≤ 0.05%",
    result: "Pass",
    testedBy: "Rabia Sheikh",
    testedAt: "2026-09-08",
    notes: "Re-check after QT-104 remediation at the same pump.",
  },
  {
    id: "QT-112",
    location: "Chaudhry Petroleum, Lahore",
    fuelType: "petrol",
    testType: "Density",
    testedValue: "758 kg/m³",
    standardRange: "720-775 kg/m³",
    result: "Pass",
    testedBy: "Sana Farooq",
    testedAt: "2026-09-09",
    notes: "",
  },
];

export const ADULTERATION_METHODS = [
  "Density Test",
  "Filter Paper Test",
  "Marker/Dye Test",
  "Distillation Test",
] as const;

export type AdulterationMethod = (typeof ADULTERATION_METHODS)[number];

export type AdulterationVerdict = "Clean" | "Suspected" | "Confirmed";

export type AdulterationCheck = {
  id: string;
  location: QCLocation;
  fuelType: FuelType;
  method: AdulterationMethod;
  adulterationLevel: number;
  verdict: AdulterationVerdict;
  actionTaken: string;
  checkedBy: string;
  checkedAt: string;
};

export function checkLocationType(check: { location: string }): QCLocationType {
  return locationType(check.location);
}

export const ADULTERATION_CHECKS: AdulterationCheck[] = [
  {
    id: "AC-201",
    location: DEPOT,
    fuelType: "petrol",
    method: "Density Test",
    adulterationLevel: 0,
    verdict: "Clean",
    actionTaken: "None required.",
    checkedBy: "Sana Farooq",
    checkedAt: "2026-09-01",
  },
  {
    id: "AC-202",
    location: "Al-Rehman Filling Station, Karachi",
    fuelType: "petrol",
    method: "Filter Paper Test",
    adulterationLevel: 6,
    verdict: "Suspected",
    actionTaken: "Sample sent to lab for distillation confirmation.",
    checkedBy: "Bilal Aslam",
    checkedAt: "2026-09-02",
  },
  {
    id: "AC-203",
    location: "Sunrise Fuel Station, Islamabad",
    fuelType: "diesel",
    method: "Marker/Dye Test",
    adulterationLevel: 22,
    verdict: "Confirmed",
    actionTaken: "Pump dispensing suspended pending supplier investigation.",
    checkedBy: "Rabia Sheikh",
    checkedAt: "2026-09-03",
  },
  {
    id: "AC-204",
    location: "Highway Filling Station, Faisalabad",
    fuelType: "hi-octane",
    method: "Density Test",
    adulterationLevel: 0,
    verdict: "Clean",
    actionTaken: "None required.",
    checkedBy: "Rabia Sheikh",
    checkedAt: "2026-09-04",
  },
  {
    id: "AC-205",
    location: "Malik Fuels, Rawalpindi",
    fuelType: "petrol",
    method: "Filter Paper Test",
    adulterationLevel: 3,
    verdict: "Suspected",
    actionTaken: "Re-tested a week later; monitoring next delivery batch.",
    checkedBy: "Bilal Aslam",
    checkedAt: "2026-09-05",
  },
  {
    id: "AC-206",
    location: "Gulshan Petroleum, Multan",
    fuelType: "diesel",
    method: "Distillation Test",
    adulterationLevel: 0,
    verdict: "Clean",
    actionTaken: "None required.",
    checkedBy: "Sana Farooq",
    checkedAt: "2026-09-06",
  },
  {
    id: "AC-207",
    location: "Chaudhry Petroleum, Lahore",
    fuelType: "petrol",
    method: "Marker/Dye Test",
    adulterationLevel: 0,
    verdict: "Clean",
    actionTaken: "None required.",
    checkedBy: "Bilal Aslam",
    checkedAt: "2026-09-07",
  },
  {
    id: "AC-208",
    location: DEPOT,
    fuelType: "diesel",
    method: "Density Test",
    adulterationLevel: 0,
    verdict: "Clean",
    actionTaken: "None required.",
    checkedBy: "Sana Farooq",
    checkedAt: "2026-09-08",
  },
  {
    id: "AC-209",
    location: "Al-Rehman Filling Station, Karachi",
    fuelType: "petrol",
    method: "Distillation Test",
    adulterationLevel: 0,
    verdict: "Clean",
    actionTaken: "Follow-up test after AC-202 remediation — sample now clean.",
    checkedBy: "Bilal Aslam",
    checkedAt: "2026-09-09",
  },
];

export const INSPECTION_SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;

export type InspectionSeverity = (typeof INSPECTION_SEVERITIES)[number];

export const INSPECTION_STATUSES = ["Open", "Under Review", "Resolved"] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_SOURCES = ["Quality Test", "Adulteration Check", "Routine Inspection"] as const;

export type InspectionSource = (typeof INSPECTION_SOURCES)[number];

export type InspectionLogEntry = {
  id: string;
  location: QCLocation;
  source: InspectionSource;
  referenceId: string | null;
  summary: string;
  severity: InspectionSeverity;
  status: InspectionStatus;
  inspector: string;
  inspectedAt: string;
  followUpDate: string | null;
};

export function inspectionLocationType(entry: { location: string }): QCLocationType {
  return locationType(entry.location);
}

export const INSPECTION_LOG: InspectionLogEntry[] = [
  {
    id: "IL-301",
    location: "Al-Rehman Filling Station, Karachi",
    source: "Quality Test",
    referenceId: "QT-104",
    summary: "Petrol water content above allowed limit at underground tank.",
    severity: "Medium",
    status: "Resolved",
    inspector: "Bilal Aslam",
    inspectedAt: "2026-09-02",
    followUpDate: "2026-09-08",
  },
  {
    id: "IL-302",
    location: "Sunrise Fuel Station, Islamabad",
    source: "Adulteration Check",
    referenceId: "AC-203",
    summary: "Diesel adulteration confirmed at 22% via dye test — dispensing suspended.",
    severity: "Critical",
    status: "Under Review",
    inspector: "Rabia Sheikh",
    inspectedAt: "2026-09-03",
    followUpDate: "2026-09-12",
  },
  {
    id: "IL-303",
    location: "Highway Filling Station, Faisalabad",
    source: "Quality Test",
    referenceId: "QT-107",
    summary: "Hi-Octane density above upper spec limit — retest requested from depot.",
    severity: "High",
    status: "Open",
    inspector: "Rabia Sheikh",
    inspectedAt: "2026-09-04",
    followUpDate: "2026-09-14",
  },
  {
    id: "IL-304",
    location: "Al-Rehman Filling Station, Karachi",
    source: "Adulteration Check",
    referenceId: "AC-202",
    summary: "Petrol filter paper test showed 6% suspected adulteration — sample sent to lab.",
    severity: "Medium",
    status: "Resolved",
    inspector: "Bilal Aslam",
    inspectedAt: "2026-09-02",
    followUpDate: "2026-09-09",
  },
  {
    id: "IL-305",
    location: "Malik Fuels, Rawalpindi",
    source: "Adulteration Check",
    referenceId: "AC-205",
    summary: "Petrol filter paper test showed 3% suspected adulteration — monitoring next batch.",
    severity: "Low",
    status: "Under Review",
    inspector: "Bilal Aslam",
    inspectedAt: "2026-09-05",
    followUpDate: "2026-09-19",
  },
  {
    id: "IL-306",
    location: DEPOT,
    source: "Routine Inspection",
    referenceId: null,
    summary: "Monthly depot tank calibration and seal integrity check — all tanks compliant.",
    severity: "Low",
    status: "Resolved",
    inspector: "Sana Farooq",
    inspectedAt: "2026-09-06",
    followUpDate: null,
  },
  {
    id: "IL-307",
    location: "Gulshan Petroleum, Multan",
    source: "Routine Inspection",
    referenceId: null,
    summary: "Pump nozzle calibration check — one nozzle over-reading by 0.4%, recalibrated on site.",
    severity: "Medium",
    status: "Resolved",
    inspector: "Sana Farooq",
    inspectedAt: "2026-09-07",
    followUpDate: null,
  },
  {
    id: "IL-308",
    location: "Chaudhry Petroleum, Lahore",
    source: "Routine Inspection",
    referenceId: null,
    summary: "Storage tank housekeeping and fire-safety equipment inspection — compliant.",
    severity: "Low",
    status: "Resolved",
    inspector: "Bilal Aslam",
    inspectedAt: "2026-09-08",
    followUpDate: null,
  },
];
