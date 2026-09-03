export function buildRedirectDestination(configuredUrl: string | undefined, currentUrl: string): string | null {
  const value = configuredUrl?.trim();
  if (!value) return null;

  try {
    const current = new URL(currentUrl);
    const destination = new URL(value);
    if (destination.protocol !== "https:") return null;
    if (destination.origin === current.origin && destination.pathname === current.pathname) return null;

    destination.search = current.search;
    destination.hash = current.hash;
    return destination.toString();
  } catch {
    return null;
  }
}

export function redirectToCanonicalDeployment(): boolean {
  const destination = buildRedirectDestination(import.meta.env.VITE_CANONICAL_DEPLOYMENT_URL, window.location.href);
  if (!destination) return false;
  window.location.replace(destination);
  return true;
}
