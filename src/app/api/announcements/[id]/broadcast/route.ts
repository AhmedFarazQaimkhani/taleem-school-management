import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { notFound } from "@/lib/api";
import { sendAndLog } from "@/lib/notify";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    await assertFeatureEnabled(schoolId, "smsBroadcast");
    const announcement = await db.announcement.findFirst({ where: { id: params.id } });
    if (!announcement) throw notFound("Announcement not found");

    const recipients: { phone: string }[] = [];
    if (announcement.audience === "PARENTS" || announcement.audience === "ALL") {
      const guardians = await db.guardian.findMany({ where: { deletedAt: null, phone: { not: "" } }, select: { phone: true } });
      recipients.push(...guardians);
    }
    if (announcement.audience === "STAFF" || announcement.audience === "ALL") {
      const staff = await db.staff.findMany({ where: { deletedAt: null, phone: { not: null } }, select: { phone: true } });
      recipients.push(...staff.filter((row): row is { phone: string } => Boolean(row.phone)));
    }

    const unique = Array.from(new Set(recipients.map((row) => row.phone).filter(Boolean)));
    let sent = 0;
    for (const phone of unique) {
      await sendAndLog(db, schoolId, {
        channel: "WHATSAPP",
        to: phone,
        body: `${announcement.title}: ${announcement.body}`,
      });
      sent += 1;
    }
    return jsonOk({ sent });
  } catch (error) {
    return handleRouteError(error);
  }
}
