import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantClient } from "@/lib/prisma-tenant";
import type { AppRole } from "@/types/roles";
import { hasFeature, parseFeatureFlags, type FeatureFlag } from "@/lib/plan";

export async function requireSchoolPage(allowed?: AppRole[], feature?: FeatureFlag) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/super-admin");
  if (!session.user.schoolId) redirect("/login");
  if (allowed && !allowed.includes(session.user.role)) redirect("/dashboard");

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.schoolId },
    include: { plan: true },
  });
  if (!tenant || tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
    redirect("/login?error=suspended");
  }

  if (feature && !hasFeature(tenant.plan.featureFlags, feature)) {
    redirect(`/dashboard?locked=${feature}`);
  }

  return {
    session,
    tenant,
    schoolId: tenant.id,
    features: parseFeatureFlags(tenant.plan.featureFlags),
    db: getTenantClient(tenant.id),
  };
}
