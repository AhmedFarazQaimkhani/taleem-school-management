import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { parseDateOnly } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "TEACHER", "ACCOUNTANT"]);
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const day = date ? parseDateOnly(date) : undefined;

    const sections = await db.section.findMany({
      include: { class: true, _count: { select: { students: true } } },
      orderBy: { name: "asc" },
    });

    const summaries = [];
    for (const section of sections) {
      const where = { sectionId: section.id, ...(day ? { date: day } : {}) };
      const records = await db.attendanceRecord.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      });
      const counts = Object.fromEntries(records.map((row) => [row.status, row._count._all]));
      const marked = records.reduce((sum, row) => sum + row._count._all, 0);
      const present = (counts.PRESENT ?? 0) + (counts.LATE ?? 0);
      summaries.push({
        section,
        marked,
        present,
        absent: counts.ABSENT ?? 0,
        late: counts.LATE ?? 0,
        excused: counts.EXCUSED ?? 0,
        percent: marked === 0 ? 0 : Math.round((present / marked) * 10000) / 100,
      });
    }

    return jsonOk({ summaries });
  } catch (error) {
    return handleRouteError(error);
  }
}
