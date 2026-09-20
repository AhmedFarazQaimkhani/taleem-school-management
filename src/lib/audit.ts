import type { TenantClient } from "@/lib/prisma-tenant";

export async function writeAudit(
  db: TenantClient,
  input: {
    schoolId: string;
    actorId?: string | null;
    action: string;
    entity: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
  },
) {
  await db.auditLog.create({
    data: {
      schoolId: input.schoolId,
      actorId: input.actorId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: input.before === undefined ? undefined : (input.before as object),
      after: input.after === undefined ? undefined : (input.after as object),
    },
  });
}
