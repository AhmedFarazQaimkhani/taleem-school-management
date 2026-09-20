import { prisma } from "@/lib/prisma";
import { planLimit } from "@/lib/api";
import { hasFeature, type FeatureFlag } from "@/lib/plan";

export async function assertStudentCap(schoolId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: schoolId },
    include: { plan: true },
  });
  if (!tenant) throw planLimit("School not found");

  const count = await prisma.student.count({
    where: { schoolId, deletedAt: null },
  });

  if (count >= tenant.plan.maxStudents) {
    throw planLimit(
      `Student cap reached (${tenant.plan.maxStudents}). Upgrade the plan to admit more students.`,
    );
  }
}

export async function assertFeatureEnabled(schoolId: string, feature: FeatureFlag) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: schoolId },
    include: { plan: true },
  });
  if (!tenant || !hasFeature(tenant.plan.featureFlags, feature)) {
    throw planLimit(`Feature "${feature}" is not included in this school's plan.`);
  }
}
