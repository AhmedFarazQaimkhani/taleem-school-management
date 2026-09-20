import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { timetableSchema } from "@/lib/validations/phase2";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER", "STUDENT", "PARENT"]);
    await assertFeatureEnabled(schoolId, "timetable");
    const sectionId = new URL(request.url).searchParams.get("sectionId") ?? "";
    const slots = await db.timetable.findMany({
      where: sectionId ? { sectionId } : {},
      include: { subject: true, staff: true, section: { include: { class: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return jsonOk({ slots });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    await assertFeatureEnabled(schoolId, "timetable");
    const body = timetableSchema.parse(await request.json());
    const slot = await db.timetable.create({
      data: {
        schoolId,
        sectionId: body.sectionId,
        subjectId: body.subjectId,
        staffId: body.staffId || null,
        dayOfWeek: body.dayOfWeek,
        startTime: body.startTime.slice(0, 5),
        endTime: body.endTime.slice(0, 5),
        room: body.room || null,
      },
    });
    return jsonOk({ slot }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
