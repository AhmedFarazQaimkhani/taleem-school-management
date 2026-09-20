import { describe, expect, it } from "vitest";
import { parseTenantSlug } from "../src/lib/host";

describe("subdomain parsing", () => {
  it("extracts tenant slug from localhost subdomains", () => {
    expect(parseTenantSlug("greenwood.localhost:3000", "localhost:3000")).toBe("greenwood");
    expect(parseTenantSlug("citymodel.localhost:3000", "localhost:3000")).toBe("citymodel");
  });

  it("returns null on the platform apex and reserved hosts", () => {
    expect(parseTenantSlug("localhost:3000", "localhost:3000")).toBeNull();
    expect(parseTenantSlug("admin.localhost:3000", "localhost:3000")).toBeNull();
    expect(parseTenantSlug("www.localhost:3000", "localhost:3000")).toBeNull();
  });

  it("extracts slug in production-style hosts", () => {
    expect(parseTenantSlug("greenwood.yourdomain.com", "yourdomain.com")).toBe("greenwood");
    expect(parseTenantSlug("www.yourdomain.com", "yourdomain.com")).toBeNull();
  });
});
