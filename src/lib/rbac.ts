import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api";
import type { AppRole } from "@/types/roles";
import { getTenantClient, type TenantClient } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) throw unauthorized();
  return session;
}

export async function requireRoles(roles: AppRole[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw forbidden("Insufficient role");
  }
  return session;
}

export async function requireSuperAdmin() {
  return requireRoles(["SUPER_ADMIN"]);
}

/**
 * Tenant-scoped handler guard:
 * - SUPER_ADMIN is rejected here (they must use platform routes)
 * - session.schoolId is required and is the only school the request may touch
 * - optional resourceSchoolId must match
 */
export async function requireTenantUser(allowed: AppRole[] = ["ADMIN", "TEACHER", "ACCOUNTANT", "PARENT", "STUDENT"]) {
  const session = await requireRoles(allowed);
  if (session.user.role === "SUPER_ADMIN" || !session.user.schoolId) {
    throw forbidden("This route is tenant-scoped");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.schoolId },
    select: { id: true, status: true, slug: true, name: true, planId: true },
  });
  if (!tenant || tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    throw forbidden("School is not active");
  }

  return {
    session,
    schoolId: session.user.schoolId,
    tenant,
    db: getTenantClient(session.user.schoolId) as TenantClient,
  };
}

export function assertSameSchool(sessionSchoolId: string | null, resourceSchoolId: string) {
  if (!sessionSchoolId || sessionSchoolId !== resourceSchoolId) {
    throw forbidden();
  }
}
