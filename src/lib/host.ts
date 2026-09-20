const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "app",
  "api",
  "super",
  "platform",
  "mail",
  "status",
]);

export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}

/**
 * Parse `<slug>.yourdomain.com` (or `<slug>.localhost:3000` in dev).
 * Returns null on the apex / reserved hosts (platform Super Admin).
 */
export function parseTenantSlug(hostHeader: string, platformDomain: string): string | null {
  const host = hostHeader.split(":")[0].toLowerCase();
  const platformHost = platformDomain.split(":")[0].toLowerCase();

  if (host === platformHost || host === `www.${platformHost}`) {
    return null;
  }

  if (host.endsWith(`.${platformHost}`)) {
    const slug = host.slice(0, -(platformHost.length + 1));
    if (!slug || slug.includes(".") || isReservedSubdomain(slug)) {
      return null;
    }
    return slug;
  }

  // `greenwood.localhost` when PLATFORM_DOMAIN is `localhost:3000`
  if (platformHost === "localhost" && host.endsWith(".localhost")) {
    const slug = host.replace(/\.localhost$/, "");
    if (!slug || isReservedSubdomain(slug)) return null;
    return slug;
  }

  return null;
}

export function isPlatformHost(hostHeader: string, platformDomain: string): boolean {
  return parseTenantSlug(hostHeader, platformDomain) === null;
}
