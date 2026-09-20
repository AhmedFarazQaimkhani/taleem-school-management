import { headers } from "next/headers";
import { TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTenantClient, type TenantClient } from "@/lib/prisma-tenant";
import { tenantSuspended } from "@/lib/api";

export type TenantContext = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  planId: string;
};

export async function resolveTenantFromHeaders(): Promise<TenantContext | null> {
  const h = headers();
  const schoolId = h.get("x-school-id");
  const slug = h.get("x-tenant-slug");

  if (schoolId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true, slug: true, status: true, planId: true },
    });
    return tenant;
  }

  if (slug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true, planId: true },
    });
    return tenant;
  }

  return null;
}

export async function requireActiveTenant(): Promise<TenantContext> {
  const tenant = await resolveTenantFromHeaders();
  if (!tenant) {
    throw tenantSuspended("No school context on this request");
  }
  if (tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    throw tenantSuspended();
  }
  return tenant;
}

export async function getScopedDbForRequest(): Promise<{ tenant: TenantContext; db: TenantClient }> {
  const tenant = await requireActiveTenant();
  return { tenant, db: getTenantClient(tenant.id) };
}
