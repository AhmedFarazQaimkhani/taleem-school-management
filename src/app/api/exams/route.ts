import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { assertFeatureEnabled } from "@/lib/plan-limits";
import { examSchema } from "@/lib/validations/phase2";
import { parseDateOnly } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    await assertFeatureEnabled(schoolId, "exams");
    const exams = await db.exam.findMany({
      include: { class: true, academicYear: true, _count: { select: { results: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ exams });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN", "TEACHER"]);
    await assertFeatureEnabled(schoolId, "exams");
    const body = examSchema.parse(await request.json());
    const exam = await db.exam.create({
      data: {
        schoolId,
        name: body.name,
        type: body.type,
        academicYearId: body.academicYearId,
        classId: body.classId || null,
        startDate: body.startDate ? parseDateOnly(body.startDate) : null,
        endDate: body.endDate ? parseDateOnly(body.endDate) : null,
      },
    });
    return jsonOk({ exam }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
