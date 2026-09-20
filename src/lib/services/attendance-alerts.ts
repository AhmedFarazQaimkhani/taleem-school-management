import type { TenantClient } from "@/lib/prisma-tenant";
import { sendAndLog, schoolAllowsWhatsApp } from "@/lib/notify";

export async function notifyAbsences(
  db: TenantClient,
  schoolId: string,
  rows: Array<{ studentName: string; date: string; phone: string | null }>,
) {
  if (!(await schoolAllowsWhatsApp(schoolId))) {
    return { sent: 0, skipped: rows.length, reason: "feature_disabled" as const };
  }

  let sent = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!row.phone) {
      skipped += 1;
      continue;
    }
    await sendAndLog(db, schoolId, {
      channel: "WHATSAPP",
      to: row.phone,
      body: `${row.studentName} was marked absent on ${row.date}. Please contact the school if this is unexpected.`,
    });
    sent += 1;
  }
  return { sent, skipped, reason: null };
}
