// Pump owner login credentials: how the email and password are made, cleaned and checked.
// Pure: no imports, so the tests and the forms and routes all use the same rules.

// The email as it is stored and compared: trimmed and lower-cased. Spaces inside the address are not allowed.
export function normalizeOwnerEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

// A valid address: one @, a local part without spaces, and a domain with at least one dot.
const EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export function isValidOwnerEmail(value: unknown): boolean {
  return EMAIL_PATTERN.test(normalizeOwnerEmail(value));
}

// Letters and digits only, so a name with a space, an apostrophe or a dot never ends up in an address.
function emailPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// The login email the admin creates for a pump owner. The pattern is the one already in use: owner@pumpgmail.com.
export function ownerEmailFor(ownerName: string, pumpName: string): string {
  const owner = emailPart(ownerName);
  const pump = emailPart(pumpName);
  if (!owner || !pump) return "";
  return `${owner}@${pump}gmail.com`;
}

// The starting password for a new pump owner: the owner's name with a capital letter and 123.
export function ownerPasswordFor(ownerName: string): string {
  const name = ownerName.trim();
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}123`;
}

// What the create form does with an existing owner email. A branch pump reuses the owner's password,
// so a different password typed for the same email is refused instead of being ignored.
export function branchPasswordCheck(
  hasExistingOwner: boolean,
  password: string | undefined,
  matchesExisting: boolean
): { ok: true } | { ok: false; error: string } {
  if (!hasExistingOwner || password === undefined || password === "") return { ok: true };
  if (matchesExisting) return { ok: true };
  return {
    ok: false,
    error: "This owner email already has a different password. Use the owner's existing password for a branch pump.",
  };
}

// The role a pump owner login needs. Accounts without it are not pump owners.
export function isPumpOwnerRole(role: unknown): boolean {
  return role === "pump-owner";
}
