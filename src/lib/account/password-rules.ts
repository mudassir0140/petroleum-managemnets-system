// New-password rules for Change Password. Pure: no imports, so the client form and the server
// use exactly the same checks.

export const MIN_PASSWORD_LENGTH = 6;
export const OWNER_MIN_PASSWORD_LENGTH = 8;
// Longer inputs are refused before hashing, so a huge value cannot slow the server down.
export const MAX_PASSWORD_LENGTH = 128;

// Returns the message for the first rule the new password breaks, or null when it is acceptable.
// Pump owners get the stricter rule (a letter and a number). Other roles keep their existing minimum.
export function newPasswordError(role: string, newPassword: string): string | null {
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return `New password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }
  if (role === "pump-owner") {
    if (newPassword.length < OWNER_MIN_PASSWORD_LENGTH) {
      return `New password must be at least ${OWNER_MIN_PASSWORD_LENGTH} characters`;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return "New password must include at least one letter and one number";
    }
    return null;
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

// The minimum length the form shows in its input attribute, for the role.
export function minPasswordLength(role: string): number {
  return role === "pump-owner" ? OWNER_MIN_PASSWORD_LENGTH : MIN_PASSWORD_LENGTH;
}
