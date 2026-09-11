export const EXTRA_FEATURES = [
  "Finance Access",
  "Reports Access",
  "Tanker Tracking Access",
  "Fuel Stock Access",
  "Pump Owners Access",
] as const;

export type ExtraFeature = (typeof EXTRA_FEATURES)[number];

export const DEFAULT_ACCESS_GRANTS: Record<string, ExtraFeature[]> = {
  "EMP-01": ["Reports Access"],
  "EMP-03": ["Reports Access", "Tanker Tracking Access"],
  "EMP-05": ["Fuel Stock Access"],
  "EMP-13": ["Tanker Tracking Access", "Fuel Stock Access"],
  "EMP-15": ["Finance Access", "Reports Access", "Pump Owners Access"],
};
