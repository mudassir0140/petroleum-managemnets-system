// Location fields for supplier and pump records. Pure: no imports, so the forms, the APIs and the tests can all use it.

export const LOCATION_FIELDS = ["country", "province", "district", "city", "address"] as const;
export type LocationField = (typeof LOCATION_FIELDS)[number];

export type Location = Record<LocationField, string>;

export const LOCATION_LABELS: Record<LocationField, { en: string; ur: string }> = {
  country: { en: "Country", ur: "ملک" },
  province: { en: "Province / State", ur: "صوبہ / ریاست" },
  district: { en: "District", ur: "ضلع" },
  city: { en: "City", ur: "شہر" },
  address: { en: "Complete address", ur: "مکمل پتہ" },
};

const MAX_LENGTH = 200;
const MAX_ADDRESS_LENGTH = 300;

// Trims each field and checks the required ones. Blank required fields and over-long values are rejected.
export function validateLocation(
  input: Record<string, unknown>,
  required: readonly LocationField[]
): { ok: true; value: Location } | { ok: false; error: string } {
  const value = {} as Location;
  for (const field of LOCATION_FIELDS) {
    const raw = input[field];
    value[field] = typeof raw === "string" ? raw.trim() : "";
  }
  for (const field of required) {
    if (!value[field]) {
      return { ok: false, error: `${LOCATION_LABELS[field].en} is required / ${LOCATION_LABELS[field].ur} درکار ہے` };
    }
  }
  for (const field of LOCATION_FIELDS) {
    const limit = field === "address" ? MAX_ADDRESS_LENGTH : MAX_LENGTH;
    if (value[field].length > limit) {
      return { ok: false, error: `${LOCATION_LABELS[field].en} is too long / ${LOCATION_LABELS[field].ur} بہت لمبا ہے` };
    }
  }
  return { ok: true, value };
}

// One line for display and for geocoding: the most specific part first, blanks skipped.
export function formatLocation(parts: Record<string, unknown>): string {
  return ["address", "city", "district", "province", "country"]
    .map((key) => (typeof parts[key] === "string" ? (parts[key] as string).trim() : ""))
    .filter((v) => v !== "")
    .join(", ");
}
