import type { TenantClient } from "@/lib/prisma-tenant";
import { getNotificationService, type NotificationPayload } from "@/lib/services/notification";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/plan";

export async function sendAndLog(
  db: TenantClient,
  schoolId: string,
  payload: Omit<NotificationPayload, "schoolId">,
) {
  const result = await getNotificationService().send({ ...payload, schoolId });
  await db.notificationLog.create({
    data: {
      schoolId,
      channel: payload.channel,
      to: payload.to,
      body: payload.body,
      status: result.ok ? "SENT" : "FAILED",
      provider: result.provider,
      providerId: result.providerId,
      error: result.error,
      sentAt: result.ok ? new Date() : null,
    },
  });
  return result;
}

export async function schoolAllowsWhatsApp(schoolId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: schoolId },
    include: { plan: true },
  });
  return Boolean(tenant && hasFeature(tenant.plan.featureFlags, "whatsappAlerts"));
}
