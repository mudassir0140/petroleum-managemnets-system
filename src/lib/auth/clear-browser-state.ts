// Empties everything the browser keeps for this site in local and session storage.
export function clearBrowserState(): void {
  try {
    window.localStorage.clear();
  } catch {
    // Storage can be unavailable (private mode, blocked site data). Nothing to clear then.
  }
  try {
    window.sessionStorage.clear();
  } catch {
    // Same as above.
  }
}
