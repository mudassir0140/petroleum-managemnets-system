// Pump owner login credentials. The Admin form generates them, the create and reset
// routes store them, and the login route matches them. Keep these in one place so the
// three never drift apart.

// Login identifier: "{owner}@{pump}gmail.com", lowercase with no spaces.
export function generateOwnerEmail(ownerName: string, pumpName: string): string {
  const cleanOwner = ownerName.toLowerCase().replace(/\s+/g, "");
  const cleanPump = pumpName.toLowerCase().replace(/\s+/g, "");
  if (!cleanOwner || !cleanPump) return "";
  return `${cleanOwner}@${cleanPump}gmail.com`;
}

// The same rule applied to any typed login identifier before it is looked up or stored.
export function normalizeOwnerEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s+/g, "");
}

// Initial and reset password: the owner's name with a capital first letter, then "123".
export function generateOwnerPassword(ownerName: string): string {
  const name = ownerName.trim();
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}123`;
}
