import { PUMPS, type Pump } from "@/lib/dashboard/data/pumps";

export const CITY_REGIONS: Record<string, string> = {
  Karachi: "South",
  Lahore: "Central",
  Islamabad: "North",
  Faisalabad: "Central",
  Rawalpindi: "North",
  Multan: "South",
};

export type AreaAssignment = {
  id: string;
  city: string;
  region: string;
  areaManager: string;
  phone: string;
};

export const AREA_ASSIGNMENTS: AreaAssignment[] = [
  { id: "AA-01", city: "Karachi", region: "South", areaManager: "Tariq Naveed", phone: "+92 300 771 2244" },
  { id: "AA-02", city: "Lahore", region: "Central", areaManager: "Farhan Qureshi", phone: "+92 300 771 2255" },
  { id: "AA-03", city: "Islamabad", region: "North", areaManager: "Ayesha Kamal", phone: "+92 300 771 2266" },
  { id: "AA-04", city: "Faisalabad", region: "Central", areaManager: "Farhan Qureshi", phone: "+92 300 771 2255" },
  { id: "AA-05", city: "Rawalpindi", region: "North", areaManager: "Ayesha Kamal", phone: "+92 300 771 2266" },
  { id: "AA-06", city: "Multan", region: "South", areaManager: "Tariq Naveed", phone: "+92 300 771 2244" },
];

export type CityPumpSummary = {
  city: string;
  pumpCount: number;
  online: number;
  offline: number;
  maintenance: number;
  monthlySales: number;
};

export function pumpsByCity(pumps: Pump[] = PUMPS): CityPumpSummary[] {
  const map = new Map<string, CityPumpSummary>();
  for (const pump of pumps) {
    const entry = map.get(pump.city) ?? {
      city: pump.city,
      pumpCount: 0,
      online: 0,
      offline: 0,
      maintenance: 0,
      monthlySales: 0,
    };
    entry.pumpCount += 1;
    entry.monthlySales += pump.monthlySales;
    if (pump.status === "Online") entry.online += 1;
    else if (pump.status === "Offline") entry.offline += 1;
    else entry.maintenance += 1;
    map.set(pump.city, entry);
  }
  return Array.from(map.values()).sort((a, b) => b.pumpCount - a.pumpCount);
}

export type VisitPurpose = "Routine Check" | "Performance Review" | "Complaint Follow-up" | "Audit";
export type VisitFollowUp = "None" | "Pending" | "Resolved";

export type PumpVisit = {
  id: string;
  pumpNumber: number;
  pumpName: string;
  city: string;
  date: string;
  areaManager: string;
  purpose: VisitPurpose;
  rating: number;
  findings: string;
  followUp: VisitFollowUp;
};

export const PUMP_VISITS: PumpVisit[] = [
  { id: "VIS-201", pumpNumber: 1, pumpName: "Al-Rehman Filling Station", city: "Karachi", date: "2026-09-10", areaManager: "Tariq Naveed", purpose: "Routine Check", rating: 4, findings: "Clean premises, minor queue delays at peak hour.", followUp: "None" },
  { id: "VIS-202", pumpNumber: 2, pumpName: "Chaudhry Petroleum", city: "Lahore", date: "2026-09-09", areaManager: "Farhan Qureshi", purpose: "Performance Review", rating: 5, findings: "Strong monthly growth, attendants well trained.", followUp: "None" },
  { id: "VIS-203", pumpNumber: 3, pumpName: "Sunrise Fuel Station", city: "Islamabad", date: "2026-09-08", areaManager: "Ayesha Kamal", purpose: "Complaint Follow-up", rating: 3, findings: "Customer complaint about short-filling verified as isolated; dispenser recalibrated.", followUp: "Resolved" },
  { id: "VIS-204", pumpNumber: 4, pumpName: "Highway Filling Station", city: "Faisalabad", date: "2026-09-07", areaManager: "Farhan Qureshi", purpose: "Audit", rating: 2, findings: "Pump under maintenance longer than scheduled; sales dropping sharply.", followUp: "Pending" },
  { id: "VIS-205", pumpNumber: 5, pumpName: "Malik Fuels", city: "Rawalpindi", date: "2026-09-06", areaManager: "Ayesha Kamal", purpose: "Routine Check", rating: 4, findings: "Good housekeeping, stock records accurate.", followUp: "None" },
  { id: "VIS-206", pumpNumber: 6, pumpName: "Gulshan Petroleum", city: "Multan", date: "2026-09-05", areaManager: "Tariq Naveed", purpose: "Complaint Follow-up", rating: 2, findings: "Pump offline again; owner unresponsive to calls.", followUp: "Pending" },
  { id: "VIS-207", pumpNumber: 1, pumpName: "Al-Rehman Filling Station", city: "Karachi", date: "2026-08-22", areaManager: "Tariq Naveed", purpose: "Performance Review", rating: 4, findings: "On track against monthly target.", followUp: "None" },
  { id: "VIS-208", pumpNumber: 3, pumpName: "Sunrise Fuel Station", city: "Islamabad", date: "2026-08-18", areaManager: "Ayesha Kamal", purpose: "Routine Check", rating: 5, findings: "Excellent condition, no issues found.", followUp: "None" },
];

export type CoordinationParty = "Company Owner" | "Pump Owner" | "Area Manager";
export type CoordinationStatus = "Open" | "In Progress" | "Resolved";

export type CoordinationItem = {
  id: string;
  subject: string;
  from: CoordinationParty;
  to: CoordinationParty;
  pump: string;
  city: string;
  message: string;
  status: CoordinationStatus;
  date: string;
};

export const COORDINATION_ITEMS: CoordinationItem[] = [
  { id: "COORD-101", subject: "Approve price revision for Pump 4", from: "Area Manager", to: "Company Owner", pump: "Highway Filling Station", city: "Faisalabad", message: "Recommending a temporary discount to recover sales lost to maintenance downtime.", status: "Open", date: "2026-09-10" },
  { id: "COORD-102", subject: "Request extra tanker slot for Karachi cluster", from: "Area Manager", to: "Company Owner", pump: "All Pumps", city: "Karachi", message: "Pump 1 and nearby stock levels are running low ahead of the weekend rush.", status: "In Progress", date: "2026-09-09" },
  { id: "COORD-103", subject: "Owner feedback on canopy repainting", from: "Company Owner", to: "Pump Owner", pump: "Chaudhry Petroleum", city: "Lahore", message: "Approved budget for canopy repainting at Pump 2, schedule with the area manager.", status: "Resolved", date: "2026-09-05" },
  { id: "COORD-104", subject: "Staffing shortfall at Sunrise Fuel Station", from: "Pump Owner", to: "Area Manager", pump: "Sunrise Fuel Station", city: "Islamabad", message: "Need two additional attendants for the morning shift, please coordinate with HR.", status: "In Progress", date: "2026-09-08" },
  { id: "COORD-105", subject: "Escalate unresponsive owner at Gulshan Petroleum", from: "Area Manager", to: "Company Owner", pump: "Gulshan Petroleum", city: "Multan", message: "Owner not answering calls for 5 days while pump remains offline.", status: "Open", date: "2026-09-08" },
  { id: "COORD-106", subject: "Confirm new fuel price rollout", from: "Company Owner", to: "Area Manager", pump: "All Pumps", city: "Rawalpindi", message: "Please confirm all pumps in your region have updated signage for the new pricing.", status: "Resolved", date: "2026-09-02" },
];

export type EscalationType = "Low Sales" | "Payment Delay" | "Complaint";
export type EscalationSeverity = "Low" | "Medium" | "High" | "Critical";
export type EscalationStatus = "Open" | "Investigating" | "Escalated" | "Resolved";

export type Escalation = {
  id: string;
  pumpNumber: number;
  pumpName: string;
  city: string;
  type: EscalationType;
  severity: EscalationSeverity;
  description: string;
  raisedDate: string;
  status: EscalationStatus;
  assignedTo: string;
};

export const ESCALATIONS: Escalation[] = [
  { id: "ESC-301", pumpNumber: 6, pumpName: "Gulshan Petroleum", city: "Multan", type: "Low Sales", severity: "Critical", description: "Monthly sales down 57% vs. last month; pump has been offline repeatedly.", raisedDate: "2026-09-08", status: "Escalated", assignedTo: "Tariq Naveed" },
  { id: "ESC-302", pumpNumber: 4, pumpName: "Highway Filling Station", city: "Faisalabad", type: "Low Sales", severity: "High", description: "Extended maintenance closure has cut monthly revenue by 40%.", raisedDate: "2026-09-07", status: "Investigating", assignedTo: "Farhan Qureshi" },
  { id: "ESC-303", pumpNumber: 3, pumpName: "Sunrise Fuel Station", city: "Islamabad", type: "Complaint", severity: "Medium", description: "Customer complaint about short-filling at dispenser 2.", raisedDate: "2026-09-08", status: "Resolved", assignedTo: "Ayesha Kamal" },
  { id: "ESC-304", pumpNumber: 3, pumpName: "Sunrise Fuel Station", city: "Islamabad", type: "Payment Delay", severity: "Medium", description: "Owner's monthly settlement overdue by 6 days.", raisedDate: "2026-09-05", status: "Open", assignedTo: "Ayesha Kamal" },
  { id: "ESC-305", pumpNumber: 4, pumpName: "Highway Filling Station", city: "Faisalabad", type: "Payment Delay", severity: "High", description: "Owner's monthly settlement overdue by 9 days, second reminder sent.", raisedDate: "2026-09-02", status: "Open", assignedTo: "Farhan Qureshi" },
  { id: "ESC-306", pumpNumber: 6, pumpName: "Gulshan Petroleum", city: "Multan", type: "Complaint", severity: "Low", description: "Minor complaint about restroom cleanliness, addressed same day.", raisedDate: "2026-08-30", status: "Resolved", assignedTo: "Tariq Naveed" },
];
