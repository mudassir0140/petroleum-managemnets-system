// Account controls shared by the pump admin pages, the account routes and the login routes.
// Pure: no server imports, so the rules can be tested without the database.

// Each account type the pump admin can disable or delete, and the collection that stores it.
export const ACCOUNT_KINDS = {
  supplier: { collection: "supplierAccounts", label: "Supplier" },
  khata: { collection: "khataClients", label: "Khata client" },
  employee: { collection: "pump_employees", label: "Employee" },
  truck: { collection: "trucks", label: "Tanker" },
} as const;

export type AccountKind = keyof typeof ACCOUNT_KINDS;

export function isAccountKind(value: unknown): value is AccountKind {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(ACCOUNT_KINDS, value);
}

// An account is disabled only when its `disabled` flag is exactly true. Older records have no flag, so they stay enabled.
export function isDisabledAccount(record: { [key: string]: unknown } | null | undefined): boolean {
  return record?.disabled === true;
}

export const DISABLED_LOGIN_MESSAGE = "This account is disabled. Contact your pump admin.";
